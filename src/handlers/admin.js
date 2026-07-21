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
     
