import { db } from '../db/index.js';
import { users, bonusTransactions, userBonusesByPartner, sessions, cdrs } from '../db/schema.js';
import { eq, sql, and } from 'drizzle-orm';
import logger from '../utils/logger.js';
import config from '../config/index.js';

class BonusService {
  async calculateAndApplyBonus(cdrData, partnerId = 1) {
    try {
      logger.info(`💰 Calculating bonus for CDR: ${cdrData.id}, user: ${cdrData.user_id}`);
      
      const totalCost = parseFloat(cdrData.total_cost) || 0;
      if (totalCost <= 0) {
        logger.warn('⚠️ Total cost is 0, skipping bonus');
        return null;
      }

      const bonusPercentage = config.bonusPercentage;
      const totalBonus = Math.floor((totalCost * bonusPercentage) / 100);
      
      if (totalBonus <= 0) {
        logger.warn('⚠️ Bonus is 0, skipping');
        return null;
      }

      const splitRatio = config.bonusSplitRatio;
      const immediateBonus = Math.floor(totalBonus * splitRatio);
      const frozenBonus = totalBonus - immediateBonus;

      logger.info(`📊 Bonus breakdown: Total ${totalBonus}, Immediate ${immediateBonus}, Frozen ${frozenBonus}`);

      await db.transaction(async (trx) => {
        if (immediateBonus > 0) {
          await trx.update(users)
            .set({ bonusBalance: sql`${users.bonusBalance} + ${immediateBonus}` })
            .where(eq(users.id, cdrData.user_id));
          
          await trx.insert(bonusTransactions).values({
            userId: cdrData.user_id,
            amount: immediateBonus,
            type: 'earn',
            bonusType: 'immediate',
            sessionId: cdrData.session_id,
            description: `Fast Charge ${bonusPercentage}% bonus (immediate)`
          });
        }

        if (frozenBonus > 0) {
          await trx.update(users)
            .set({ frozenBonus: sql`${users.frozenBonus} + ${frozenBonus}` })
            .where(eq(users.id, cdrData.user_id));
          
          await trx.insert(bonusTransactions).values({
            userId: cdrData.user_id,
            amount: frozenBonus,
            type: 'earn',
            bonusType: 'frozen',
            sessionId: cdrData.session_id,
            description: `Fast Charge ${bonusPercentage}% bonus (frozen 30 days)`
          });
        }

        if (partnerId) {
          await trx.insert(userBonusesByPartner).values({
            userId: cdrData.user_id,
            partnerId: partnerId,
            bonusAmount: totalBonus,
          });
        }
      });

      logger.info(`✅ Bonus applied successfully: ${totalBonus} AMD`);
      
      return {
        totalBonus,
        immediateBonus,
        frozenBonus,
        bonusPercentage
      };
    } catch (error) {
      logger.error('❌ Bonus calculation error:', error);
      throw error;
    }
  }

  async unfreezeBonuses() {
    try {
      logger.info('🔄 Checking frozen bonuses to unfreeze...');
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const frozenTransactions = await db.select()
        .from(bonusTransactions)
        .where(
          and(
            eq(bonusTransactions.bonusType, 'frozen'),
            eq(bonusTransactions.type, 'earn'),
            sql`${bonusTransactions.createdAt} < ${thirtyDaysAgo}`
          )
        );
      
      let unfrozenCount = 0;
      
      for (const tx of frozenTransactions) {
        await db.transaction(async (trx) => {
          await trx.update(users)
            .set({ 
              bonusBalance: sql`${users.bonusBalance} + ${tx.amount}`,
              frozenBonus: sql`${users.frozenBonus} - ${tx.amount}`
            })
            .where(eq(users.id, tx.userId));
          
          await trx.update(bonusTransactions)
            .set({ bonusType: 'unfrozen' })
            .where(eq(bonusTransactions.id, tx.id));
          
          unfrozenCount++;
        });
      }
      
      logger.info(`✅ Unfrozen ${unfrozenCount} bonuses`);
      return unfrozenCount;
    } catch (error) {
      logger.error('❌ Unfreeze error:', error);
      throw error;
    }
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
      throw error;
    }
  }

  async getUserTransactions(userId, limit = 20) {
    try {
      return await db.select()
        .from(bonusTransactions)
        .where(eq(bonusTransactions.userId, userId))
        .orderBy(bonusTransactions.createdAt, 'desc')
        .limit(limit);
    } catch (error) {
      logger.error('❌ Get user transactions error:', error);
      throw error;
    }
  }
}

export default new BonusService();
