const ADMIN_IDS = ['5019965315'];

const parseAdminIds = () => {
    const envIds = (import.meta.env.VITE_ADMIN_IDS ?? '')
        .split(',')
        .map((value: string) => value.trim())
        .filter(Boolean);

    return envIds.length > 0 ? envIds : ADMIN_IDS;
};

export const isAdminUser = (telegramId: string) => {
    const adminIds = parseAdminIds();
    return adminIds.includes(telegramId);
};
