const translations = {
  hy: {
    welcome: `🦜 Ամեն օր էլեկտրոմեքենա ես լիցքավորում:
Դրա համար բոնուսներ ստացիր Tu Tak-ից:

Լիցքավորիր մեքենան մեր կայաններում,
ավելի քիչ վճարիր և բոնուսներ կուտակիր ամեն լիցքավորումից:

Հետո դրանք ծախսիր ուտելիքի, ապրանքների և ծառայությունների վրա
Tu Tak-ի գործընկերների մոտ:

———————————————

⚡ Լիցքավորվիր շահավետ

🔋 Ցածր գին մեկ կՎտ-ի համար մեր կայաններում
⭐ Բոնուսներ ամեն լիցքավորումից
📍 Կայաններ հարմար վայրերում
💳 Վճարիր լիցքավորումը կուտակած բոնուսներով

Ամեն օր լիցքավորվում ես — ամեն օր կուտակում ես:

———————————————

🛒 Լիցքավորումից բոնուսները գործում են ամենուր

Կուտակել ես լիցքավորումներից — ծախսիր ինչ ուզում ես.
🍽 Սնունդ և ռեստորաններ
🏗 Շինանյութեր — խիճ, ավազ, ցեմենտ
🛍 Խանութներ և ապրանքներ
🚗 Ծառայություններ և վառելիք

Մեկ հաշիվ — բոնուսներ ամեն ինչից:
Գործընկերների ցանկը ամեն ամիս ավելանում է:

———————————————

⭐ Քո բոնուսները

🟢 2% վերադառնում են անմիջապես
⚫ +3% կուտակվում են և բացվում 6 ամսից
💳 Վճարիր բոնուսներով մինչև 30% գնման
🚫 Բոնուսները ծախսվում են համակարգի ներսում

———————————————

👥 Ընկերոջդ բեր — միասին վաստակեք

🎁 Դուք երկուսդ էլ կատարել եք 10,000 ֏-ից ավելի գնում →
   յուրաքանչյուրը +1,000 բոնուս:

Քո ընկերների ամեն գնումից.
• Ընկեր — 1%
• Ընկերոջ ընկեր — 0.5%
• Հաջորդ մակարդակ — 0.25%

Որքան շատ ակտիվ ընկերներ — այնքան ավելի շատ բոնուսներ 🚀
Լիցքավորվիր և կուտակիր 👇`,
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
    referralText: (link) => `<b>👥 Ռեֆերալային ծրագիր</b>\n\n🔗 Ձեր հղումը:\n<code>${link}</code>\n\n📊 Բոնուսներ:\n• 1% - 1-ին մակարդակ\n• 0.5% - 2-րդ մակարդակ\n• 0.25% - 3-րդ մակարդակ\n\n📱 Ձեր անհատական QR կոդը:`,
    referralFriends: (count) => `Ձեր հրավիրածները: ${count}`,
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
    askPhone: '📱 Խնդրում եմ գրեք ձեր հեռախոսահամարը:\n\nՕրինակներ:\n• 099887766 (Հայաստան)\n• +14155552671 (ԱՄՆ)\n• +447911123456 (Մեծ Բրիտանիա)',
    invalidPhone: '❌ Սխալ ձևաչափ: Խնդրում եմ գրեք ճիշտ հեռախոսահամար:\n\nՕրինակներ:\n• 099887766 (Հայաստան)\n• +14155552671 (ԱՄՆ)\n• +447911123456 (Մեծ Բրիտանիա)',
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
    buildingMaterials: '🏗️ Շինանյութ',
    sand: '🏖️ Ավազ',
    gravel: '🪨 Խիճ',
    sand_0_5: 'Ավազ 0-5 — 13,000 ֏',
    sand_0_8: 'Ավազ 0-8 — 9,500 ֏',
    sand_0_10: 'Ավազ 0-10 — 9,000 ֏',
    gravel_0_5: 'Խիճ 0-5 — 7,000 ֏',
    gravel_5_19: 'Խիճ 5-19 — 7,000 ֏',
    gravel_10_15: 'Խիճ 10-15 — 7,000 ֏',
    selectBuildingMaterial: '🏗️ Ընտրեք շինանյութի կատեգորիա:',
    selectSand: '🏖️ Ընտրեք ավազի տեսակը:',
    selectGravel: '🪨 Ընտրեք խիճի տեսակը:',
  },
  ru: {
    welcome: `🦜 Заряжаешь электромобиль каждый день?
Получай за это бонусы с Tu Tak.

Заряжай машину на наших станциях,
плати меньше и копи бонусы за каждую зарядку.

А потом трать их на еду, товары и услуги
у партнёров Tu Tak.

———————————————

⚡ Заряжайся выгодно

🔋 Низкая цена за кВт на наших станциях
⭐ Бонусы за каждую зарядку
📍 Станции в удобных локациях
💳 Оплачивай зарядку накопленными бонусами

Заряжаешься каждый день — копишь каждый день.

———————————————

🛒 Бонусы с зарядки работают везде

Накопил на зарядках — трать на что хочешь:
🍽 Еда и рестораны
🏗 Стройматериалы — щебень, песок, цемент
🛍 Магазины и товары
🚗 Услуги и топливо

Один аккаунт — бонусы со всего.
Список партнёров растёт каждый месяц.

———————————————

⭐ Твои бонусы

🟢 2% возвращаются сразу
⚫ +3% копятся и открываются через 6 месяцев
💳 Оплачивай бонусами до 30% покупки
🚫 Бонусы тратятся внутри системы

———————————————

👥 Приведи друга — заработайте вместе

🎁 Вы оба совершили покупку от 10,000 ֏ →
   каждому +1,000 бонусов.

С каждой покупки твоих друзей:
• Друг — 1%
• Друг друга — 0.5%
• Уровень глубже — 0.25%

Чем больше активных друзей — тем больше бонусов 🚀
Заряжайся и копи 👇`,
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
    referralText: (link) => `<b>👥 Реферальная программа</b>\n\n🔗 Ваша ссылка:\n<code>${link}</code>\n\n📊 Бонусы:\n• 1% - 1-й уровень\n• 0.5% - 2-й уровень\n• 0.25% - 3-й уровень\n\n📱 Ваш персональный QR-код.`,
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
    askPhone: '📱 Пожалуйста, напишите ваш номер телефона:\n\nПримеры:\n• 099887766 (Армения)\n• +14155552671 (США)\n• +447911123456 (Великобритания)',
    invalidPhone: '❌ Неверный формат: Пожалуйста, напишите правильный номер телефона:\n\nПримеры:\n• 099887766 (Армения)\n• +14155552671 (США)\n• +447911123456 (Великобритания)',
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
    buildingMaterials: '🏗️ Стройматериалы',
    sand: '🏖️ Песок',
    gravel: '🪨 Щебень',
    sand_0_5: 'Песок 0-5 — 13,000 ֏',
    sand_0_8: 'Песок 0-8 — 9,500 ֏',
    sand_0_10: 'Песок 0-10 — 9,000 ֏',
    gravel_0_5: 'Щебень 0-5 — 7,000 ֏',
    gravel_5_19: 'Щебень 5-19 — 7,000 ֏',
    gravel_10_15: 'Щебень 10-15 — 7,000 ֏',
    selectBuildingMaterial: '🏗️ Выберите категорию стройматериалов:',
    selectSand: '🏖️ Выберите тип песка:',
    selectGravel: '🪨 Выберите тип щебня:',
  },
  en: {
    welcome: `🦜 Do you charge your EV every day?
Get bonuses with Tu Tak for it.

Charge your car at our stations,
pay less and accumulate bonuses for every charge.

Then spend them on food, goods, and services
from Tu Tak partners.

———————————————

⚡ Charge profitably

🔋 Low price per kWh at our stations
⭐ Bonuses for every charge
📍 Stations in convenient locations
💳 Pay for charging with accumulated bonuses

You charge every day — you accumulate every day.

———————————————

🛒 Bonuses from charging work everywhere

Earned on charging — spend on whatever you want:
🍽 Food and restaurants
🏗 Building materials — crushed stone, sand, cement
🛍 Shops and goods
🚗 Services and fuel

One account — bonuses from everything.
The list of partners grows every month.

———————————————

⭐ Your bonuses

🟢 2% returned immediately
⚫ +3% accumulate and unlock after 6 months
💳 Pay with bonuses up to 30% of the purchase
🚫 Bonuses are spent within the system

———————————————

👥 Bring a friend — earn together

🎁 You both made a purchase over 10,000 AMD →
   each gets +1,000 bonuses.

From every purchase of your friends:
• Friend — 1%
• Friend's friend — 0.5%
• Next level — 0.25%

The more active friends — the more bonuses 🚀
Charge up and accumulate 👇`,
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
    referralText: (link) => `<b>👥 Referral program</b>\n\n🔗 Your link:\n<code>${link}</code>\n\n📊 Bonuses:\n• 1% - 1st level\n• 0.5% - 2nd level\n• 0.25% - 3rd level\n\n📱 Your personal QR code.`,
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
    askPhone: '📱 Please enter your phone number:\n\nExamples:\n• 099887766 (Armenia)\n• +14155552671 (USA)\n• +447911123456 (UK)',
    invalidPhone: '❌ Invalid format: Please enter a valid phone number:\n\nExamples:\n• 099887766 (Armenia)\n• +14155552671 (USA)\n• +447911123456 (UK)',
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
    buildingMaterials: '🏗️ Building Materials',
    sand: '🏖️ Sand',
    gravel: '🪨 Gravel',
    sand_0_5: 'Sand 0-5 — 13,000 AMD',
    sand_0_8: 'Sand 0-8 — 9,500 AMD',
    sand_0_10: 'Sand 0-10 — 9,000 AMD',
    gravel_0_5: 'Gravel 0-5 — 7,000 AMD',
    gravel_5_19: 'Gravel 5-19 — 7,000 AMD',
    gravel_10_15: 'Gravel 10-15 — 7,000 AMD',
    selectBuildingMaterial: '🏗️ Select building material category:',
    selectSand: '🏖️ Select sand type:',
    selectGravel: '🪨 Select gravel type:',
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
