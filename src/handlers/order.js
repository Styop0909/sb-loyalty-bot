import { Markup } from 'telegraf';
import { db } from '../db/index.js';
import { orders, users, bonusTransactions } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { getTranslation } from '../../i18n.js';
import { calculateBonusToUse, validatePhone } from '../utils/helpers.js';
import { mainMenu } from '../keyboards/index.js';
import { spendBonus } from '../services/bonus.js';

class OrderHandlers {
  constructor(bot) {
    this.bot = bot;
    this.setupHandlers();
  }

  setupHandlers() {
    // My Orders
    this.bot.hears(['📋 Իմ պատվերները', '📋 Мои заказы', '📋 My orders'], async (ctx) => {
      const user = await this.getUser(ctx.from.id);
      if (!user) return;
      const lang = user.language || 'hy';
      
      const userOrders = await db.select().from(orders).where(eq(orders.userId, user.id)).orderBy(desc(orders.createdAt)).limit(10);
      if (userOrders.length === 0) {
        return ctx.reply(getTranslation(lang, 'noOrders'));
      }
      
      let text = getTranslation(lang, 'ordersTitle') + '\n\n';
      for (let ord of userOrders) {
        let status = '';
        if (ord.status === 'pending') status = getTranslation(lang, 'orderStatusPending');
        else if (ord.status === 'confirmed') status = getTranslation(lang, 'orderStatusConfirmed');
        else if (ord.status === 'rejected') status = getTranslation(lang, 'orderStatusRejected');
        else if (ord.status === 'completed') status = getTranslation(lang, 'orderStatusCompleted');
        else status = ord.status;
        text += `№${ord.id} — ${ord.createdAt.toLocaleDateString()} — ${ord.totalAmount} ֏ — ${status}\n`;
      }
      await ctx.reply(text, { parse_mode: 'Markdown' });
    });

    // Cart
    this.bot.hears(['🛒 Զամբյուղ', '🛒 Корзина', '🛒 Cart'], async (ctx) => {
      const user = await this.getUser(ctx.from.id);
      if (!user) return;
      const lang = user.language || 'hy';
      
      const cart = ctx.session.cart || [];
      if (cart.length === 0) {
        return ctx.reply(getTranslation(lang, 'cartEmpty'));
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
    });

    // Clear cart
    this.bot.action('clear_cart', async (ctx) => {
      ctx.session.cart = [];
      const user = await this.getUser(ctx.from.id);
      if (!user) return;
      await ctx.answerCbQuery(getTranslation(user.language, 'clearCart'));
      await ctx.deleteMessage();
    });

    // Checkout
    this.bot.action('checkout', async (ctx) => {
      const user = await this.getUser(ctx.from.id);
      if (!user) return;
      const lang = user.language || 'hy';
      
      const cart = ctx.session.cart || [];
      if (cart.length === 0) {
        await ctx.answerCbQuery(getTranslation(lang, 'cartEmpty'));
        return;
      }
      
      let total = 0;
      for (let item of cart) total += item.price * item.quantity;
      const maxBonus = calculateBonusToUse(total, user.bonusBalance);
      
      ctx.session.checkout = { cart, total, maxBonus };
      
      const cancelButton = Markup.inlineKeyboard([
        [Markup.button.callback(getTranslation(lang, 'cancelOrder'), 'cancel_checkout')]
      ]);
      
      if (maxBonus === 0) {
        ctx.session.checkout.bonusToUse = 0;
        ctx.session.waitingForBonus = false;
        ctx.session.waitingForAddress = true;
        await ctx.reply(getTranslation(lang, 'noBonus', total), cancelButton);
      } else {
        ctx.session.waitingForBonus = true;
        await ctx.reply(getTranslation(lang, 'askBonus', total, maxBonus), cancelButton);
      }
      await ctx.answerCbQuery();
    });

    // Cancel checkout
    this.bot.action('cancel_checkout', async (ctx) => {
      ctx.session.checkout = null;
      ctx.session.waitingForBonus = false;
      ctx.session.waitingForAddress = false;
      ctx.session.waitingForPhone = false;
      ctx.session.cart = [];
      
      const user = await this.getUser(ctx.from.id);
      if (!user) return;
      await ctx.reply(getTranslation(user.language, 'orderCancelled'), mainMenu(user.language));
      await ctx.answerCbQuery();
    });

    // Text input for checkout
    this.bot.on('text', async (ctx, next) => {
      const user = await this.getUser(ctx.from.id);
      if (!user) return next();
      const lang = user.language || 'hy';
      
      if (ctx.session.waitingForBonus) {
        const bonusInput = parseInt(ctx.message.text);
        if (isNaN(bonusInput) || bonusInput < 0 || bonusInput > ctx.session.checkout.maxBonus) {
          return ctx.reply(getTranslation(lang, 'invalidNumber', 0, ctx.session.checkout.maxBonus));
        }
        ctx.session.checkout.bonusToUse = bonusInput;
        ctx.session.waitingForBonus = false;
        ctx.session.waitingForAddress = true;
        return ctx.reply(getTranslation(lang, 'askAddress'));
      }
      
      if (ctx.session.waitingForAddress) {
        const address = ctx.message.text;
        ctx.session.checkout.address = address;
        ctx.session.waitingForAddress = false;
        
        if (!user.phoneVerified) {
          ctx.session.waitingForPhone = true;
          return ctx.reply(getTranslation(lang, 'askPhone'));
        }
        
        await this.createOrder(ctx, user);
        return;
      }
      
      if (ctx.session.waitingForPhone) {
        const phone = ctx.message.text.trim();
        const normalizedPhone = validatePhone(phone);
        
        if (!normalizedPhone) {
          return ctx.reply(getTranslation(lang, 'invalidPhone'));
        }
        
        await db.update(users).set({ 
          phone: normalizedPhone, 
          phoneVerified: true 
        }).where(eq(users.telegramId, ctx.from.id));
        
        ctx.session.waitingForPhone = false;
        await this.createOrder(ctx, user);
        return;
      }
      
      await next();
    });
  }

  async getUser(telegramId) {
    const result = await db.select().from(users).where(eq(users.telegramId, telegramId));
    return result[0] || null;
  }

  async createOrder(ctx, user) {
    const lang = user.language || 'hy';
    const { cart, total, bonusToUse, address } = ctx.session.checkout;
    const finalTotal = total - bonusToUse;
    
    const itemsJson = JSON.stringify(cart.map(i => ({ id: i.id, name: i.name, qty: i.quantity, price: i.price })));
    const newOrder = await db.insert(orders).values({
      userId: user.id,
      city: user.city,
      items: itemsJson,
      totalAmount: total,
      bonusUsed: bonusToUse,
      bonusEarned: 0,
      status: 'pending',
      address: address,
    }).returning();
    
    if (bonusToUse > 0) {
      await spendBonus(user.id, bonusToUse, newOrder[0].id);
    }
    
    ctx.session.cart = [];
    ctx.session.checkout = null;
    
    await ctx.reply(getTranslation(lang, 'orderSent', newOrder[0].id, finalTotal));
  }
}

export default OrderHandlers;
