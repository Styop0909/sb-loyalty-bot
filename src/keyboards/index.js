import { Markup } from 'telegraf';
import { getTranslation } from '../../i18n.js';

export function mainMenu(lang) {
  const t = (key, ...args) => getTranslation(lang, key, ...args);
  return Markup.keyboard([
    ['🍽 Մենյու', '💎 Բոնուս'],
    ['👥 Ռեֆերալ', '📋 Պատվերներ'],
    ['🏙 Քաղաք', '🌐 Լեզու'],
    ['🏢 Գործընկերներ', '🛒 Զամբյուղ'],
    ['📊 Վիճակագրություն', '🏗 Շինանյութեր'],
    ['🔌 Fast Charge', '📱 Mobile App']
  ]).resize();
}

export function cityMenu(lang) {
  const t = (key, ...args) => getTranslation(lang, key, ...args);
  return Markup.keyboard([
    [t('yerevan'), t('echmiadzin')],
    [t('back')]
  ]).resize();
}

export function languageMenu(lang) {
  return Markup.keyboard([
    ['Հայերեն', 'Русский', 'English'],
    [getTranslation(lang, 'back')]
  ]).resize();
}

export function adminMenu() {
  return Markup.keyboard([
    ['📦 Պատվերներ', '🍽 Մենյու'],
    ['📊 Վիճակագրություն', '👥 Օգտատերեր'],
    ['🏢 Գործընկերներ', '🏠 Գլխավոր մենյու']
  ]).resize();
}

export function fastChargeMenu() {
  return Markup.keyboard([
    ['📍 Կայաններ', '💰 Տարիֆներ'],
    ['📊 Իմ սեսիաները', '📱 FastCharge QR'],
    ['⬅️ Հետ']
  ]).resize();
}

export function buildingMaterialsMenu(lang) {
  const t = (key) => getTranslation(lang, key);
  return Markup.keyboard([
    [t('sand'), t('gravel')],
    [t('back')]
  ]).resize();
}

export function inlineAdminMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('➕ Ավելացնել ուտեստ', 'add_menu_item')],
    [Markup.button.callback('✏️ Խմբագրել ուտեստ', 'edit_menu_item')],
    [Markup.button.callback('🗑 Ջնջել ուտեստ', 'delete_menu_item')],
    [Markup.button.callback('👑 Կառավարել ադմիններ', 'manage_admins')],
    [Markup.button.callback('🔙 Հետ', 'back_to_admin')]
  ]);
}

export function inlinePartnerMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('➕ Ավելացնել գործընկեր', 'add_partner')],
    [Markup.button.callback('✏️ Խմբագրել գործընկեր', 'edit_partner')],
    [Markup.button.callback('🗑 Ջնջել գործընկեր', 'delete_partner')],
    [Markup.button.callback('🔙 Հետ', 'back_to_admin')]
  ]);
}

export function inlineAdminManagement() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('➕ Ավելացնել ադմին', 'add_admin_by_username')],
    [Markup.button.callback('❌ Հեռացնել ադմին', 'remove_admin_by_username')],
    [Markup.button.callback('🔙 Հետ', 'back_to_admin')]
  ]);
}

export function inlineBackButton(callback = 'back_to_main') {
  return Markup.inlineKeyboard([
    [Markup.button.callback('◀️ Հետ', callback)]
  ]);
}

export function inlineConfirmButtons(orderId) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('✅ Հաստատել', `confirm_order_${orderId}`)],
    [Markup.button.callback('❌ Մերժել', `reject_order_${orderId}`)]
  ]);
}

export default {
  mainMenu,
  cityMenu,
  languageMenu,
  adminMenu,
  fastChargeMenu,
  buildingMaterialsMenu,
  inlineAdminMenu,
  inlinePartnerMenu,
  inlineAdminManagement,
  inlineBackButton,
  inlineConfirmButtons,
};
