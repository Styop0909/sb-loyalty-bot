import QRCode from 'qrcode';

export function normalizePhone(phone) {
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

export function validatePhone(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  if (normalized.length < 10) return null;
  if (!/^[\+\d]+$/.test(normalized)) return null;
  return normalized;
}

export function calculateBonusToUse(orderTotal, availableBalance, maxPercentage = 0.3) {
  const maxAllowed = Math.floor(orderTotal * maxPercentage);
  return Math.min(availableBalance, maxAllowed);
}

export async function generateQR(data) {
  try {
    const qrString = typeof data === 'string' ? data : Buffer.from(JSON.stringify(data)).toString('base64');
    return await QRCode.toDataURL(qrString);
  } catch (error) {
    throw new Error(`QR generation failed: ${error.message}`);
  }
}

export function generateId(prefix = '') {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}${random}`;
}

export function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('hy-AM', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatCurrency(amount, currency = 'AMD') {
  return `${Math.round(amount)} ${currency}`;
}

export function truncateText(text, maxLength = 50) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

export function getStatusEmoji(status) {
  const emojis = {
    pending: '⏳',
    confirmed: '✅',
    rejected: '❌',
    completed: '✔️',
    ACTIVE: '🔌',
    COMPLETED: '✅',
    CANCELLED: '❌',
  };
  return emojis[status] || '📌';
}

export function getStatusText(status, lang = 'hy') {
  const texts = {
    hy: {
      pending: 'Սպասում է',
      confirmed: 'Հաստատված',
      rejected: 'Մերժված',
      completed: 'Ավարտված',
      ACTIVE: 'Ակտիվ',
      COMPLETED: 'Ավարտված',
    },
    ru: {
      pending: 'Ожидает',
      confirmed: 'Подтвержден',
      rejected: 'Отклонен',
      completed: 'Завершен',
      ACTIVE: 'Активный',
      COMPLETED: 'Завершен',
    },
    en: {
      pending: 'Pending',
      confirmed: 'Confirmed',
      rejected: 'Rejected',
      completed: 'Completed',
      ACTIVE: 'Active',
      COMPLETED: 'Completed',
    }
  };
  return texts[lang]?.[status] || status;
}

export function getBonusTypeText(type, lang = 'hy') {
  const texts = {
    hy: {
      immediate: 'Անմիջապես',
      frozen: 'Սառեցված',
      unfrozen: 'Ապասառեցված',
      spend: 'Ծախսված',
    },
    ru: {
      immediate: 'Мгновенный',
      frozen: 'Замороженный',
      unfrozen: 'Размороженный',
      spend: 'Потраченный',
    },
    en: {
      immediate: 'Immediate',
      frozen: 'Frozen',
      unfrozen: 'Unfrozen',
      spend: 'Spent',
    }
  };
  return texts[lang]?.[type] || type;
}
