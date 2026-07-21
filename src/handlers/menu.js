import { Markup } from 'telegraf';
import { db } from '../db/index.js';
import { menuItems } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import logger from '../utils/logger.js';

class MenuHandlers {
  constructor(bot) {
    this.bot = bot;
    this.setupHandlers();
  }

  setupHandlers() {
    this.bot.hears(['🍽 Մենյու', '🍽 Menu', '🍽 Меню'], async (ctx) => {
      try {
        const user = await this.getUser(ctx.from.id);
        const city = user?.city || 'yerevan';
        
        const items = await db.select().from(menuItems).where(eq(menuItems.city, city));
        if (items.length === 0) {
          return ctx.reply('📭 Մենյուն դատարկ է');
        }
        
        const categories = {};
        for (const item of items) {
          const cat = item.category || 'Այլ';
          if (!categories[cat]) categories[cat] = [];
          categories[cat].push(item);
        }
        
        const keyboard = [];
        for (const [category, items] of Object.entries(categories)) {
          const buttonText = `${category} (${items.length})`;
          keyboard.push([Markup.button.callback(buttonText, `cat_${category}_${city}`)]);
        }
        keyboard.push([Markup.button.callback('◀️ Հետ', 'back_to_main')]);
        
        await ctx.reply('🍽 *Մենյու*\n\nԸնտրեք կատեգորիա:', {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard(keyboard)
        });
      } catch (error) {
        logger.error('Menu error:', error);
        await ctx.reply('❌ Սխալ տեղի ունեցավ:');
      }
    });

    this.bot.action(/cat_(.+)_(.+)/, async (ctx) => {
      try {
        const category = ctx.match[1];
        const city = ctx.match[2];
        
        const items = await db.select()
          .from(menuItems)
          .where(eq(menuItems.city, city))
          .where(eq(menuItems.category, category));
        
        if (items.length === 0) {
          return ctx.reply('📭 Այս կատեգորիայում ուտեստներ չկան');
        }
        
        const keyboard = [];
        for (const item of items) {
          keyboard.push([Markup.button.callback(
            `${item.name} — ${item.price} ֏`,
            `add_${item.id}`
          )]);
        }
        keyboard.push([Markup.button.callback('◀️ Հետ', 'back_to_categories')]);
        keyboard.push([Markup.button.callback('🛒 Զամբյուղ', 'show_cart')]);
        
        await ctx.reply(`🍽 *${category}*\n\nԸնտրեք ուտեստը:`, {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard(keyboard)
        });
        await ctx.answerCbQuery();
      } catch (error) {
        logger.error('Category error:', error);
        await ctx.answerCbQuery('Սխալ տեղի ունեցավ');
      }
    });

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
            price: item.price,
            quantity: 1
          });
        }
        
        await ctx.answerCbQuery(`✅ ${item.name} ավելացվեց զամբյուղում`);
      } catch (error) {
        logger.error('Add to cart error:', error);
        await ctx.answerCbQuery('Սխալ, փորձեք կրկին');
      }
    });

    this.bot.action('back_to_categories', async (ctx) => {
      await ctx.reply('🍽 Մենյու');
      await ctx.answerCbQuery();
    });

    this.bot.action('show_cart', async (ctx) => {
      const cart = ctx.session.cart || [];
      if (cart.length === 0) {
        await ctx.answerCbQuery('Զամբյուղը դատարկ է');
        return;
      }
      
      let total = 0;
      let text = '🛒 *Զամբյուղ*\n\n';
      for (let item of cart) {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        text += `${item.name} x${item.quantity} — ${subtotal} ֏\n`;
      }
      text += `\n💰 Ընդամենը: ${total} ֏`;
      
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('✅ Պատվիրել', 'checkout')],
        [Markup.button.callback('🗑 Մաքրել', 'clear_cart')]
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
