import { Router } from 'express';
import { PrismaClient, OrderStatus } from '@prisma/client';
import { getRequestTelegramUser, requireTelegramAuth } from '../lib/telegramAuth';

const router = Router();
const prisma = new PrismaClient();

const calculateDaysSince = (date: Date) => {
    const diffMs = Date.now() - date.getTime();
    if (diffMs <= 0) return 0;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

router.get('/:telegramId/profile', requireTelegramAuth, async (req, res) => {
    const telegramId = String(req.params.telegramId ?? '').trim();
    if (!telegramId) {
        return res.status(400).json({ success: false, error: 'Invalid telegramId' });
    }

    const requestUser = getRequestTelegramUser(req);
    if (requestUser && requestUser.id !== telegramId) {
        return res
            .status(403)
            .json({ success: false, error: 'Profile access denied' });
    }

    const limitRaw = Number(req.query.limit ?? 10);
    const take = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 10;

    try {
        let user = await prisma.user.findUnique({
            where: { telegramId },
        });

        if (!user && requestUser) {
            // Create the user on first launch (when Telegram auth is present).
            user = await prisma.user.create({
                data: {
                    telegramId: requestUser.id,
                    username: requestUser.username,
                    firstName: requestUser.firstName,
                },
            });
        }

        if (!user) {
            return res.json({
                user: {
                    telegramId,
                    username: null,
                    firstName: null,
                },
                stats: {
                    ordersCount: 0,
                    totalSpent: 0,
                    daysWithUs: 0,
                },
                orders: [],
            });
        }

        const orders = await prisma.order.findMany({
            where: {
                userId: user.id,
            },
            include: {
                items: true,
            },
            orderBy: { createdAt: 'desc' },
            take,
        });

        const ordersCount = await prisma.order.count({
            where: { userId: user.id },
        });

        const totalSpentResult = await prisma.order.aggregate({
            where: {
                userId: user.id,
                status: { not: OrderStatus.CANCELLED },
            },
            _sum: {
                totalAmount: true,
            },
        });

        res.json({
            user: {
                telegramId: user.telegramId,
                username: user.username,
                firstName: user.firstName,
            },
            stats: {
                ordersCount,
                totalSpent: totalSpentResult._sum.totalAmount ?? 0,
                daysWithUs: Math.max(1, calculateDaysSince(user.createdAt)),
            },
            orders: orders.map((order) => ({
                id: order.id,
                status: order.status,
                totalAmount: order.totalAmount,
                createdAt: order.createdAt,
                customerContact: order.customerContact,
                customerNote: order.customerNote,
                adminMessage: order.adminMessage,
                assignedTo: order.assignedTo,
                items: order.items,
            })),
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch profile' });
    }
});

export default router;
