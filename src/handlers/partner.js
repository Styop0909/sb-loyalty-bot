import { Markup } from 'telegraf';
import { db } from '../db/index.js';
import { partners } from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import logger from '../utils/logger.js';

class PartnerHandlers {
  constructor(bot) {
    this.bot = bot;
    this.setupHandlers();
  }

  setupHandlers() {
    this.bot.hears(['🏢 Գործընկերներ', '🏢 Partners', '🏢 Партнеры'], async (ctx) => {
      try {
        const partnersList = await db.select()
          .from(partners)
          .where(and(
            eq(partners.isActive, true),
            sql`${partners.name} != 'FastCharge'`
          ));
        
        if (partnersList.length === 0) {
          return ctx.reply('📭 Գործընկերներ չկան');
        }
        
        const keyboard = [];
        for (let p of partnersList) {
          keyboard.push([Markup.button.callback(`🏢 ${p.name}`, `partner_${p.id}`)]);
        }
        keyboard.push([Markup.button.callback('◀️ Հետ', 'back_to_main')]);
        
        await ctx.reply('🏢 *Գործընկերներ*', {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard(keyboard)
        });
      } catch (error) {
        logger.error('Partners error:', error);
        await ctx.reply('❌ Սխալ տեղի ունեցավ:');
      }
    });

    this.bot.action(/partner_(\d+)/, async (ctx) => {
      try {
        const partnerId = parseInt(ctx.match[1]);
        const partner = await db.select().from(partners).where(eq(partners.id, partnerId)).then(r => r[0]);
        
        if (!partner) {
          await ctx.answerCbQuery('Գործընկերը չի գտնվել');
          return;
        }
        
        let text = `🏢 *${partner.name}*\n\n`;
        if (partner.description) text += `${partner.description}\n`;
        if (partner.address) text += `📍 ${partner.address}\n`;
        if (partner.phone) text += `📞 ${partner.phone}\n`;
        text += `💰 Բոնուս: ${partner.commission}%`;
        
        const keyboard = Markup.inlineKeyboard([
          [Markup.button.callback('◀️ Հետ', 'back_to_partners')]
        ]);
        
        await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
        await ctx.answerCbQuery();
      } catch (error) {
        logger.error('Partner action error:', error);
        await ctx.answerCbQuery('Սխալ տեղի ունեցավ');
      }
    });
    this.bot.action('back_to_partners', async (ctx) => {
      await ctx.reply('🏢 Գործընկերներ');
      await ctx.answerCbQuery();
    });
  }
}

export default PartnerHandlers;
