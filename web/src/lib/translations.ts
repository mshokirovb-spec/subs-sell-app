export type Language = 'ru' | 'en';

export const translations = {
    ru: {
        // Common
        loading: "Загрузка...",
        error: "Ошибка",
        back: "Назад",

        // Navigation
        nav_catalog: "Каталог",
        nav_cart: "Корзина",
        nav_profile: "Профиль",
        nav_admin: "Админ",

        // Catalog
        catalog_title: "Каталог",
        catalog_empty: "Каталог пуст",
        catalog_error_loading: "Не удалось загрузить каталог",
        catalog_buy_now: "Купить сейчас",
        catalog_add_to_cart: "В корзину",
        catalog_ready_account: "Готовый аккаунт",
        catalog_own_account: "На мой аккаунт",
        catalog_select_term: "Выберите срок",
        catalog_no_options: "Нет вариантов для выбранного типа",
        catalog_quantity: "Количество",
        catalog_total: "Итого:",
        catalog_coming_soon_title: "Скоро!",
        catalog_coming_soon_text: "Этот раздел скоро откроется!",
        catalog_ok: "Ок",

        // Cart
        cart_title: "Корзина",
        cart_empty: "Корзина пуста",
        cart_checkout: "Оформить заказ",
        cart_processing: "Обработка...",
        cart_total: "Итого:",
        cart_payment_notice: "Оплата пока не подключена — заказ уйдет менеджеру.",
        cart_success_ready: "Заказ успешно создан! Сейчас откроем чат с администратором.",
        cart_success_own: "Заказ успешно создан! Администратор выполнит заказ в ближайшее время.",
        cart_error_create: "Ошибка при создании заказа. Попробуйте позже.",
        cart_checkout_title: "Оформление",
        cart_your_contact: "Ваш контакт (Telegram)",
        cart_comment: "Комментарий к заказу",
        cart_cancel: "Отмена",
        cart_confirm: "Подтвердить",

        // Profile
        profile_title: "Профиль",
        profile_orders_stat: "Заказов",
        profile_spent_stat: "Потрачено",
        profile_days_stat: "Дней с нами",
        profile_history: "История заказов",
        profile_support: "Поддержка",
        profile_settings: "Настройки",
        profile_no_orders: "Пока нет заказов.",
        profile_order: "Заказ",
        profile_status_new: "Новый",
        profile_status_work: "В работе",
        profile_status_done: "Выполнен",
        profile_status_cancel: "Отменен",
        profile_contact: "Контакт",
        profile_comment: "Комментарий",
        profile_admin_message: "Сообщение от администратора",
        profile_problem: "Проблема с заказом",
        profile_error_loading: "Не удалось загрузить профиль",

        // Settings
        settings_title: "Настройки",
        settings_theme: "Тема",
        settings_language: "Язык",
        settings_theme_light: "Светлая",
        settings_theme_dark: "Темная",
        settings_lang_ru: "Русский",
        settings_lang_en: "English",
    },
    en: {
        // Common
        loading: "Loading...",
        error: "Error",
        back: "Back",

        // Navigation
        nav_catalog: "Catalog",
        nav_cart: "Cart",
        nav_profile: "Profile",
        nav_admin: "Admin",

        // Catalog
        catalog_title: "Catalog",
        catalog_empty: "Catalog is empty",
        catalog_error_loading: "Failed to load catalog",
        catalog_buy_now: "Buy Now",
        catalog_add_to_cart: "Add to Cart",
        catalog_ready_account: "Ready Account",
        catalog_own_account: "On My Account",
        catalog_select_term: "Select Duration",
        catalog_no_options: "No options for selected type",
        catalog_quantity: "Quantity",
        catalog_total: "Total:",
        catalog_coming_soon_title: "Coming Soon!",
        catalog_coming_soon_text: "This section will open soon!",
        catalog_ok: "Ok",

        // Cart
        cart_title: "Cart",
        cart_empty: "Your cart is empty",
        cart_checkout: "Checkout",
        cart_processing: "Processing...",
        cart_total: "Total:",
        cart_payment_notice: "Payment not connected yet — order will be sent to manager.",
        cart_success_ready: "Order created! Opening chat with admin...",
        cart_success_own: "Order created! Admin will process it shortly.",
        cart_error_create: "Error creating order. Please try again.",
        cart_checkout_title: "Checkout",
        cart_your_contact: "Your Contact (Telegram)",
        cart_comment: "Order Comment",
        cart_cancel: "Cancel",
        cart_confirm: "Confirm",

        // Profile
        profile_title: "Profile",
        profile_orders_stat: "Orders",
        profile_spent_stat: "Spent",
        profile_days_stat: "Days with us",
        profile_history: "Order History",
        profile_support: "Support",
        profile_settings: "Settings",
        profile_no_orders: "No orders yet.",
        profile_order: "Order",
        profile_status_new: "New",
        profile_status_work: "In Progress",
        profile_status_done: "Completed",
        profile_status_cancel: "Cancelled",
        profile_contact: "Contact",
        profile_comment: "Comment",
        profile_admin_message: "Admin Message",
        profile_problem: "Problem with order",
        profile_error_loading: "Failed to load profile",

        // Settings
        settings_title: "Settings",
        settings_theme: "Theme",
        settings_language: "Language",
        settings_theme_light: "Light",
        settings_theme_dark: "Dark",
        settings_lang_ru: "Russian",
        settings_lang_en: "English",
    }
};

export type TranslationKey = keyof typeof translations.ru;
