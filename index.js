const { Telegraf, Markup } = require('telegraf');
const LocalSession = require('telegraf-session-local');
require('dotenv').config();
const { db } = require('./src/db');
const { 
  users, 
  orders, 
  menuItems, 
  bonusTransactions, 
  partners, 
  userBonusesByPartner,
  locations,
  tariffs,
  sessions
} = require('./src/db/schema.js');
const { eq, desc, and } = require('drizzle-orm');
const { getTranslation } = require('./i18n');
const { sql } = require('drizzle-orm');

const ocpiRouter = require('./src/ocpi/server.js');

const { 
  isAdmin, 
  showAdminPanel, 
  showPendingOrders, 
  confirmOrder, 
  rejectOrder, 
  showMenuManagement, 
  showPartnersManagement,
  showStats, 
  showUsers,
  showManageAdmins,
  addAdminByUsername,
  removeAdminByUsername,
  addPartner,
  editPartner,
  deletePartner
} = require('./admin');

const express = require('express');
const app = express();
const port = process.env.PORT || 8080;
const QRCode = require('qrcode');
app.use(express.json());

let locationsCache = null;
let tariffsCache = null;
let lastLocationsFetch = 0;
let lastTariffsFetch = 0;

app.get('/ocpi/versions', (req, res) => {
  res.json({
    status_code: 1000,
    data: [
      { version: '2.2.1', url: 'https://sb-loyalty-bot-production.up.railway.app/ocpi/details' }
    ]
  });
});

app.get('/ocpi/details', (req, res) => {
  res.json({
    status_code: 1000,
    data: {
      version: '2.2.1',
      endpoints: [
        { identifier: 'credentials', role: 'RECEIVER', url: 'https://sb-loyalty-bot-production.up.railway.app/ocpi/credentials' },
        { identifier: 'locations', role: 'RECEIVER', url: 'https://sb-loyalty-bot-production.up.railway.app/ocpi/locations' },
        { identifier: 'tariffs', role: 'RECEIVER', url: 'https://sb-loyalty-bot-production.up.railway.app/ocpi/tariffs' }
      ]
    }
  });
});

const handleCredentials = async (req, res) => {
  try {
    console.log('📥 Credentials request received:');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Token ')) {
      console.log('❌ No Authorization header');
      return res.status(401).json({
        status_code: 2001,
        status_message: 'Missing authorization header',
        data: {}
      });
    }
    
    const base64Token = authHeader.replace('Token ', '');
    let headerToken;
    try {
      headerToken = Buffer.from(base64Token, 'base64').toString('utf8');
      console.log('✅ Header token decoded:', headerToken);
    } catch (e) {
      console.log('❌ Invalid base64 token');
      return res.status(401).json({
        status_code: 2001,
        status_message: 'Invalid token encoding',
        data: {}
      });
    }

    const bodyToken = req.body.token;
    const url = req.body.url;
    console.log('📥 Body token:', bodyToken);
    console.log('📥 URL:', url);

    if (headerToken !== bodyToken) {
      console.log('❌ Token mismatch');
      return res.status(401).json({
        status_code: 2001,
        status_message: 'Token mismatch between header and body',
        data: {}
      });
    }

    const OUR_TOKEN = '83Fh78ubergMleuhuehfuYwdwdnuwbeufbuerbvYTuefube03ubeufbefDrtnr45';
    if (headerToken !== OUR_TOKEN) {
      console.log('❌ Invalid token received');
      return res.status(401).json({
        status_code: 2001,
        status_message: 'Invalid token',
        data: {}
      });
    }

    try {
      const fs = require('fs');
      let connections = [];
      try {
        const data = fs.readFileSync('./connections.json', 'utf8');
        connections = JSON.parse(data);
      } catch (e) {}
      connections.push({
        partner: 'fast_charge',
        url: url,
        token: headerToken,
        status: 'active',
        created_at: new Date().toISOString()
      });
      fs.writeFileSync('./connections.json', JSON.stringify(connections, null, 2));
      console.log('✅ Fast Charge connection stored successfully');
    } catch (error) {
      console.error('⚠️ Could not store connection:', error.message);
    }

    res.json({
      status_code: 1000,
      status_message: 'Success',
      data: {
        token: OUR_TOKEN,
        url: 'https://sb-loyalty-bot-production.up.railway.app/ocpi'
      }
    });
  } catch (error) {
    console.error('❌ Credentials error:', error);
    res.status(500).json({
      status_code: 3000,
      status_message: 'Internal server error: ' + error.message,
      data: {}
    });
  }
};

app.post('/ocpi/credentials', handleCredentials);
app.post('/ocpi/2.2.1/credentials', handleCredentials);

app.post('/ocpi/locations', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const base64Token = authHeader?.replace('Token ', '');
    let token;
    try {
      token = Buffer.from(base64Token, 'base64').toString('utf8');
    } catch (e) {
      return res.status(401).json({
        status_code: 2001,
        status_message: 'Invalid token encoding',
        data: {}
      });
    }

    const OUR_TOKEN = '83Fh78ubergMleuhuehfuYwdwdnuwbeufbuerbvYTuefube03ubeufbefDrtnr45';
    if (token !== OUR_TOKEN) {
      return res.status(401).json({
        status_code: 2001,
        status_message: 'Invalid token',
        data: {}
      });
    }

    const locationsData = req.body;
    if (!Array.isArray(locationsData)) {
      return res.status(400).json({
        status_code: 2002,
        status_message: 'Invalid data format, expected array',
        data: {}
      });
    }
    
    console.log('📍 Received', locationsData.length, 'locations');
    
    for (const location of locationsData) {
      const hasOnlineConnector = location.evses?.some(evse => 
        evse.connectors?.some(conn => conn.status === 'online')
      ) || false;
      
      await db.execute(sql`
        INSERT INTO locations (id, name, address, city, country, latitude, longitude, evses, publish, is_online, created_at, updated_at)
        VALUES (${location.id}, ${location.name}, ${location.address}, ${location.city}, ${location.country || 'AM'}, 
                ${location.coordinates?.latitude || 0}, ${location.coordinates?.longitude || 0}, 
                ${JSON.stringify(location.evses || [])}, ${location.publish !== false}, ${hasOnlineConnector}, 
                NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          address = EXCLUDED.address,
          city = EXCLUDED.city,
          country = EXCLUDED.country,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          evses = EXCLUDED.evses,
          publish = EXCLUDED.publish,
          is_online = EXCLUDED.is_online,
          updated_at = NOW()
      `);
    }

    res.json({
      status_code: 1000,
      status_message: 'Success',
      data: {}
    });
  } catch (error) {
    console.error('❌ Locations error:', error);
    res.status(500).json({
      status_code: 3000,
      status_message: 'Internal server error: ' + error.message,
      data: {}
    });
  }
});

app.post('/ocpi/tariffs', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const base64Token = authHeader?.replace('Token ', '');
    let token;
    try {
      token = Buffer.from(base64Token, 'base64').toString('utf8');
    } catch (e) {
      return res.status(401).json({
        status_code: 2001,
        status_message: 'Invalid token encoding',
        data: {}
      });
    }

    const OUR_TOKEN = '83Fh78ubergMleuhuehfuYwdwdnuwbeufbuerbvYTuefube03ubeufbefDrtnr45';
    if (token !== OUR_TOKEN) {
      return res.status(401).json({
        status_code: 2001,
        status_message: 'Invalid token',
        data: {}
      });
    }

    const tariffsData = req.body;
    if (!Array.isArray(tariffsData)) {
      return res.status(400).json({
        status_code: 2002,
        status_message: 'Invalid data format, expected array',
        data: {}
      });
    }
    
    console.log('💰 Received', tariffsData.length, 'tariffs');
    
    for (const tariff of tariffsData) {
      await db.execute(sql`
        INSERT INTO tariffs (id, currency, elements, energy_price, parking_fee, created_at, updated_at)
        VALUES (${tariff.id}, ${tariff.currency || 'AMD'}, ${JSON.stringify(tariff.elements || {})}, 
                ${tariff.energy_price || 0}, ${tariff.parking_fee || 0}, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          currency = EXCLUDED.currency,
          elements = EXCLUDED.elements,
          energy_price = EXCLUDED.energy_price,
          parking_fee = EXCLUDED.parking_fee,
          updated_at = NOW()
      `);
    }

    res.json({
      status_code: 1000,
      status_message: 'Success',
      data: {}
    });
  } catch (error) {
    console.error('❌ Tariffs error:', error);
    res.status(500).json({
      status_code: 3000,
      status_message: 'Internal server error: ' + error.message,
      data: {}
    });
  }
});

app.get('/ocpi/locations', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const base64Token = authHeader?.replace('Token ', '');
    let token;
    try {
      token = Buffer.from(base64Token, 'base64').toString('utf8');
    } catch (e) {
      return res.status(401).json({
        status_code: 2001,
        status_message: 'Invalid token encoding',
        data: {}
      });
    }

    const OUR_TOKEN = '83Fh78ubergMleuhuehfuYwdwdnuwbeufbuerbvYTuefube03ubeufbefDrtnr45';
    if (token !== OUR_TOKEN) {
      return res.status(401).json({
        status_code: 2001,
        status_message: 'Invalid token',
        data: {}
      });
    }

    const result = await db.execute(sql`SELECT * FROM locations WHERE publish = true`);
    const locationsData = result.rows || result;
    
    res.json({
      status_code: 1000,
      status_message: 'Success',
      data: locationsData.map(loc => ({
        id: loc.id,
        name: loc.name,
        address: loc.address,
        city: loc.city,
        country: loc.country || 'AM',
        coordinates: {
          latitude: parseFloat(loc.latitude) || 0,
          longitude: parseFloat(loc.longitude) || 0
        },
        evses: loc.evses || []
      }))
    });
  } catch (error) {
    console.error('Locations error:', error);
    res.status(500).json({
      status_code: 3000,
      status_message: 'Internal server error: ' + error.message,
      data: {}
    });
  }
});

app.get('/ocpi/tariffs', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const base64Token = authHeader?.replace('Token ', '');
    let token;
    try {
      token = Buffer.from(base64Token, 'base64').toString('utf8');
    } catch (e) {
      return res.status(401).json({
        status_code: 2001,
        status_message: 'Invalid token encoding',
        data: {}
      });
    }

    const OUR_TOKEN = '83Fh78ubergMleuhuehfuYwdwdnuwbeufbuerbvYTuefube03ubeufbefDrtnr45';
    if (token !== OUR_TOKEN) {
      return res.status(401).json({
        status_code: 2001,
        status_message: 'Invalid token',
        data: {}
      });
    }

    const result = await db.select().from(tariffs);
    
    res.json({
      status_code: 1000,
      status_message: 'Success',
      data: result.map(t => ({
        id: t.id,
        currency: t.currency || 'AMD',
        elements: t.elements || {},
        energy_price: parseFloat(t.energyPrice) || 0,
        parking_fee: parseFloat(t.parkingFee) || 0
      }))
    });
  } catch (error) {
    console.error('Tariffs error:', error);
    res.status(500).json({
      status_code: 3000,
      status_message: 'Internal server error: ' + error.message,
      data: {}
    });
  }
});

app.post('/ocpi/sessions', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const base64Token = authHeader?.replace('Token ', '');
    let token;
    try {
      token = Buffer.from(base64Token, 'base64').toString('utf8');
    } catch (e) {
      return res.status(401).json({
        status_code: 2001,
        status_message: 'Invalid token encoding',
        data: {}
      });
    }

    const OUR_TOKEN = '83Fh78ubergMleuhuehfuYwdwdnuwbeufbuerbvYTuefube03ubeufbefDrtnr45';
    if (token !== OUR_TOKEN) {
      return res.status(401).json({
        status_code: 2001,
        status_message: 'Invalid token',
        data: {}
      });
    }

    const session = req.body;
    
    await db.execute(sql`
      INSERT INTO sessions (id, location_id, start_date, end_date, kwh, total_cost, status, created_at, updated_at)
      VALUES (${session.id}, ${session.location_id}, ${new Date(session.start_date_time)}, 
              ${session.end_date_time ? new Date(session.end_date_time) : null}, 
              ${session.kwh || 0}, ${session.total_cost || 0}, ${session.status || 'ACTIVE'}, NOW(), NOW())
    `);

    res.json({
      status_code: 1000,
      status_message: 'Success',
      data: {}
    });
  } catch (error) {
    console.error('Sessions error:', error);
    res.status(500).json({
      status_code: 3000,
      status_message: 'Internal server error: ' + error.message,
      data: {}
    });
  }
});

app.get('/ocpi/cpo/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const base64Token = authHeader?.replace('Token ', '');
    let token;
    try {
      token = Buffer.from(base64Token, 'base64').toString('utf8');
    } catch (e) {
      return res.status(401).json({
        status_code: 2001,
        status_message: 'Invalid token encoding',
        data: {}
      });
    }

    const OUR_TOKEN = '83Fh78ubergMleuhuehfuYwdwdnuwbeufbuerbvYTuefube03ubeufbefDrtnr45';
    if (token !== OUR_TOKEN) {
      return res.status(401).json({
        status_code: 2001,
        status_message: 'Invalid token',
        data: {}
      });
    }

    const userId = req.params.id;
    const user = await db.select().from(users).where(eq(users.id, userId)).then(r => r[0]);
    
    res.json({
      status_code: 1000,
      status_message: 'Success',
      data: {
        allowed: user?.bonusBalance > 1000 || false,
        token: `token_${user?.id}_${Date.now()}`
      }
    });
  } catch (error) {
    console.error('Authorization error:', error);
    res.status(500).json({
      status_code: 3000,
      status_message: 'Internal server error',
      data: {}
    });
  }
});

app.use('/ocpi', ocpiRouter);
app.get('/', (req, res) => {
  res.send('TuTak Bot is running!');
});
app.listen(port, () => {
  console.log(`✅ HTTP server running on port ${port}`);
});

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(new LocalSession({ database: 'session_db.json' }).middleware());

function mainMenu(lang) {
  const t = (key, ...args) => getTranslation(lang, key, ...args);
  return Markup.keyboard([
    [t('menu'), t('bonus')],
    [t('referral'), t('myOrders')],
    [t('changeCity'), t('changeLanguage')],
    [t('partners'), t('cart')],
    [t('myStats')]
  ]).resize();
}

function cityMenu(lang) {
  const t = (key, ...args) => getTranslation(lang, key, ...args);
  return Markup.keyboard([
    [t('yerevan'), t('echmiadzin')],
    [t('back')]
  ]).resize();
}

function languageMenu(lang) {
  return Markup.keyboard([
    ['Հայերեն', 'Русский', 'English'],
    [getTranslation(lang, 'back')]
  ]).resize();
}

function normalizePhone(phone) {
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('0') && cleaned.length === 9) {
    return '+374' + cleaned.slice(1);
  }
  if (cleaned.startsWith('374') && cleaned.length === 11) {
    return '+' + cleaned;
  }
  if (cleaned.startsWith('+374') && cleaned.length === 12) {
    return cleaned;
  }
  if (cleaned.length === 8) {
    return '+374' + cleaned;
  }
  if (cleaned.length === 10 && !cleaned.startsWith('0')) {
    return '+' + cleaned;
  }
  if (cleaned.length === 11 && cleaned.startsWith('374')) {
    return '+' + cleaned;
  }
  if (cleaned.startsWith('+') && cleaned.length >= 10) {
    return cleaned;
  }
  return null;
}

function validatePhone(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  if (normalized.length < 10) return null;
  if (!/^[\+\d]+$/.test(normalized)) return null;
  return normalized;
}

async function registerUser(telegramId, firstName, lastName, username, invitedBy = null) {
  const existing = await db.select().from(users).where(eq(users.telegramId, telegramId));
  if (existing.length > 0) return existing[0];
  
  const newUser = await db.insert(users).values({
    telegramId,
    firstName,
    lastName,
    username,
    invitedBy: invitedBy || null,
    language: null,
    city: 'yerevan',
    bonusBalance: 0,
    frozenBonus: 0,
    phoneVerified: false,
  }).returning();
  
  return newUser[0];
}

function calculateBonusToUse(orderTotal, availableBalance) {
  const maxAllowed = Math.floor(orderTotal * 0.3);
  return Math.min(availableBalance, maxAllowed);
}

async function spendBonus(userId, amount, orderId) {
  await db.insert(bonusTransactions).values({
    userId, amount: -amount, type: 'spend', bonusType: 'order', orderId, description: 'Ծախսված բոնուս'
  });
  await db.update(users)
    .set({ bonusBalance: sql`${users.bonusBalance} - ${amount}` })
    .where(eq(users.id, userId));
}

async function getReferralChain(userId) {
  const user = await db.select().from(users).where(eq(users.id, userId)).then(r => r[0]);
  if (!user || !user.invitedBy) return [];
  const level1 = user.invitedBy;
  const inviter1 = await db.select().from(users).where(eq(users.id, level1)).then(r => r[0]);
  if (!inviter1) return [];
  const level2 = inviter1.invitedBy;
  let level3 = null;
  if (level2) {
    const inviter2 = await db.select().from(users).where(eq(users.id, level2)).then(r => r[0]);
    if (inviter2) level3 = inviter2.invitedBy;
  }
  return [level1, level2, level3].filter(Boolean);
}

bot.telegram.getMe().then((botInfo) => {
  console.log('✅ Բոտը միացավ:', botInfo.username);
});

async function generateReferralQR(userId) {
  const link = `https://t.me/TuTak_Official_Bot?start=ref_${userId}`;
  return await QRCode.toDataURL(link);
}

bot.start(async (ctx) => {
  ctx.session.cart = [];
  ctx.session.checkout = null;
  ctx.session.waitingForBonus = false;
  ctx.session.waitingForAddress = false;
  ctx.session.waitingForPhone = false;
  
  let refUserId = null;
  if (ctx.startPayload && ctx.startPayload.startsWith('ref_')) {
    refUserId = parseInt(ctx.startPayload.split('_')[1]);
  }
  
  const user = await registerUser(ctx.from.id, ctx.from.first_name, ctx.from.last_name, ctx.from.username, refUserId);
  
  if (!user.language) {
    const languageKeyboard = Markup.keyboard([['Հայերեն', 'Русский', 'English']]).resize();
    await ctx.reply(getTranslation('hy', 'chooseLanguage'), languageKeyboard);
  } else {
    const welcomeText = getTranslation(user.language, 'welcome');
    await ctx.reply(welcomeText, { parse_mode: 'Markdown', reply_markup: mainMenu(user.language).reply_markup });
  }
});

bot.hears([getTranslation('hy', 'partners'), getTranslation('ru', 'partners'), getTranslation('en', 'partners')], async (ctx) => {
  const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
  const lang = user?.language || 'hy';
  
  const partnersList = await db.select().from(partners).where(eq(partners.isActive, true));
  
  if (partnersList.length === 0) {
    return ctx.reply(getTranslation(lang, 'noPartners'));
  }
  
  let text = getTranslation(lang, 'partnersTitle') + '\n\n';
  for (let p of partnersList) {
    let name = p.name;
    if (lang === 'ru' && p.nameRu) name = p.nameRu;
    if (lang === 'en' && p.nameEn) name = p.nameEn;
    text += `*${name}*\n`;
    if (p.description) text += `${p.description}\n`;
    if (p.address) text += `📍 ${p.address}\n`;
    if (p.phone) text += `📞 ${p.phone}\n`;
    text += getTranslation(lang, 'partnersBonus', p.commission) + '\n\n';
  }
  
  ctx.reply(text, { parse_mode: 'Markdown' });
});

bot.hears([getTranslation('hy', 'menu'), getTranslation('ru', 'menu'), getTranslation('en', 'menu')], async (ctx) => {
  const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
  const lang = user?.language || 'hy';
  const city = user?.city || 'yerevan';
  
  const items = await db.select().from(menuItems).where(eq(menuItems.city, city));
  if (items.length === 0) {
    return ctx.reply(getTranslation(lang, 'emptyMenu'));
  }
  
  const categoriesSet = new Set();
  for (const item of items) {
    let categoryName = item.category;
    if (lang === 'ru' && item.categoryRu) categoryName = item.categoryRu;
    if (lang === 'en' && item.categoryEn) categoryName = item.categoryEn;
    categoriesSet.add(categoryName);
  }
  
  const categories = Array.from(categoriesSet);
  const keyboard = [];
  for (let i = 0; i < categories.length; i += 2) {
    const row = [];
    row.push(Markup.button.callback(categories[i], `cat_${i}_${city}`));
    if (i + 1 < categories.length) {
      row.push(Markup.button.callback(categories[i + 1], `cat_${i + 1}_${city}`));
    }
    keyboard.push(row);
  }
  keyboard.push([Markup.button.callback(getTranslation(lang, 'back'), 'back_to_main')]);
  
  await ctx.reply(getTranslation(lang, 'categoriesTitle'), {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard(keyboard)
  });
});

bot.action(/cat_(\d+)_(.+)/, async (ctx) => {
  const categoryIndex = parseInt(ctx.match[1]);
  const city = ctx.match[2];
  const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
  const lang = user?.language || 'hy';
  
  const items = await db.select().from(menuItems).where(eq(menuItems.city, city));
  
  let categoryName = null;
  const categoriesSet = new Set();
  const categoryMap = new Map();
  for (const item of items) {
    let catDisplay = item.category;
    if (lang === 'ru' && item.categoryRu) catDisplay = item.categoryRu;
    if (lang === 'en' && item.categoryEn) catDisplay = item.categoryEn;
    categoriesSet.add(catDisplay);
    categoryMap.set(catDisplay, item.category);
  }
  const categories = Array.from(categoriesSet);
  const selectedCategory = categories[categoryIndex];
  const originalCategory = categoryMap.get(selectedCategory);
  
  const categoryItems = items.filter(item => item.category === originalCategory);
  
  if (categoryItems.length === 0) {
    return ctx.reply(getTranslation(lang, 'categoryEmpty'));
  }
  
  const keyboard = [];
  for (const item of categoryItems) {
    let name = item.name;
    if (lang === 'ru' && item.nameRu) name = item.nameRu;
    if (lang === 'en' && item.nameEn) name = item.nameEn;
    keyboard.push([Markup.button.callback(`${name} - ${item.price} ֏`, `add_${item.id}`)]);
  }
  keyboard.push([Markup.button.callback(getTranslation(lang, 'backToCategories'), 'back_to_categories')]);
  
  await ctx.reply(`🍽 *${selectedCategory}*\n\n${getTranslation(lang, 'selectItem')}`, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard(keyboard)
  });
  await ctx.answerCbQuery();
});

bot.action(/add_(\d+)/, async (ctx) => {
  try {
    const itemId = parseInt(ctx.match[1]);
    const item = await db.select().from(menuItems).where(eq(menuItems.id, itemId)).then(r => r[0]);
    if (!item) {
      await ctx.answerCbQuery('Չկա').catch(() => {});
      return;
    }
    
    ctx.session.cart = ctx.session.cart || [];
    const existing = ctx.session.cart.find(i => i.id === itemId);
    if (existing) {
      existing.quantity++;
    } else {
      ctx.session.cart.push({
        id: item.id,
        name: item.name,
        nameRu: item.nameRu,
        nameEn: item.nameEn,
        price: item.price,
        quantity: 1
      });
    }
    
    const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
    const lang = user?.language || 'hy';
    
    let itemName = item.name;
    if (lang === 'ru' && item.nameRu) itemName = item.nameRu;
    if (lang === 'en' && item.nameEn) itemName = item.nameEn;
    
    await ctx.answerCbQuery(getTranslation(lang, 'itemAdded', itemName)).catch(() => {});
  } catch (err) {
    console.error('Add to cart error:', err);
    await ctx.answerCbQuery('Սխալ, փորձեք կրկին').catch(() => {});
  }
});

bot.action('back_to_categories', async (ctx) => {
  const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
  const lang = user?.language || 'hy';
  const city = user?.city || 'yerevan';
  
  const items = await db.select().from(menuItems).where(eq(menuItems.city, city));
  if (items.length === 0) {
    return ctx.reply(getTranslation(lang, 'emptyMenu'));
  }
  
  const categoriesSet = new Set();
  for (const item of items) {
    let categoryName = item.category;
    if (lang === 'ru' && item.categoryRu) categoryName = item.categoryRu;
    if (lang === 'en' && item.categoryEn) categoryName = item.categoryEn;
    categoriesSet.add(categoryName);
  }
  
  const categories = Array.from(categoriesSet);
  const keyboard = [];
  for (let i = 0; i < categories.length; i += 2) {
    const row = [];
    row.push(Markup.button.callback(categories[i], `cat_${i}_${city}`));
    if (i + 1 < categories.length) {
      row.push(Markup.button.callback(categories[i + 1], `cat_${i + 1}_${city}`));
    }
    keyboard.push(row);
  }
  keyboard.push([Markup.button.callback(getTranslation(lang, 'back'), 'back_to_main')]);
  
  await ctx.reply(getTranslation(lang, 'categoriesTitle'), {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard(keyboard)
  });
  await ctx.answerCbQuery();
});

bot.action('show_cart', async (ctx) => {
  try {
    const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
    const lang = user?.language || 'hy';
    const cart = ctx.session.cart || [];
    if (cart.length === 0) {
      await ctx.answerCbQuery(getTranslation(lang, 'cartEmpty')).catch(() => {});
      return;
    }
    
    let total = 0;
    let text = getTranslation(lang, 'cartTitle') + '\n\n';
    for (let item of cart) {
      let name = item.name;
      if (lang === 'ru' && item.nameRu) name = item.nameRu;
      if (lang === 'en' && item.nameEn) name = item.nameEn;
      const subtotal = item.price * item.quantity;
      total += subtotal;
      text += getTranslation(lang, 'cartItem', name, item.quantity, subtotal) + '\n';
    }
    text += `\n${getTranslation(lang, 'cartTotal')} ${total} ֏`;
    
    const maxBonus = calculateBonusToUse(total, user.bonusBalance);
    text += `\n${getTranslation(lang, 'cartBonusHint', maxBonus)}`;
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(getTranslation(lang, 'checkoutConfirm'), 'checkout')],
      [Markup.button.callback(getTranslation(lang, 'clearCart'), 'clear_cart')]
    ]);
    await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
    await ctx.answerCbQuery().catch(() => {});
  } catch (err) {
    console.error('Show cart error:', err);
    await ctx.answerCbQuery('Սխալ').catch(() => {});
  }
});

bot.action('clear_cart', async (ctx) => {
  try {
    ctx.session.cart = [];
    await ctx.answerCbQuery(getTranslation('hy', 'clearCart')).catch(() => {});
    await ctx.deleteMessage();
  } catch (err) {
    console.error('Clear cart error:', err);
  }
});

bot.action('checkout', async (ctx) => {
  try {
    const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
    const cart = ctx.session.cart || [];
    if (cart.length === 0) {
      await ctx.answerCbQuery(getTranslation(user.language, 'cartEmpty')).catch(() => {});
      return;
    }
    let total = 0;
    for (let item of cart) total += item.price * item.quantity;
    const maxBonus = calculateBonusToUse(total, user.bonusBalance);
    
    ctx.session.checkout = { cart, total, maxBonus };
    
    const cancelButton = Markup.inlineKeyboard([
      [Markup.button.callback(getTranslation(user.language, 'cancelOrder'), 'cancel_checkout')]
    ]);
    
    if (maxBonus === 0) {
      ctx.session.checkout.bonusToUse = 0;
      ctx.session.waitingForBonus = false;
      ctx.session.waitingForAddress = true;
      await ctx.reply(getTranslation(user.language, 'noBonus', total), cancelButton);
    } else {
      ctx.session.waitingForBonus = true;
      await ctx.reply(getTranslation(user.language, 'askBonus', total, maxBonus), cancelButton);
    }
    await ctx.answerCbQuery().catch(() => {});
  } catch (err) {
    console.error('Checkout error:', err);
    await ctx.answerCbQuery('Սխալ').catch(() => {});
  }
});

bot.action('cancel_checkout', async (ctx) => {
  ctx.session.checkout = null;
  ctx.session.waitingForBonus = false;
  ctx.session.waitingForAddress = false;
  ctx.session.waitingForPhone = false;
  ctx.session.cart = [];
  
  const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
  await ctx.reply(getTranslation(user.language, 'orderCancelled'), mainMenu(user.language));
  await ctx.answerCbQuery();
});

bot.on('text', async (ctx, next) => {
  const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
  if (!user) return next();
  
  if (ctx.session.waitingForBonus) {
    const bonusInput = parseInt(ctx.message.text);
    if (isNaN(bonusInput) || bonusInput < 0 || bonusInput > ctx.session.checkout.maxBonus) {
      return ctx.reply(getTranslation(user.language, 'invalidNumber', 0, ctx.session.checkout.maxBonus));
    }
    ctx.session.checkout.bonusToUse = bonusInput;
    ctx.session.waitingForBonus = false;
    ctx.session.waitingForAddress = true;
    return ctx.reply(getTranslation(user.language, 'askAddress'));
  }
  
  if (ctx.session.waitingForAddress) {
    const address = ctx.message.text;
    ctx.session.checkout.address = address;
    ctx.session.waitingForAddress = false;
    
    if (!user.phoneVerified) {
      ctx.session.waitingForPhone = true;
      return ctx.reply(getTranslation(user.language, 'askPhone'));
    }
    
    const { cart, total, bonusToUse, address: savedAddress } = ctx.session.checkout;
    const finalTotal = total - bonusToUse;
    
    const itemsJson = JSON.stringify(cart.map(i => ({ id: i.id, name: i.name, qty: i.quantity, price: i.price })));
    const newOrder = await db.insert(orders).values({
      userId: user.id,
      city: user.city,
      items: itemsJson,
      totalAmount: total,
      bonusUsed: bonusToUse,
      bonusEarned: 0,
      status: 'pending',
      address: savedAddress,
    }).returning();
    
    if (bonusToUse > 0) await spendBonus(user.id, bonusToUse, newOrder[0].id);
    
    ctx.session.cart = [];
    ctx.session.checkout = null;
    
    ctx.reply(getTranslation(user.language, 'orderSent', newOrder[0].id, finalTotal));
    return;
  }
  
  if (ctx.session.waitingForPhone) {
    const phone = ctx.message.text.trim();
    const normalizedPhone = validatePhone(phone);
    
    if (!normalizedPhone) {
      return ctx.reply(getTranslation(user.language, 'invalidPhone'));
    }
    
    await db.update(users).set({ 
      phone: normalizedPhone, 
      phoneVerified: true 
    }).where(eq(users.telegramId, ctx.from.id));
    
    ctx.session.waitingForPhone = false;
    
    const { cart, total, bonusToUse, address } = ctx.session.checkout;
    const finalTotal = total - bonusToUse;
    
    const itemsJson = JSON.stringify(cart.map(i => ({ id: i.id, name: i.name, qty: i.quantity, price: i.price })));
    const newOrder = await db.insert(orders).values({
      userId: user.id,
      city: user.city,
      items: itemsJson,
      totalAmount: total,
      bonusUsed: bonusToUse,
      bonusEarned: 0,
      status: 'pending',
      address: address,
    }).returning();
    
    if (bonusToUse > 0) await spendBonus(user.id, bonusToUse, newOrder[0].id);
    
    ctx.session.cart = [];
    ctx.session.checkout = null;
    
    ctx.reply(getTranslation(user.language, 'orderSent', newOrder[0].id, finalTotal));
    return;
  }
  
  if (ctx.session.adminAction) {
    if (!await isAdmin(ctx)) return next();
    
    if (ctx.session.adminAction === 'add_menu') {
      const parts = ctx.message.text.split(',');
      if (parts.length >= 4) {
        await db.insert(menuItems).values({
          city: parts[0].trim(),
          name: parts[1].trim(),
          price: parseInt(parts[2].trim()),
          category: parts[3].trim(),
          nameHy: parts[1].trim(),
          nameRu: parts[1].trim(),
          nameEn: parts[1].trim(),
        });
        ctx.reply('✅ Ուտեստը ավելացվեց');
      } else {
        ctx.reply('❌ Սխալ ձևաչափ: Օրինակ: yerevan, Հավի բոքս, 2900, Բոքսեր');
      }
      ctx.session.adminAction = null;
      return;
    }
    
    if (ctx.session.adminAction === 'edit_menu') {
      const parts = ctx.message.text.split(',');
      if (parts.length >= 3) {
        const id = parseInt(parts[0].trim());
        await db.update(menuItems).set({
          name: parts[1].trim(),
          price: parseInt(parts[2].trim()),
        }).where(eq(menuItems.id, id));
        ctx.reply('✅ Ուտեստը խմբագրվեց');
      } else {
        ctx.reply('❌ Սխալ ձևաչափ: Օրինակ: 5, Հավի բոքս նոր, 3200');
      }
      ctx.session.adminAction = null;
      return;
    }
    
    if (ctx.session.adminAction === 'delete_menu') {
      const id = parseInt(ctx.message.text.trim());
      await db.delete(menuItems).where(eq(menuItems.id, id));
      ctx.reply('✅ Ուտեստը ջնջվեց');
      ctx.session.adminAction = null;
      return;
    }
    
    if (ctx.session.adminAction === 'add_partner') {
      const parts = ctx.message.text.split(',');
      if (parts.length >= 3) {
        await addPartner(ctx, parts[0].trim(), parts[1].trim(), parseInt(parts[2].trim()));
        ctx.reply('✅ Գործընկերը ավելացվեց');
      } else {
        ctx.reply('❌ Սխալ ձևաչափ: Օրինակ: Pizza House, Սննդի, 5');
      }
      ctx.session.adminAction = null;
      return;
    }
    
    if (ctx.session.adminAction === 'edit_partner') {
      const parts = ctx.message.text.split(',');
      if (parts.length >= 4) {
        const id = parseInt(parts[0].trim());
        await editPartner(id, {
          name: parts[1].trim(),
          category: parts[2].trim(),
          commission: parseInt(parts[3].trim())
        });
        ctx.reply('✅ Գործընկերը խմբագրվեց');
      } else {
        ctx.reply('❌ Սխալ ձևաչափ: Օրինակ: 1, Pizza House New, Սննդի, 5');
      }
      ctx.session.adminAction = null;
      return;
    }
    
    if (ctx.session.adminAction === 'delete_partner') {
      const id = parseInt(ctx.message.text.trim());
      await deletePartner(id);
      ctx.reply('✅ Գործընկերը ջնջվեց');
      ctx.session.adminAction = null;
      return;
    }
    
    if (ctx.session.adminAction === 'add_admin_username') {
      const username = ctx.message.text.trim().replace('@', '');
      const success = await addAdminByUsername(username);
      if (success) {
        ctx.reply(`✅ @${username} ավելացվեց ադմինների ցանկում`);
      } else {
        ctx.reply(`⚠️ @${username} արդեն ադմին է`);
      }
      ctx.session.adminAction = null;
      return;
    }
    
    if (ctx.session.adminAction === 'remove_admin_username') {
      const username = ctx.message.text.trim().replace('@', '');
      const success = await removeAdminByUsername(username);
      if (success) {
        ctx.reply(`❌ @${username} հեռացվեց ադմինների ցանկից`);
      } else {
        ctx.reply(`⚠️ @${username} ադմին չէ`);
      }
      ctx.session.adminAction = null;
      return;
    }
  }
  
  await next();
});

bot.hears([getTranslation('hy', 'cart'), getTranslation('ru', 'cart'), getTranslation('en', 'cart')], async (ctx) => {
  const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
  const lang = user?.language || 'hy';
  const cart = ctx.session.cart || [];
  if (cart.length === 0) {
    return ctx.reply(getTranslation(lang, 'cartEmpty'));
  }
  
  let total = 0;
  let text = getTranslation(lang, 'cartTitle') + '\n\n';
  for (let item of cart) {
    let name = item.name;
    if (lang === 'ru' && item.nameRu) name = item.nameRu;
    if (lang === 'en' && item.nameEn) name = item.nameEn;
    const subtotal = item.price * item.quantity;
    total += subtotal;
    text += getTranslation(lang, 'cartItem', name, item.quantity, subtotal) + '\n';
  }
  text += `\n${getTranslation(lang, 'cartTotal')} ${total} ֏`;
  
  const maxBonus = calculateBonusToUse(total, user.bonusBalance);
  text += `\n${getTranslation(lang, 'cartBonusHint', maxBonus)}`;
  
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback(getTranslation(lang, 'checkoutConfirm'), 'checkout')],
    [Markup.button.callback(getTranslation(lang, 'clearCart'), 'clear_cart')]
  ]);
  await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
});

bot.hears([getTranslation('hy', 'bonus'), getTranslation('ru', 'bonus'), getTranslation('en', 'bonus')], async (ctx) => {
  const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
  const t = (key, ...args) => getTranslation(user.language, key, ...args);
  ctx.reply(t('bonusText', user?.bonusBalance || 0, user?.frozenBonus || 0), { parse_mode: 'HTML' });
});

bot.hears([getTranslation('hy', 'referral'), getTranslation('ru', 'referral'), getTranslation('en', 'referral')], async (ctx) => {
  const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
  const lang = user?.language || 'hy';
  const refLink = `https://t.me/${ctx.botInfo.username}?start=ref_${user.id}`;
  
  const referrals = await db.select().from(users).where(eq(users.invitedBy, user.id));
  let referralsText = '';
  if (referrals.length > 0) {
    referralsText = `\n${getTranslation(lang, 'referralFriends', referrals.length)}*\n`;
    for (let ref of referrals) {
      referralsText += `• ${ref.firstName || ref.username || ref.telegramId}\n`;
    }
  }
  const hint = getTranslation(lang, 'referralCopyHint');
  const qrImage = await generateReferralQR(user.id);
  await ctx.replyWithPhoto(
    { source: Buffer.from(qrImage.split(',')[1], 'base64') },
    {
      caption: `${getTranslation(lang, 'referralText', refLink)}\n${referralsText}\n${hint}`,
      parse_mode: 'HTML'
    }
  );
});

bot.action('my_referrals', async (ctx) => {
  const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
  const referrals = await db.select().from(users).where(eq(users.invitedBy, user.id));
  
  if (referrals.length === 0) {
    await ctx.answerCbQuery('Դեռ ոչ ոքի չեք հրավիրել', { show_alert: true });
    return;
  }
  
  let text = 'Ձեր հրավիրածները*\n\n';
  for (let ref of referrals) {
    text += `• ${ref.firstName || ref.username || ref.telegramId}\n`;
  }
  await ctx.reply(text, { parse_mode: 'Markdown' });
  await ctx.answerCbQuery();
});

bot.hears([getTranslation('hy', 'myOrders'), getTranslation('ru', 'myOrders'), getTranslation('en', 'myOrders')], async (ctx) => {
  const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
  const lang = user?.language || 'hy';
  const userOrders = await db.select().from(orders).where(eq(orders.userId, user.id)).orderBy(desc(orders.createdAt)).limit(10);
  if (userOrders.length === 0) return ctx.reply(getTranslation(lang, 'noOrders'));
  
  let text = getTranslation(lang, 'ordersTitle') + '\n\n';
  for (let ord of userOrders) {
    let status = '';
    if (ord.status === 'pending') status = getTranslation(lang, 'orderStatusPending');
    else if (ord.status === 'confirmed') status = getTranslation(lang, 'orderStatusConfirmed');
    else if (ord.status === 'rejected') status = getTranslation(lang, 'orderStatusRejected');
    else if (ord.status === 'completed') status = getTranslation(lang, 'orderStatusCompleted');
    else status = ord.status;
    text += `№${ord.id} — ${ord.createdAt.toLocaleDateString()} — ${ord.totalAmount} ֏ — ${status}\n`;
  }
  ctx.reply(text, { parse_mode: 'Markdown' });
});

bot.hears([getTranslation('hy', 'changeCity'), getTranslation('ru', 'changeCity'), getTranslation('en', 'changeCity')], async (ctx) => {
  const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
  const t = (key, ...args) => getTranslation(user.language, key, ...args);
  ctx.reply(t('selectCity'), cityMenu(user.language));
});

bot.hears([getTranslation('hy', 'yerevan'), getTranslation('ru', 'yerevan'), getTranslation('en', 'yerevan')], async (ctx) => {
  const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
  const t = (key, ...args) => getTranslation(user.language, key, ...args);
  await db.update(users).set({ city: 'yerevan' }).where(eq(users.telegramId, ctx.from.id));
  ctx.reply(t('cityChanged', 'Երևան / Ереван / Yerevan'), { parse_mode: 'HTML', reply_markup: mainMenu(user.language).reply_markup });
});

bot.hears([getTranslation('hy', 'echmiadzin'), getTranslation('ru', 'echmiadzin'), getTranslation('en', 'echmiadzin')], async (ctx) => {
  const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
  const t = (key, ...args) => getTranslation(user.language, key, ...args);
  await db.update(users).set({ city: 'echmiadzin' }).where(eq(users.telegramId, ctx.from.id));
  ctx.reply(t('cityChanged', 'Էջմիածին / Эчмиадзин / Echmiadzin'), { parse_mode: 'HTML', reply_markup: mainMenu(user.language).reply_markup });
});

bot.hears([getTranslation('hy', 'back'), getTranslation('ru', 'back'), getTranslation('en', 'back')], async (ctx) => {
  const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
  ctx.reply('Գլխավոր մենյու', mainMenu(user.language));
});

bot.hears([getTranslation('hy', 'changeLanguage'), getTranslation('ru', 'changeLanguage'), getTranslation('en', 'changeLanguage')], async (ctx) => {
  const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
  const t = (key, ...args) => getTranslation(user.language, key, ...args);
  ctx.reply(t('selectLanguage'), languageMenu(user.language));
});

bot.hears(['Հայերեն', 'Русский', 'English'], async (ctx) => {
  ctx.session.waitingForPhone = false;
  ctx.session.waitingForBonus = false;
  ctx.session.waitingForAddress = false;
  
  const langMap = { 'Հայերեն': 'hy', 'Русский': 'ru', 'English': 'en' };
  const newLang = langMap[ctx.message.text];
  
  const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
  await db.update(users).set({ language: newLang }).where(eq(users.telegramId, ctx.from.id));
  
  const welcomeText = getTranslation(newLang, 'welcome');
  
  await ctx.reply(welcomeText, { parse_mode: 'Markdown', reply_markup: mainMenu(newLang).reply_markup });
});

bot.hears([getTranslation('hy', 'myStats'), getTranslation('ru', 'myStats'), getTranslation('en', 'myStats')], async (ctx) => {
  const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
  if (!user) return ctx.reply('Խնդրում եմ գրանցվեք /start-ով');
  const lang = user.language || 'hy';
  
  const totalEarnedImmediate = await db.select().from(bonusTransactions)
    .where(and(eq(bonusTransactions.userId, user.id), eq(bonusTransactions.type, 'earn'), eq(bonusTransactions.bonusType, 'immediate')))
    .then(r => r.reduce((sum, t) => sum + t.amount, 0));
  
  const totalEarnedFrozen = await db.select().from(bonusTransactions)
    .where(and(eq(bonusTransactions.userId, user.id), eq(bonusTransactions.type, 'earn'), eq(bonusTransactions.bonusType, 'frozen')))
    .then(r => r.reduce((sum, t) => sum + t.amount, 0));
  
  const totalSpent = await db.select().from(bonusTransactions)
    .where(and(eq(bonusTransactions.userId, user.id), eq(bonusTransactions.type, 'spend')))
    .then(r => r.reduce((sum, t) => sum + Math.abs(t.amount), 0));
  
  const partnerBonuses = await db.select({
    partnerName: partners.name,
    partnerNameRu: partners.nameRu,
    partnerNameEn: partners.nameEn,
    totalBonus: sql`SUM(${userBonusesByPartner.bonusAmount})`
  })
  .from(userBonusesByPartner)
  .leftJoin(partners, eq(userBonusesByPartner.partnerId, partners.id))
  .where(eq(userBonusesByPartner.userId, user.id))
  .groupBy(partners.id, partners.name, partners.nameRu, partners.nameEn);
  
  let text = getTranslation(lang, 'statsTitle') + '\n\n';
  text += getTranslation(lang, 'statsEarnedImmediate', totalEarnedImmediate) + '\n';
  text += getTranslation(lang, 'statsEarnedFrozen', totalEarnedFrozen) + '\n';
  text += getTranslation(lang, 'statsSpent', totalSpent) + '\n';
  text += getTranslation(lang, 'statsBalance', user.bonusBalance) + '\n\n';
  
  if (partnerBonuses.length > 0) {
    text += getTranslation(lang, 'statsByPartners') + '\n\n';
    for (let pb of partnerBonuses) {
      let name = pb.partnerName;
      if (lang === 'ru' && pb.partnerNameRu) name = pb.partnerNameRu;
      if (lang === 'en' && pb.partnerNameEn) name = pb.partnerNameEn;
      text += `• ${name}: ${pb.totalBonus} ֏\n`;
    }
  } else {
    text += getTranslation(lang, 'statsNoPartners') + '\n';
  }
  
  ctx.reply(text, { parse_mode: 'Markdown' });
});

bot.hears('📦 Պատվերներ', async (ctx) => {
  if (!await isAdmin(ctx)) return;
  await showPendingOrders(ctx);
});

bot.hears('🍽 Մենյու', async (ctx) => {
  if (!await isAdmin(ctx)) return;
  await showMenuManagement(ctx);
});

bot.hears('🏢 Գործընկերներ', async (ctx) => {
  if (!await isAdmin(ctx)) return;
  await showPartnersManagement(ctx);
});

bot.hears('🏢 ԿԱՌԱՎԱՐԵԼ ԳՈՐԾԸՆԿԵՐՆԵՐԸ', async (ctx) => {
  if (!await isAdmin(ctx)) return;
  await showPartnersManagement(ctx);
});

bot.hears('📊 Վիճակագրություն', async (ctx) => {
  if (!await isAdmin(ctx)) return;
  await showStats(ctx);
});

bot.hears('👥 Օգտատերեր', async (ctx) => {
  if (!await isAdmin(ctx)) return;
  await showUsers(ctx);
});

bot.hears('🏠 Գլխավոր մենյու', async (ctx) => {
  const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
  ctx.reply('Գլխավոր մենյու', mainMenu(user.language));
});

bot.command('admin', async (ctx) => {
  if (!await isAdmin(ctx)) return ctx.reply('⛔ Մուտքը արգելված է');
  await showAdminPanel(ctx);
});

bot.action('manage_admins', async (ctx) => {
  if (!await isAdmin(ctx)) return;
  await showManageAdmins(ctx);
  await ctx.answerCbQuery();
});

bot.action('add_admin_by_username', async (ctx) => {
  if (!await isAdmin(ctx)) return;
  ctx.session.adminAction = 'add_admin_username';
  await ctx.reply('📝 Գրեք նոր ադմինի Telegram username-ը (առանց @-ի):\nՕրինակ: Aram123');
  await ctx.answerCbQuery();
});

bot.action('remove_admin_by_username', async (ctx) => {
  if (!await isAdmin(ctx)) return;
  ctx.session.adminAction = 'remove_admin_username';
  await ctx.reply('📝 Գրեք հեռացնելու ադմինի Telegram username-ը (առանց @-ի):\nՕրինակ: Aram123');
  await ctx.answerCbQuery();
});

bot.action(/confirm_order_(\d+)/, async (ctx) => {
  if (!await isAdmin(ctx)) return ctx.answerCbQuery('⛔ Արգելված է');
  await confirmOrder(ctx, parseInt(ctx.match[1]));
});

bot.action(/reject_order_(\d+)/, async (ctx) => {
  if (!await isAdmin(ctx)) return ctx.answerCbQuery('⛔ Արգելված է');
  await rejectOrder(ctx, parseInt(ctx.match[1]));
});

bot.action('add_menu_item', async (ctx) => {
  if (!await isAdmin(ctx)) return;
  ctx.session.adminAction = 'add_menu';
  await ctx.reply('📝 Գրեք նոր ուտեստի տվյալները այս ձևաչափով:\nքաղաք, անուն, գին, կատեգորիա\nՕրինակ: yerevan, Հավի բոքս, 2900, Բոքսեր');
  await ctx.answerCbQuery();
});

bot.action('edit_menu_item', async (ctx) => {
  if (!await isAdmin(ctx)) return;
  ctx.session.adminAction = 'edit_menu';
  await ctx.reply('📝 Գրեք ուտեստի ID-ն և նոր տվյալները:\nid, անուն, գին\nՕրինակ: 5, Հավի բոքս նոր, 3200');
  await ctx.answerCbQuery();
});

bot.action('delete_menu_item', async (ctx) => {
  if (!await isAdmin(ctx)) return;
  ctx.session.adminAction = 'delete_menu';
  await ctx.reply('🗑 Գրեք ջնջելու ուտեստի ID-ն:\nՕրինակ: 5');
  await ctx.answerCbQuery();
});

bot.action('add_partner', async (ctx) => {
  if (!await isAdmin(ctx)) return;
  ctx.session.adminAction = 'add_partner';
  await ctx.reply('📝 Գրեք նոր գործընկերի տվյալները:\nանուն, կատեգորիա, commission(%)\nՕրինակ: Pizza House, Սննդի, 5');
  await ctx.answerCbQuery();
});

bot.action('edit_partner', async (ctx) => {
  if (!await isAdmin(ctx)) return;
  ctx.session.adminAction = 'edit_partner';
  await ctx.reply('📝 Գրեք գործընկերի ID-ն և նոր տվյալները:\nid, անուն, կատեգորիա, commission(%)\nՕրինակ: 1, Pizza House New, Սննդի, 5');
  await ctx.answerCbQuery();
});

bot.action('delete_partner', async (ctx) => {
  if (!await isAdmin(ctx)) return;
  ctx.session.adminAction = 'delete_partner';
  await ctx.reply('🗑 Գրեք ջնջելու գործընկերի ID-ն:\nՕրինակ: 1');
  await ctx.answerCbQuery();
});

bot.action('back_to_admin', async (ctx) => {
  if (!await isAdmin(ctx)) return;
  await showAdminPanel(ctx);
  await ctx.answerCbQuery();
});

bot.action('back_to_main', async (ctx) => {
  const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
  const lang = user?.language || 'hy';
  await ctx.reply(getTranslation(lang, 'backToMain'), mainMenu(lang));
  await ctx.answerCbQuery();
});

bot.telegram.deleteWebhook({ drop_pending_updates: true })
  .then(() => {
    console.log('✅ Webhook deleted');
    setTimeout(() => {
      bot.launch({ polling: { timeout: 30 } });
    }, 2000);
  })
  .catch((err) => {
    console.error('Webhook delete error:', err);
    setTimeout(() => {
      bot.launch({ polling: { timeout: 30 } });
    }, 2000);
  });

console.log('✅ TuTak Bot աշխատում է...');
