const parseAdminIds = () =>
    (import.meta.env.VITE_ADMIN_IDS ?? '')
        .split(',')
        .map((value: string) => value.trim())
        .filter(Boolean);

export const isAdminUser = (telegramId: string) => {
    const adminIds = parseAdminIds();

    // Safer default: if no admin IDs are configured, only show admin UI in dev.
    if (adminIds.length === 0) return import.meta.env.DEV;

    return adminIds.includes(telegramId);
};
