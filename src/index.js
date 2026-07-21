import { Telegraf } from 'telegraf';
import LocalSession from 'telegraf-session-local';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';
import https from 'https';

import config from './config/index.js';
import db from './db/index.js';
import ocpiRouter from './ocpi/server.js';
import { mainMenu } from './keyboards/index.js';

import {
  AdminHandlers,
  UserHandlers,
  OrderHandlers,
  BonusHandlers,
  PartnerHandlers,
  FastChargeHandlers,
  MenuHandlers
} from './handlers/index.js';

// ============================================
// OCPI ENDPOINTS (Express)
// ============================================
const app = express();
const port = config.port || 8080;

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use('/ocpi', ocpiRouter);

// OCPI Handshake endpoints
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
        { identifier: 'locations', role: 'SENDER', url: 'https://sb-loyalty-bot-production.up.railway.app/ocpi/cpo/locations' },
        { identifier: 'locations', role: 'RECEIVER', url: 'https://sb-loyalty-bot-production.up.railway.app/ocpi/emsp/locations' },
        { identifier: 'tariffs', role: 'SENDER', url: 'https://sb-loyalty-bot-production.up.railway.app/ocpi/cpo/tariffs' },
        { identifier: 'tariffs', role: 'RECEIVER', url: 'https://sb-loyalty-bot-production.up.railway.app/ocpi/emsp/tariffs' },
        { identifier: 'sessions', role: 'SENDER', url: 'https://sb-loyalty-bot-production.up.railway.app/ocpi/cpo/sessions' },
        { identifier: 'sessions', role: 'RECEIVER', url: 'https://sb-loyalty-bot-production.up.railway.app/ocpi/emsp/sessions' },
        { identifier: 'cdrs', role: 'SENDER', url: 'https://sb-loyalty-bot-production.up.railway.app/ocpi/cpo/cdrs' },
        { identifier: 'cdrs', role: 'RECEIVER', url: 'https://sb-loyalty-bot-production.up.railway.app/ocpi/emsp/cdrs' },
        { identifier: 'commands', role: 'SENDER', url: 'https://sb-loyalty-bot-production.up.railway.app/ocpi/emsp/commands' },
        { identifier: 'commands', role: 'RECEIVER', url: 'https://sb-loyalty-bot-production.up.railway.app/ocpi/cpo/commands' },
        { identifier: 'hubclientinfo', role: 'SENDER', url: 'https://sb-loyalty-bot-production.up.railway.app/ocpi/hubclientinfo' }
      ]
    }
  });
});

// Authentication helper
const OUR_TOKEN = config.ocpiToken;

function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Token ')) {
    return { valid: false, error: 'Missing authorization header' };
  }
  const base64Token = authHeader.replace('Token ', '');
  let token;
  try {
    token = Buffer.from(base64Token, 'base64').toString('utf8');
  } catch (e) {
    return { valid: false, error: 'Invalid token encoding' };
  }
  if (token !== OUR_TOKEN) {
    return { valid: false, error: 'Invalid token' };
  }
  return { valid: true, token };
}

// Credentials handler
const handleCredentials = async (req, res) => {
  try {
    console.log('📥 Credentials request received');
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Token ')) {
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
    } catch (e) {
      return res.status(401).json({
        status_code: 2001,
        status_message: 'Invalid token encoding',
        data: {}
      });
    }

    const bodyToken = req.body.token;
    if (headerToken !== bodyToken || headerToken !== OUR_TOKEN) {
      return res.status(401).json({
        status_code: 2001,
        status_message: 'Invalid token',
        data: {}
      });
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

// Locations endpoint
app.post('/ocpi/locations', async (req, res) => {
  try {
    const verification = verifyToken(req.headers.authorization);
    if (!verification.valid) {
      return res.status(401).json({ status_code: 2001, status_message: verification.error, data: {} });
    }
    const locationsData = req.body;
    if (!Array.isArray(locationsData)) {
      return res.status(400).json({ status_code: 2002, status_message: 'Invalid data format', data: {} });
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
          name = EXCLUDED.name, address = EXCLUDED.address, city = EXCLUDED.city,
          country = EXCLUDED.country, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
          evses = EXCLUDED.evses, publish = EXCLUDED.publish, is_online = EXCLUDED.is_online,
          updated_at = NOW()
      `);
    }
    res.json({ status_code: 1000, status_message: 'Success', data: {} });
  } catch (error) {
    console.error('❌ Locations error:', error);
    res.status(500).json({ status_code: 3000, status_message: 'Internal server error: ' + error.message, data: {} });
  }
});

// Tariffs endpoint
app.post('/ocpi/tariffs', async (req, res) => {
  try {
    const verification = verifyToken(req.headers.authorization);
    if (!verification.valid) {
      return res.status(401).json({ status_code: 2001, status_message: verification.error, data: {} });
    }
    const tariffsData = req.body;
    if (!Array.isArray(tariffsData)) {
      return res.status(400).json({ status_code: 2002, status_message: 'Invalid data format', data: {} });
    }
    console.log('💰 Received', tariffsData.length, 'tariffs');
    for (const tariff of tariffsData) {
      await db.execute(sql`
        INSERT INTO tariffs (id, currency, elements, energy_price, parking_fee, created_at, updated_at)
        VALUES (${tariff.id}, ${tariff.currency || 'AMD'}, ${JSON.stringify(tariff.elements || {})}, 
                ${tariff.energy_price || 0}, ${tariff.parking_fee || 0}, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          currency = EXCLUDED.currency, elements = EXCLUDED.elements,
          energy_price = EXCLUDED.energy_price, parking_fee = EXCLUDED.parking_fee,
          updated_at = NOW()
      `);
    }
    res.json({ status_code: 1000, status_message: 'Success', data: {} });
  } catch (error) {
    console.error('❌ Tariffs error:', error);
    res.status(500).json({ status_code: 3000, status_message: 'Internal server error: ' + error.message, data: {} });
  }
});

// Sessions endpoint
app.post('/ocpi/cpo/sessions', async (req, res) => {
  try {
    const verification = verifyToken(req.headers.authorization);
    if (!verification.valid) {
      return res.status(401).json({ status_code: 2001, status_message: verification.error, data: {} });
    }
    const sessionData = req.body;
    console.log('📊 CPO Session received:', sessionData.id);
    const startDate = sessionData.start_date_time ? new Date(sessionData.start_date_time) : null;
    const endDate = sessionData.end_date_time ? new Date(sessionData.end_date_time) : null;
    await db.execute(sql`
      INSERT INTO sessions (id, location_id, user_id, start_date, end_date, kwh, total_cost, status, created_at, updated_at)
      VALUES (${sessionData.id}, ${sessionData.location_id}, ${sessionData.user_id || null}, 
              ${startDate}, ${endDate}, ${parseFloat(sessionData.kwh) || 0}, ${parseFloat(sessionData.total_cost) || 0}, 
              ${sessionData.status || 'ACTIVE'}, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        end_date = EXCLUDED.end_date, kwh = EXCLUDED.kwh,
        total_cost = EXCLUDED.total_cost, status = EXCLUDED.status,
        updated_at = NOW()
    `);
    res.json({ status_code: 1000, status_message: 'Success', data: {} });
  } catch (error) {
    console.error('❌ CPO Sessions error:', error);
    res.status(500).json({ status_code: 3000, status_message: 'Internal server error: ' + error.message, data: {} });
  }
});

// CDRs endpoint
app.post('/ocpi/cpo/cdrs', async (req, res) => {
  try {
    const verification = verifyToken(req.headers.authorization);
    if (!verification.valid) {
      return res.status(401).json({ status_code: 2001, status_message: verification.error, data: {} });
    }
    const cdrData = req.body;
    console.log('📄 CPO CDR received:', cdrData.id);
    const startDate = cdrData.start_date_time ? new Date(cdrData.start_date_time) : null;
    const endDate = cdrData.end_date_time ? new Date(cdrData.end_date_time) : null;
    await db.execute(sql`
      INSERT INTO cdrs (id, session_id, location_id, user_id, start_date, end_date, kwh, total_cost, currency, status, created_at, updated_at)
      VALUES (${cdrData.id}, ${cdrData.session_id}, ${cdrData.location_id}, ${cdrData.user_id || null},
              ${startDate}, ${endDate}, ${parseFloat(cdrData.kwh) || 0}, ${parseFloat(cdrData.total_cost) || 0}, 
              ${cdrData.currency || 'AMD'}, ${cdrData.status || 'COMPLETED'}, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        end_date = EXCLUDED.end_date, kwh = EXCLUDED.kwh,
        total_cost = EXCLUDED.total_cost, status = EXCLUDED.status,
        updated_at = NOW()
    `);
    res.json({ status_code: 1000, status_message: 'Success', data: {} });
  } catch (error) {
    console.error('❌ CPO CDRs error:', error);
    res.status(500).json({ status_code: 3000, status_message: 'Internal server error: ' + error.message, data: {} });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/', (req, res) => {
  res.send('TuTak Bot is running!');
});

app.listen(port, () => {
  console.log(`✅ HTTP server running on port ${port}`);
});

// ============================================
// TELEGRAM BOT
// ============================================
const bot = new Telegraf(config.botToken);
bot.use(new LocalSession({ database: 'session_db.json' }).middleware());

// Initialize all handlers
new AdminHandlers(bot);
new UserHandlers(bot);
new OrderHandlers(bot);
new BonusHandlers(bot);
new PartnerHandlers(bot);
new FastChargeHandlers(bot);
new MenuHandlers(bot);

// ============================================
// SYNC FUNCTIONS (Fast Charge)
// ============================================
const FAST_CHARGE_BASE64 = config.fastChargeToken;
let isSyncing = false;
let lastSyncTime = 0;

async function syncLocations() {
  try {
    console.log('🔄 Syncing locations from Fast Charge...');
    
    const options = {
      hostname: 'api.fastcharge.company',
      path: '/v2/ocpi/2.2.1/cpo/locations',
      method: 'GET',
      headers: {
        'Authorization': `Token ${FAST_CHARGE_BASE64}`
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', async () => {
          try {
            const json = JSON.parse(data);
            if (json.status_code === 1000) {
              console.log(`📍 Received ${json.data.length} locations`);
              for (const loc of json.data) {
                const lat = parseFloat(loc.coordinates.latitude) || 0;
                const lng = parseFloat(loc.coordinates.longitude) || 0;
                const isOnline = loc.evses?.some(e => e.connectors?.some(c => c.status === 'online')) || false;
                await db.execute(sql`
                  INSERT INTO locations (id, name, address, city, country, latitude, longitude, evses, publish, is_online, updated_at)
                  VALUES (${loc.id}, ${loc.name}, ${loc.address}, ${loc.city}, ${loc.country.slice(0, 2)},
                          ${lat}, ${lng}, ${JSON.stringify(loc.evses || [])}, ${loc.publish !== false}, ${isOnline}, NOW())
                  ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name, address = EXCLUDED.address, city = EXCLUDED.city,
                    country = EXCLUDED.country, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
                    evses = EXCLUDED.evses, publish = EXCLUDED.publish, is_online = EXCLUDED.is_online,
                    updated_at = NOW()
                `);
              }
              console.log('✅ Locations synced successfully');
              resolve(json.data);
            } else {
              console.error('❌ Fast Charge error:', json.status_message);
              reject(new Error(json.status_message));
            }
          } catch (e) {
            console.error('❌ Parse error:', e.message);
            reject(e);
          }
        });
      });
      req.on('error', (e) => {
        console.error('❌ Request error:', e.message);
        reject(e);
      });
      req.end();
    });
  } catch (error) {
    console.error('❌ Sync error:', error.message);
    throw error;
  }
}

async function syncTariffs() {
  try {
    console.log('💰 Syncing tariffs from Fast Charge...');
    const options = {
      hostname: 'api.fastcharge.company',
      path: '/v2/ocpi/2.2.1/cpo/tariffs',
      method: 'GET',
      headers: {
        'Authorization': `Token ${FAST_CHARGE_BASE64}`
      }
    };
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', async () => {
          try {
            const json = JSON.parse(data);
            if (json.status_code === 1000) {
              console.log(`💰 Received ${json.data.length} tariffs`);
              for (const tariff of json.data) {
                await db.execute(sql`
                  INSERT INTO tariffs (id, currency, elements, energy_price, parking_fee, updated_at)
                  VALUES (${tariff.id}, ${tariff.currency || 'AMD'}, ${JSON.stringify(tariff.elements || {})}, 
                          ${tariff.energy_price || 0}, ${tariff.parking_fee || 0}, NOW())
                  ON CONFLICT (id) DO UPDATE SET
                    currency = EXCLUDED.currency, elements = EXCLUDED.elements,
                    energy_price = EXCLUDED.energy_price, parking_fee = EXCLUDED.parking_fee,
                    updated_at = NOW()
                `);
              }
              console.log('✅ Tariffs synced successfully');
              resolve(json.data);
            } else {
              console.error('❌ Fast Charge error:', json.status_message);
              reject(new Error(json.status_message));
            }
          } catch (e) {
            console.error('❌ Parse error:', e.message);
            reject(e);
          }
        });
      });
      req.on('error', (e) => {
        console.error('❌ Request error:', e.message);
        reject(e);
      });
      req.end();
    });
  } catch (error) {
    console.error('❌ Sync error:', error.message);
    throw error;
  }
}

async function syncData() {
  if (isSyncing) {
    console.log('⏳ Sync already in progress, skipping...');
    return;
  }
  const now = Date.now();
  if (now - lastSyncTime < 30000) {
    console.log('⏳ Too soon since last sync, skipping...');
    return;
  }
  isSyncing = true;
  try {
    await Promise.allSettled([syncLocations(), syncTariffs()]);
    lastSyncTime = now;
    console.log('✅ Sync completed successfully');
  } catch (error) {
    console.error('❌ Sync failed:', error);
  } finally {
    isSyncing = false;
  }
}

// Start sync
setTimeout(() => { syncData().catch(console.error); }, 5000);
setInterval(() => { syncData().catch(console.error); }, 10 * 60 * 1000);

// ============================================
// START BOT
// ============================================
bot.telegram.getMe().then((botInfo) => {
  console.log('✅ Բոտը միացավ:', botInfo.username);
});

bot.telegram.deleteWebhook({ drop_pending_updates: true })
  .then(() => {
    console.log('✅ Webhook deleted');
    bot.launch({ polling: { timeout: 30 } });
  })
  .catch((err) => {
    console.error('Webhook delete error:', err);
    bot.launch({ polling: { timeout: 30 } });
  });

console.log('✅ TuTak Bot աշխատում է...');

export { bot, app };
