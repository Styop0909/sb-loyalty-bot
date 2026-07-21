import { db } from '../db/index.js';
import { users, bonusTransactions, partners, userBonusesByPartner } from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import logger from '../utils/logger.js';

class BonusHandlers {
  constructor(bot) {
    this.bot = bot;
    this.setupHandlers();
  }

  setupHandlers() {
    this.bot.hears(['📊 Վիճակագրություն', '📊 Статистика', '📊 Statistics'], async (ctx) => {
      try {
        const user = await this.getUser(ctx.from.id);
        if (!user) return;
        
        const stats = await this.getUserStats(user.id);
        
        let text = '📊 *Ձեր վիճակագրությունը*\n\n';
        text += `💰 Ստացված բոնուսներ: ${stats.immediate + stats.frozen} AMD\n`;
        text += `💸 Ծախսված բոնուսներ: ${stats.spent} AMD\n`;
        text += `💎 Ընթացիկ բալանս: ${user.bonusBalance} AMD\n`;
        text += `❄️ Սառեցված: ${user.frozenBonus} AMD\n`;
        
        await ctx.reply(text, { parse_mode: 'Markdown' });
      } catch (error) {
        logger.error('Stats error:', error);
        await ctx.reply('❌ Սխալ տեղի ունեցավ:');
      }
    });
  }

  async getUser(telegramId) {
    const result = await db.select().from(users).where(eq(users.telegramId, telegramId));
    return result[0] || null;
  }

  async getUserStats(userId) {
    try {
      const immediate = await db.select()
        .from(bonusTransactions)
        .where(
          and(
            eq(bonusTransactions.userId, userId),
            eq(bonusTransactions.type, 'earn'),
            eq(bonusTransactions.bonusType, 'immediate')
          )
        )
        .then(r => r.reduce((sum, t) => sum + t.amount, 0));
      
      const frozen = await db.select()
        .from(bonusTransactions)
        .where(
          and(
            eq(bonusTransactions.userId, userId),
            eq(bonusTransactions.type, 'earn'),
            eq(bonusTransactions.bonusType, 'frozen')
          )
        )
        .then(r => r.reduce((sum, t) => sum + t.amount, 0));
      
      const spent = await db.select()
        .from(bonusTransactions)
        .where(
          and(
            eq(bonusTransactions.userId, userId),
            eq(bonusTransactions.type, 'spend')
          )
        )
        .then(r => r.reduce((sum, t) => sum + Math.abs(t.amount), 0));
      
      return { immediate, frozen, spent };
    } catch (error) {
      logger.error('❌ Get user stats error:', error);
      return { immediate: 0, frozen: 0, spent: 0 };
    }
  }
}

export default BonusHandlers;
