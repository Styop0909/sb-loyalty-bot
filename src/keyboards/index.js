const { Markup } = require('telegraf');
const { getTranslation } = require('../../i18n');

function mainMenu(lang) {
  const t = (key, ...args) => getTranslation(lang, key, ...args);
  return Markup.keyboard([
    [t('menu'), t('bonus')],
    [t('referral'), t('myOrders')],
    [t('changeCity'), t('changeLanguage')],
    [t('partners'), t('cart')],
    [t('myStats'), t('buildingMaterials')],
    ['🔌 Fast Charge', '📱 Mobile App']
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

function adminMenu() {
  return Markup.keyboard([
    ['📦 Պատվերներ', '🍽 Մենյու'],
    ['📊 Վիճակագրություն', '👥 Օգտատերեր'],
    ['🏢 Գործընկերներ', '🏠 Գլխավոր մենյու']
  ]).resize();
}

function fastChargeMenu() {
  return Markup.keyboard([
    ['📍 Կայաններ', '💰 Տարիֆներ'],
    ['📊 Իմ սեսիաները', '📱 FastCharge QR'],
    ['⬅️ Հետ']
  ]).resize();
}

module.exports = {
  mainMenu,
  cityMenu,
  languageMenu,
  adminMenu,
  fastChargeMenu
};
