import { 
  pgTable, 
  serial, 
  bigint, 
  varchar, 
  integer, 
  boolean, 
  timestamp, 
  text, 
  decimal, 
  jsonb,
  numeric 
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  telegramId: bigint('telegram_id', { mode: 'number' }).unique().notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  username: varchar('username', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  phoneVerified: boolean('phone_verified').default(false),
  language: varchar('language', { length: 2 }).default('ru'),
  city: varchar('city', { length: 50 }).default('yerevan'),
  bonusBalance: integer('bonus_balance').default(0),
  frozenBonus: integer('frozen_bonus').default(0),
  invitedBy: integer('invited_by'),
  onboardingShown: boolean('onboarding_shown').default(false),
  orderCount: integer('order_count').default(0),
  lastOrderAt: timestamp('last_order_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const orders = pgTable('orders', {
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

export const bonusTransactions = pgTable('bonus_transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  type: varchar('type', { length: 20 }),
  bonusType: varchar('bonus_type', { length: 20 }),
  amount: integer('amount').notNull(),
  orderId: integer('order_id'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const appNotifications = pgTable('app_notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).unique().notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const menuItems = pgTable('menu_items', {
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

export const complaints = pgTable('complaints', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  orderId: integer('order_id'),
  message: text('message').notNull(),
  status: varchar('status', { length: 20 }).default('pending'),
  adminBonusGiven: boolean('admin_bonus_given').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const partners = pgTable('partners', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  nameHy: varchar('name_hy', { length: 200 }),
  nameRu: varchar('name_ru', { length: 200 }),
  nameEn: varchar('name_en', { length: 200 }),
  description: text('description'),
  address: varchar('address', { length: 500 }),
  phone: varchar('phone', { length: 20 }),
  website: varchar('website', { length: 200 }),
  category: varchar('category', { length: 100 }),
  commission: integer('commission').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const userBonusesByPartner = pgTable('user_bonuses_by_partner', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  partnerId: integer('partner_id').notNull(),
  bonusAmount: integer('bonus_amount').default(0),
  orderId: integer('order_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const locations = pgTable('locations', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  country: varchar('country', { length: 2 }).default('AM'),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  evses: jsonb('evses').default([]),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const tariffs = pgTable('tariffs', {
  id: varchar('id', { length: 255 }).primaryKey(),
  currency: varchar('currency', { length: 3 }).default('AMD'),
  elements: jsonb('elements'),
  energyPrice: decimal('energy_price', { precision: 10, scale: 2 }),
  parkingFee: decimal('parking_fee', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  locationId: varchar('location_id', { length: 255 }),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  userId: integer('user_id').references(() => users.id),
  kwh: decimal('kwh', { precision: 10, scale: 2 }),
  totalCost: decimal('total_cost', { precision: 10, scale: 2 }),
  status: varchar('status', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const cdrs = pgTable('cdrs', {
  id: text('id').primaryKey(),
  sessionId: text('session_id'),
  locationId: text('location_id'),
  userId: integer('user_id').references(() => users.id),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  kwh: numeric('kwh').default('0'),
  totalCost: numeric('total_cost').default('0'),
  currency: text('currency').default('AMD'),
  status: text('status').default('COMPLETED'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  orders: many(orders),
  bonusTransactions: many(bonusTransactions),
  complaints: many(complaints),
  sessions: many(sessions),
  cdrs: many(cdrs),
  referrals: many(users, { relationName: 'referrals' }),
  inviter: one(users, { fields: [users.invitedBy], references: [users.id], relationName: 'referrals' }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
}));

export const bonusTransactionsRelations = relations(bonusTransactions, ({ one }) => ({
  user: one(users, { fields: [bonusTransactions.userId], references: [users.id] }),
  order: one(orders, { fields: [bonusTransactions.orderId], references: [orders.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const cdrsRelations = relations(cdrs, ({ one }) => ({
  user: one(users, { fields: [cdrs.userId], references: [users.id] }),
  session: one(sessions, { fields: [cdrs.sessionId], references: [sessions.id] }),
}));

export const locationsRelations = relations(locations, ({ many }) => ({
  sessions: many(sessions),
}));

export const tariffsRelations = relations(tariffs, ({ many }) => ({
  sessions: many(sessions),
}));
