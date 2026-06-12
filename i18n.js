const translations = {
  hy: {
    welcome: `🦜 Բարի գալուստ SB Loyalty!

SB Loyalty-ն սննդի շուրջ կառուցված հավատարմության ծրագիր է:
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
    chooseLanguage: 'Ընտրիր լեզուն',
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
    referralText: (link) => `<b>👥 Ռեֆերալային ծրագիր</b>\n\n🔗 Ձեր հղումը:\n<code>${link}</code>\n\n<b>📊 Բոնուսներ:</b>\n• 1% - 1-ին մակարդակ\n• 0.5% - 2-րդ մակարդակ\n• 0.25% - 3-րդ մակարդակ`,
    cityChanged: (city) => `✅ Քաղաքը փոխվեց: <b>${city}</b>`,
    languageChanged: (lang) => `✅ Լեզուն փոխվեց: ${lang}`,
    noOrders: '📭 Դեռ պատվերներ չկան',
  },
  ru: {
    welcome: `🦜 Добро пожаловать в SB Loyalty!

SB Loyalty — это программа лояльности вокруг еды.
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
    chooseLanguage: 'Выберите язык',
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
    referralText: (link) => `<b>👥 Реферальная программа</b>\n\n🔗 Ваша ссылка:\n<code>${link}</code>\n\n<b>📊 Бонусы:</b>\n• 1% - 1-й уровень\n• 0.5% - 2-й уровень\n• 0.25% - 3-й уровень`,
    cityChanged: (city) => `✅ Город изменён: <b>${city}</b>`,
    languageChanged: (lang) => `✅ Язык изменён: ${lang}`,
    noOrders: '📭 Нет заказов',
  },
  en: {
    welcome: `🦜 Welcome to SB Loyalty!

SB Loyalty is a loyalty program built around food.
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
    chooseLanguage: 'Choose language',
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
    referralText: (link) => `<b>👥 Referral program</b>\n\n🔗 Your link:\n<code>${link}</code>\n\n<b>📊 Bonuses:</b>\n• 1% - 1st level\n• 0.5% - 2nd level\n• 0.25% - 3rd level`,
    cityChanged: (city) => `✅ City changed: <b>${city}</b>`,
    languageChanged: (lang) => `✅ Language changed: ${lang}`,
    noOrders: '📭 No orders yet',
  },
  welcomeAll: `🦜 **Բարի գալուստ SB Loyalty! / Добро пожаловать! / Welcome!**

--- Հայերեն ---
SB Loyalty-ն սննդի շուրջ կառուցված հավատարմության ծրագիր է:
Պատվիրիր մեզնից և գործընկերներից, կուտակիր բոնուսներ,
հրավիրիր ընկերներին և ծախսիր բոնուսները հաջորդ պատվերների վրա:

Ամեն ինչ թափանցիկ է: Ամեն ինչ ազնիվ է:

⭐ Ինչպես են աշխատում քո բոնուսները:
🟢 2% յուրաքանչյուր պատվերից — հասանելի են անմիջապես
⚫ 3% յուրաքանչյուր պատվերից — բացվում են 6 ամիս ակտիվ գնումներից հետո
💳 Բոնուսներով կարող ես վճարել պատվերի գումարի մինչև 30%-ը
🚫 Բոնուսները չի կարելի կանխիկացնել — միայն ծախսել համակարգի ներսում

👥 Հրավիրիր ընկերներին — ավելի շատ վաստակիր:
🎁 Սկզբնական բոնուս: երկուսդ էլ 10,000 ֏-ից ավելի պատվեր → +1,000 բոնուս
📊 1% / 0.5% / 0.25% 3 մակարդակ

--- Русский ---
SB Loyalty — это программа лояльности вокруг еды.
Заказывай у нас и партнёров, копи бонусы,
приглашай друзей и трать бонусы на следующие заказы.

Всё прозрачно. Всё честно.

⭐ Как работают твои бонусы:
🟢 2% от каждого заказа — доступны сразу
⚫ 3% от каждого заказа — открываются через 6 месяцев
💳 Бонусами можно оплатить до 30% от суммы заказа
🚫 Бонусы нельзя вывести деньгами

👥 Приглашай друзей — зарабатывай больше!
🎁 Стартовый бонус: оба заказа от 10,000 ֏ → +1,000 бонусов
📊 1% / 0.5% / 0.25%

--- English ---
SB Loyalty is a loyalty program built around food.
Order from us and partners, accumulate bonuses,
invite friends, and spend bonuses on future orders.

Everything is transparent. Everything is fair.

⭐ How your bonuses work:
🟢 2% from each order — available immediately
⚫ 3% from each order — unlocked after 6 months
💳 You can pay up to 30% of the order amount with bonuses
🚫 Bonuses cannot be cashed out

👥 Invite friends — earn more!
🎁 Starter bonus: both order over 10,000 AMD → +1,000 bonuses
📊 1% / 0.5% / 0.25%

👇 **Ընտրիր լեզուն / Выбери язык / Choose language** 👇`,
};

function getTranslation(lang, key, ...args) {
  if (key === 'welcomeAll') {
    return translations.welcomeAll;
  }
  const t = translations[lang] || translations.hy;
  if (typeof t[key] === 'function') {
    return t[key](...args);
  }
  return t[key] || key;
}

module.exports = { getTranslation };
