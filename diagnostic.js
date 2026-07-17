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
const { sql } = require('drizzle-orm');
const axios = require('axios');
require('dotenv').config();

// ============================================
// ԿԱՐԳԱՎՈՐՈՒՄՆԵՐ
// ============================================

const FAST_TOKEN = "72CmZMK4U5XrrPaSZ0y9L8rWZlScIAL4a9F9b8PwOsxRjryxgbF3hXG1b85PBNkZ";
const OUR_TOKEN = "83Fh78ubergMleuhuehfuYwdwdnuwbeufbuerbvYTuefube03ubeufbefDrtnr45";
const FAST_CHARGE_TOKEN = "YXzFdr66FHUEPN8qdD4u2MzDkW2AwlugT5CYFy4I1HQZUYlAg0kiFBm8XHpm9Y3sNSgfuAAi";
const BASE_URL = "https://sb-loyalty-bot-production.up.railway.app";
const FAST_CHARGE_URL = "https://api.fastcharge.company/v2/ocpi";

// ============================================
// 1. ՍՏՈՒԳԵԼ ՏՎՅԱԼՆԵՐԻ ԲԱԶԱՆ
// ============================================

async function checkDatabase() {
  console.log('\n📊 ===== DATABASE CHECK =====');
  
  try {
    // Locations
    const locationsCount = await db.execute(sql`SELECT COUNT(*) as total FROM locations`);
    console.log(`📍 Locations: ${locationsCount.rows[0].total}`);
    
    const locationsData = await db.execute(sql`SELECT id, name, city, created_at, publish FROM locations`);
    console.log('📋 Locations list:');
    locationsData.rows.forEach(loc => {
      console.log(`   ${loc.id} | ${loc.name} | ${loc.city} | publish: ${loc.publish}`);
    });
    
    // Tariffs
    const tariffsCount = await db.execute(sql`SELECT COUNT(*) as total FROM tariffs`);
    console.log(`💰 Tariffs: ${tariffsCount.rows[0].total}`);
    
    const tariffsData = await db.execute(sql`SELECT id, currency, energy_price FROM tariffs`);
    console.log('📋 Tariffs list:');
    tariffsData.rows.forEach(t => {
      console.log(`   ${t.id} | ${t.currency} | ${t.energy_price}`);
    });
    
    // Sessions
    const sessionsCount = await db.execute(sql`SELECT COUNT(*) as total FROM sessions`);
    console.log(`📊 Sessions: ${sessionsCount.rows[0].total}`);
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
}

// ============================================
// 2. ՍՏՈՒԳԵԼ ՁԵՐ ՍԵՐՎԵՐԸ
// ============================================

async function checkOurServer() {
  console.log('\n🖥️ ===== OUR SERVER CHECK =====');
  
  try {
    // /versions
    const versions = await axios.get(`${BASE_URL}/ocpi/versions`);
    console.log(`✅ /versions: ${versions.data.status_code}`);
  } catch (error) {
    console.log(`❌ /versions: ${error.response?.status || 'ERROR'}`);
  }
  
  try {
    // /details
    const details = await axios.get(`${BASE_URL}/ocpi/details`);
    console.log(`✅ /details: ${details.data.status_code}`);
  } catch (error) {
    console.log(`❌ /details: ${error.response?.status || 'ERROR'}`);
  }
  
  try {
    // /locations
    const headers = {
      'Authorization': `Token ${Buffer.from(OUR_TOKEN).toString('base64')}`
    };
    const locations = await axios.get(`${BASE_URL}/ocpi/locations`, { headers });
    console.log(`✅ /locations: ${locations.data.status_code} (${locations.data.data?.length || 0} locations)`);
  } catch (error) {
    console.log(`❌ /locations: ${error.response?.status || 'ERROR'}`);
  }
  
  try {
    // /tariffs
    const headers = {
      'Authorization': `Token ${Buffer.from(OUR_TOKEN).toString('base64')}`
    };
    const tariffs = await axios.get(`${BASE_URL}/ocpi/tariffs`, { headers });
    console.log(`✅ /tariffs: ${tariffs.data.status_code} (${tariffs.data.data?.length || 0} tariffs)`);
  } catch (error) {
    console.log(`❌ /tariffs: ${error.response?.status || 'ERROR'}`);
  }
}

// ============================================
// 3. ՍՏՈՒԳԵԼ FAST CHARGE-Ի ՀԱՍԱՆԵԼԻՈՒԹՅՈՒՆԸ
// ============================================

async function checkFastCharge() {
  console.log('\n🔌 ===== FAST CHARGE CHECK =====');
  
  const base64Fast = Buffer.from(FAST_TOKEN).toString('base64');
  const base64Our = Buffer.from(OUR_TOKEN).toString('base64');
  const base64FastCharge = Buffer.from(FAST_CHARGE_TOKEN).toString('base64');
  
  // 1. GET /versions (PRE_TOKEN)
  try {
    const headers = { 'Authorization': `Token ${base64Fast}` };
    const versions = await axios.get(`${FAST_CHARGE_URL}/versions`, { headers });
    console.log(`✅ /versions (PRE_TOKEN): ${versions.data.status_code}`);
  } catch (error) {
    console.log(`❌ /versions (PRE_TOKEN): ${error.response?.status || 'ERROR'}`);
  }
  
  // 2. GET /details (PRE_TOKEN)
  try {
    const headers = { 'Authorization': `Token ${base64Fast}` };
    const details = await axios.get(`${FAST_CHARGE_URL}/2.2.1/details`, { headers });
    console.log(`✅ /details (PRE_TOKEN): ${details.data.status_code}`);
  } catch (error) {
    console.log(`❌ /details (PRE_TOKEN): ${error.response?.status || 'ERROR'}`);
  }
  
  // 3. GET /cpo/locations (OUR_TOKEN)
  try {
    const headers = { 'Authorization': `Token ${base64Our}` };
    const locations = await axios.get(`${FAST_CHARGE_URL}/2.2.1/cpo/locations`, { headers });
    console.log(`✅ /cpo/locations (OUR_TOKEN): ${locations.data.status_code} (${locations.data.data?.length || 0} locations)`);
  } catch (error) {
    console.log(`❌ /cpo/locations (OUR_TOKEN): ${error.response?.status || 'ERROR'}`);
  }
  
  // 4. GET /cpo/locations (FAST_CHARGE_TOKEN)
  try {
    const headers = { 'Authorization': `Token ${base64FastCharge}` };
    const locations = await axios.get(`${FAST_CHARGE_URL}/2.2.1/cpo/locations`, { headers });
    console.log(`✅ /cpo/locations (FAST_CHARGE_TOKEN): ${locations.data.status_code} (${locations.data.data?.length || 0} locations)`);
  } catch (error) {
    console.log(`❌ /cpo/locations (FAST_CHARGE_TOKEN): ${error.response?.status || 'ERROR'}`);
  }
  
  // 5. GET /cpo/tariffs (OUR_TOKEN)
  try {
    const headers = { 'Authorization': `Token ${base64Our}` };
    const tariffs = await axios.get(`${FAST_CHARGE_URL}/2.2.1/cpo/tariffs`, { headers });
    console.log(`✅ /cpo/tariffs (OUR_TOKEN): ${tariffs.data.status_code} (${tariffs.data.data?.length || 0} tariffs)`);
  } catch (error) {
    console.log(`❌ /cpo/tariffs (OUR_TOKEN): ${error.response?.status || 'ERROR'}`);
  }
}

// ============================================
// 4. ՍՏՈՒԳԵԼ FAST CHARGE-Ի POST /CREDENTIALS
// ============================================

async function checkCredentials() {
  console.log('\n🔐 ===== CREDENTIALS CHECK =====');
  
  const base64Fast = Buffer.from(FAST_TOKEN).toString('base64');
  
  try {
    const headers = {
      'Authorization': `Token ${base64Fast}`,
      'Content-Type': 'application/json'
    };
    const body = {
      token: FAST_TOKEN,
      url: `${BASE_URL}/ocpi/versions`
    };
    const response = await axios.post(`${FAST_CHARGE_URL}/2.2.1/credentials`, body, { headers });
    console.log(`✅ POST /credentials: ${response.data.status_code}`);
    console.log(`   Token: ${response.data.data?.token}`);
    console.log(`   URL: ${response.data.data?.url}`);
  } catch (error) {
    console.log(`❌ POST /credentials: ${error.response?.status || 'ERROR'}`);
    console.log(`   ${error.response?.data?.status_message || 'No message'}`);
  }
}

// ============================================
// 5. RUN ALL
// ============================================

async function runDiagnostic() {
  console.log('\n🔍 ==========================================');
  console.log('🔍   TUṬAK OCPI DIAGNOSTIC TOOL');
  console.log('🔍 ==========================================');
  console.log(`📅 Time: ${new Date().toISOString()}`);
  console.log(`🏠 Our URL: ${BASE_URL}`);
  console.log(`🔌 Fast Charge URL: ${FAST_CHARGE_URL}`);
  
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
