const { pgTable, serial, bigint, varchar, integer, boolean, timestamp, text } = require('drizzle-orm/pg-core');

const users = pgTable('users', {
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

const complaints = pgTable('complaints', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  orderId: integer('order_id'),
  message: text('message').notNull(),
  status: varchar('status', { length: 20 }).default('pending'),
  adminBonusGiven: boolean('admin_bonus_given').default(false),
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
  website: varchar('website', { length: 200 }),
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

module.exports = {
  users,
  orders,
  menuItems,
  bonusTransactions,
  complaints,
  partners,
  userBonusesByPartner,
};