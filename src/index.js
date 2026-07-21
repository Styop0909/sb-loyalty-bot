import { Telegraf } from 'telegraf';
import LocalSession from 'telegraf-session-local';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';

import config from './config/index.js';
import logger from './utils/logger.js';
import { db } from './db/index.js';
import ocpiRouter from './ocpi/server.js';

import {
  UserHandlers,
  OrderHandlers,
  BonusHandlers,
  PartnerHandlers,
  FastChargeHandlers,
  AdminHandlers,
  MenuHandlers
} from './handlers/index.js';

import { mainMenu } from './keyboards/index.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/ocpi', ocpiRouter);

app.get('/', (req, res) => {
  res.send('TuTak Bot is running!');
});

const port = config.port || 8080;
app.listen(port, () => {
  logger.info(`✅ HTTP server running on port ${port}`);
});
const bot = new Telegraf(config.botToken);
bot.use(new LocalSession({ database: 'session_db.json' }).middleware());
new UserHandlers(bot);
new OrderHandlers(bot);
new BonusHandlers(bot);
new PartnerHandlers(bot);
new FastChargeHandlers(bot);
new AdminHandlers(bot);
new MenuHandlers(bot);

bot.telegram.getMe().then((botInfo) => {
  logger.info(`✅ Bot connected as @${botInfo.username}`);
});

bot.telegram.deleteWebhook({ drop_pending_updates: true })
  .then(() => {
    logger.info('✅ Webhook deleted');
    bot.launch({ polling: { timeout: 30 } });
    logger.info('🚀 Bot is running!');
  })
  .catch((err) => {
    logger.error('❌ Webhook delete error:', err);
    bot.launch({ polling: { timeout: 30 } });
    logger.info('🚀 Bot is running!');
  });

export { bot, app };
