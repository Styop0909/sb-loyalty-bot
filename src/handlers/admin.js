import { Markup } from 'telegraf';
import { db } from '../db/index.js';
import { users, orders, menuItems, partners, bonusTransactions } from '../db/schema.js';
import { eq, desc, and, sql } from 'drizzle-orm';
import logger from '../utils/logger.js';
import config from '../config/index.js';
import { adminMenu, inlineAdminMenu, inlinePartnerMenu, inlineAdminManagement } from '../keyboards/index.js';
import notificationService from '../services/notification.js';
import bonusService from '../services/bonus.js';

class AdminHandlers {
  constructor(bot) {
    this.bot = bot;
    this.adminUsernames = config.adminUsernames;
    this.setupHandlers();
  }

  async isAdmin(ctx) {
    const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
    if (!user) return false;
    return this.adminUsernames.includes(user.username);
  }

  async getAdminUsers() {
    const adminUsers = [];
    for (const username of this.adminUsernames) {
      const user = await db.select().from(users).where(eq(users.username, username)).then(r => r[0]);
      adminUsers.push({
        username,
        firstName: user?.firstName || 'Not registered',
        id: user?.id || null
      });
    }
    return adminUsers;
  }

  setupHandlers() {
    this.bot.command('admin', async (ctx) => {
      if (!await this.isAdmin(ctx)) {
        await ctx.reply('⛔ Մուտքը արգելված է');
        return;
      }
      await this.showAdminPanel(ctx);
    });

    this.bot.hears('📦 Պատվերներ', async (ctx) => {
      if (!await this.isAdmin(ctx)) return;
      await this.showPendingOrders(ctx);
    });

    this.bot.hears('🍽 Մենյու', async (ctx) => {
      if (!await this.isAdmin(ctx)) return;
      await this.showMenuManagement(ctx);
    });

    this.bot.hears('🏢 Գործընկերներ', async (ctx) => {
      if (!await this.isAdmin(ctx)) return;
      await this.showPartnersManagement(ctx);
    });

    this.bot.hears('📊 Վիճակագրություն', async (ctx) => {
      if (!await this.isAdmin(ctx)) return;
      await this.showStats(ctx);
    });

    this.bot.hears('👥 Օգտատերեր', async (ctx) => {
      if (!await this.isAdmin(ctx)) return;
      await this.showUsers(ctx);
    });

    this.bot.command('app_ready', async (ctx) => {
      if (!await this.isAdmin(ctx)) {
        await ctx.reply('⛔ Մուտքը արգելված է');
        return;
      }
      
      const count = await notificationService.getRegistrationCount();
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('✅ Այո, ուղարկել բոլորին', 'send_app_notification')],
        [Markup.button.callback('❌ Չեղարկել', 'cancel_app_notification')]
      ]);
      
      await ctx.reply(
        `📱 *App-ի ծանուցում*\n\n` +
        `Դուք պատրաստվում եք ծանուցում ուղարկել բոլոր գրանցված օգտատերերին:\n\n` +
        `📊 Գրանցված օգտատերեր: ${count}\n\n` +
        `Համոզվա՞ծ եք, որ ուզում եք շարունակել:`,
        { parse_mode: 'Markdown', ...keyboard }
      );
    });

    this.bot.action('send_app_notification', async (ctx) => {
      if (!await this.isAdmin(ctx)) {
        await ctx.answerCbQuery('⛔ Մուտքը արգելված է');
        return;
      }
      
      await ctx.answerCbQuery('⏳ Ուղարկվում է...');
      await ctx.reply('⏳ Ծանուցումները ուղարկվում են, խնդրում եմ սպասեք...');
      
      try {
        const result = await notificationService.sendAppLaunchNotification(this.bot);
        await ctx.reply(
          `✅ *Ծանուցումները հաջողությամբ ուղարկվել են!*\n\n` +
          `📊 *Արդյունքներ:*\n` +
          `✅ Հաջող: ${result.success}\n` +
          `❌ Անհաջող: ${result.fail}\n` +
          `📊 Ընդհանուր: ${result.total}`,
          { parse_mode: 'Markdown' }
        );
      } catch (error) {
        logger.error('Send notification error:', error);
        await ctx.reply('❌ Սխալ տեղի ունեցավ ծանուցումները ուղարկելիս:');
      }
    });

    this.bot.action('cancel_app_notification', async (ctx) => {
      if (!await this.isAdmin(ctx)) {
        await ctx.answerCbQuery('⛔ Մուտքը արգելված է');
        return;
      }
      await ctx.answerCbQuery('✅ Չեղարկված է');
      await ctx.reply('✅ Ծանուցման ուղարկումը չեղարկվել է:');
    });

    this.bot.action(/confirm_order_(\d+)/, async (ctx) => {
      if (!await this.isAdmin(ctx)) {
        await ctx.answerCbQuery('⛔ Արգելված է');
        return;
      }
      await this.confirmOrder(ctx, parseInt(ctx.match[1]));
    });

    this.bot.action(/reject_order_(\d+)/, async (ctx) => {
      if (!await this.isAdmin(ctx)) {
        await ctx.answerCbQuery('⛔ Արգելված է');
        return;
      }
      await this.rejectOrder(ctx, parseInt(ctx.match[1]));
    });

    this.bot.action('manage_admins', async (ctx) => {
      if (!await this.isAdmin(ctx)) return;
      await this.showManageAdmins(ctx);
      await ctx.answerCbQuery();
    });

    this.bot.action('add_admin_by_username', async (ctx) => {
      if (!await this.isAdmin(ctx)) return;
      ctx.session.adminAction = 'add_admin_username';
      await ctx.reply('📝 Գրեք նոր ադմինի Telegram username-ը (առանց @-ի):\nՕրինակ: Aram123');
      await ctx.answerCbQuery();
    });

    this.bot.action('remove_admin_by_username', async (ctx) => {
      if (!await this.isAdmin(ctx)) return;
      ctx.session.adminAction = 'remove_admin_username';
      await ctx.reply('📝 Գրեք հեռացնելու ադմինի Telegram username-ը (առանց @-ի):\nՕրինակ: Aram123');
      await ctx.answerCbQuery();
    });

    this.bot.action('back_to_admin', async (ctx) => {
      if (!await this.isAdmin(ctx)) return;
      await this.showAdminPanel(ctx);
      await ctx.answerCbQuery();
    });
  }

  async showAdminPanel(ctx) {
    const adminUsers = await this.getAdminUsers();
    let text = '🔐 *Admin Panel*\n\n';
    text += `👑 Ադմիններ:\n`;
    for (const admin of adminUsers) {
      text += `• @${admin.username} — ${admin.firstName}\n`;
    }
    text += `\n📊 Ընտրիր գործողությունը:`;
    
    await ctx.reply(text, { 
      parse_mode: 'Markdown', 
      ...adminMenu() 
    });
  }

  async showPendingOrders(ctx) {
    const pendingOrders = await db.select()
      .from(orders)
      .where(eq(orders.status, 'pending'))
      .orderBy(desc(orders.createdAt));
    
    if (pendingOrders.length === 0) {
      return ctx.reply('📭 Սպասող պատվերներ չկան');
    }
    
    for (const order of pendingOrders) {
      const user = await db.select().from(users).where(eq(users.id, order.userId)).then(r => r[0]);
      const items = JSON.parse(order.items);
      
      let itemsText = '';
      for (let item of items) {
        itemsText += `${item.name} x${item.qty} — ${item.price * item.qty} ֏\n`;
      }
      
      const text = 
`🆕 *Պատվեր №${order.id}*

👤 ${user?.firstName || user?.username || 'Unknown'}
📍 ${order.city}
📞 ${user?.phone || 'Բացակայում է'}
🏠 ${order.address || 'N/A'}

📦 *Ուտեստներ:*\n${itemsText}
💰 Ընդամենը: ${order.totalAmount} ֏
⭐ Օգտագործված բոնուս: ${order.bonusUsed} ֏
💸 Վճարվելիք: ${order.totalAmount - order.bonusUsed} ֏

📅 ${new Date(order.createdAt).toLocaleString()}`;
      
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('✅ Հաստատել', `confirm_order_${order.id}`)],
        [Markup.button.callback('❌ Մերժել', `reject_order_${order.id}`)]
      ]);
      
      await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
    }
  }

  async confirmOrder(ctx, orderId) {
    const order = await db.select().from(orders).where(eq(orders.id, orderId)).then(r => r[0]);
    if (!order) return;
    
    await db.update(orders).set({ status: 'confirmed' }).where(eq(orders.id, orderId));
    
    const user = await db.select().from(users).where(eq(users.id, order.userId)).then(r => r[0]);
    
    const bonusAmount = Math.floor(order.totalAmount * 0.05);
    
    if (bonusAmount > 0) {
      await db.insert(bonusTransactions).values({
        userId: user.id,
        amount: bonusAmount,
        type: 'earn',
        bonusType: 'immediate',
        orderId: orderId,
        description: `Պատվեր №${orderId} - 5% բոնուս`
      });
      await db.update(users)
        .set({ bonusBalance: user.bonusBalance + bonusAmount })
        .where(eq(users.id, user.id));
    }
    
    await ctx.answerCbQuery(`✅ Պատվերը հաստատվեց, ստացաք ${bonusAmount} բոնուս`);
    await ctx.deleteMessage();
    
    try {
      await this.bot.telegram.sendMessage(
        user.telegramId,
        `✅ *Ձեր պատվերը №${orderId} հաստատվել է!*\n\n` +
        `🎉 Դուք ստացաք ${bonusAmount} բոնուս:`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      logger.warn(`Could not notify user ${user.id}:`, error.message);
    }
  }

  async rejectOrder(ctx, orderId) {
    await db.update(orders).set({ status: 'rejected' }).where(eq(orders.id, orderId));
    await ctx.answerCbQuery('❌ Պատվերը մերժվեց');
    await ctx.deleteMessage();
  }

  async showMenuManagement(ctx) {
    const items = await db.select()
      .from(menuItems)
      .orderBy(menuItems.city, menuItems.category);
    
    let text = '🍽 *ՄԵՆՅՈւԻ ԿԱՌԱՎԱՐՈՒՄ*\n\n';
    if (items.length === 0) {
      text += '📭 Ուտեստներ չկան\n\n';
    } else {
      for (let item of items) {
        const cityName = item.city === 'yerevan' ? 'Երևան' : 'Էջմիածին';
        text += `${item.id}. ${item.name} — ${item.price} ֏ (${cityName})\n`;
      }
    }
    text += `\n📊 Ընդհանուր: ${items.length} ուտեստ`;
    
    await ctx.reply(text, { parse_mode: 'Markdown', ...inlineAdminMenu() });
  }

  async showPartnersManagement(ctx) {
    const partnersList = await db.select()
      .from(partners)
      .orderBy(partners.name);
    
    let text = '🏢 *ԳՈՐԾԸՆԿԵՐՆԵՐԻ ԿԱՌԱՎԱՐՈՒՄ*\n\n';
    if (partnersList.length === 0) {
      text += '📭 Գործընկերներ չկան\n\n';
    } else {
      for (let p of partnersList) {
        text += `${p.id}. ${p.name} — ${p.commission}% (${p.isActive ? '✅' : '❌'})\n`;
      }
    }
    text += `\n📊 Ընդհանուր: ${partnersList.length} գործընկեր`;
    
    await ctx.reply(text, { parse_mode: 'Markdown', ...inlinePartnerMenu() });
  }

  async showManageAdmins(ctx) {
    const adminList = await this.getAdminUsers();
    let text = '👑 *ԱԴՄԻՆՆԵՐԻ ԿԱՌԱՎԱՐՈՒՄ*\n\n';
    for (let admin of adminList) {
      text += `• @${admin.username} — ${admin.firstName}\n`;
    }
    text += `\n📊 Ընդհանուր: ${adminList.length} ադմին`;
    
    await ctx.reply(text, { parse_mode: 'Markdown', ...inlineAdminManagement() });
  }

  async showStats(ctx) {
    const [
      totalUsers,
      totalOrders,
      totalRevenue,
      pendingOrders,
      totalPartners,
      totalBonuses
    ] = await Promise.all([
      db.select().from(users).then(r => r.length),
      db.select().from(orders).then(r => r.length),
      db.select().from(orders).then(r => r.reduce((sum, o) => sum + o.totalAmount, 0)),
      db.select().from(orders).where(eq(orders.status, 'pending')).then(r => r.length),
      db.select().from(partners).then(r => r.length),
      db.select().from(bonusTransactions).where(eq(bonusTransactions.type, 'earn')).then(r => r.reduce((sum, t) => sum + t.amount, 0)),
    ]);

    const text = 
`📊 *ՎԻՃԱԿԱԳՐՈՒԹՅՈՒՆ*

👥 Օգտատերեր: ${totalUsers}
📦 Պատվերներ: ${totalOrders}
💰 Ընդհանուր եկամուտ: ${totalRevenue.toLocaleString()} ֏
⏳ Սպասող պատվերներ: ${pendingOrders}
🏢 Գործընկերներ: ${totalPartners}
💎 Ընդհանուր բոնուսներ: ${totalBonuses.toLocaleString()} ֏

📈 *Միջին ցուցանիշներ:*
💰 Միջին պատվեր: ${totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(0) : 0} ֏
💎 Բոնուս մեկ user: ${totalUsers > 0 ? (totalBonuses / totalUsers).toFixed(0) : 0} ֏`;
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🔄 Թարմացնել', 'refresh_stats')],
      [Markup.button.callback('🔙 Հետ', 'back_to_admin')]
    ]);
    
    await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
  }

  async showUsers(ctx) {
    const allUsers = await db.select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(20);
    
    if (allUsers.length === 0) {
      return ctx.reply('📭 Օգտատերեր չկան');
    }
    
    let text = '👥 *ՎԵՐՋԻՆ 20 ՕԳՏԱՏԵՐԸ*\n\n';
    for (let u of allUsers) {
      const name = u.firstName || u.username || 'Unknown';
      const phone = u.phone || 'No phone';
      const bonus = u.bonusBalance || 0;
      text += `• ${name} | ${phone} | ${bonus} բոնուս\n`;
    }
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('📊 Ամբողջական ցուցակ', 'view_all_users')],
      [Markup.button.callback('🔙 Հետ', 'back_to_admin')]
    ]);
    
    await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
  }
}

export default AdminHandlers;
