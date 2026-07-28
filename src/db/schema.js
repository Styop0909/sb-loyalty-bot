const { pgTable, serial, bigint, varchar, integer, boolean, timestamp, text, decimal, jsonb } = require('drizzle-orm/pg-core');

const users = pgTable('users', {
  id: serial('id').primaryKey(),
  telegramId: bigint('telegram_id', { mode: 'number' }).unique().notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  username: varchar('username', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  phoneVerified: boolean('phone_verified').default(false),
  language: varchar('language', { length: 2 }).default('hy'),
  city: varchar('city', { length: 50 }).default('yerevan'),
  bonusBalance: integer('bonus_balance').default(0),
  frozenBonus: integer('frozen_bonus').default(0),
  invitedBy: integer('invited_by'),
  createdAt: timestamp('created_at').defaultNow(),
});

const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  city: varchar('city', { length: 50 }).notNull(),
  items: text('items').notNull(),
  totalAmount: integer('total_amount').notNull(),
  bonusUsed: integer('bonus_used').default(0),
  bonusEarned: integer('bonus_earned').default(0),
  status: varchar('status', { length: 20 }).default('pending'),
  address: text('address'),
  createdAt: timestamp('created_at').defaultNow(),
});

const menuItems = pgTable('menu_items', {
  id: serial('id').primaryKey(),
  city: varchar('city', { length: 50 }).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  nameHy: varchar('name_hy', { length: 200 }),
  nameRu: varchar('name_ru', { length: 200 }),
  nameEn: varchar('name_en', { length: 200 }),
  price: integer('price').notNull(),
  category: varchar('category', { length: 100 }),
  categoryRu: varchar('category_ru', { length: 100 }),
  categoryEn: varchar('category_en', { length: 100 }),
  isAvailable: boolean('is_available').default(true),
});

const bonusTransactions = pgTable('bonus_transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  type: varchar('type', { length: 20 }),
  bonusType: varchar('bonus_type', { length: 20 }),
  amount: integer('amount').notNull(),
  orderId: integer('order_id'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

const partners = pgTable('partners', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  nameHy: varchar('name_hy', { length: 200 }),
  nameRu: varchar('name_ru', { length: 200 }),
  nameEn: varchar('name_en', { length: 200 }),
  description: text('description'),
  address: varchar('address', { length: 500 }),
  phone: varchar('phone', { length: 20 }),
  category: varchar('category', { length: 100 }),
  commission: integer('commission').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

const userBonusesByPartner = pgTable('user_bonuses_by_partner', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  partnerId: integer('partner_id').notNull(),
  bonusAmount: integer('bonus_amount').default(0),
  orderId: integer('order_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

const locations = pgTable('locations', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  country: varchar('country', { length: 2 }).default('AM'),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  evses: jsonb('evses').default([]),
  publish: boolean('publish').default(true),
  isOnline: boolean('is_online').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

const tariffs = pgTable('tariffs', {
  id: varchar('id', { length: 255 }).primaryKey(),
  currency: varchar('currency', { length: 3 }).default('AMD'),
  elements: jsonb('elements'),
  energyPrice: decimal('energy_price', { precision: 10, scale: 2 }),
  parkingFee: decimal('parking_fee', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

const sessions = pgTable('sessions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  locationId: varchar('location_id', { length: 255 }),
  userId: integer('user_id'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  kwh: decimal('kwh', { precision: 10, scale: 2 }),
  totalCost: decimal('total_cost', { precision: 10, scale: 2 }),
  status: varchar('status', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

const cdrs = pgTable('cdrs', {
  id: text('id').primaryKey(),
  sessionId: text('session_id'),
  locationId: text('location_id'),
  userId: integer('user_id'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  kwh: decimal('kwh', { precision: 10, scale: 2 }),
  totalCost: decimal('total_cost', { precision: 10, scale: 2 }),
  currency: text('currency').default('AMD'),
  status: text('status').default('COMPLETED'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

const appNotifications = pgTable('app_notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').unique().notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

const sessionTokens = pgTable('session_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  cdrToken: text('cdr_token').unique().notNull(),
  status: text('status').default('pending'),
  locationId: text('location_id'),
  sessionId: text('session_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

module.exports = {
  users,
  orders,
  menuItems,
  bonusTransactions,
  partners,
  userBonusesByPartner,
  locations,
  tariffs,
  sessions,
  sessionTokens,
  cdrs,
  appNotifications
};
