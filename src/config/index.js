module.exports = {
  botToken: process.env.BOT_TOKEN,
  port: process.env.PORT || 8080,
  databaseUrl: process.env.DATABASE_URL,
  ocpiToken: process.env.OCPI_TOKEN || '83Fh78ubergMleuhuehfuYwdwdnuwbeufbuerbvYTuefube03ubeufbefDrtnr45',
  fastChargeToken: process.env.FAST_CHARGE_TOKEN || 'WVh6RmRyNjZGSFVFUE44cWRENHUyTXpEa1cyQXdsdWdUNUNZRnk0STFIUVpVWWxBZzBraUZCbThYSHBtdnRWQg==',
  syncInterval: 10 * 60 * 1000,
  minSyncInterval: 30000,
  adminUsernames: (process.env.ADMIN_USERNAMES || 'Styop1221').split(',').map(s => s.trim())
};
