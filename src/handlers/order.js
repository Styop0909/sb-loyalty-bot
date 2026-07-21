import { Markup } from 'telegraf';
import { db } from '../db/index.js';
import { orders, users, bonusTransactions } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import logger from '../utils/logger.js';
import { mainMenu } from '../keyboards/index.js';

class OrderHandlers {
  constructor(bot) {
    this.bot = bot;
    this.setupHandlers();
  }

  setupHandlers() {
    this.bot.hears(['📋 Պատվերներ', '📋 Orders', '📋 Заказы'], async (ctx) => {
      try {
        const user = await this.getUser(ctx.from.id);
        if (!user) return;
        
        const userOrders = await db.select()
          .from(orders)
          .where(eq(orders.userId, user.id))
          .orderBy(desc(orders.createdAt))
          .limit(10);
        
        if (userOrders.length === 0) {
          return ctx.reply('📭 Դուք դեռ պատվերներ չունեք');
        }
        
        let text = '📋 *Ձեր պատվերները*\n\n';
        for (let ord of userOrders) {
          const statusMap = {
            pending: '⏳ Սպասում է',
            confirmed: '✅ Հաստատված',
            rejected: '❌ Մերժված',
            completed: '✔️ Ավարտված'
          };
          text += `№${ord.id} — ${ord.createdAt.toLocaleDateString()} — ${ord.totalAmount} ֏ — ${statusMap[ord.status] || ord.status}\n`;
        }
        
        await ctx.reply(text, { parse_mode: 'Markdown' });
      } catch (error) {
        logger.error('Orders error:', error);
        await ctx.reply('❌ Սխալ տեղի ունեցավ:');
      }
    });

    this.bot.hears(['🛒 Զամբյուղ', '🛒 Cart', '🛒 Корзина'], async (ctx) => {
      const cart = ctx.session.cart || [];
      if (cart.length === 0) {
        return ctx.reply('🛒 Զամբյուղը դատարկ է');
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
    });
  }

  async getUser(telegramId) {
    const result = await db.select().from(users).where(eq(users.telegramId, telegramId));
    return result[0] || null;
  }
}

export default OrderHandlers;
