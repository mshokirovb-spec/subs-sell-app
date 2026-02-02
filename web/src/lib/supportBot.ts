import { openTelegramLink } from './telegramLinks';

export const openSupportBotForOrder = (orderId: string) => {
    // Open direct chat with admin for order issues
    const message = `Проблема с заказом #${orderId.slice(0, 8)}`;
    openTelegramLink(`https://t.me/ShMukhammad?text=${encodeURIComponent(message)}`);
};
