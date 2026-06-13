const translations = {
  hy: {
    welcome: `🦜 Բարի գալուստ TuTak!

TuTak-ն սննդի շուրջ կառուցված հավատարմության ծրագիր է:
Պատվիրիր մեզնից և գործընկերներից, կուտակիր բոնուսներ,
հրավիրիր ընկերներին և ծախսիր բոնուսները հաջորդ պատվերների վրա:

Ամեն ինչ թափանցիկ է: Ամեն ինչ ազնիվ է:

⭐ Ինչպես են աշխատում քո բոնուսները:

🟢 2% յուրաքանչյուր պատվերից — հասանելի են անմիջապես
⚫ 3% յուրաքանչյուր պատվերից — բացվում են 6 ամիս ակտիվ գնումներից հետո
💳 Բոնուսներով կարող ես վճարել պատվերի գումարի մինչև 30%-ը
🚫 Բոնուսները չի կարելի կանխիկացնել — միայն ծախսել համակարգի ներսում

👥 Հրավիրիր ընկերներին — ավելի շատ վաստակիր:

🎁 Սկզբնական բոնուս:
Երկուսդ էլ կատարե՞լ եք 10,000 ֏-ից ավելի պատվեր:
Յուրաքանչյուրը ստանում է +1,000 բոնուս:

📊 Քո ընկերների յուրաքանչյուր պատվերից դու ստանում ես.
• Ընկեր (մակարդակ 1) — 1% նրա պատվերից
• Ընկերոջ ընկեր (մակարդակ 2) — 0.5%
• Հաջորդ մակարդակ (մակարդակ 3) — 0.25%

Օրինակ: ընկերը պատվիրել է 10,000 ֏
→ դու ավտոմատ ստանում ես 100 բոնուս:

Որքան շատ ակտիվ ընկերներ — այնքան ավելի շատ բոնուսներ: 🚀`,
    chooseLanguage: '🌐 Ընտրիր լեզու / Выбери язык / Choose language:',
    selectCity: 'Ընտրիր քաղաքը:',
    yerevan: '🌆 Երևան',
    echmiadzin: '✝️ Էջմիածին',
    back: '◀️ Հետ',
    menu: '🍽 Ճաշացուցակ',
    bonus: '⭐ Բոնուսներ',
    referral: '👥 Ռեֆերալ',
    myOrders: '📋 Իմ պատվերները',
    changeCity: '📍 Փոխել քաղաքը',
    partners: '🏢 Գործընկերներ',
    cart: '🛒 Զամբյուղ',
    myStats: '📊 Իմ վիճակագրություն',
    changeLanguage: '🌐 Փոխել լեզուն',
    emptyMenu: '📭 Մենյուն դատարկ է։ Խնդրում եմ սպասեք թարմացմանը։',
    bonusText: (available, frozen) => `<b>⭐ Ձեր բոնուսները</b>\n\n🟢 Հասանելի: ${available} ֏\n⚫ Սառեցված: ${frozen} ֏\n\n🔹 2% անմիջապես, 3% բացվում է 6 ամսից`,
    referralText: (link) => `<b>👥 Ռեֆերալային ծրագիր</b>\n\n🔗 Ձեր հղումը:\n<code>${link}</code>\n\n📊 Բոնուսներ:\n• 1% - 1-ին մակարդակ\n• 0.5% - 2-րդ մակարդակ\n• 0.25% - 3-րդ մակարդակ`,
    referralFriends: (count) => `👥 Ձեր հրավիրածները: ${count}`,
    referralCopyHint: `💡 Հղումը պատճենելու համար պարզապես սեղմեք հղման վրա`,
    cityChanged: (city) => `✅ Քաղաքը փոխվեց: <b>${city}</b>`,
    languageChanged: (lang) => `✅ Լեզուն փոխվեց: ${lang}`,
    noOrders: '📭 Դեռ պատվերներ չկան',
    ordersTitle: '📋 *Ձեր վերջին պատվերները*',
    orderStatusPending: 'սպասվում է',
    orderStatusConfirmed: 'հաստատված',
    orderStatusRejected: 'մերժված',
    orderStatusCompleted: 'ավարտված',
    categoriesTitle: '📂 *Ընտրիր կատեգորիա:*',
    categoryEmpty: '📭 Այս կատեգորիայում ուտեստ չկա',
    selectItem: 'Ընտրիր ուտեստը:',
    backToCategories: '◀️ Վերադառնալ կատեգորիաներին',
    backToMain: '🔙 Վերադարձ գլխավոր մենյու',
    itemAdded: (name) => `✅ ${name} ավելացվեց`,
    cartEmpty: '🛒 Զամբյուղը դատարկ է',
    cartTitle: '🛒 *Ձեր զամբյուղը*',
    cartTotal: '💰 *Ընդամենը:*',
    cartBonusHint: (max) => `⭐ *Կարող եք օգտագործել մինչև:* ${max} բոնուս`,
    checkoutConfirm: '✅ Ձևակերպել պատվեր',
    clearCart: '🗑 Մաքրել զամբյուղը',
    cancelOrder: '❌ Չեղարկել պատվերը',
    orderCancelled: '❌ Պատվերը չեղարկվեց:',
    noBonus: (total) => `Պատվերի գումարը: ${total} ֏\nԴուք չունեք բոնուսներ:\nՆշեք առաքման հասցեն (կամ գրեք "ինքնուրույն վերցնել"):`,
    askBonus: (total, max) => `Պատվերի գումարը: ${total} ֏\nԿարող եք օգտագործել մինչև ${max} բոնուս:\nՈրքա՞ն բոնուս եք ուզում օգտագործել (0-${max}):`,
    askAddress: 'Նշեք առաքման հասցեն (կամ գրեք "ինքնուրույն վերցնել"):',
    askPhone: '📱 Խնդրում եմ գրեք ձեր հեռախոսահամարը +374 ձևաչափով:\nՕրինակ: +374XXXXXXXX',
    invalidPhone: '❌ Սխալ ձևաչափ: Խնդրում եմ գրեք +374XXXXXXXX ձևաչափով:\nՕրինակ: +374XXXXXXXX',
    orderSent: (id, paid) => `✅ Պատվերը ուղարկվեց հաստատման №${id}\n💸 Վճարված: ${paid} ֏\n⏳ Սպասեք ադմինի հաստատմանը`,
    statsTitle: '📊 *ՎԻՃԱԿԱԳՐՈՒԹՅՈՒՆ*',
    statsEarnedImmediate: (amount) => `✅ Ստացված բոնուսներ (2% անմիջապես): ${amount} ֏`,
    statsEarnedFrozen: (amount) => `⏳ Ստացված բոնուսներ (սառեցված 6 ամիս): ${amount} ֏`,
    statsSpent: (amount) => `💸 Ծախսված բոնուսներ: ${amount} ֏`,
    statsBalance: (amount) => `⭐ Ընթացիկ մնացորդ: ${amount} ֏`,
    statsByPartners: '🏢 *ԸՍՏ ԳՈՐԾԸՆԿԵՐՆԵՐԻ*',
    statsNoPartners: '🏢 Գործընկերներից բոնուսներ դեռ չկան',
    partnersTitle: '🏢 *ՄԵՐ ԳՈՐԾԸՆԿԵՐՆԵՐԸ*',
    partnersBonus: (percent) => `💰 Բոնուս: ${percent}%`,
    noPartners: '📭 Դեռևս գործընկերներ չկան',
    adminOnly: '⛔ Մուտքը արգելված է',
    invalidNumber: (min, max) => `Սխալ թիվ: Գրեք 0-ից ${max} միջակայքում`,
    cartItem: (name, qty, subtotal) => `${name} x${qty} — ${subtotal} ֏`,
    statistics: '📊 Վիճակագրություն',
    users: '👥 Օգտատերեր',
    orders: '📦 Պատվերներ',
    menuManagement: '🍽 Մենյու',
    partnersManagement: '🏢 Գործընկերներ',
    backToAdmin: '🔙 Հետ',
    adminPanel: '🔐 Admin Panel - Ընտրիր գործողությունը:',
    selectLanguage: '🌐 Ընտրիր լեզու / Выбери язык / Choose language:',
  },
  ru: {
    welcome: `🦜 Добро пожаловать в TuTak!

TuTak — это программа лояльности вокруг еды.
Заказывай у нас и партнёров, копи бонусы,
приглашай друзей и трать бонусы на следующие заказы.

Всё прозрачно. Всё честно.

⭐ Как работают твои бонусы:

🟢 2% от каждого заказа — доступны сразу
⚫ 3% от каждого заказа — открываются через 6 месяцев активных покупок
💳 Бонусами можно оплатить до 30% от суммы заказа
🚫 Бонусы нельзя вывести деньгами — только тратить внутри системы

👥 Приглашай друзей — зарабатывай больше!

🎁 Стартовый бонус:
Вы оба сделали заказ от 10,000 ֏?
Каждый получает +1,000 бонусов!

📊 С каждого заказа твоих друзей ты получаешь:
• Друг (уровень 1) — 1% от его заказа
• Друг друга (уровень 2) — 0.5%
• Следующий уровень (уровень 3) — 0.25%

Пример: друг заказал на 10,000 ֏
→ ты автоматически получаешь 100 бонусов!

Чем больше активных друзей — тем больше бонусов! 🚀`,
    chooseLanguage: '🌐 Выберите язык / Choose language / Ընտրիր լեզու:',
    selectCity: 'Выберите город:',
    yerevan: '🌆 Ереван',
    echmiadzin: '✝️ Эчмиадзин',
    back: '◀️ Назад',
    menu: '🍽 Меню',
    bonus: '⭐ Бонусы',
    referral: '👥 Рефералы',
    myOrders: '📋 Мои заказы',
    changeCity: '📍 Сменить город',
    partners: '🏢 Партнеры',
    cart: '🛒 Корзина',
    myStats: '📊 Моя статистика',
    changeLanguage: '🌐 Сменить язык',
    emptyMenu: '📭 Меню пусто. Пожалуйста, подождите обновления.',
    bonusText: (available, frozen) => `<b>⭐ Ваши бонусы</b>\n\n🟢 Доступно: ${available} ֏\n⚫ Заморожено: ${frozen} ֏\n\n🔹 2% сразу, 3% открывается через 6 месяцев`,
    referralText: (link) => `<b>👥 Реферальная программа</b>\n\n🔗 Ваша ссылка:\n<code>${link}</code>\n\n📊 Бонусы:\n• 1% - 1-й уровень\n• 0.5% - 2-й уровень\n• 0.25% - 3-й уровень`,
    referralFriends: (count) => `👥 Ваши приглашенные: ${count}`,
    referralCopyHint: `💡 Чтобы скопировать ссылку, просто нажмите на неё`,
    cityChanged: (city) => `✅ Город изменён: <b>${city}</b>`,
    languageChanged: (lang) => `✅ Язык изменён: ${lang}`,
    noOrders: '📭 Нет заказов',
    ordersTitle: '📋 *Ваши последние заказы*',
    orderStatusPending: 'ожидает',
    orderStatusConfirmed: 'подтверждён',
    orderStatusRejected: 'отклонён',
    orderStatusCompleted: 'завершён',
    categoriesTitle: '📂 *Выберите категорию:*',
    categoryEmpty: '📭 В этой категории нет блюд',
    selectItem: 'Выберите блюдо:',
    backToCategories: '◀️ Вернуться к категориям',
    backToMain: '🔙 Вернуться в главное меню',
    itemAdded: (name) => `✅ ${name} добавлен`,
    cartEmpty: '🛒 Корзина пуста',
    cartTitle: '🛒 *Ваша корзина*',
    cartTotal: '💰 *Итого:*',
    cartBonusHint: (max) => `⭐ *Можете использовать до:* ${max} бонусов`,
    checkoutConfirm: '✅ Оформить заказ',
    clearCart: '🗑 Очистить корзину',
    cancelOrder: '❌ Отменить заказ',
    orderCancelled: '❌ Заказ отменён:',
    noBonus: (total) => `Сумма заказа: ${total} ֏\nУ вас нет бонусов:\nУкажите адрес доставки (или напишите "самовывоз"):`,
    askBonus: (total, max) => `Сумма заказа: ${total} ֏\nМожете использовать до ${max} бонусов:\nСколько бонусов хотите использовать (0-${max}):`,
    askAddress: 'Укажите адрес доставки (или напишите "самовывоз"):',
    askPhone: '📱 Пожалуйста, напишите ваш номер телефона в формате +374XXXXXXXX\nПример: +374XXXXXXXX',
    invalidPhone: '❌ Неверный формат: Пожалуйста, напишите номер в формате +374XXXXXXXX\nПример: +374XXXXXXXX',
    orderSent: (id, paid) => `✅ Заказ отправлен на подтверждение №${id}\n💸 Оплачено: ${paid} ֏\n⏳ Ожидайте подтверждения администратора`,
    statsTitle: '📊 *СТАТИСТИКА*',
    statsEarnedImmediate: (amount) => `✅ Получено бонусов (2% сразу): ${amount} ֏`,
    statsEarnedFrozen: (amount) => `⏳ Получено бонусов (заморожено 6 месяцев): ${amount} ֏`,
    statsSpent: (amount) => `💸 Потрачено бонусов: ${amount} ֏`,
    statsBalance: (amount) => `⭐ Текущий баланс: ${amount} ֏`,
    statsByPartners: '🏢 *ПО ПАРТНЕРАМ*',
    statsNoPartners: '🏢 Бонусов от партнеров пока нет',
    partnersTitle: '🏢 *НАШИ ПАРТНЕРЫ*',
    partnersBonus: (percent) => `💰 Бонус: ${percent}%`,
    noPartners: '📭 Партнеров пока нет',
    adminOnly: '⛔ Доступ запрещён',
    invalidNumber: (min, max) => `Неверное число: Напишите от 0 до ${max}`,
    cartItem: (name, qty, subtotal) => `${name} x${qty} — ${subtotal} ֏`,
    statistics: '📊 Статистика',
    users: '👥 Пользователи',
    orders: '📦 Заказы',
    menuManagement: '🍽 Меню',
    partnersManagement: '🏢 Партнеры',
    backToAdmin: '🔙 Назад',
    adminPanel: '🔐 Admin Panel - Выберите действие:',
    selectLanguage: '🌐 Выберите язык / Choose language / Ընտրիր լեզու:',
  },
  en: {
    welcome: `🦜 Welcome to TuTak!

TuTak is a loyalty program built around food.
Order from us and partners, accumulate bonuses,
invite friends, and spend bonuses on future orders.

Everything is transparent. Everything is fair.

⭐ How your bonuses work:

🟢 2% from each order — available immediately
⚫ 3% from each order — unlocked after 6 months of active purchases
💳 You can pay up to 30% of the order amount with bonuses
🚫 Bonuses cannot be cashed out — only spent within the system

👥 Invite friends — earn more!

🎁 Starter bonus:
Both made an order over 10,000 AMD?
Each gets +1,000 bonuses!

📊 From each order of your friends you get:
• Friend (level 1) — 1% of their order
• Friend's friend (level 2) — 0.5%
• Next level (level 3) — 0.25%

Example: a friend ordered for 10,000 AMD
→ you automatically get 100 bonuses!

The more active friends — the more bonuses! 🚀`,
    chooseLanguage: '🌐 Choose language / Выбери язык / Ընտրիր լեզու:',
    selectCity: 'Choose city:',
    yerevan: '🌆 Yerevan',
    echmiadzin: '✝️ Echmiadzin',
    back: '◀️ Back',
    menu: '🍽 Menu',
    bonus: '⭐ Bonuses',
    referral: '👥 Referral',
    myOrders: '📋 My orders',
    changeCity: '📍 Change city',
    partners: '🏢 Partners',
    cart: '🛒 Cart',
    myStats: '📊 My statistics',
    changeLanguage: '🌐 Change language',
    emptyMenu: '📭 Menu is empty. Please wait for update.',
    bonusText: (available, frozen) => `<b>⭐ Your bonuses</b>\n\n🟢 Available: ${available} AMD\n⚫ Frozen: ${frozen} AMD\n\n🔹 2% immediately, 3% unlocks after 6 months`,
    referralText: (link) => `<b>👥 Referral program</b>\n\n🔗 Your link:\n<code>${link}</code>\n\n📊 Bonuses:\n• 1% - 1st level\n• 0.5% - 2nd level\n• 0.25% - 3rd level`,
    referralFriends: (count) => `👥 Your invited friends: ${count}`,
    referralCopyHint: `💡 To copy the link, just click on it`,
    cityChanged: (city) => `✅ City changed: <b>${city}</b>`,
    languageChanged: (lang) => `✅ Language changed: ${lang}`,
    noOrders: '📭 No orders yet',
    ordersTitle: '📋 *Your recent orders*',
    orderStatusPending: 'pending',
    orderStatusConfirmed: 'confirmed',
    orderStatusRejected: 'rejected',
    orderStatusCompleted: 'completed',
    categoriesTitle: '📂 *Select category:*',
    categoryEmpty: '📭 No items in this category',
    selectItem: 'Select item:',
    backToCategories: '◀️ Back to categories',
    backToMain: '🔙 Back to main menu',
    itemAdded: (name) => `✅ ${name} added`,
    cartEmpty: '🛒 Cart is empty',
    cartTitle: '🛒 *Your cart*',
    cartTotal: '💰 *Total:*',
    cartBonusHint: (max) => `⭐ *You can use up to:* ${max} bonus`,
    checkoutConfirm: '✅ Checkout',
    clearCart: '🗑 Clear cart',
    cancelOrder: '❌ Cancel order',
    orderCancelled: '❌ Order cancelled:',
    noBonus: (total) => `Order total: ${total} AMD\nYou have no bonuses:\nEnter delivery address (or write "pickup"):`,
    askBonus: (total, max) => `Order total: ${total} AMD\nYou can use up to ${max} bonuses:\nHow many bonuses do you want to use (0-${max}):`,
    askAddress: 'Enter delivery address (or write "pickup"):',
    askPhone: '📱 Please enter your phone number in +374 format\nExample: +374XXXXXXXX',
    invalidPhone: '❌ Invalid format: Please enter phone number in +374XXXXXXXX format\nExample: +374XXXXXXXX',
    orderSent: (id, paid) => `✅ Order sent for confirmation №${id}\n💸 Paid: ${paid} AMD\n⏳ Wait for admin confirmation`,
    statsTitle: '📊 *STATISTICS*',
    statsEarnedImmediate: (amount) => `✅ Bonuses earned (2% immediately): ${amount} AMD`,
    statsEarnedFrozen: (amount) => `⏳ Bonuses earned (frozen 6 months): ${amount} AMD`,
    statsSpent: (amount) => `💸 Bonuses spent: ${amount} AMD`,
    statsBalance: (amount) => `⭐ Current balance: ${amount} AMD`,
    statsByPartners: '🏢 *BY PARTNER*',
    statsNoPartners: '🏢 No partner bonuses yet',
    partnersTitle: '🏢 *OUR PARTNERS*',
    partnersBonus: (percent) => `💰 Bonus: ${percent}%`,
    noPartners: '📭 No partners yet',
    adminOnly: '⛔ Access denied',
    invalidNumber: (min, max) => `Invalid number: Please enter 0 to ${max}`,
    cartItem: (name, qty, subtotal) => `${name} x${qty} — ${subtotal} AMD`,
    statistics: '📊 Statistics',
    users: '👥 Users',
    orders: '📦 Orders',
    menuManagement: '🍽 Menu',
    partnersManagement: '🏢 Partners',
    backToAdmin: '🔙 Back',
    adminPanel: '🔐 Admin Panel - Choose action:',
    selectLanguage: '🌐 Choose language / Выбери язык / Ընտրիր լեզու:',
  },
};

function getTranslation(lang, key, ...args) {
  const t = translations[lang] || translations.hy;
  if (typeof t[key] === 'function') {
    return t[key](...args);
  }
  return t[key] || key;
}

module.exports = { getTranslation };
