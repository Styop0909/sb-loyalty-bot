require('dotenv').config();
const { db } = require('./src/db');
const { menuItems } = require('./src/db/schema');
const { eq } = require('drizzle-orm');

const menuData = [

  { city: 'yerevan', name: 'Կարմիր լոբով ապուր', nameHy: 'Կարմիր լոբով ապուր', nameRu: 'Суп с красной фасолью', nameEn: 'Red bean soup', price: 600, category: 'Ապուրներ', categoryHy: 'Ապուրներ', categoryRu: 'Супы', categoryEn: 'Soups' },
  { city: 'yerevan', name: 'Կոլոլակով ապուր', nameHy: 'Կոլոլակով ապուր', nameRu: 'Суп с фрикадельками', nameEn: 'Meatball soup', price: 600, category: 'Ապուրներ', categoryHy: 'Ապուրներ', categoryRu: 'Супы', categoryEn: 'Soups' },
  { city: 'yerevan', name: 'Սպաս', nameHy: 'Սպաս', nameRu: 'Спас', nameEn: 'Spas', price: 600, category: 'Ապուրներ', categoryHy: 'Ապուրներ', categoryRu: 'Супы', categoryEn: 'Soups' },
  { city: 'yerevan', name: 'Թուխ ապուր', nameHy: 'Թուխ ապուր', nameRu: 'Тух апур', nameEn: 'Tukh apur', price: 600, category: 'Ապուրներ', categoryHy: 'Ապուրներ', categoryRu: 'Супы', categoryEn: 'Soups' },
  { city: 'yerevan', name: 'Բանջարեղենով ապուր', nameHy: 'Բանջարեղենով ապուր', nameRu: 'Овощной суп', nameEn: 'Vegetable soup', price: 600, category: 'Ապուրներ', categoryHy: 'Ապուրներ', categoryRu: 'Супы', categoryEn: 'Soups' },
  { city: 'yerevan', name: 'Կարտոֆիլով ապուր', nameHy: 'Կարտոֆիլով ապուր', nameRu: 'Картофельный суп', nameEn: 'Potato soup', price: 600, category: 'Ապուրներ', categoryHy: 'Ապուրներ', categoryRu: 'Супы', categoryEn: 'Soups' },
  { city: 'yerevan', name: 'Սնկով ապուր', nameHy: 'Սնկով ապուր', nameRu: 'Грибной суп', nameEn: 'Mushroom soup', price: 600, category: 'Ապուրներ', categoryHy: 'Ապուրներ', categoryRu: 'Супы', categoryEn: 'Soups' },
  { city: 'yerevan', name: 'Կաթնապուր', nameHy: 'Կաթնապուր', nameRu: 'Молочный суп', nameEn: 'Milk soup', price: 600, category: 'Ապուրներ', categoryHy: 'Ապուրներ', categoryRu: 'Супы', categoryEn: 'Soups' },

  { city: 'yerevan', name: 'Շիշ տավուկ', nameHy: 'Շիշ տավուկ', nameRu: 'Шиш тавук', nameEn: 'Shish tavuk', price: 1300, category: 'Հիմնական ուտեստներ', categoryHy: 'Հիմնական ուտեստներ', categoryRu: 'Основные блюда', categoryEn: 'Main dishes' },
  { city: 'yerevan', name: 'Չախոխբիլի', nameHy: 'Չախոխբիլի', nameRu: 'Чахохбили', nameEn: 'Chakhokhbili', price: 1300, category: 'Հիմնական ուտեստներ', categoryHy: 'Հիմնական ուտեստներ', categoryRu: 'Основные блюда', categoryEn: 'Main dishes' },
  { city: 'yerevan', name: 'Կոտլետ', nameHy: 'Կոտլետ', nameRu: 'Котлета', nameEn: 'Cutlet', price: 1300, category: 'Հիմնական ուտեստներ', categoryHy: 'Հիմնական ուտեստներ', categoryRu: 'Основные блюда', categoryEn: 'Main dishes' },
  { city: 'yerevan', name: 'Տոլմա', nameHy: 'Տոլմա', nameRu: 'Толма', nameEn: 'Tolma', price: 1500, category: 'Հիմնական ուտեստներ', categoryHy: 'Հիմնական ուտեստներ', categoryRu: 'Основные блюда', categoryEn: 'Main dishes' },
  { city: 'yerevan', name: 'Սաջո', nameHy: 'Սաջո', nameRu: 'Саджо', nameEn: 'Sajo', price: 1500, category: 'Հիմնական ուտեստներ', categoryHy: 'Հիմնական ուտեստներ', categoryRu: 'Основные блюда', categoryEn: 'Main dishes' },
  { city: 'yerevan', name: 'Կարմի խորոված', nameHy: 'Կարմի խորոված', nameRu: 'Карми хоровац', nameEn: 'Karmi horovats', price: 1500, category: 'Հիմնական ուտեստներ', categoryHy: 'Հիմնական ուտեստներ', categoryRu: 'Основные блюда', categoryEn: 'Main dishes' },
  { city: 'yerevan', name: 'Կաթնով լոբի', nameHy: 'Կաթնով լոբի', nameRu: 'Фасоль с молоком', nameEn: 'Beans with milk', price: 1000, category: 'Հիմնական ուտեստներ', categoryHy: 'Հիմնական ուտեստներ', categoryRu: 'Основные блюда', categoryEn: 'Main dishes' },
  { city: 'yerevan', name: 'Տապակած կարտոֆիլ', nameHy: 'Տապակած կարտոֆիլ', nameRu: 'Жареный картофель', nameEn: 'Fried potatoes', price: 800, category: 'Հիմնական ուտեստներ', categoryHy: 'Հիմնական ուտեստներ', categoryRu: 'Основные блюда', categoryEn: 'Main dishes' },
  { city: 'yerevan', name: 'Բրինձ', nameHy: 'Բրինձ', nameRu: 'Рис', nameEn: 'Rice', price: 600, category: 'Հիմնական ուտեստներ', categoryHy: 'Հիմնական ուտեստներ', categoryRu: 'Основные блюда', categoryEn: 'Main dishes' },
  { city: 'yerevan', name: 'Կարտոֆիլի պյուրե', nameHy: 'Կարտոֆիլի պյուրե', nameRu: 'Картофельное пюре', nameEn: 'Mashed potatoes', price: 700, category: 'Հիմնական ուտեստներ', categoryHy: 'Հիմնական ուտեստներ', categoryRu: 'Основные блюда', categoryEn: 'Main dishes' },
  { city: 'yerevan', name: 'Կարագով բրինձ', nameHy: 'Կարագով բրինձ', nameRu: 'Рис с маслом', nameEn: 'Rice with butter', price: 700, category: 'Հիմնական ուտեստներ', categoryHy: 'Հիմնական ուտեստներ', categoryRu: 'Основные блюда', categoryEn: 'Main dishes' },

  { city: 'yerevan', name: 'Թաբուլե', nameHy: 'Թաբուլե', nameRu: 'Табуле', nameEn: 'Tabouleh', price: 1000, category: 'Աղցաններ', categoryHy: 'Աղցաններ', categoryRu: 'Салаты', categoryEn: 'Salads' },
  { city: 'yerevan', name: 'Ստոլիչնի', nameHy: 'Ստոլիչնի', nameRu: 'Столичный', nameEn: 'Stolichny', price: 1000, category: 'Աղցաններ', categoryHy: 'Աղցաններ', categoryRu: 'Салаты', categoryEn: 'Salads' },
  { city: 'yerevan', name: 'Կորեական աղցան', nameHy: 'Կորեական աղցան', nameRu: 'Корейский салат', nameEn: 'Korean salad', price: 1000, category: 'Աղցաններ', categoryHy: 'Աղցաններ', categoryRu: 'Салаты', categoryEn: 'Salads' },
  { city: 'yerevan', name: 'Վիտամին', nameHy: 'Վիտամին', nameRu: 'Витаминный', nameEn: 'Vitamin', price: 800, category: 'Աղցաններ', categoryHy: 'Աղցաններ', categoryRu: 'Салаты', categoryEn: 'Salads' },
  { city: 'yerevan', name: 'Ձողիկներ', nameHy: 'Ձողիկներ', nameRu: 'Палочки', nameEn: 'Sticks', price: 1000, category: 'Աղցաններ', categoryHy: 'Աղցաններ', categoryRu: 'Салаты', categoryEn: 'Salads' },
  { city: 'yerevan', name: 'Գազարով աղցան', nameHy: 'Գազարով աղցան', nameRu: 'Морковный салат', nameEn: 'Carrot salad', price: 600, category: 'Աղցաններ', categoryHy: 'Աղցաններ', categoryRu: 'Салаты', categoryEn: 'Salads' },
  { city: 'yerevan', name: 'Ճակնդեղով աղցան', nameHy: 'Ճակնդեղով աղցան', nameRu: 'Свекольный салат', nameEn: 'Beet salad', price: 600, category: 'Աղցաններ', categoryHy: 'Աղցաններ', categoryRu: 'Салаты', categoryEn: 'Salads' },

  { city: 'yerevan', name: 'Ձվածեղ', nameHy: 'Ձվածեղ', nameRu: 'Омлет', nameEn: 'Omelette', price: 600, category: 'Ձվով ուտեստներ', categoryHy: 'Ձվով ուտեստներ', categoryRu: 'Яичные блюда', categoryEn: 'Egg dishes' },
  { city: 'yerevan', name: 'Հում ձվով', nameHy: 'Հում ձվով', nameRu: 'Яичница', nameEn: 'Fried eggs', price: 600, category: 'Ձվով ուտեստներ', categoryHy: 'Ձվով ուտեստներ', categoryRu: 'Яичные блюда', categoryEn: 'Egg dishes' },
  { city: 'yerevan', name: 'Խառնած ձու', nameHy: 'Խառնած ձու', nameRu: 'Болтунья', nameEn: 'Scrambled eggs', price: 600, category: 'Ձվով ուտեստներ', categoryHy: 'Ձվով ուտեստներ', categoryRu: 'Яичные блюда', categoryEn: 'Egg dishes' },
  { city: 'yerevan', name: 'Բողկով ձու', nameHy: 'Բողկով ձու', nameRu: 'Яйца с редиской', nameEn: 'Eggs with radish', price: 700, category: 'Ձվով ուտեստներ', categoryHy: 'Ձվով ուտեստներ', categoryRu: 'Яичные блюда', categoryEn: 'Egg dishes' },
  { city: 'yerevan', name: 'Կանաչիով ձու', nameHy: 'Կանաչիով ձու', nameRu: 'Яйца с зеленью', nameEn: 'Eggs with herbs', price: 700, category: 'Ձվով ուտեստներ', categoryHy: 'Ձվով ուտեստներ', categoryRu: 'Яичные блюда', categoryEn: 'Egg dishes' },
  { city: 'yerevan', name: 'Պանիրով ձու', nameHy: 'Պանիրով ձու', nameRu: 'Яйца с сыром', nameEn: 'Eggs with cheese', price: 800, category: 'Ձվով ուտեստներ', categoryHy: 'Ձվով ուտեստներ', categoryRu: 'Яичные блюда', categoryEn: 'Egg dishes' },

  { city: 'yerevan', name: 'Պիցցա', nameHy: 'Պիցցա', nameRu: 'Пицца', nameEn: 'Pizza', price: 1150, category: 'Արագ սնունդ', categoryHy: 'Արագ սնունդ', categoryRu: 'Быстрая еда', categoryEn: 'Fast food' },
  { city: 'yerevan', name: 'Բուրգեր', nameHy: 'Բուրգեր', nameRu: 'Бургер', nameEn: 'Burger', price: 1150, category: 'Արագ սնունդ', categoryHy: 'Արագ սնունդ', categoryRu: 'Быстрая еда', categoryEn: 'Fast food' },
  { city: 'yerevan', name: 'Սենդվիչ', nameHy: 'Սենդվիչ', nameRu: 'Сэндвич', nameEn: 'Sandwich', price: 1000, category: 'Արագ սնունդ', categoryHy: 'Արագ սնունդ', categoryRu: 'Быстрая еда', categoryEn: 'Fast food' },
  { city: 'yerevan', name: 'Լոշիկ', nameHy: 'Լոշիկ', nameRu: 'Лошик', nameEn: 'Loshik', price: 300, category: 'Արագ սնունդ', categoryHy: 'Արագ սնունդ', categoryRu: 'Быстрая еда', categoryEn: 'Fast food' },
  { city: 'yerevan', name: 'Հոթ դոգ', nameHy: 'Հոթ դոգ', nameRu: 'Хот дог', nameEn: 'Hot dog', price: 600, category: 'Արագ սնունդ', categoryHy: 'Արագ սնունդ', categoryRu: 'Быстрая еда', categoryEn: 'Fast food' },

  { city: 'yerevan', name: 'Լավաշ', nameHy: 'Լավաշ', nameRu: 'Лаваш', nameEn: 'Lavash', price: 250, category: 'Հաց', categoryHy: 'Հաց', categoryRu: 'Хлеб', categoryEn: 'Bread' },
  { city: 'yerevan', name: 'Սպիտակ հաց', nameHy: 'Սպիտակ հաց', nameRu: 'Белый хлеб', nameEn: 'White bread', price: 250, category: 'Հաց', categoryHy: 'Հաց', categoryRu: 'Хлеб', categoryEn: 'Bread' },
  { city: 'yerevan', name: 'Թոնրի հաց', nameHy: 'Թոնրի հաց', nameRu: 'Тонри хац', nameEn: 'Tonri hats', price: 300, category: 'Հաց', categoryHy: 'Հաց', categoryRu: 'Хлеб', categoryEn: 'Bread' },
  { city: 'yerevan', name: 'Մատնաքաշ', nameHy: 'Մատնաքաշ', nameRu: 'Матнакаш', nameEn: 'Matnakash', price: 300, category: 'Հաց', categoryHy: 'Հաց', categoryRu: 'Хлеб', categoryEn: 'Bread' },

  { city: 'yerevan', name: 'Խմորեղեն', nameHy: 'Խմորեղեն', nameRu: 'Выпечка', nameEn: 'Pastry', price: 500, category: 'Հաց', categoryHy: 'Հաց', categoryRu: 'Хлеб', categoryEn: 'Bread' },
  { city: 'yerevan', name: 'Կարկանդակ', nameHy: 'Կարկանդակ', nameRu: 'Пирожок', nameEn: 'Pie', price: 500, category: 'Հաց', categoryHy: 'Հաց', categoryRu: 'Хлеб', categoryEn: 'Bread' },
  { city: 'yerevan', name: 'Բլիթ', nameHy: 'Բլիթ', nameRu: 'Блинчик', nameEn: 'Pancake', price: 500, category: 'Հաց', categoryHy: 'Հաց', categoryRu: 'Хлеб', categoryEn: 'Bread' },

  { city: 'yerevan', name: 'Մածուն', nameHy: 'Մածուն', nameRu: 'Мацун', nameEn: 'Matzoon', price: 500, category: 'Կաթնային ըմպելիքներ', categoryHy: 'Կաթնային ըմպելիքներ', categoryRu: 'Молочные напитки', categoryEn: 'Dairy drinks' },
  { city: 'yerevan', name: 'Թան', nameHy: 'Թան', nameRu: 'Тан', nameEn: 'Tan', price: 500, category: 'Կաթնային ըմպելիքներ', categoryHy: 'Կաթնային ըմպելիքներ', categoryRu: 'Молочные напитки', categoryEn: 'Dairy drinks' },
  { city: 'yerevan', name: 'Կեֆիր', nameHy: 'Կեֆիր', nameRu: 'Кефир', nameEn: 'Kefir', price: 500, category: 'Կաթնային ըմպելիքներ', categoryHy: 'Կաթնային ըմպելիքներ', categoryRu: 'Молочные напитки', categoryEn: 'Dairy drinks' },
  { city: 'yerevan', name: 'Ռյաժենկա', nameHy: 'Ռյաժենկա', nameRu: 'Ряженка', nameEn: 'Ryazhenka', price: 500, category: 'Կաթնային ըմպելիքներ', categoryHy: 'Կաթնային ըմպելիքներ', categoryRu: 'Молочные напитки', categoryEn: 'Dairy drinks' },

  { city: 'yerevan', name: 'Սուրճ 3in1', nameHy: 'Սուրճ 3in1', nameRu: 'Кофе 3в1', nameEn: 'Coffee 3in1', price: 600, category: 'Տաք ըմպելիքներ', categoryHy: 'Տաք ըմպելիքներ', categoryRu: 'Горячие напитки', categoryEn: 'Hot drinks' },
  { city: 'yerevan', name: 'Թուրքական սուրճ', nameHy: 'Թուրքական սուրճ', nameRu: 'Турецкий кофе', nameEn: 'Turkish coffee', price: 600, category: 'Տաք ըմպելիքներ', categoryHy: 'Տաք ըմպելիքներ', categoryRu: 'Горячие напитки', categoryEn: 'Hot drinks' },
  { city: 'yerevan', name: 'Ամերիկանո', nameHy: 'Ամերիկանո', nameRu: 'Американо', nameEn: 'Americano', price: 600, category: 'Տաք ըմպելիքներ', categoryHy: 'Տաք ըմպելիքներ', categoryRu: 'Горячие напитки', categoryEn: 'Hot drinks' },
  { city: 'yerevan', name: 'Կապուչինո', nameHy: 'Կապուչինո', nameRu: 'Капучино', nameEn: 'Cappuccino', price: 800, category: 'Տաք ըմպելիքներ', categoryHy: 'Տաք ըմպելիքներ', categoryRu: 'Горячие напитки', categoryEn: 'Hot drinks' },
  { city: 'yerevan', name: 'Լատտե', nameHy: 'Լատտե', nameRu: 'Латте', nameEn: 'Latte', price: 800, category: 'Տաք ըմպելիքներ', categoryHy: 'Տաք ըմպելիքներ', categoryRu: 'Горячие напитки', categoryEn: 'Hot drinks' },
  { city: 'yerevan', name: 'Կակաո', nameHy: 'Կակաո', nameRu: 'Какао', nameEn: 'Cocoa', price: 600, category: 'Տաք ըմպելիքներ', categoryHy: 'Տաք ըմպելիքներ', categoryRu: 'Горячие напитки', categoryEn: 'Hot drinks' },
  { city: 'yerevan', name: 'Թեյ', nameHy: 'Թեյ', nameRu: 'Чай', nameEn: 'Tea', price: 300, category: 'Տաք ըմպելիքներ', categoryHy: 'Տաք ըմպելիքներ', categoryRu: 'Горячие напитки', categoryEn: 'Hot drinks' },

  { city: 'yerevan', name: 'Կոկա-կոլա 0.5', nameHy: 'Կոկա-կոլա 0.5', nameRu: 'Кока-кола 0.5', nameEn: 'Coca-Cola 0.5', price: 600, category: 'Գազավորված ըմպելիքներ', categoryHy: 'Գազավորված ըմպելիքներ', categoryRu: 'Газированные напитки', categoryEn: 'Carbonated drinks' },
  { city: 'yerevan', name: 'Ֆանտա 0.5', nameHy: 'Ֆանտա 0.5', nameRu: 'Фанта 0.5', nameEn: 'Fanta 0.5', price: 600, category: 'Գազավորված ըմպելիքներ', categoryHy: 'Գազավորված ըմպելիքներ', categoryRu: 'Газированные напитки', categoryEn: 'Carbonated drinks' },
  { city: 'yerevan', name: 'Սպրայթ 0.5', nameHy: 'Սպրայթ 0.5', nameRu: 'Спрайт 0.5', nameEn: 'Sprite 0.5', price: 600, category: 'Գազավորված ըմպելիքներ', categoryHy: 'Գազավորված ըմպելիքներ', categoryRu: 'Газированные напитки', categoryEn: 'Carbonated drinks' },
  { city: 'yerevan', name: 'Պեպսի 0.5', nameHy: 'Պեպսի 0.5', nameRu: 'Пепси 0.5', nameEn: 'Pepsi 0.5', price: 600, category: 'Գազավորված ըմպելիքներ', categoryHy: 'Գազավորված ըմպելիքներ', categoryRu: 'Газированные напитки', categoryEn: 'Carbonated drinks' },
  { city: 'yerevan', name: 'Կոկա-կոլա 1.0', nameHy: 'Կոկա-կոլա 1.0', nameRu: 'Кока-кола 1.0', nameEn: 'Coca-Cola 1.0', price: 900, category: 'Գազավորված ըմպելիքներ', categoryHy: 'Գազավորված ըմպելիքներ', categoryRu: 'Газированные напитки', categoryEn: 'Carbonated drinks' },
  { city: 'yerevan', name: 'Սոդա', nameHy: 'Սոդա', nameRu: 'Сода', nameEn: 'Soda', price: 250, category: 'Գազավորված ըմպելիքներ', categoryHy: 'Գազավորված ըմպելիքներ', categoryRu: 'Газированные напитки', categoryEn: 'Carbonated drinks' },

  { city: 'yerevan', name: 'Խնձորի հյութ', nameHy: 'Խնձորի հյութ', nameRu: 'Яблочный сок', nameEn: 'Apple juice', price: 700, category: 'Հյութեր և կոմպոտներ', categoryHy: 'Հյութեր և կոմպոտներ', categoryRu: 'Соки и компоты', categoryEn: 'Juices and compotes' },
  { city: 'yerevan', name: 'Նռան հյութ', nameHy: 'Նռան հյութ', nameRu: 'Гранатовый сок', nameEn: 'Pomegranate juice', price: 800, category: 'Հյութեր և կոմպոտներ', categoryHy: 'Հյութեր և կոմպոտներ', categoryRu: 'Соки и компоты', categoryEn: 'Juices and compotes' },
  { city: 'yerevan', name: 'Դեղձի հյութ', nameHy: 'Դեղձի հյութ', nameRu: 'Персиковый сок', nameEn: 'Peach juice', price: 700, category: 'Հյութեր և կոմպոտներ', categoryHy: 'Հյութեր և կոմպոտներ', categoryRu: 'Соки и компоты', categoryEn: 'Juices and compotes' },
  { city: 'yerevan', name: 'Կոմպոտ', nameHy: 'Կոմպոտ', nameRu: 'Компот', nameEn: 'Compote', price: 600, category: 'Հյութեր և կոմպոտներ', categoryHy: 'Հյութեր և կոմպոտներ', categoryRu: 'Соки и компоты', categoryEn: 'Juices and compotes' },

  { city: 'yerevan', name: 'Ջուր 0.5', nameHy: 'Ջուր 0.5', nameRu: 'Вода 0.5', nameEn: 'Water 0.5', price: 250, category: 'Ջուր', categoryHy: 'Ջուր', categoryRu: 'Вода', categoryEn: 'Water' },
  { city: 'yerevan', name: 'Ջուր 1.0', nameHy: 'Ջուր 1.0', nameRu: 'Вода 1.0', nameEn: 'Water 1.0', price: 400, category: 'Ջուր', categoryHy: 'Ջուր', categoryRu: 'Вода', categoryEn: 'Water' },
  { city: 'yerevan', name: 'Գազավորված ջուր', nameHy: 'Գազավորված ջուր', nameRu: 'Газированная вода', nameEn: 'Sparkling water', price: 300, category: 'Ջուր', categoryHy: 'Ջուր', categoryRu: 'Вода', categoryEn: 'Water' },

  { city: 'yerevan', name: 'Հավի բոքս', nameHy: 'Հավի բոքս', nameRu: 'Куриный бокс', nameEn: 'Chicken box', price: 2900, category: 'Բոքսեր', categoryHy: 'Բոքսեր', categoryRu: 'Боксы', categoryEn: 'Boxes' },
  { city: 'yerevan', name: 'Խոզի բոքս', nameHy: 'Խոզի բոքս', nameRu: 'Свиной бокс', nameEn: 'Pork box', price: 3100, category: 'Բոքսեր', categoryHy: 'Բոքսեր', categoryRu: 'Боксы', categoryEn: 'Boxes' },
  { city: 'yerevan', name: 'Տավարի բոքս', nameHy: 'Տավարի բոքս', nameRu: 'Говяжий бокс', nameEn: 'Beef box', price: 3400, category: 'Բոքսեր', categoryHy: 'Բոքսեր', categoryRu: 'Боксы', categoryEn: 'Boxes' },
  { city: 'yerevan', name: 'Ուժեղ հավ 160գ', nameHy: 'Ուժեղ հավ 160գ', nameRu: 'Сильная курица 160г', nameEn: 'Strong chicken 160g', price: 3400, category: 'Strong', categoryHy: 'Strong', categoryRu: 'Strong', categoryEn: 'Strong' },
  { city: 'yerevan', name: 'Ուժեղ խոզ 160գ', nameHy: 'Ուժեղ խոզ 160գ', nameRu: 'Сильная свинина 160г', nameEn: 'Strong pork 160g', price: 3700, category: 'Strong', categoryHy: 'Strong', categoryRu: 'Strong', categoryEn: 'Strong' },
  { city: 'yerevan', name: 'Ուժեղ տավար 160գ', nameHy: 'Ուժեղ տավար 160գ', nameRu: 'Сильная говядина 160г', nameEn: 'Strong beef 160g', price: 4000, category: 'Strong', categoryHy: 'Strong', categoryRu: 'Strong', categoryEn: 'Strong' },
  { city: 'yerevan', name: 'Ընտանեկան S (3 բոքս)', nameHy: 'Ընտանեկան S (3 բոքս)', nameRu: 'Семейный S (3 бокса)', nameEn: 'Family S (3 boxes)', price: 8500, category: 'Ընտանեկան', categoryHy: 'Ընտանեկան', categoryRu: 'Семейные', categoryEn: 'Family' },
  { city: 'yerevan', name: 'Ընտանեկան M (5 բոքս)', nameHy: 'Ընտանեկան M (5 բոքս)', nameRu: 'Семейный M (5 боксов)', nameEn: 'Family M (5 boxes)', price: 14000, category: 'Ընտանեկան', categoryHy: 'Ընտանեկան', categoryRu: 'Семейные', categoryEn: 'Family' },
  { city: 'yerevan', name: 'Ընտանեկան L (8 բոքս)', nameHy: 'Ընտանեկան L (8 բոքս)', nameRu: 'Семейный L (8 боксов)', nameEn: 'Family L (8 boxes)', price: 21500, category: 'Ընտանեկան', categoryHy: 'Ընտանեկան', categoryRu: 'Семейные', categoryEn: 'Family' },

  { city: 'echmiadzin', name: 'Տավարի քաբաբ', nameHy: 'Տավարի քաբաբ', nameRu: 'Говяжий кабаб', nameEn: 'Beef kebab', price: 1300, category: 'Քաբաբ', categoryHy: 'Քաբաբ', categoryRu: 'Кабаб', categoryEn: 'Kebab' },
  { city: 'echmiadzin', name: 'Հավի քաբաբ', nameHy: 'Հավի քաբաբ', nameRu: 'Куриный кабаб', nameEn: 'Chicken kebab', price: 1040, category: 'Քաբաբ', categoryHy: 'Քաբաբ', categoryRu: 'Кабаб', categoryEn: 'Kebab' },
  { city: 'echmiadzin', name: 'Գառան քաբաբ', nameHy: 'Գառան քաբաբ', nameRu: 'Бараний кабаб', nameEn: 'Lamb kebab', price: 1950, category: 'Քաբաբ', categoryHy: 'Քաբաբ', categoryRu: 'Кабаб', categoryEn: 'Kebab' },
  { city: 'echmiadzin', name: 'Հավի թևիկներ', nameHy: 'Հավի թևիկներ', nameRu: 'Куриные крылышки', nameEn: 'Chicken wings', price: 1560, category: 'Հավ', categoryHy: 'Հավ', categoryRu: 'Курица', categoryEn: 'Chicken' },
  { city: 'echmiadzin', name: 'Մանդալու ճաշ', nameHy: 'Մանդալու ճաշ', nameRu: 'Мандалу джаш', nameEn: 'Mandalu jash', price: 1560, category: 'Հիմնական', categoryHy: 'Հիմնական', categoryRu: 'Основное', categoryEn: 'Main' },
  { city: 'echmiadzin', name: 'Կարտոֆիլի փլավ', nameHy: 'Կարտոֆիլի փլավ', nameRu: 'Картофельный плов', nameEn: 'Potato pilaf', price: 650, category: 'Կողմնակի', categoryHy: 'Կողմնակի', categoryRu: 'Гарниры', categoryEn: 'Side dishes' },
  { city: 'echmiadzin', name: 'Բանջարեղենի խորոված', nameHy: 'Բանջարեղենի խորոված', nameRu: 'Овощной хоровац', nameEn: 'Vegetable horovats', price: 1040, category: 'Խորոված', categoryHy: 'Խորոված', categoryRu: 'Хоровац', categoryEn: 'Horovats' },
  { city: 'echmiadzin', name: 'Տավարի խորոված 1կգ', nameHy: 'Տավարի խորոված 1կգ', nameRu: 'Говяжий хоровац 1кг', nameEn: 'Beef horovats 1kg', price: 6500, category: 'Խորոված', categoryHy: 'Խորոված', categoryRu: 'Хоровац', categoryEn: 'Horovats' },
  { city: 'echmiadzin', name: 'Խոզի խորոված 1կգ', nameHy: 'Խոզի խորոված 1կգ', nameRu: 'Свиной хоровац 1кг', nameEn: 'Pork horovats 1kg', price: 5000, category: 'Խորոված', categoryHy: 'Խորոված', categoryRu: 'Хоровац', categoryEn: 'Horovats' },
  { city: 'echmiadzin', name: 'Հավի խորոված 1կգ', nameHy: 'Հավի խորոված 1կգ', nameRu: 'Куриный хоровац 1кг', nameEn: 'Chicken horovats 1kg', price: 3000, category: 'Խորոված', categoryHy: 'Խորոված', categoryRu: 'Хоровац', categoryEn: 'Horovats' },
  { city: 'echmiadzin', name: 'Իշխանի խորոված 1կգ', nameHy: 'Իշխանի խորոված 1կգ', nameRu: 'Хоровац из форели 1кг', nameEn: 'Trout horovats 1kg', price: 4940, category: 'Ձուկ', categoryHy: 'Ձուկ', categoryRu: 'Рыба', categoryEn: 'Fish' },
  { city: 'echmiadzin', name: 'Թառափի խորոված 1կգ', nameHy: 'Թառափի խորոված 1կգ', nameRu: 'Хоровац из осетра 1кг', nameEn: 'Sturgeon horovats 1kg', price: 7150, category: 'Ձուկ', categoryHy: 'Ձուկ', categoryRu: 'Рыба', categoryEn: 'Fish' },
];

async function seed() {
  console.log('🌱 Տեղադրում ենք մենյուն...');
  
  for (const item of menuData) {
    const existing = await db.select().from(menuItems).where(eq(menuItems.name, item.name)).limit(1);
    if (existing.length === 0) {
      await db.insert(menuItems).values(item);
      console.log(`✅ Ավելացվեց: ${item.name}`);
    } else {
      await db.update(menuItems).set({
        nameRu: item.nameRu,
        nameEn: item.nameEn,
        categoryRu: item.categoryRu,
        categoryEn: item.categoryEn,
      }).where(eq(menuItems.name, item.name));
      console.log(`🔄 Թարմացվեց: ${item.name}`);
    }
  }
  
  console.log('✅ Մենյուն ավարտված է');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Սխալ:', err);
  process.exit(1);
});