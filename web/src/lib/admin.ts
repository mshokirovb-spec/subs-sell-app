const parseAdminIds = () =>
    (import.meta.env.VITE_ADMIN_IDS ?? '')
        .split(',')
        .map((value: string) => value.trim())
        .filter(Boolean);

export const isAdminUser = (telegramId: string) => {
    const adminIds = parseAdminIds();
    if (adminIds.length === 0) return true;
    return adminIds.includes(telegramId);
};
