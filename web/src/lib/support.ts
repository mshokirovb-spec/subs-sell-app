import { openChatWithUsername } from './telegramLinks';

const parseUsernames = (raw: string) =>
    raw
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
        .map((value) => value.replace(/^@/, ''))
        .filter(Boolean);

export const getSupportAdminUsername = () => {
    const usernames = parseUsernames(import.meta.env.VITE_SUPPORT_ADMIN_USERNAMES ?? '');
    if (usernames.length > 0) {
        return usernames[Math.floor(Math.random() * usernames.length)];
    }

    const fallback = String(import.meta.env.VITE_SUPPORT_USERNAME ?? 'ShMukhammad').trim();
    return fallback.replace(/^@/, '');
};

export const openSupportChat = () => {
    const username = getSupportAdminUsername();
    if (!username) return;
    openChatWithUsername(username);
};
