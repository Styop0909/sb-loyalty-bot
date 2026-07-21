import { db } from '../db/index.js';
import { users, bonusTransactions, userBonusesByPartner } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';

export async function spendBonus(userId, amount, orderId) {
  await db.insert(bonusTransactions).values({
    userId,
    amount: -amount,
    type: 'spend',
    bonusType: 'order',
    orderId,
    description: 'Ծախսված բոնուս'
  });
  await db.update(users)
    .set({ bonusBalance: sql`${users.bonusBalance} - ${amount}` })
    .where(eq(users.id, userId));
}

export async function getUserStats(userId) {
  const immediate = await db.select()
    .from(bonusTransactions)
    .where(
      sql`${bonusTransactions.userId} = ${userId} 
          AND ${bonusTransactions.type} = 'earn' 
          AND ${bonusTransactions.bonusType} = 'immediate'`
    )
    .then(r => r.reduce((sum, t) => sum + t.amount, 0));
  
  const frozen = await db.select()
    .from(bonusTransactions)
    .where(
      sql`${bonusTransactions.userId} = ${userId} 
          AND ${bonusTransactions.type} = 'earn' 
          AND ${bonusTransactions.bonusType} = 'frozen'`
    )
    .then(r => r.reduce((sum, t) => sum + t.amount, 0));
  
  const spent = await db.select()
    .from(bonusTransactions)
    .where(
      sql`${bonusTransactions.userId} = ${userId} 
          AND ${bonusTransactions.type} = 'spend'`
    )
    .then(r => r.reduce((sum, t) => sum + Math.abs(t.amount), 0));
  
  return { immediate, frozen, spent };
}
