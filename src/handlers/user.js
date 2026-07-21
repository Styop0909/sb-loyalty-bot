import { Markup } from 'telegraf';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import logger from '../utils/logger.js';
import { generateQR } from '../utils/helpers.js';
import { mainMenu } from '../keyboards/index.js';

class UserHandlers {
  constructor(bot) {
    this.bot = bot;
    this.setupHandlers();
  }

  setupHandlers() {
    this.bot.start(async (ctx) => {
      try {
        ctx.session.cart = [];
        ctx.session.checkout = null;
        ctx.session.waitingForBonus = false;
        ctx.session.waitingForAddress = false;
        ctx.session.waitingForPhone = false;
        
        let refUserId = null;
        if (ctx.startPayload && ctx.startPayload.startsWith('ref_')) {
          refUserId = parseInt(ctx.startPayload.split('_')[1]);
        }
        
        const user = await this.registerUser(
          ctx.from.id, 
          ctx.from.first_name, 
          ctx.from.last_name, 
          ctx.from.username, 
          refUserId
        );
        
        await ctx.reply(`👋 Բարի գալուստ, ${user.firstName || 'User'}!`, {
          reply_markup: mainMenu(user.language || 'hy').reply_markup
        });
      } catch (error) {
        logger.error('Start error:', error);
        await ctx.reply('❌ Սխալ տեղի ունեցավ:');
      }
    });

    this.bot.hears(['💎 Բոնուս', '💎 Bonus', '💎 Бонус'], async (ctx) => {
      try {
        const user = await this.getUser(ctx.from.id);
        if (!user) return;
        
        await ctx.reply(
          `💎 *Ձեր բոնուսները:*\n\n` +
          `✅ Հասանելի: ${user.bonusBalance || 0} AMD\n` +
          `❄️ Սառեցված: ${user.frozenBonus || 0} AMD\n` +
          `📊 Ընդհանուր: ${(user.bonusBalance || 0) + (user.frozenBonus || 0)} AMD`,
          { parse_mode: 'Markdown' }
        );
      } catch (error) {
        logger.error('Bonus error:', error);
        await ctx.reply('❌ Սխալ տեղի ունեցավ:');
      }
    });

    this.bot.hears(['👥 Ռեֆերալ', '👥 Referral', '👥 Реферал'], async (ctx) => {
      try {
        const user = await this.getUser(ctx.from.id);
        if (!user) return;
        
        const refLink = `https://t.me/TuTak_Official_Bot?start=ref_${user.id}`;
        const referrals = await db.select().from(users).where(eq(users.invitedBy, user.id));
        
        let text = `👥 *Ռեֆերալ համակարգ*\n\n🔗 ${refLink}\n\n`;
        text += `👤 Հրավիրածներ: ${referrals.length}\n`;
        for (let ref of referrals) {
          text += `• ${ref.firstName || ref.username || ref.telegramId}\n`;
        }
        
        const qrImage = await generateQR(refLink);
        await ctx.replyWithPhoto(
          { source: Buffer.from(qrImage.split(',')[1], 'base64') },
          { caption: text, parse_mode: 'Markdown' }
        );
      } catch (error) {
        logger.error('Referral error:', error);
        await ctx.reply('❌ Սխալ տեղի ունեցավ:');
      }
    });

    this.bot.hears(['⬅️ Հետ'], async (ctx) => {
      const user = await this.getUser(ctx.from.id);
      await ctx.reply('Գլխավոր մենյու', mainMenu(user?.language || 'hy'));
    });
  }

  async getUser(telegramId) {
    const result = await db.select().from(users).where(eq(users.telegramId, telegramId));
    return result[0] || null;
  }

  async registerUser(telegramId, firstName, lastName, username, invitedBy = null) {
    const existing = await db.select().from(users).where(eq(users.telegramId, telegramId));
    if (existing.length > 0) return existing[0];
    
    const newUser = await db.insert(users).values({
      telegramId,
      firstName,
      lastName,
      username,
      invitedBy: invitedBy || null,
      language: 'hy',
      city: 'yerevan',
      bonusBalance: 0,
      frozenBonus: 0,
      phoneVerified: false,
    }).returning();
    
    logger.info(`✅ New user registered: ${telegramId} (${username || 'no username'})`);
    return newUser[0];
  }
}

export default UserHandlers;
