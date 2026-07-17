const https = require('https');
const { db } = require('./src/db');
const { sql } = require('drizzle-orm');
require('dotenv').config();

// ============================================
// ԿԱՐԳԱՎՈՐՈՒՄՆԵՐ
// ============================================

const FAST_TOKEN = "72CmZMK4U5XrrPaSZ0y9L8rWZlScIAL4a9F9b8PwOsxRjryxgbF3hXG1b85PBNkZ";
const OUR_TOKEN = "83Fh78ubergMleuhuehfuYwdwdnuwbeufbuerbvYTuefube03ubeufbefDrtnr45";
const FAST_CHARGE_TOKEN = "YXzFdr66FHUEPN8qdD4u2MzDkW2AwlugT5CYFy4I1HQZUYlAg0kiFBm8XHpm9Y3sNSgfuAAi";
const BASE_URL = "https://sb-loyalty-bot-production.up.railway.app";
const FAST_CHARGE_URL = "https://api.fastcharge.company";

// ============================================
// HTTPS REQUEST HELPER
// ============================================

function httpsRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// ============================================
// 1. ՍՏՈՒԳԵԼ ՏՎՅԱԼՆԵՐԻ ԲԱԶԱՆ
// ============================================

async function checkDatabase() {
  console.log('\n📊 ===== DATABASE CHECK =====');
  
  try {
    const locationsCount = await db.execute(sql`SELECT COUNT(*) as total FROM locations`);
    console.log(`📍 Locations: ${locationsCount.rows[0].total}`);
    
    const locationsData = await db.execute(sql`SELECT id, name, city, created_at, publish FROM locations`);
    console.log('📋 Locations list:');
    locationsData.rows.forEach(loc => {
      console.log(`   ${loc.id} | ${loc.name} | ${loc.city} | publish: ${loc.publish}`);
    });
  } catch (error) {
    console.log('❌ Locations error:', error.message);
  }
  
  try {
    const tariffsCount = await db.execute(sql`SELECT COUNT(*) as total FROM tariffs`);
    console.log(`💰 Tariffs: ${tariffsCount.rows[0].total}`);
  } catch (error) {
    console.log('❌ Tariffs error:', error.message);
  }
  
  try {
    const sessionsCount = await db.execute(sql`SELECT COUNT(*) as total FROM sessions`);
    console.log(`📊 Sessions: ${sessionsCount.rows[0].total}`);
  } catch (error) {
    console.log('❌ Sessions error:', error.message);
  }
}

// ============================================
// 2. HTTPS REQUEST WRAPPER
// ============================================

function request(url, method = 'GET', headers = {}, body = null) {
  const urlObj = new URL(url);
  const options = {
    hostname: urlObj.hostname,
    port: urlObj.port || 443,
    path: urlObj.pathname + urlObj.search,
    method: method,
    headers: headers
  };
  return httpsRequest(options, body);
}

// ============================================
// 3. ՍՏՈՒԳԵԼ ՁԵՐ ՍԵՐՎԵՐԸ
// ============================================

async function checkOurServer() {
  console.log('\n🖥️ ===== OUR SERVER CHECK =====');
  
  // /versions
  const versions = await request(`${BASE_URL}/ocpi/versions`);
  console.log(`✅ /versions: ${versions.status}`);
  
  // /details
  const details = await request(`${BASE_URL}/ocpi/details`);
  console.log(`✅ /details: ${details.status}`);
  
  // /locations (with token)
  const base64Our = Buffer.from(OUR_TOKEN).toString('base64');
  const locations = await request(`${BASE_URL}/ocpi/locations`, 'GET', {
    'Authorization': `Token ${base64Our}`
  });
  console.log(`✅ /locations: ${locations.status} (${locations.data?.data?.length || 0} locations)`);
  
  // /tariffs (with token)
  const tariffs = await request(`${BASE_URL}/ocpi/tariffs`, 'GET', {
    'Authorization': `Token ${base64Our}`
  });
  console.log(`✅ /tariffs: ${tariffs.status} (${tariffs.data?.data?.length || 0} tariffs)`);
}

// ============================================
// 4. ՍՏՈՒԳԵԼ FAST CHARGE-Ի ՍԵՐՎԵՐԸ
// ============================================

async function checkFastCharge() {
  console.log('\n🔌 ===== FAST CHARGE CHECK =====');
  
  const base64Fast = Buffer.from(FAST_TOKEN).toString('base64');
  const base64Our = Buffer.from(OUR_TOKEN).toString('base64');
  const base64FastCharge = Buffer.from(FAST_CHARGE_TOKEN).toString('base64');
  
  // /versions (PRE_TOKEN)
  const versions = await request(`${FAST_CHARGE_URL}/v2/ocpi/versions`, 'GET', {
    'Authorization': `Token ${base64Fast}`
  });
  console.log(`✅ /versions (PRE_TOKEN): ${versions.status}`);
  
  // /details (PRE_TOKEN)
  const details = await request(`${FAST_CHARGE_URL}/v2/ocpi/2.2.1/details`, 'GET', {
    'Authorization': `Token ${base64Fast}`
  });
  console.log(`✅ /details (PRE_TOKEN): ${details.status}`);
  
  // /cpo/locations (OUR_TOKEN)
  const locations1 = await request(`${FAST_CHARGE_URL}/v2/ocpi/2.2.1/cpo/locations`, 'GET', {
    'Authorization': `Token ${base64Our}`
  });
  console.log(`✅ /cpo/locations (OUR_TOKEN): ${locations1.status} (${locations1.data?.data?.length || 0} locations)`);
  
  // /cpo/locations (FAST_CHARGE_TOKEN)
  const locations2 = await request(`${FAST_CHARGE_URL}/v2/ocpi/2.2.1/cpo/locations`, 'GET', {
    'Authorization': `Token ${base64FastCharge}`
  });
  console.log(`✅ /cpo/locations (FAST_CHARGE_TOKEN): ${locations2.status} (${locations2.data?.data?.length || 0} locations)`);
  
  // /cpo/tariffs (OUR_TOKEN)
  const tariffs = await request(`${FAST_CHARGE_URL}/v2/ocpi/2.2.1/cpo/tariffs`, 'GET', {
    'Authorization': `Token ${base64Our}`
  });
  console.log(`✅ /cpo/tariffs (OUR_TOKEN): ${tariffs.status} (${tariffs.data?.data?.length || 0} tariffs)`);
}

// ============================================
// 5. CREDENTIALS CHECK
// ============================================

async function checkCredentials() {
  console.log('\n🔐 ===== CREDENTIALS CHECK =====');
  
  const base64Fast = Buffer.from(FAST_TOKEN).toString('base64');
  
  const headers = {
    'Authorization': `Token ${base64Fast}`,
    'Content-Type': 'application/json'
  };
  const body = {
    token: FAST_TOKEN,
    url: `${BASE_URL}/ocpi/versions`
  };
  
  const response = await request(`${FAST_CHARGE_URL}/v2/ocpi/2.2.1/credentials`, 'POST', headers, body);
  console.log(`✅ POST /credentials: ${response.status}`);
  if (response.status === 1000 || response.status === 200) {
    console.log(`   Token: ${response.data?.data?.token}`);
    console.log(`   URL: ${response.data?.data?.url}`);
  }
}

// ============================================
// 6. RUN ALL
// ============================================

async function runDiagnostic() {
  console.log('\n🔍 ==========================================');
  console.log('🔍   TUṬAK OCPI DIAGNOSTIC TOOL');
  console.log('🔍 ==========================================');
  console.log(`📅 Time: ${new Date().toISOString()}`);
  
  await checkDatabase();
  await checkOurServer();
  await checkFastCharge();
  await checkCredentials();
  
  console.log('\n✅ ==========================================');
  console.log('✅ DIAGNOSTIC COMPLETE');
  console.log('✅ ==========================================\n');
  
  process.exit(0);
}

runDiagnostic().catch(console.error);
