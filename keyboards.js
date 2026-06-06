const { Markup } = require('telegraf');

function mainMenu() {
  return Markup.keyboard([
    ['🍽 Ճաշացուցակ', '⭐ Բոնուսներ'],
    ['👥 Ռեֆերալ', '📋 Իմ պատվերները'],
    ['📍 Փոխել քաղաքը', '🌐 Փոխել լեզուն']
  ])
  .resize()
  .oneTime(false);
}

module.exports = { mainMenu };