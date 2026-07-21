import { Markup } from 'telegraf';
import { db } from '../db/index.js';
import { partners } from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { getTranslation } from '../../i18n.js';

class PartnerHandlers {
  constructor(bot) {
    this.bot = bot;
    this.setupHandlers();
  }

  setupHandlers() {
    // Partners
    this.bot.hears(['🏢 Գործընկերներ', '🏢 Партнеры', '🏢 Partners'], async (ctx) => {
      const user = await this.getUser(ctx.from.id);
      if (!user) return;
      const lang = user.language || 'hy';
      
      const partnersList = await db.select()
        .from(partners)
        .where(and(
          eq(partners.isActive, true),
          sql`${partners.name} != 'FastCharge'`
        ));
      
      if (partnersList.length === 0) {
        return ctx.reply(getTranslation(lang, 'noPartners'));
      }
      
      const keyboard = [];
      for (let p of partnersList) {
        let name = p.name;
        if (lang === 'ru' && p.nameRu) name = p.nameRu;
        if (lang === 'en' && p.nameEn) name = p.nameEn;
        keyboard.push([Markup.button.callback(`🏢 ${name}`, `partner_${p.id}`)]);
      }
      keyboard.push([Markup.button.callback(getTranslation(lang, 'back'), 'back_to_main')]);
      
      await ctx.reply(getTranslation(lang, 'partnersTitle'), {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(keyboard)
      });
    });

    // Partner action
    this.bot.action(/partner_(\d+)/, async (ctx) => {
      const partnerId = parseInt(ctx.match[1]);
      const user = await this.getUser(ctx.from.id);
      if (!user) return;
      const lang = user.language || 'hy';
      
      const partner = await db.select().from(partners).where(eq(partners.id, partnerId)).then(r => r[0]);
      if (!partner) {
        await ctx.answerCbQuery('Գործընկերը չի գտնվել');
        return;
      }
      
      let name = partner.name;
      if (lang === 'ru' && partner.nameRu) name = partner.nameRu;
      if (lang === 'en' && partner.nameEn) name = partner.nameEn;
      
      let text = `🏢 *${name}*\n\n`;
      if (partner.description) text += `${partner.description}\n`;
      if (partner.address) text += `📍 ${partner.address}\n`;
      if (partner.phone) text += `📞 ${partner.phone}\n`;
      text += `💰 Բոնուս: ${partner.commission}%`;
      
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback(getTranslation(lang, 'back'), 'back_to_partners')]
      ]);
      
      await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
      await ctx.answerCbQuery();
    });

    // Back to partners
    this.bot.action('back_to_partners', async (ctx) => {
      const user = await this.getUser(ctx.from.id);
      if (!user) return;
      const lang = user.language || 'hy';
      
      const partnersList = await db.select().from(partners).where(eq(partners.isActive, true));
      
      const keyboard = [];
      for (let p of partnersList) {
        let name = p.name;
        if (lang === 'ru' && p.nameRu) name = p.nameRu;
        if (lang === 'en' && p.nameEn) name = p.nameEn;
        keyboard.push([Markup.button.callback(`🏢 ${name}`, `partner_${p.id}`)]);
      }
      keyboard.push([Markup.button.callback(getTranslation(lang, 'back'), 'back_to_main')]);
      
      await ctx.reply(getTranslation(lang, 'partnersTitle'), {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(keyboard)
      });
      await ctx.answerCbQuery();
    });
  }

  async getUser(telegramId) {
    const result = await db.select().from(users).where(eq(users.telegramId, telegramId));
    return result[0] || null;
  }
}

export default PartnerHandlers;
