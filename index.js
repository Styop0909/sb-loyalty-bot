const { Telegraf, Markup } = require('telegraf');
const LocalSession = require('telegraf-session-local');
require('dotenv').config();
const { db } = require('./src/db');
const { users, orders, menuItems, bonusTransactions, partners, userBonusesByPartner } = require('./src/db/schema');
const { eq, desc, and } = require('drizzle-orm');
const { getTranslation } = require('./i18n');
const { sql } = require('drizzle-orm');
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
const port = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.send('SB Loyalty Bot is running!');
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
    ['🏢 Գործընկերներ', '🛒 Զամբյուղ'],
    ['📊 Իմ վիճակագրություն']
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

function validatePhone(phone) {
  const regex = /^\+374\d{8}$/;
  return regex.test(phone);
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
  
  if (!user.language || user.language === 'hy') {
    const languageKeyboard = Markup.keyboard([['Հայերեն', 'Русский', 'English']]).resize();
    await ctx.reply('🌐 Ընտրիր լեզու / Выбери язык / Choose language:', languageKeyboard);
  } else {
    const welcomeText = getTranslation(user.language, 'welcome');
    await ctx.reply(welcomeText, { parse_mode: 'Markdown', reply_markup: mainMenu(user.language).reply_markup });
  }
});

bot.hears(['🏢 Գործընկերներ', '🏢 Партнеры', '🏢 Partners'], async (ctx) => {
  const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
  const lang = user?.language || 'hy';
  
  const partnersList = await db.select().from(partners).where(eq(partners.isActive, true));
  
  if (partnersList.length === 0) {
    return ctx.reply('📭 Դեռևս գործընկերներ չկան');
  }
  
  let text = '🏢 *ՄԵՐ ԳՈՐԾԸՆԿԵՐՆԵՐԸ*\n\n';
  for (let p of partnersList) {
    let name = p.name;
    if (lang === 'ru' && p.nameRu) name = p.nameRu;
    if (lang === 'en' && p.nameEn) name = p.nameEn;
    text += `*${name}*\n`;
    if (p.description) text += `${p.description}\n`;
    if (p.address) text += `📍 ${p.address}\n`;
    if (p.phone) text += `📞 ${p.phone}\n`;
    text += `💰 Բոնուս: ${p.commission}%\n\n`;
  }
  
  ctx.reply(text, { parse_mode: 'Markdown' });
});

bot.hears(['🍽 Ճաշացուցակ', '🍽 Меню', '🍽 Menu'], async (ctx) => {
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
  keyboard.push([Markup.button.callback('🔙 Հետ', 'back_to_main')]);
  
  await ctx.reply('📂 *Ընտրիր կատեգորիա:*', {
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
    return ctx.reply('📭 Այս կատեգորիայում ուտեստ չկա');
  }
  
  const keyboard = [];
  for (const item of categoryItems) {
    let name = item.name;
    if (lang === 'ru' && item.nameRu) name = item.nameRu;
    if (lang === 'en' && item.nameEn) name = item.nameEn;
    keyboard.push([Markup.button.callback(`${name} - ${item.price} ֏`, `add_${item.id}`)]);
  }
  keyboard.push([Markup.button.callback('◀️ Վերադառնալ կատեգորիաներին', 'back_to_categories')]);
  
  await ctx.reply(`🍽 *${selectedCategory}*\n\nԸնտրիր ուտեստը:`, {
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
    await ctx.answerCbQuery(`✅ ${item.name} ավելացվեց`).catch(() => {});
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
  keyboard.push([Markup.button.callback('🔙 Հետ', 'back_to_main')]);
  
  await ctx.reply('📂 *Ընտրիր կատեգորիա:*', {
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
      await ctx.answerCbQuery('Զամբյուղը դատարկ է').catch(() => {});
      return;
    }
    
    let total = 0;
    let text = '🛒 *Ձեր զամբյուղը*\n\n';
    for (let item of cart) {
      let name = item.name;
      if (lang === 'ru' && item.nameRu) name = item.nameRu;
      if (lang === 'en' && item.nameEn) name = item.nameEn;
      const subtotal = item.price * item.quantity;
      total += subtotal;
      text += `${name} x${item.quantity} — ${subtotal} ֏\n`;
    }
    text += `\n💰 *Ընդամենը:* ${total} ֏`;
    
    const maxBonus = calculateBonusToUse(total, user.bonusBalance);
    text += `\n⭐ *Կարող եք օգտագործել մինչև:* ${maxBonus} բոնուս`;
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('✅ Ձևակերպել պատվեր', 'checkout')],
      [Markup.button.callback('🗑 Մաքրել զամբյուղը', 'clear_cart')]
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
    await ctx.answerCbQuery('Զամբյուղը մաքրվեց').catch(() => {});
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
      await ctx.answerCbQuery('Զամբյուղը դատարկ է').catch(() => {});
      return;
    }
    let total = 0;
    for (let item of cart) total += item.price * item.quantity;
    const maxBonus = calculateBonusToUse(total, user.bonusBalance);
    
    ctx.session.checkout = { cart, total, maxBonus };
    
    const cancelButton = Markup.inlineKeyboard([
      [Markup.button.callback('❌ Չեղարկել պատվերը', 'cancel_checkout')]
    ]);
    
    if (maxBonus === 0) {
      ctx.session.checkout.bonusToUse = 0;
      ctx.session.waitingForBonus = false;
      ctx.session.waitingForAddress = true;
      await ctx.reply(`Պատվերի գումարը: ${total} ֏\nԴուք չունեք բոնուսներ:\nՆշեք առաքման հասցեն (կամ գրեք "ինքնուրույն վերցնել"):`, cancelButton);
    } else {
      ctx.session.waitingForBonus = true;
      await ctx.reply(`Պատվերի գումարը: ${total} ֏\nԿարող եք օգտագործել մինչև ${maxBonus} բոնուս:\nՈրքա՞ն բոնուս եք ուզում օգտագործել (0-${maxBonus}):`, cancelButton);
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
  await ctx.reply('❌ Պատվերը չեղարկվեց:', mainMenu(user.language));
  await ctx.answerCbQuery();
});

bot.on('text', async (ctx, next) => {
  const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
  if (!user) return next();
  
  if (ctx.session.waitingForBonus) {
    const bonusInput = parseInt(ctx.message.text);
    if (isNaN(bonusInput) || bonusInput < 0 || bonusInput > ctx.session.checkout.maxBonus) {
      return ctx.reply(`Սխալ թիվ: Գրեք 0-ից ${ctx.session.checkout.maxBonus} միջակայքում`);
    }
    ctx.session.checkout.bonusToUse = bonusInput;
    ctx.session.waitingForBonus = false;
    ctx.session.waitingForAddress = true;
    return ctx.reply('Նշեք առաքման հասցեն (կամ գրեք "ինքնուրույն վերցնել"):');
  }
  
  if (ctx.session.waitingForAddress) {
    const address = ctx.message.text;
    ctx.session.checkout.address = address;
    ctx.session.waitingForAddress = false;
    
    if (!user.phoneVerified) {
      ctx.session.waitingForPhone = true;
      return ctx.reply('📱 Խնդրում եմ գրեք ձեր հեռախոսահամարը +374 ձևաչափով:\nՕրինակ: +374XXXXXXXX');
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
    
    ctx.reply(`✅ Պատվերը ուղարկվեց հաստատման №${newOrder[0].id}\n💸 Վճարված: ${finalTotal} ֏\n⏳ Սպասեք ադմինի հաստատմանը`);
    return;
  }
  
  if (ctx.session.waitingForPhone) {
    const phone = ctx.message.text.trim();
    if (!validatePhone(phone)) {
      return ctx.reply('❌ Սխալ ձևաչափ: Խնդրում եմ գրեք +374XXXXXXXX ձևաչափով:\nՕրինակ: +374XXXXXXXX');
    }
    await db.update(users).set({ phone: phone, phoneVerified: true }).where(eq(users.telegramId, ctx.from.id));
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
    
    ctx.reply(`✅ Պատվերը ուղարկվեց հաստատման №${newOrder[0].id}\n💸 Վճարված: ${finalTotal} ֏\n⏳ Սպասեք ադմինի հաստատմանը`);
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

bot.hears(['🛒 Զամբյուղ', '🛒 Корзина', '🛒 Cart', '🛒 Զամբյուղ / Корзина / Cart'], async (ctx) => {
  const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
  const lang = user?.language || 'hy';
  const cart = ctx.session.cart || [];
  if (cart.length === 0) {
    return ctx.reply('🛒 Զամբյուղը դատարկ է');
  }
  
  let total = 0;
  let text = '🛒 *Ձեր զամբյուղը*\n\n';
  for (let item of cart) {
    let name = item.name;
    if (lang === 'ru' && item.nameRu) name = item.nameRu;
    if (lang === 'en' && item.nameEn) name = item.nameEn;
    const subtotal = item.price * item.quantity;
    total += subtotal;
    text += `${name} x${item.quantity} — ${subtotal} ֏\n`;
  }
  text += `\n💰 *Ընդամենը:* ${total} ֏`;
  
  const maxBonus = calculateBonusToUse(total, user.bonusBalance);
  text += `\n⭐ *Կարող եք օգտագործել մինչև:* ${maxBonus} բոնուս`;
  
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('✅ Ձևակերպել պատվեր', 'checkout')],
    [Markup.button.callback('🗑 Մաքրել զամբյուղը', 'clear_cart')]
  ]);
  await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
});

bot.hears(['⭐ Բոնուսներ', '⭐ Бонусы', '⭐ Bonuses'], async (ctx) => {
  const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
  const t = (key, ...args) => getTranslation(user.language, key, ...args);
  ctx.reply(t('bonusText', user?.bonusBalance || 0, user?.frozenBonus || 0), { parse_mode: 'HTML' });
});
bot.hears(['👥 Ռեֆերալ', '👥 Рефералы', '👥 Referral'], async (ctx) => {
  const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
  const refLink = `https://t.me/${ctx.botInfo.username}?start=ref_${user.id}`;
  
  const referrals = await db.select().from(users).where(eq(users.invitedBy, user.id));
  let referralsText = '';
  if (referrals.length > 0) {
    referralsText = '\n\n👥 *Ձեր հրավիրածները:*\n';
    for (let ref of referrals) {
      referralsText += `• ${ref.firstName || ref.username || ref.telegramId}\n`;
    }
  }
  
  ctx.reply(`<b>👥 Ռեֆերալային ծրագիր</b>\n\n🔗 Ձեր հղումը:\n \n<code>${refLink}</code>\n\n📊 Բոնուսներ:\n• 1% - 1-ին մակարդակ\n• 0.5% - 2-րդ մակարդակ\n• 0.25% - 3-րդ մակարդակ${referralsText}\n\n💡 Հղումը պատճենելու համար պարզապես սեղմեք հղման վրա`, { parse_mode: 'HTML' });
});
bot.action('my_referrals', async (ctx) => {
  const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
  const referrals = await db.select().from(users).where(eq(users.invitedBy, user.id));
  
  if (referrals.length === 0) {
    await ctx.answerCbQuery('Դեռ ոչ ոքի չեք հրավիրել', { show_alert: true });
    return;
  }
  
  let text = '👥 *Ձեր հրավիրածները*\n\n';
  for (let ref of referrals) {
    text += `• ${ref.firstName || ref.username || ref.telegramId}\n`;
  }
  await ctx.reply(text, { parse_mode: 'Markdown' });
  await ctx.answerCbQuery();
});

bot.hears(['📋 Իմ պատվերները', '📋 Мои заказы', '📋 My orders'], async (ctx) => {
  const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
  const userOrders = await db.select().from(orders).where(eq(orders.userId, user.id)).orderBy(desc(orders.createdAt)).limit(10);
  if (userOrders.length === 0) return ctx.reply('📭 Դեռ պատվերներ չկան');
  let text = '📋 *Ձեր վերջին պատվերները*\n\n';
  for (let ord of userOrders) {
    text += `№${ord.id} — ${ord.createdAt.toLocaleDateString()} — ${ord.totalAmount} ֏ — ${ord.status}\n`;
  }
  ctx.reply(text, { parse_mode: 'Markdown' });
});

bot.hears(['📍 Փոխել քաղաքը', '📍 Сменить город', '📍 Change city'], async (ctx) => {
  const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
  const t = (key, ...args) => getTranslation(user.language, key, ...args);
  ctx.reply(t('selectCity'), cityMenu(user.language));
});

bot.hears(['🌆 Երևան', '🌆 Ереван', '🌆 Yerevan'], async (ctx) => {
  const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
  const t = (key, ...args) => getTranslation(user.language, key, ...args);
  await db.update(users).set({ city: 'yerevan' }).where(eq(users.telegramId, ctx.from.id));
  ctx.reply(t('cityChanged', 'Երևան / Ереван / Yerevan'), { parse_mode: 'HTML', reply_markup: mainMenu(user.language).reply_markup });
});

bot.hears(['✝️ Էջմիածին', '✝️ Эчмиадзин', '✝️ Echmiadzin'], async (ctx) => {
  const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
  const t = (key, ...args) => getTranslation(user.language, key, ...args);
  await db.update(users).set({ city: 'echmiadzin' }).where(eq(users.telegramId, ctx.from.id));
  ctx.reply(t('cityChanged', 'Էջմիածին / Эчмиадзин / Echmiadzin'), { parse_mode: 'HTML', reply_markup: mainMenu(user.language).reply_markup });
});

bot.hears(['◀️ Հետ', '◀️ Назад', '◀️ Back'], async (ctx) => {
  const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
  ctx.reply('Գլխավոր մենյու', mainMenu(user.language));
});

bot.hears(['🌐 Փոխել լեզուն', '🌐 Сменить язык', '🌐 Change language'], async (ctx) => {
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
  
  const t = (key, ...args) => getTranslation(newLang, key, ...args);
  const welcomeText = t('welcome');
  
  await ctx.reply(welcomeText, { parse_mode: 'Markdown', reply_markup: mainMenu(newLang).reply_markup });
});

bot.hears('📊 Իմ վիճակագրություն', async (ctx) => {
  const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
  if (!user) return ctx.reply('Խնդրում եմ գրանցվեք /start-ով');
  
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
  
  const lang = user.language || 'hy';
  let text = `📊 *ՎԻՃԱԿԱԳՐՈՒԹՅՈՒՆ*\n\n`;
  text += `✅ Ստացված բոնուսներ (2% անմիջապես): ${totalEarnedImmediate} ֏\n`;
  text += `⏳ Ստացված բոնուսներ (սառեցված 6 ամիս): ${totalEarnedFrozen} ֏\n`;
  text += `💸 Ծախսված բոնուսներ: ${totalSpent} ֏\n`;
  text += `⭐ Ընթացիկ մնացորդ: ${user.bonusBalance} ֏\n\n`;
  
  if (partnerBonuses.length > 0) {
    text += `🏢 *ԸՍՏ ԳՈՐԾԸՆԿԵՐՆԵՐԻ*\n\n`;
    for (let pb of partnerBonuses) {
      let name = pb.partnerName;
      if (lang === 'ru' && pb.partnerNameRu) name = pb.partnerNameRu;
      if (lang === 'en' && pb.partnerNameEn) name = pb.partnerNameEn;
      text += `• ${name}: ${pb.totalBonus} ֏\n`;
    }
  } else {
    text += `🏢 Գործընկերներից բոնուսներ դեռ չկան\n`;
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
  await ctx.reply('🔙 Վերադարձ գլխավոր մենյու', mainMenu(lang));
  await ctx.answerCbQuery();
});

bot.launch({ polling: { timeout: 30 } });
console.log('✅ SB Loyalty Bot աշխատում է...');
