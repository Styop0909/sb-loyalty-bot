const QRCode = require('qrcode');

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

function calculateBonusToUse(orderTotal, availableBalance) {
  const maxAllowed = Math.floor(orderTotal * 0.3);
  return Math.min(availableBalance, maxAllowed);
}

async function generateQR(data) {
  try {
    const qrString = typeof data === 'string' ? data : Buffer.from(JSON.stringify(data)).toString('base64');
    return await QRCode.toDataURL(qrString);
  } catch (error) {
    throw new Error('QR generation failed: ' + error.message);
  }
}

module.exports = {
  normalizePhone,
  validatePhone,
  calculateBonusToUse,
  generateQR
};
