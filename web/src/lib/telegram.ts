export interface TelegramUser {
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
}

type TelegramInitUser = {
    id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
};

type TelegramWebApp = {
    initData?: string;
    initDataUnsafe?: {
        user?: TelegramInitUser;
    };
};

type TelegramWindow = Window & {
    Telegram?: {
        WebApp?: TelegramWebApp;
    };
};

export const getTelegramInitData = (): string => {
    const initData = (window as TelegramWindow).Telegram?.WebApp?.initData;
    return typeof initData === 'string' ? initData : '';
};

export const getTelegramUser = (): TelegramUser => {
    const rawUser = (window as TelegramWindow).Telegram?.WebApp?.initDataUnsafe?.user;

    if (rawUser && typeof rawUser.id === 'number') {
        return {
            id: String(rawUser.id),
            username: rawUser.username,
            firstName: rawUser.first_name,
            lastName: rawUser.last_name,
        };
    }

    return {
        id: import.meta.env.VITE_TELEGRAM_ID ?? '123456789',
        username: import.meta.env.VITE_TELEGRAM_USERNAME ?? 'guest',
        firstName: import.meta.env.VITE_TELEGRAM_FIRST_NAME ?? 'Guest',
    };
};
