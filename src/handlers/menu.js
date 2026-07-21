import { Markup } from 'telegraf';
import { db } from '../db/index.js';
import { menuItems } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { getTranslation } from '../../i18n.js';

class MenuHandlers {
  constructor(bot) {
    this.bot = bot;
    this.setupHandlers();
  }

  setupHandlers() {
    // Menu
    this.bot.hears(['🍽 Ճաշացուցակ', '🍽 Меню', '🍽 Menu'], async (ctx) => {
      const user = await this.getUser(ctx.from.id);
      if (!user) return;
      const lang = user.language || 'hy';
      const city = user.city || 'yerevan';
      
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

    // Category selection
    this.bot.action(/cat_(\d+)_(.+)/, async (ctx) => {
      const categoryIndex = parseInt(ctx.match[1]);
      const city = ctx.match[2];
      const user = await this.getUser(ctx.from.id);
      if (!user) return;
      const lang = user.language || 'hy';
      
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
      keyboard.push([Markup.button.callback('🛒 Զամբյուղ', 'show_cart')]);
      
      await ctx.reply(`🍽 *${selectedCategory}*\n\n${getTranslation(lang, 'selectItem')}`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(keyboard)
      });
      await ctx.answerCbQuery();
    });

    // Add to cart
    this.bot.action(/add_(\d+)/, async (ctx) => {
      try {
        const itemId = parseInt(ctx.match[1]);
        const item = await db.select().from(menuItems).where(eq(menuItems.id, itemId)).then(r => r[0]);
        if (!item) {
          await ctx.answerCbQuery('Չկա');
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
        
        const user = await this.getUser(ctx.from.id);
        if (!user) return;
        const lang = user.language || 'hy';
        let itemName = item.name;
        if (lang === 'ru' && item.nameRu) itemName = item.nameRu;
        if (lang === 'en' && item.nameEn) itemName = item.nameEn;
        
        await ctx.answerCbQuery(getTranslation(lang, 'itemAdded', itemName));
      } catch (err) {
        console.error('Add to cart error:', err);
        await ctx.answerCbQuery('Սխալ, փորձեք կրկին');
      }
    });

    // Back to categories
    this.bot.action('back_to_categories', async (ctx) => {
      const user = await this.getUser(ctx.from.id);
      if (!user) return;
      const lang = user.language || 'hy';
      const city = user.city || 'yerevan';
      
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

    // Show cart
    this.bot.action('show_cart', async (ctx) => {
      const user = await this.getUser(ctx.from.id);
      if (!user) return;
      const lang = user.language || 'hy';
      
      const cart = ctx.session.cart || [];
      if (cart.length === 0) {
        await ctx.answerCbQuery(getTranslation(lang, 'cartEmpty'));
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
      await ctx.answerCbQuery();
    });
  }

  async getUser(telegramId) {
    const result = await db.select().from(users).where(eq(users.telegramId, telegramId));
    return result[0] || null;
  }
}

export default MenuHandlers;

// Import needed for calculateBonusToUse
import { calculateBonusToUse } from '../utils/helpers.js';
