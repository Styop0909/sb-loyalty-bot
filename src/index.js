import { Telegraf } from 'telegraf';
import LocalSession from 'telegraf-session-local';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import config from './config/index.js';
import logger from './utils/logger.js';
import { db, closeDb } from './db/index.js';
import ocpiRouter from './ocpi/server.js';
import bonusService from './services/bonus.js';

import {
  UserHandlers,
  OrderHandlers,
  BonusHandlers,
  PartnerHandlers,
  FastChargeHandlers,
  AdminHandlers,
  MenuHandlers,
} from './handlers/index.js';
import { mainMenu } from './keyboards/index.js';
const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  });
});
app.use('/ocpi', ocpiRouter);
app.get('/', (req, res) => {
  res.send('TuTak Bot is running!');
});
const server = app.listen(config.port, () => {
  logger.info(`✅ HTTP server running on port ${config.port}`);
});

const bot = new Telegraf(config.botToken);

bot.use(new LocalSession({ database: 'session_db.json' }).middleware());

bot.use(async (ctx, next) => {
  const start = Date.now();
  try {
    await next();
  } finally {
    const ms = Date.now() - start;
    logger.debug(`[${ctx.updateType}] ${ctx.chat?.id || 'unknown'} - ${ms}ms`);
  }
});

bot.catch((err, ctx) => {
  logger.error(`❌ Bot error for ${ctx.updateType}:`, err);
  ctx.reply('❌ Տեխնիկական սխալ տեղի ունեցավ, խնդրում եմ փորձեք կրկին:').catch(() => {});
});

const userHandlers = new UserHandlers(bot);
const orderHandlers = new OrderHandlers(bot);
const bonusHandlers = new BonusHandlers(bot);
const partnerHandlers = new PartnerHandlers(bot);
const fastChargeHandlers = new FastChargeHandlers(bot);
const adminHandlers = new AdminHandlers(bot);
const menuHandlers = new MenuHandlers(bot);

setTimeout(() => {
  ocpiService.syncData().catch(err => {
    logger.error('❌ Initial sync failed:', err);
  });
}, 5000);

setInterval(() => {
  ocpiService.syncData().catch(err => {
    logger.error('❌ Regular sync failed:', err);
  });
}, config.syncInterval);

setInterval(() => {
  bonusService.unfreezeBonuses().catch(err => {
    logger.error('❌ Unfreeze bonuses failed:', err);
  });
}, 24 * 60 * 60 * 1000);

bot.telegram.getMe().then((botInfo) => {
  logger.info(`✅ Bot connected as @${botInfo.username}`);
});

bot.telegram.deleteWebhook({ drop_pending_updates: true })
  .then(() => {
    logger.info('✅ Webhook deleted');
    bot.launch({ polling: { timeout: 30 } });
    logger.info('🚀 Bot is running...');
  })
  .catch((err) => {
    logger.error('❌ Webhook delete error:', err);
    bot.launch({ polling: { timeout: 30 } });
    logger.info('🚀 Bot is running...');
  });

const shutdown = async (signal) => {
  logger.info(`\n${signal} received, shutting down gracefully...`);
  
  server.close(async () => {
    await closeDb();
    logger.info('HTTP server closed');
    bot.stop(signal);
    process.exit(0);
  });
  
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

export { bot, app, server };
