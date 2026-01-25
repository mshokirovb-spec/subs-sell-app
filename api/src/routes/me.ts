import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { getRequestTelegramUser, requireTelegramAuth } from '../lib/telegramAuth';

const router = Router();
const prisma = new PrismaClient();

// Ensures there is a User row for the current Telegram user.
// In production this relies on verified initData; in dev it falls back to provided IDs.
router.post('/ensure', requireTelegramAuth, async (req, res) => {
    const telegramUser = getRequestTelegramUser(req);
    if (!telegramUser) {
        return res
            .status(400)
            .json({ success: false, error: 'Missing telegram user' });
    }

    try {
        const user = await prisma.user.upsert({
            where: { telegramId: telegramUser.id },
            update: {
                ...(telegramUser.username ? { username: telegramUser.username } : {}),
                ...(telegramUser.firstName ? { firstName: telegramUser.firstName } : {}),
            },
            create: {
                telegramId: telegramUser.id,
                username: telegramUser.username,
                firstName: telegramUser.firstName,
            },
        });

        res.json({ success: true, user });
    } catch (error) {
        console.error('Error ensuring user:', error);
        res.status(500).json({ success: false, error: 'Failed to ensure user' });
    }
});

export default router;
