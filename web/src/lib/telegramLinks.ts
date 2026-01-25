type TelegramWebApp = {
    openTelegramLink?: (url: string) => void;
    openLink?: (url: string) => void;
    close?: () => void;
};

type TelegramWindow = Window & {
    Telegram?: {
        WebApp?: TelegramWebApp;
    };
};

const getTelegramWebApp = () => (window as TelegramWindow).Telegram?.WebApp;

const tryOpenDeepLink = (url: string) => {
    try {
        window.location.href = url;
    } catch {
        // ignore
    }
};

export const openTelegramLink = (url: string) => {
    const tg = getTelegramWebApp();

    // Inside Telegram Mini App, this opens Telegram UI (chat/user) and not a webview.
    if (tg?.openTelegramLink && url.startsWith('https://t.me/')) {
        tg.openTelegramLink(url);
        return;
    }

    // openLink typically opens an in-app browser, but can handle tg:// links in Telegram clients.
    if (tg?.openLink) {
        tg.openLink(url);
        return;
    }

    // Outside Telegram: prefer deep links to open the native Telegram app.
    if (url.startsWith('tg://')) {
        tryOpenDeepLink(url);
        return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
};

export const openChatWithUsername = (username: string) => {
    const normalized = username.replace(/^@/, '').trim();
    if (!normalized) return;

    const tg = getTelegramWebApp();

    // In a regular browser, attempt to open Telegram Desktop/Mobile via deep-link.
    if (!tg) {
        tryOpenDeepLink(`tg://resolve?domain=${encodeURIComponent(normalized)}`);
        setTimeout(() => {
            window.open(`https://t.me/${normalized}`, '_blank', 'noopener,noreferrer');
        }, 300);
        return;
    }

    openTelegramLink(`https://t.me/${normalized}`);
    setTimeout(() => tg.close?.(), 200);
};

export const openChatWithUserId = (telegramId: string) => {
    const id = telegramId.trim();
    if (!id) return;

    const tg = getTelegramWebApp();

    if (!tg) {
        tryOpenDeepLink(`tg://user?id=${encodeURIComponent(id)}`);
        return;
    }

    // tg://user?id= opens a user profile/chat in Telegram clients.
    if (tg.openLink) {
        tg.openLink(`tg://user?id=${encodeURIComponent(id)}`);
        return;
    }

    openTelegramLink(`tg://user?id=${encodeURIComponent(id)}`);
};
