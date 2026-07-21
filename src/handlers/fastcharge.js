import { Markup } from 'telegraf';
import { db } from '../db/index.js';
import { locations, tariffs, sessions, users } from '../db/schema.js';
import { eq, desc, sql } from 'drizzle-orm';
import { getTranslation } from '../../i18n.js';
import { generateQR } from '../utils/helpers.js';
import { fastChargeMenu } from '../keyboards/index.js';

class FastChargeHandlers {
  constructor(bot) {
    this.bot = bot;
    this.setupHandlers();
  }

  setupHandlers() {
    // Fast Charge menu
    this.bot.hears(['🔌 Fast Charge', 'Fast Charge'], async (ctx) => {
      const user = await this.getUser(ctx.from.id);
      if (!user) return;
      const lang = user.language || 'hy';
      
      await ctx.reply(
        '⚡ *Fast Charge*\n\n' +
        'Ընտրեք բաժինը:\n\n' +
        '📍 Կայաններ - Տեսնել բոլոր լիցքավորման կայանները\n' +
        '💰 Տարիֆներ - Տեսնել գների ցանկը\n' +
        '📊 Իմ սեսիաները - Ձեր լիցքավորման պատմությունը\n' +
        '📱 FastCharge QR - Ձեր QR code-ը լիցքավորման համար',
        { parse_mode: 'Markdown', ...fastChargeMenu() }
      );
    });

    // Locations
    this.bot.hears(['📍 Կայաններ', '📍 Станции', '📍 Stations'], async (ctx) => {
      const user = await this.getUser(ctx.from.id);
      if (!user) return;
      
      const result = await db.execute(sql`SELECT * FROM locations WHERE publish = true`);
      const locationsData = result.rows || result;
      
      if (locationsData.length === 0) {
        return ctx.reply('📭 Կայաններ դեռ չկան');
      }
      
      let text = '🔌 *Fast Charge - Լիցքավորման կայաններ*\n\n';
      
      for (let i = 0; i < locationsData.length; i++) {
        const loc = locationsData[i];
        
        text += `${i + 1}. *${loc.name}*\n`;
        if (loc.address) text += `📍 ${loc.address}\n`;
        if (loc.city) text += `🏙️ ${loc.city}\n`;
        
        let evses = [];
        try {
          evses = typeof loc.evses === 'string' ? JSON.parse(loc.evses) : loc.evses;
        } catch (e) {
          evses = [];
        }
        
        const connectors = evses.reduce((count, evse) => {
          return count + (evse.connectors?.length || 0);
        }, 0);
        
        text += `🔌 ${connectors || 0} միացում`;
        const isOnline = loc.is_online !== false;
        text += isOnline ? '  🟢 *Հասանելի*' : '  🔴 *Անհասանելի*';
        text += '\n\n';
      }
      
      if (text.length > 4000) {
        text = text.slice(0, 3800) + '\n\n... և այլն';
      }
      
      const keyboard = Markup.keyboard([['⬅️ Հետ']]).resize();
      await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
    });

    // Tariffs
    this.bot.hears(['💰 Տարիֆներ', '💰 Тарифы', '💰 Tariffs'], async (ctx) => {
      const user = await this.getUser(ctx.from.id);
      if (!user) return;
      
      const tariffsData = await db.select().from(tariffs);
      
      if (tariffsData.length === 0) {
        return ctx.reply('💰 Տարիֆներ դեռ չկան');
      }
      
      let text = '💰 *Fast Charge - Սակագներ (Tariffs)*\n\n';
      
      for (let i = 0; i < tariffsData.length; i++) {
        const t = tariffsData[i];
        
        let elements = [];
        try {
          elements = typeof t.elements === 'string' ? JSON.parse(t.elements) : t.elements;
        } catch (e) {
          elements = [];
        }
        
        let energyPrice = null;
        let parkingPrice = null;
        
        if (Array.isArray(elements) && elements.length > 0) {
          for (const element of elements) {
            if (element.price_components && Array.isArray(element.price_components)) {
              for (const comp of element.price_components) {
                if (comp.type === 'ENERGY') energyPrice = comp.price;
                else if (comp.type === 'PARKING_TIME') parkingPrice = comp.price;
              }
            }
          }
        }
        
        if (energyPrice === null && t.energy_price > 0) energyPrice = t.energy_price;
        if (parkingPrice === null && t.parking_fee > 0) parkingPrice = t.parking_fee;
        
        if (energyPrice === null) continue;
        
        text += `🔹 *Տարբերակ ${i + 1}*\n`;
        text += `⚡ ${energyPrice} ${t.currency || 'AMD'}/kWh`;
        
        if (parkingPrice && parkingPrice > 0) {
          text += `  •  🅿️ ${parkingPrice} ${t.currency || 'AMD'}/ժամ`;
        }
        
        text += '\n\n';
      }
      
      if (text.length > 4000) {
        text = text.slice(0, 3800) + '\n\n... և այլն';
      }
      
      const keyboard = Markup.keyboard([['⬅️ Հետ']]).resize();
      await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
    });

    // My Sessions
    this.bot.hears(['📊 Իմ սեսիաները', '📊 Мои сессии', '📊 My sessions'], async (ctx) => {
      const user = await this.getUser(ctx.from.id);
      if (!user) return;
      
      const sessionsData = await db.select()
        .from(sessions)
        .where(eq(sessions.userId, user.id))
        .orderBy(desc(sessions.createdAt))
        .limit(20);
      
      if (sessionsData.length === 0) {
        return ctx.reply('📊 Դուք դեռ չունեք լիցքավորման սեսիաներ');
      }
      
      let text = '📊 *Ձեր Fast Charge սեսիաները*\n\n';
      let totalCost = 0;
      let totalKwh = 0;
      
      for (const s of sessionsData) {
        const cost = parseFloat(s.totalCost) || 0;
        const kwh = parseFloat(s.kwh) || 0;
        totalCost += cost;
        totalKwh += kwh;
        
        const date = s.startDate ? new Date(s.startDate).toLocaleString() : 'N/A';
        const status = s.status === 'COMPLETED' ? '✅ Ավարտված' : 
                       s.status === 'ACTIVE' ? '⏳ Ընթացքի մեջ' : s.status;
        
        text += `🆔 ${s.id.slice(0, 12)}...\n`;
        text += `📅 ${date}\n`;
        text += `⚡ ${kwh} kWh\n`;
        text += `💵 ${cost} AMD\n`;
        text += `📌 ${status}\n\n`;
      }
      
      text += `📊 *Ընդհանուր:*\n`;
      text += `⚡ ${totalKwh.toFixed(1)} kWh\n`;
      text += `💵 ${totalCost} AMD\n`;
      
      const keyboard = Markup.keyboard([['⬅️ Հետ']]).resize();
      await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
    });

    // FastCharge QR
    this.bot.hears(['📱 FastCharge QR', 'FastCharge QR'], async (ctx) => {
      const user = await this.getUser(ctx.from.id);
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
      
      const qrImage = await generateQR(qrData);
      
      await ctx.replyWithPhoto(
        { source: Buffer.from(qrImage.split(',')[1], 'base64') },
        {
          caption: 
`📱 *Ձեր Fast Charge QR Code*

Սա ձեր անձնական QR code-ն է Fast Charge-ի համար:

🔹 *Ինչպես օգտագործել:*
1. Գնացեք Fast Charge կայան
2. Սկանավորեք այս QR code-ը
3. Սկսեք լիցքավորումը
4. Բոնուսները կհաշվարկվեն ավտոմատ

👤 *User:* ${user.firstName || user.username}
🆔 *ID:* ${user.id}
💰 *Բոնուս:* 5% cashback

*Պահպանեք այս QR code-ը ձեր հեռախոսում*`,
          parse_mode: 'Markdown'
        }
      );
    });

    // Back
    this.bot.hears(['⬅️ Հետ'], async (ctx) => {
      const user = await this.getUser(ctx.from.id);
      if (!user) return;
      await ctx.reply('Գլխավոր մենյու', mainMenu(user.language));
    });
  }

  async getUser(telegramId) {
    const result = await db.select().from(users).where(eq(users.telegramId, telegramId));
    return result[0] || null;
  }
}

export default FastChargeHandlers;
