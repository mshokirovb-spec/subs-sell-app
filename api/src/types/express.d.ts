import type { TelegramAuthUser } from '../lib/telegramAuth';

declare global {
    namespace Express {
        interface Request {
            telegramUser?: TelegramAuthUser;
        }
    }
}

export {};
