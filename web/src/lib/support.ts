import { openChatWithUsername } from './telegramLinks';

export const getSupportAdminUsername = () => {
    return 'ShMukhammad';
};

export const openSupportChat = () => {
    const username = getSupportAdminUsername();
    if (!username) return;
    openChatWithUsername(username);
};
