import { db } from '../db/index.js';
import { users, appNotifications } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';
import logger from '../utils/logger.js';
import config from '../config/index.js';

class NotificationService {
  async registerForAppLaunch(userId) {
    try {
      await db.execute(sql`
        INSERT INTO app_notifications (user_id, created_at)
        VALUES (${userId}, NOW())
        ON CONFLICT (user_id) DO NOTHING
      `);
      logger.info(`✅ User ${userId} registered for app launch notifications`);
      return true;
    } catch (error) {
      logger.error('❌ Register for app launch error:', error);
      return false;
    }
  }

  async getRegisteredUsers() {
    try {
      const result = await db.execute(sql`
        SELECT u.id, u.telegram_id, u.first_name, u.username, u.language
        FROM users u
        INNER JOIN app_notifications an ON u.id = an.user_id
        WHERE u.telegram_id IS NOT NULL
      `);
      return result.rows;
    } catch (error) {
      logger.error('❌ Get registered users error:', error);
      return [];
    }
  }

  async getRegistrationCount() {
    try {
      const result = await db.execute(sql`
        SELECT COUNT(*) as count FROM app_notifications
      `);
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('❌ Get registration count error:', error);
      return 0;
    }
  }

  async sendAppLaunchNotification(bot) {
    try {
      logger.info('📱 Sending app launch notifications...');
      
      const users = await this.getRegisteredUsers();
      logger.info(`📊 Found ${users.length} users to notify`);
      
      let successCount = 0;
      let failCount = 0;

      const message = 
`🎉 *TuTak Mobile App-ը թողարկվել է!*

📱 *Ներբեռնեք հիմա:*

🔹 *iOS:* ${config.appIosUrl}
🔹 *Android:* ${config.appAndroidUrl}
🔹 *Website:* ${config.appWebsiteUrl}

✨ *Ինչ նորություն կա:*
• 🚀 Ավելի արագ պատվիրում
• 🔔 Push notifications
• 👤 Face ID / Touch ID
• 💳 Apple Pay / Google Pay
• 📍 Real-time tracking

💎 *Բոնուս առաջին 100 օգտատերերի համար:*
Ներբեռնեք և ստացեք *500 բոնուս* նվեր:`;

      for (const user of users) {
        try {
          await bot.telegram.sendMessage(
            user.telegram_id,
            message,
            { 
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '📲 Ներբեռնել App-ը', url: config.appWebsiteUrl }],
                  [{ text: '💎 Ստանալ 500 բոնուս', callback_data: 'claim_app_bonus' }]
                ]
              }
            }
          );
          successCount++;
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          logger.error(`❌ Failed to send to user ${user.id}:`, error.message);
          failCount++;
        }
      }
      
      logger.info(`✅ App notifications sent: ${successCount} success, ${failCount} failed`);
      return { success: successCount, fail: failCount, total: users.length };
    } catch (error) {
      logger.error('❌ Send app notifications error:', error);
      throw error;
    }
  }
}

export default new NotificationService();
