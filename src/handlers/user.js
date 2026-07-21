import { Markup } from 'telegraf';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { getTranslation } from '../../i18n.js';
import { mainMenu, languageMenu } from '../keyboards/index.js';
import { generateQR } from '../utils/helpers.js';

class UserHandlers {
  constructor(bot) {
    this.bot = bot;
    this.setupHandlers();
  }

  setupHandlers() {
    // Start
    this.bot.start(async (ctx) => {
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
      
      if (!user.language) {
        await ctx.reply(getTranslation('hy', 'chooseLanguage'), languageMenu('hy'));
      } else {
        const welcomeText = getTranslation(user.language, 'welcome');
        await ctx.reply(welcomeText, {
          parse_mode: 'Markdown',
          reply_markup: mainMenu(user.language).reply_markup
        });
      }
    });

    // Bonus
    this.bot.hears(['💎 Բոնուս', '💎 Bonus', '💎 Бонус'], async (ctx) => {
      const user = await this.getUser(ctx.from.id);
      if (!user) return;
      const t = (key, ...args) => getTranslation(user.language, key, ...args);
      await ctx.reply(t('bonusText', user.bonusBalance || 0, user.frozenBonus || 0), { parse_mode: 'HTML' });
    });

    // Referral
    this.bot.hears(['👥 Ռեֆերալ', '👥 Referral', '👥 Реферал'], async (ctx) => {
      const user = await this.getUser(ctx.from.id);
      if (!user) return;
      const lang = user.language || 'hy';
      const refLink = `https://t.me/${ctx.botInfo.username}?start=ref_${user.id}`;
      
      const referrals = await db.select().from(users).where(eq(users.invitedBy, user.id));
      let referralsText = '';
      if (referrals.length > 0) {
        referralsText = `\n${getTranslation(lang, 'referralFriends', referrals.length)}*\n`;
        for (let ref of referrals) {
          referralsText += `• ${ref.firstName || ref.username || ref.telegramId}\n`;
        }
      }
      const hint = getTranslation(lang, 'referralCopyHint');
      const qrImage = await generateQR(refLink);
      
      await ctx.replyWithPhoto(
        { source: Buffer.from(qrImage.split(',')[1], 'base64') },
        {
          caption: `${getTranslation(lang, 'referralText', refLink)}\n${referralsText}\n${hint}`,
          parse_mode: 'HTML'
        }
      );
    });

    // Change Language
    this.bot.hears(['🌐 Փոխել լեզուն', '🌐 Сменить язык', '🌐 Change language'], async (ctx) => {
      const user = await this.getUser(ctx.from.id);
      if (!user) return;
      await ctx.reply(getTranslation(user.language, 'selectLanguage'), languageMenu(user.language));
    });

    // Language selection
    this.bot.hears(['Հայերեն', 'Русский', 'English'], async (ctx) => {
      const langMap = { 'Հայերեն': 'hy', 'Русский': 'ru', 'English': 'en' };
      const newLang = langMap[ctx.message.text];
      
      const user = await this.getUser(ctx.from.id);
      if (!user) return;
      
      await db.update(users).set({ language: newLang }).where(eq(users.telegramId, ctx.from.id));
      const welcomeText = getTranslation(newLang, 'welcome');
      await ctx.reply(welcomeText, {
        parse_mode: 'Markdown',
        reply_markup: mainMenu(newLang).reply_markup
      });
    });

    // Change City
    this.bot.hears(['📍 Փոխել քաղաքը', '📍 Сменить город', '📍 Change city'], async (ctx) => {
      const user = await this.getUser(ctx.from.id);
      if (!user) return;
      const t = (key, ...args) => getTranslation(user.language, key, ...args);
      await ctx.reply(t('selectCity'), this.cityMenu(user.language));
    });

    // City selection
    this.bot.hears(['🌆 Երևան', '🌆 Ереван', '🌆 Yerevan'], async (ctx) => {
      const user = await this.getUser(ctx.from.id);
      if (!user) return;
      await db.update(users).set({ city: 'yerevan' }).where(eq(users.telegramId, ctx.from.id));
      const t = (key, ...args) => getTranslation(user.language, key, ...args);
      await ctx.reply(t('cityChanged', 'Երևան / Ереван / Yerevan'), {
        parse_mode: 'HTML',
        reply_markup: mainMenu(user.language).reply_markup
      });
    });

    this.bot.hears(['✝️ Էջմիածին', '✝️ Эчмиадзин', '✝️ Echmiadzin'], async (ctx) => {
      const user = await this.getUser(ctx.from.id);
      if (!user) return;
      await db.update(users).set({ city: 'echmiadzin' }).where(eq(users.telegramId, ctx.from.id));
      const t = (key, ...args) => getTranslation(user.language, key, ...args);
      await ctx.reply(t('cityChanged', 'Էջմիածին / Эчмиадзин / Echmiadzin'), {
        parse_mode: 'HTML',
        reply_markup: mainMenu(user.language).reply_markup
      });
    });

    // Back
    this.bot.hears(['⬅️ Հետ', '◀️ Назад', '◀️ Back'], async (ctx) => {
      const user = await this.getUser(ctx.from.id);
      if (!user) return;
      await ctx.reply('Գլխավոր մենյու', mainMenu(user.language));
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
      language: null,
      city: 'yerevan',
      bonusBalance: 0,
      frozenBonus: 0,
      phoneVerified: false,
    }).returning();
    
    return newUser[0];
  }

  cityMenu(lang) {
    const t = (key, ...args) => getTranslation(lang, key, ...args);
    return Markup.keyboard([
      [t('yerevan'), t('echmiadzin')],
      [t('back')]
    ]).resize();
  }
}

export default UserHandlers;
