import { Markup } from 'telegraf';
import { db } from '../db/index.js';
import { locations, tariffs, sessions, users } from '../db/schema.js';
import { eq, desc, sql } from 'drizzle-orm';
import QRCode from 'qrcode';
import logger from '../utils/logger.js';

class FastChargeHandlers {
  constructor(bot) {
    this.bot = bot;
    this.setupHandlers();
  }

  setupHandlers() {
    this.bot.hears(['🔌 Fast Charge', 'Fast Charge'], async (ctx) => {
      const keyboard = Markup.keyboard([
        ['📍 Կայաններ', '💰 Տարիֆներ'],
        ['📊 Իմ սեսիաները', '📱 FastCharge QR'],
        ['⬅️ Հետ']
      ]).resize();
      
      await ctx.reply(
        '⚡ *Fast Charge*\n\nԸնտրեք բաժինը:',
        { parse_mode: 'Markdown', ...keyboard }
      );
    });

    this.bot.hears(['📍 Կայաններ', 'FastCharge Locations'], async (ctx) => {
      try {
        const result = await db.execute(sql`SELECT * FROM locations WHERE publish = true`);
        const locationsData = result.rows || result;
        
        if (locationsData.length === 0) {
          return ctx.reply('📭 Կայաններ դեռ չկան');
        }
        
        let text = '🔌 *Fast Charge - Կայաններ*\n\n';
        for (let i = 0; i < locationsData.length; i++) {
          const loc = locationsData[i];
          text += `${i + 1}. *${loc.name}*\n`;
          if (loc.address) text += `📍 ${loc.address}\n`;
          if (loc.city) text += `🏙️ ${loc.city}\n`;
          
          let evses = [];
          try { evses = typeof loc.evses === 'string' ? JSON.parse(loc.evses) : loc.evses; } catch (e) {}
          const connectors = evses.reduce((count, evse) => count + (evse.connectors?.length || 0), 0);
          text += `🔌 ${connectors || 0} միացում`;
          text += loc.is_online !== false ? ' 🟢' : ' 🔴';
          text += '\n\n';
        }
        
        const keyboard = Markup.keyboard([['⬅️ Հետ']]).resize();
        await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
      } catch (error) {
        logger.error('Locations error:', error);
        await ctx.reply('❌ Սխալ տեղի ունեցավ:');
      }
    });

    this.bot.hears(['💰 Տարիֆներ', 'FastCharge Tariffs'], async (ctx) => {
      try {
        const tariffsData = await db.select().from(tariffs);
        
        if (tariffsData.length === 0) {
          return ctx.reply('💰 Տարիֆներ դեռ չկան');
        }
        
        let text = '💰 *Fast Charge - Տարիֆներ*\n\n';
        for (let i = 0; i < tariffsData.length; i++) {
          const t = tariffsData[i];
          text += `🔹 *Տարբերակ ${i + 1}*\n`;
          text += `⚡ ${t.energy_price || 0} ${t.currency || 'AMD'}/kWh\n`;
          if (t.parking_fee > 0) text += `🅿️ ${t.parking_fee} ${t.currency || 'AMD'}/ժամ\n`;
          text += '\n';
        }
        
        const keyboard = Markup.keyboard([['⬅️ Հետ']]).resize();
        await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
      } catch (error) {
        logger.error('Tariffs error:', error);
        await ctx.reply('❌ Սխալ տեղի ունեցավ:');
      }
    });

    this.bot.hears(['📊 Իմ սեսիաները', 'My FastCharge Sessions'], async (ctx) => {
      try {
        const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
        if (!user) return;
        
        const sessionsData = await db.select()
          .from(sessions)
          .where(eq(sessions.userId, user.id))
          .orderBy(desc(sessions.createdAt))
          .limit(20);
        
        if (sessionsData.length === 0) {
          return ctx.reply('📊 Դուք դեռ չունեք սեսիաներ');
        }
        
        let text = '📊 *Ձեր սեսիաները*\n\n';
        let totalCost = 0;
        let totalKwh = 0;
        
        for (const s of sessionsData) {
          const cost = parseFloat(s.totalCost) || 0;
          const kwh = parseFloat(s.kwh) || 0;
          totalCost += cost;
          totalKwh += kwh;
          
          const date = s.startDate ? new Date(s.startDate).toLocaleString() : 'N/A';
          const status = s.status === 'COMPLETED' ? '✅ Ավարտված' : s.status === 'ACTIVE' ? '⏳ Ընթացքի մեջ' : s.status;
          
          text += `🆔 ${s.id.slice(0, 12)}...\n`;
          text += `📅 ${date}\n`;
          text += `⚡ ${kwh} kWh\n`;
          text += `💵 ${cost} AMD\n`;
          text += `📌 ${status}\n\n`;
        }
        
        text += `📊 *Ընդհանուր:* ⚡ ${totalKwh.toFixed(1)} kWh | 💵 ${totalCost} AMD`;
        
        const keyboard = Markup.keyboard([['⬅️ Հետ']]).resize();
        await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
      } catch (error) {
        logger.error('Sessions error:', error);
        await ctx.reply('❌ Սխալ տեղի ունեցավ:');
      }
    });

    this.bot.hears(['📱 FastCharge QR', 'FastCharge QR'], async (ctx) => {
      try {
        const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
        if (!user) {
          return ctx.reply('Խնդրում եմ գրանցվեք /start-ով');
        }
        
        const qrData = {
          type: 'fastcharge',
          userId: user.id,
          telegramId: user.telegramId,
          username: user.username,
          timestamp: Date.now()
        };
        
        const qrString = Buffer.from(JSON.stringify(qrData)).toString('base64');
        const qrImage = await QRCode.toDataURL(qrString);
        
        await ctx.replyWithPhoto(
          { source: Buffer.from(qrImage.split(',')[1], 'base64') },
          {
            caption: 
`📱 *Ձեր Fast Charge QR Code*

🔹 *Ինչպես օգտագործել:*
1. Գնացեք Fast Charge կայան
2. Սկանավորեք այս QR code-ը
3. Սկսեք լիցքավորումը

👤 *User:* ${user.firstName || user.username}
🆔 *ID:* ${user.id}
💰 *Բոնուս:* 5% cashback`,
            parse_mode: 'Markdown'
          }
        );
      } catch (error) {
        logger.error('QR error:', error);
        await ctx.reply('❌ Սխալ QR code-ի ստեղծման ժամանակ:');
      }
    });
  }
}

export default FastChargeHandlers;
