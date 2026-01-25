import { openTelegramLink } from './telegramLinks';

const getSupportBotUsername = () => {
    const bot = String(import.meta.env.VITE_SUPPORT_BOT_USERNAME ?? '').trim();
    if (bot) return bot.replace(/^@/, '');

    // Placeholder until you add the real bot.
    return 'support_bot';
};

export const openSupportBotForOrder = (orderId: string) => {
    const bot = getSupportBotUsername();
    if (!bot) return;

    const start = `order_${orderId}`;
    openTelegramLink(`https://t.me/${bot}?start=${encodeURIComponent(start)}`);
};
