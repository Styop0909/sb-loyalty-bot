import { db } from '../db/index.js';
import { users, bonusTransactions, partners, userBonusesByPartner } from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { getTranslation } from '../../i18n.js';
import { getUserStats } from '../services/bonus.js';

class BonusHandlers {
  constructor(bot) {
    this.bot = bot;
    this.setupHandlers();
  }

  setupHandlers() {
    // My Stats
    this.bot.hears(['📊 Իմ վիճակագրություն', '📊 Моя статистика', '📊 My statistics'], async (ctx) => {
      const user = await this.getUser(ctx.from.id);
      if (!user) return;
      const lang = user.language || 'hy';
      
      const stats = await getUserStats(user.id);
      
      const partnerBonuses = await db.select({
        partnerName: partners.name,
        partnerNameRu: partners.nameRu,
        partnerNameEn: partners.nameEn,
        totalBonus: sql`SUM(${userBonusesByPartner.bonusAmount})`
      })
      .from(userBonusesByPartner)
      .leftJoin(partners, eq(userBonusesByPartner.partnerId, partners.id))
      .where(eq(userBonusesByPartner.userId, user.id))
      .groupBy(partners.id, partners.name, partners.nameRu, partners.nameEn);
      
      let text = getTranslation(lang, 'statsTitle') + '\n\n';
      text += getTranslation(lang, 'statsEarnedImmediate', stats.immediate) + '\n';
      text += getTranslation(lang, 'statsEarnedFrozen', stats.frozen) + '\n';
      text += getTranslation(lang, 'statsSpent', stats.spent) + '\n';
      text += getTranslation(lang, 'statsBalance', user.bonusBalance) + '\n\n';
      
      if (partnerBonuses.length > 0) {
        text += getTranslation(lang, 'statsByPartners') + '\n\n';
        for (let pb of partnerBonuses) {
          let name = pb.partnerName;
          if (lang === 'ru' && pb.partnerNameRu) name = pb.partnerNameRu;
          if (lang === 'en' && pb.partnerNameEn) name = pb.partnerNameEn;
          text += `• ${name}: ${pb.totalBonus} ֏\n`;
        }
      } else {
        text += getTranslation(lang, 'statsNoPartners') + '\n';
      }
      
      await ctx.reply(text, { parse_mode: 'Markdown' });
    });
  }

  async getUser(telegramId) {
    const result = await db.select().from(users).where(eq(users.telegramId, telegramId));
    return result[0] || null;
  }
}

export default BonusHandlers;
