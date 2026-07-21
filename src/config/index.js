import dotenv from 'dotenv';
dotenv.config();

export const config = {
  botToken: process.env.BOT_TOKEN,
  port: process.env.PORT || 8080,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  databaseUrl: process.env.DATABASE_URL,
  ocpiToken: process.env.OCPI_TOKEN || '83Fh78ubergMleuhuehfuYwdwdnuwbeufbuerbvYTuefube03ubeufbefDrtnr45',
  fastChargeToken: process.env.FAST_CHARGE_TOKEN || 'WVh6RmRyNjZGSFVFUE44cWRENHUyTXpEa1cyQXdsdWdUNUNZRnk0STFIUVpVWWxBZzBraUZCbThYSHBtdnRWQg==',
  ocpiBaseUrl: process.env.OCPI_BASE_URL || 'https://sb-loyalty-bot-production.up.railway.app/ocpi',
  syncInterval: parseInt(process.env.SYNC_INTERVAL) || 10 * 60 * 1000,
  minSyncInterval: parseInt(process.env.MIN_SYNC_INTERVAL) || 30000,
  bonusPercentage: parseInt(process.env.BONUS_PERCENTAGE) || 5,
  bonusSplitRatio: parseFloat(process.env.BONUS_SPLIT_RATIO) || 0.3,
  maxBonusToUse: parseFloat(process.env.MAX_BONUS_TO_USE) || 0.3,
  adminUsernames: (process.env.ADMIN_USERNAMES || 'Styop1221').split(',').map(s => s.trim()),
  appIosUrl: process.env.APP_IOS_URL || 'https://apps.apple.com/app/tutak',
  appAndroidUrl: process.env.APP_ANDROID_URL || 'https://play.google.com/store/apps/details?id=com.tutak',
  appWebsiteUrl: process.env.APP_WEBSITE_URL || 'https://tutak.app',
};

export default config;
