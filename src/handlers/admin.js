import { Markup } from 'telegraf';
import { db } from '../db/index.js';
import { 
  orders, users, menuItems, bonusTransactions, 
  partners, userBonusesByPartner 
} from '../db/schema.js';
import { eq, desc, and, sql } from 'drizzle-orm';
import config from '../config/index.js';
import {
  adminMenu,
  inlineAdminMenu,
  inlinePartnerMenu,
  inlineAdminManagement,
  inlineConfirmButtons,
  inlineBackButton
} from '../keyboards/index.js';
import { spendBonus } from '../services/bonus.js';

let ADMIN_USERNAMES = config.adminUsernames;

class AdminHandlers {
  constructor(bot) {
    this.bot = bot;
    this.setupHandlers();
  }

  async isAdmin(ctx) {
    const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
    if (!user) return false;
    return ADMIN_USERNAMES.includes(user.username);
  }

  async addAdminByUsername(username) {
    if (!ADMIN_USERNAMES.includes(username)) {
      ADMIN_USERNAMES.push(username);
      return true;
    }
    return false;
  }

  async removeAdminByUsername(username) {
    const index = ADMIN_USERNAMES.indexOf(username);
    if (index !== -1) {
      ADMIN_USERNAMES.splice(index, 1);
      return true;
    }
    return false;
  }

  async getAdminList() {
    const adminUsers = [];
    for (const username of ADMIN_USERNAMES) {
      const user = await db.select().from(users).where(eq(users.username, username)).then(r => r[0]);
      if (user) {
        adminUsers.push({ username, firstName: user.firstName, telegramId: user.telegramId });
      } else {
        adminUsers.push({ username, firstName: 'Not registered yet', telegramId: null });
      }
    }
    return adminUsers;
  }

  async getAdminKeyboard() {
    return adminMenu();
  }

  setupHandlers() {
    // Admin command
    this.bot.command('admin', async (ctx) => {
      if (!await this.isAdmin(ctx)) {
        return ctx.reply('⛔ Մուտքը արգելված է');
      }
      await this.showAdminPanel(ctx);
    });

    // Admin panel buttons
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

    // Order confirm/reject
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

    // Admin management
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

    // Menu management
    this.bot.action('add_menu_item', async (ctx) => {
      if (!await this.isAdmin(ctx)) return;
      ctx.session.adminAction = 'add_menu';
      await ctx.reply('📝 Գրեք նոր ուտեստի տվյալները այս ձևաչափով:\nքաղաք, անուն, գին, կատեգորիա\nՕրինակ: yerevan, Հավի բոքս, 2900, Բոքսեր');
      await ctx.answerCbQuery();
    });

    this.bot.action('edit_menu_item', async (ctx) => {
      if (!await this.isAdmin(ctx)) return;
      ctx.session.adminAction = 'edit_menu';
      await ctx.reply('📝 Գրեք ուտեստի ID-ն և նոր տվյալները:\nid, անուն, գին\nՕրինակ: 5, Հավի բոքս նոր, 3200');
      await ctx.answerCbQuery();
    });

    this.bot.action('delete_menu_item', async (ctx) => {
      if (!await this.isAdmin(ctx)) return;
      ctx.session.adminAction = 'delete_menu';
      await ctx.reply('🗑 Գրեք ջնջելու ուտեստի ID-ն:\nՕրինակ: 5');
      await ctx.answerCbQuery();
    });

    // Partner management
    this.bot.action('add_partner', async (ctx) => {
      if (!await this.isAdmin(ctx)) return;
      ctx.session.adminAction = 'add_partner';
      await ctx.reply('📝 Գրեք նոր գործընկերի տվյալները:\nանուն, կատեգորիա, commission(%)\nՕրինակ: Pizza House, Սննդի, 5');
      await ctx.answerCbQuery();
    });

    this.bot.action('edit_partner', async (ctx) => {
      if (!await this.isAdmin(ctx)) return;
      ctx.session.adminAction = 'edit_partner';
      await ctx.reply('📝 Գրեք գործընկերի ID-ն և նոր տվյալները:\nid, անուն, կատեգորիա, commission(%)\nՕրինակ: 1, Pizza House New, Սննդի, 5');
      await ctx.answerCbQuery();
    });

    this.bot.action('delete_partner', async (ctx) => {
      if (!await this.isAdmin(ctx)) return;
      ctx.session.adminAction = 'delete_partner';
      await ctx.reply('🗑 Գրեք ջնջելու գործընկերի ID-ն:\nՕրինակ: 1');
      await ctx.answerCbQuery();
    });

    // Back to admin
    this.bot.action('back_to_admin', async (ctx) => {
      if (!await this.isAdmin(ctx)) return;
      await this.showAdminPanel(ctx);
      await ctx.answerCbQuery();
    });

    // Text input handlers for admin actions
    this.bot.on('text', async (ctx, next) => {
      const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
      if (!user) return next();

      if (ctx.session.adminAction) {
        if (!await this.isAdmin(ctx)) return next();

        if (ctx.session.adminAction === 'add_menu') {
          const parts = ctx.message.text.split(',');
          if (parts.length >= 4) {
            await db.insert(menuItems).values({
              city: parts[0].trim(),
              name: parts[1].trim(),
              price: parseInt(parts[2].trim()),
              category: parts[3].trim(),
              nameHy: parts[1].trim(),
              nameRu: parts[1].trim(),
              nameEn: parts[1].trim(),
            });
            ctx.reply('✅ Ուտեստը ավելացվեց');
          } else {
            ctx.reply('❌ Սխալ ձևաչափ: Օրինակ: yerevan, Հավի բոքս, 2900, Բոքսեր');
          }
          ctx.session.adminAction = null;
          return;
        }

        if (ctx.session.adminAction === 'edit_menu') {
          const parts = ctx.message.text.split(',');
          if (parts.length >= 3) {
            const id = parseInt(parts[0].trim());
            await db.update(menuItems).set({
              name: parts[1].trim(),
              price: parseInt(parts[2].trim()),
            }).where(eq(menuItems.id, id));
            ctx.reply('✅ Ուտեստը խմբագրվեց');
          } else {
            ctx.reply('❌ Սխալ ձևաչափ: Օրինակ: 5, Հավի բոքս նոր, 3200');
          }
          ctx.session.adminAction = null;
          return;
        }

        if (ctx.session.adminAction === 'delete_menu') {
          const id = parseInt(ctx.message.text.trim());
          await db.delete(menuItems).where(eq(menuItems.id, id));
          ctx.reply('✅ Ուտեստը ջնջվեց');
          ctx.session.adminAction = null;
          return;
        }

        if (ctx.session.adminAction === 'add_partner') {
          const parts = ctx.message.text.split(',');
          if (parts.length >= 3) {
            await this.addPartner(ctx, parts[0].trim(), parts[1].trim(), parseInt(parts[2].trim()));
            ctx.reply('✅ Գործընկերը ավելացվեց');
          } else {
            ctx.reply('❌ Սխալ ձևաչափ: Օրինակ: Pizza House, Սննդի, 5');
          }
          ctx.session.adminAction = null;
          return;
        }

        if (ctx.session.adminAction === 'edit_partner') {
          const parts = ctx.message.text.split(',');
          if (parts.length >= 4) {
            const id = parseInt(parts[0].trim());
            await this.editPartner(id, {
              name: parts[1].trim(),
              category: parts[2].trim(),
              commission: parseInt(parts[3].trim())
            });
            ctx.reply('✅ Գործընկերը խմբագրվեց');
          } else {
            ctx.reply('❌ Սխալ ձևաչափ: Օրինակ: 1, Pizza House New, Սննդի, 5');
          }
          ctx.session.adminAction = null;
          return;
        }

        if (ctx.session.adminAction === 'delete_partner') {
          const id = parseInt(ctx.message.text.trim());
          await this.deletePartner(id);
          ctx.reply('✅ Գործընկերը ջնջվեց');
          ctx.session.adminAction = null;
          return;
        }

        if (ctx.session.adminAction === 'add_admin_username') {
          const username = ctx.message.text.trim().replace('@', '');
          const success = await this.addAdminByUsername(username);
          if (success) {
            ctx.reply(`✅ @${username} ավելացվեց ադմինների ցանկում`);
          } else {
            ctx.reply(`⚠️ @${username} արդեն ադմին է`);
          }
          ctx.session.adminAction = null;
          return;
        }

        if (ctx.session.adminAction === 'remove_admin_username') {
          const username = ctx.message.text.trim().replace('@', '');
          const success = await this.removeAdminByUsername(username);
          if (success) {
            ctx.reply(`❌ @${username} հեռացվեց ադմինների ցանկից`);
          } else {
            ctx.reply(`⚠️ @${username} ադմին չէ`);
          }
          ctx.session.adminAction = null;
          return;
        }
      }

      await next();
    });
  }

  async showAdminPanel(ctx) {
    const adminList = await this.getAdminList();
    let text = '🔐 *Admin Panel* - Ընտրիր գործողությունը:\n\n';
    text += '👑 Ադմիններ:\n';
    for (let admin of adminList) {
      text += `• @${admin.username} — ${admin.firstName || '?'}\n`;
    }
    await ctx.reply(text, { parse_mode: 'Markdown', ...await this.getAdminKeyboard() });
  }

  async showPendingOrders(ctx) {
    const pendingOrders = await db.select().from(orders).where(eq(orders.status, 'pending')).orderBy(desc(orders.createdAt));
    
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
      
      const text = `🆕 *Պատվեր №${order.id}*\n\n👤 ${user.firstName || user.username}\n📍 ${order.city}\n📞 ${user.phone || 'Բացակայում է'}\n🏠 ${order.address}\n\n📦 *Ուտեստներ:*\n${itemsText}\n💰 Ընդամենը: ${order.totalAmount} ֏\n⭐ Օգտագործված բոնուս: ${order.bonusUsed} ֏\n💸 Վճարվելիք: ${order.totalAmount - order.bonusUsed} ֏\n\n📅 ${order.createdAt}`;
      
      await ctx.reply(text, { parse_mode: 'Markdown', ...inlineConfirmButtons(order.id) });
    }
  }

  async confirmOrder(ctx, orderId) {
    const order = await db.select().from(orders).where(eq(orders.id, orderId)).then(r => r[0]);
    if (!order) return;
    
    await db.update(orders).set({ status: 'confirmed' }).where(eq(orders.id, orderId));
    
    const user = await db.select().from(users).where(eq(users.id, order.userId)).then(r => r[0]);
    
    let partnerCommission = 5;
    let partnerId = 1;
    
    if (order.partnerId && order.partnerId !== 1) {
      const partner = await db.select().from(partners).where(eq(partners.id, order.partnerId)).then(r => r[0]);
      if (partner && partner.commission) {
        partnerCommission = partner.commission;
        partnerId = partner.id;
      }
    }
    
    const immediateBonus = Math.floor(order.totalAmount * 0.02);
    const frozenBonus = Math.floor(order.totalAmount * (partnerCommission - 2) / 100);
    
    if (immediateBonus > 0) {
      await db.insert(bonusTransactions).values({
        userId: user.id,
        amount: immediateBonus,
        type: 'earn',
        bonusType: 'immediate',
        orderId: orderId,
        description: `Անմիջապես 2% բոնուս (${partnerCommission}% ընդհանուրից)`
      });
      await db.update(users).set({ bonusBalance: user.bonusBalance + immediateBonus }).where(eq(users.id, user.id));
    }
    
    if (frozenBonus > 0) {
      await db.insert(bonusTransactions).values({
        userId: user.id,
        amount: frozenBonus,
        type: 'earn',
        bonusType: 'frozen',
        orderId: orderId,
        description: `Սառեցված ${partnerCommission - 2}% բոնուս (6 ամիս)`
      });
      await db.update(users).set({ frozenBonus: user.frozenBonus + frozenBonus }).where(eq(users.id, user.id));
    }
    
    if (partnerId !== 1) {
      await db.insert(userBonusesByPartner).values({
        userId: user.id,
        partnerId: partnerId,
        bonusAmount: immediateBonus + frozenBonus,
        orderId: orderId,
      });
    }
    
    await ctx.answerCbQuery(`✅ Պատվերը հաստատվեց, ստացաք ${immediateBonus} անմիջապես + ${frozenBonus} սառեցված (${partnerCommission}%)`);
    await ctx.deleteMessage();
  }

  async rejectOrder(ctx, orderId) {
    await db.update(orders).set({ status: 'rejected' }).where(eq(orders.id, orderId));
    await ctx.answerCbQuery('❌ Պատվերը մերժվեց');
    await ctx.deleteMessage();
  }

  async showMenuManagement(ctx) {
    const items = await db.select().from(menuItems).orderBy(menuItems.city, menuItems.category);
    
    let text = '🍽 *ՄԵՆՅՈւԻ ԿԱՌԱՎԱՐՈՒՄ*\n\n';
    for (let item of items) {
      text += `${item.id}. ${item.name} — ${item.price} ֏ (${item.city === 'yerevan' ? 'Երևան' : 'Էջմիածին'})\n`;
    }
    text += `\n📊 Ընդհանուր: ${items.length} ուտեստ`;
    
    await ctx.reply(text, { parse_mode: 'Markdown', ...inlineAdminMenu() });
  }

  async showPartnersManagement(ctx) {
    const partnersList = await db.select().from(partners).orderBy(partners.name);
    
    let text = '🏢 *ԳՈՐԾԸՆԿԵՐՆԵՐԻ ԿԱՌԱՎԱՐՈՒՄ*\n\n';
    for (let p of partnersList) {
      text += `${p.id}. ${p.name} — ${p.commission}% (${p.isActive ? '✅' : '❌'})\n`;
    }
    text += `\n📊 Ընդհանուր: ${partnersList.length} գործընկեր`;
    
    await ctx.reply(text, { parse_mode: 'Markdown', ...inlinePartnerMenu() });
  }

  async showManageAdmins(ctx) {
    const adminList = await this.getAdminList();
    let text = '👑 *ԱԴՄԻՆՆԵՐԻ ԿԱՌԱՎԱՐՈՒՄ*\n\n';
    for (let admin of adminList) {
      text += `• @${admin.username} — ${admin.firstName || '?'}\n`;
    }
    text += `\n📊 Ընդհանուր: ${adminList.length} ադմին`;
    
    await ctx.reply(text, { parse_mode: 'Markdown', ...inlineAdminManagement() });
  }

  async showStats(ctx) {
    const totalUsers = await db.select().from(users).then(r => r.length);
    const totalOrders = await db.select().from(orders).then(r => r.length);
    const totalRevenue = await db.select().from(orders).then(r => r.reduce((sum, o) => sum + o.totalAmount, 0));
    const pendingOrders = await db.select().from(orders).where(eq(orders.status, 'pending')).then(r => r.length);
    const totalPartners = await db.select().from(partners).then(r => r.length);
    
    const text = `📊 *ՎԻՃԱԿԱԳՐՈՒԹՅՈՒՆ*\n\n👥 Օգտատերեր: ${totalUsers}\n📦 Պատվերներ: ${totalOrders}\n💰 Ընդհանուր եկամուտ: ${totalRevenue} ֏\n⏳ Սպասող պատվերներ: ${pendingOrders}\n🏢 Գործընկերներ: ${totalPartners}`;
    
    await ctx.reply(text, { parse_mode: 'Markdown', ...inlineBackButton('back_to_admin') });
  }

  async showUsers(ctx) {
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt)).limit(20);
    let text = '👥 *ՎԵՐՋԻՆ 20 ՕԳՏԱՏԵՐԸ*\n\n';
    for (let u of allUsers) {
      text += `• @${u.username || u.telegramId} | ${u.phone || 'No phone'} | ${u.bonusBalance} բոնուս\n`;
    }
    await ctx.reply(text, { parse_mode: 'Markdown', ...inlineBackButton('back_to_admin') });
  }

  async addPartner(ctx, name, category, commission) {
    await db.insert(partners).values({
      name: name,
      nameHy: name,
      nameRu: name,
      nameEn: name,
      category: category,
      commission: commission,
      isActive: true
    });
  }

  async editPartner(partnerId, updates) {
    await db.update(partners).set(updates).where(eq(partners.id, partnerId));
  }

  async deletePartner(partnerId) {
    await db.delete(partners).where(eq(partners.id, partnerId));
  }
}

export default AdminHandlers;
