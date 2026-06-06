const { Markup } = require('telegraf');
const { db } = require('./src/db');
const { orders, users, menuItems, bonusTransactions, partners, userBonusesByPartner } = require('./src/db/schema');
const { eq, desc, and } = require('drizzle-orm');

let ADMIN_USERNAMES = ['Styop1221'];

async function isAdmin(ctx) {
  const user = await db.select().from(users).where(eq(users.telegramId, ctx.from.id)).then(r => r[0]);
  if (!user) return false;
  return ADMIN_USERNAMES.includes(user.username);
}

async function addAdminByUsername(username) {
  if (!ADMIN_USERNAMES.includes(username)) {
    ADMIN_USERNAMES.push(username);
    return true;
  }
  return false;
}

async function removeAdminByUsername(username) {
  const index = ADMIN_USERNAMES.indexOf(username);
  if (index !== -1) {
    ADMIN_USERNAMES.splice(index, 1);
    return true;
  }
  return false;
}

async function getAdminList() {
  const adminUsers = [];
  for (const username of ADMIN_USERNAMES) {
    const user = await db.select().from(users).where(eq(users.username, username)).then(r => r[0]);
    if (user) {
      adminUsers.push({ username, firstName: user.firstName, telegramId: user.telegramId });
    } else {
      adminUsers.push({ username, firstName: 'Not registered yet', telegramId: null });
    }
  }
  return adminUsers;
}

async function getAdminKeyboard() {
  return Markup.keyboard([
    ['📦 Պատվերներ', '🍽 Մենյու'],
    ['🏢 ԿԱՌԱՎԱՐԵԼ ԳՈՐԾԸՆԿԵՐՆԵՐԸ', '📊 Վիճակագրություն'],
    ['👥 Օգտատերեր', '🔙 Հետ']
  ]).resize();
}

async function showAdminPanel(ctx) {
  if (!await isAdmin(ctx)) return ctx.reply('⛔ Մուտքը արգելված է');
  ctx.reply('🔐 *Admin Panel* - Ընտրիր գործողությունը:', { parse_mode: 'Markdown', ...await getAdminKeyboard() });
}

async function showPendingOrders(ctx) {
  if (!await isAdmin(ctx)) return;
  const pendingOrders = await db.select().from(orders).where(eq(orders.status, 'pending')).orderBy(desc(orders.createdAt));
  
  if (pendingOrders.length === 0) {
    return ctx.reply('📭 Սպասող պատվերներ չկան');
  }
  
  for (const order of pendingOrders) {
    const user = await db.select().from(users).where(eq(users.id, order.userId)).then(r => r[0]);
    const items = JSON.parse(order.items);
    let itemsText = '';
    for (let item of items) {
      itemsText += `${item.name} x${item.qty} — ${item.price * item.qty} ֏\n`;
    }
    
    const text = `🆕 *Պատվեր №${order.id}*\n\n👤 ${user.firstName || user.username}\n📍 ${order.city}\n📞 ${user.phone || 'Բացակայում է'}\n🏠 ${order.address}\n\n📦 *Ուտեստներ:*\n${itemsText}\n💰 Ընդամենը: ${order.totalAmount} ֏\n⭐ Օգտագործված բոնուս: ${order.bonusUsed} ֏\n💸 Վճարվելիք: ${order.totalAmount - order.bonusUsed} ֏\n\n📅 ${order.createdAt}`;
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('✅ Հաստատել', `confirm_order_${order.id}`)],
      [Markup.button.callback('❌ Մերժել', `reject_order_${order.id}`)]
    ]);
    
    await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
  }
}

async function confirmOrder(ctx, orderId) {
  const order = await db.select().from(orders).where(eq(orders.id, orderId)).then(r => r[0]);
  if (!order) return;
  
  await db.update(orders).set({ status: 'confirmed' }).where(eq(orders.id, orderId));
  
  const user = await db.select().from(users).where(eq(users.id, order.userId)).then(r => r[0]);
  
  let partnerCommission = 5;
  let partnerId = 1;
  
  if (order.partnerId && order.partnerId !== 1) {
    const partner = await db.select().from(partners).where(eq(partners.id, order.partnerId)).then(r => r[0]);
    if (partner && partner.commission) {
      partnerCommission = partner.commission;
      partnerId = partner.id;
    }
  }
  
  const immediateBonus = Math.floor(order.totalAmount * 0.02);
  const frozenBonus = Math.floor(order.totalAmount * (partnerCommission - 2) / 100);
  
  if (immediateBonus > 0) {
    await db.insert(bonusTransactions).values({
      userId: user.id,
      amount: immediateBonus,
      type: 'earn',
      bonusType: 'immediate',
      orderId: orderId,
      description: `Անմիջապես 2% բոնուս (${partnerCommission}% ընդհանուրից)`
    });
    await db.update(users).set({ bonusBalance: user.bonusBalance + immediateBonus }).where(eq(users.id, user.id));
  }
  
  if (frozenBonus > 0) {
    await db.insert(bonusTransactions).values({
      userId: user.id,
      amount: frozenBonus,
      type: 'earn',
      bonusType: 'frozen',
      orderId: orderId,
      description: `Սառեցված ${partnerCommission - 2}% բոնուս (6 ամիս)`
    });
    await db.update(users).set({ frozenBonus: user.frozenBonus + frozenBonus }).where(eq(users.id, user.id));
  }
  
  if (partnerId !== 1) {
    await db.insert(userBonusesByPartner).values({
      userId: user.id,
      partnerId: partnerId,
      bonusAmount: immediateBonus + frozenBonus,
      orderId: orderId,
    });
  }
  
  await ctx.answerCbQuery(`✅ Պատվերը հաստատվեց, ստացաք ${immediateBonus} անմիջապես + ${frozenBonus} սառեցված (${partnerCommission}%)`);
  await ctx.deleteMessage();
}

async function rejectOrder(ctx, orderId) {
  await db.update(orders).set({ status: 'rejected' }).where(eq(orders.id, orderId));
  await ctx.answerCbQuery('❌ Պատվերը մերժվեց');
  await ctx.deleteMessage();
}

async function showMenuManagement(ctx) {
  if (!await isAdmin(ctx)) return;
  const items = await db.select().from(menuItems).orderBy(menuItems.city, menuItems.category);
  
  let text = '🍽 *ՄԵՆՅՈւԻ ԿԱՌԱՎԱՐՈՒՄ*\n\n';
  for (let item of items) {
    text += `${item.id}. ${item.name} — ${item.price} ֏ (${item.city === 'yerevan' ? 'Երևան' : 'Էջմիածին'})\n`;
  }
  
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('➕ Ավելացնել ուտեստ', 'add_menu_item')],
    [Markup.button.callback('✏️ Խմբագրել ուտեստ', 'edit_menu_item')],
    [Markup.button.callback('🗑 Ջնջել ուտեստ', 'delete_menu_item')],
    [Markup.button.callback('👑 Կառավարել ադմիններ', 'manage_admins')],
    [Markup.button.callback('🔙 Հետ', 'back_to_admin')]
  ]);
  
  await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
}

async function showPartnersManagement(ctx) {
  if (!await isAdmin(ctx)) return;
  const partnersList = await db.select().from(partners).orderBy(partners.name);
  
  let text = '🏢 *ԳՈՐԾԸՆԿԵՐՆԵՐԻ ԿԱՌԱՎԱՐՈՒՄ*\n\n';
  for (let p of partnersList) {
    text += `${p.id}. ${p.name} — ${p.commission}% (${p.isActive ? '✅' : '❌'})\n`;
  }
  
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('➕ Ավելացնել գործընկեր', 'add_partner')],
    [Markup.button.callback('✏️ Խմբագրել գործընկեր', 'edit_partner')],
    [Markup.button.callback('🗑 Ջնջել գործընկեր', 'delete_partner')],
    [Markup.button.callback('🔙 Հետ', 'back_to_admin')]
  ]);
  
  await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
}

async function showManageAdmins(ctx) {
  if (!await isAdmin(ctx)) return;
  
  const adminList = await getAdminList();
  let text = '👑 *ԱԴՄԻՆՆԵՐԻ ԿԱՌԱՎԱՐՈՒՄ*\n\n';
  for (let admin of adminList) {
    text += `• @${admin.username} — ${admin.firstName || '?'}\n`;
  }
  
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('➕ Ավելացնել ադմին', 'add_admin_by_username')],
    [Markup.button.callback('❌ Հեռացնել ադմին', 'remove_admin_by_username')],
    [Markup.button.callback('🔙 Հետ', 'back_to_admin')]
  ]);
  
  await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
}

async function showStats(ctx) {
  if (!await isAdmin(ctx)) return;
  
  const totalUsers = await db.select().from(users).then(r => r.length);
  const totalOrders = await db.select().from(orders).then(r => r.length);
  const totalRevenue = await db.select().from(orders).then(r => r.reduce((sum, o) => sum + o.totalAmount, 0));
  const pendingOrders = await db.select().from(orders).where(eq(orders.status, 'pending')).then(r => r.length);
  const totalPartners = await db.select().from(partners).then(r => r.length);
  
  const text = `📊 *ՎԻՃԱԿԱԳՐՈՒԹՅՈՒՆ*\n\n👥 Օգտատերեր: ${totalUsers}\n📦 Պատվերներ: ${totalOrders}\n💰 Ընդհանուր եկամուտ: ${totalRevenue} ֏\n⏳ Սպասող պատվերներ: ${pendingOrders}\n🏢 Գործընկերներ: ${totalPartners}`;
  
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🔙 Հետ', 'back_to_admin')]
  ]);
  
  await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
}

async function showUsers(ctx) {
  if (!await isAdmin(ctx)) return;
  
  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt)).limit(20);
  let text = '👥 *ՎԵՐՋԻՆ 20 ՕԳՏԱՏԵՐԸ*\n\n';
  for (let u of allUsers) {
    text += `• @${u.username || u.telegramId} | ${u.phone || 'No phone'} | ${u.bonusBalance} բոնուս\n`;
  }
  
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🔙 Հետ', 'back_to_admin')]
  ]);
  
  await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
}

async function addPartner(ctx, name, category, commission) {
  await db.insert(partners).values({
    name: name,
    nameHy: name,
    nameRu: name,
    nameEn: name,
    category: category,
    commission: commission,
    isActive: true
  });
}

async function editPartner(partnerId, updates) {
  await db.update(partners).set(updates).where(eq(partners.id, partnerId));
}

async function deletePartner(partnerId) {
  await db.delete(partners).where(eq(partners.id, partnerId));
}

module.exports = { 
  isAdmin, 
  showAdminPanel, 
  showPendingOrders, 
  confirmOrder, 
  rejectOrder, 
  showMenuManagement, 
  showPartnersManagement,
  showStats, 
  showUsers,
  showManageAdmins,
  addAdminByUsername,
  removeAdminByUsername,
  addPartner,
  editPartner,
  deletePartner,
  getAdminKeyboard,
  getAdminList
};