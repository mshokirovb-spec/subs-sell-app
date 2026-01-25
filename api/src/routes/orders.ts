import { Router, type Request } from 'express';
import { getRequestTelegramUser, isTelegramAuthConfigured, requireTelegramAuth } from '../lib/telegramAuth';
import { PrismaClient, OrderStatus } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const adminIds = new Set(
    (process.env.ADMIN_TELEGRAM_IDS ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
);

const getAdminTelegramId = (req: Request) =>
    String(req.telegramUser?.id ?? req.header('x-telegram-id') ?? '').trim();

const isAdminRequest = (req: Request) => {
    const authConfigured = isTelegramAuthConfigured();

    // In production (when Telegram auth is configured) we require explicit admin IDs.
    if (authConfigured && adminIds.size === 0) return false;

    if (adminIds.size === 0) return true;

    const telegramId = getAdminTelegramId(req);
    return Boolean(telegramId && adminIds.has(telegramId));
};

const normalizeStatus = (status?: string) => {
    if (!status) return undefined;
    const normalized = status.toUpperCase();
    return Object.values(OrderStatus).includes(normalized as OrderStatus)
        ? (normalized as OrderStatus)
        : undefined;
};

router.post('/', requireTelegramAuth, async (req, res) => {
    try {
        const { customerContact, customerNote, items } = req.body ?? {};

        const telegramUser = getRequestTelegramUser(req);

        if (!telegramUser?.id || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, error: 'Invalid order payload' });
        }

        const normalizedItems = new Map<string, number>();
        for (const item of items) {
            const planId = String(item?.planId ?? '').trim();
            const quantity = Math.floor(Number(item?.quantity ?? 1));

            if (!planId || !Number.isFinite(quantity) || quantity <= 0) {
                return res.status(400).json({ success: false, error: 'Invalid order item' });
            }

            normalizedItems.set(planId, (normalizedItems.get(planId) ?? 0) + quantity);
        }

        const planIds = Array.from(normalizedItems.keys());
        const plans = await prisma.plan.findMany({
            where: { id: { in: planIds }, active: true },
            include: { service: true },
        });

        if (plans.length !== planIds.length) {
            return res.status(400).json({ success: false, error: 'Some plans are unavailable' });
        }

        const planById = new Map(plans.map((plan) => [plan.id, plan]));
        const itemsData = planIds.map((planId) => {
            const plan = planById.get(planId);
            if (!plan) {
                throw new Error('Plan lookup failed');
            }

            return {
                serviceId: plan.serviceId,
                planId: plan.id,
                serviceName: plan.service.name,
                accountType: plan.accountType,
                durationLabel: plan.durationLabel,
                price: plan.price,
                quantity: normalizedItems.get(planId) ?? 1,
            };
        });

        const totalAmount = itemsData.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );

        let user = await prisma.user.findUnique({
            where: { telegramId: telegramUser.id },
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    telegramId: telegramUser.id,
                    username: telegramUser.username,
                    firstName: telegramUser.firstName,
                },
            });
        } else if ((telegramUser.username && user.username !== telegramUser.username) || (telegramUser.firstName && user.firstName !== telegramUser.firstName)) {
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    ...(telegramUser.username ? { username: telegramUser.username } : {}),
                    ...(telegramUser.firstName ? { firstName: telegramUser.firstName } : {}),
                },
            });
        }

        const order = await prisma.order.create({
            data: {
                userId: user.id,
                totalAmount,
                customerContact: typeof customerContact === "string" ? customerContact.trim() : undefined,
                customerNote: typeof customerNote === "string" ? customerNote.trim() : undefined,
                items: {
                    create: itemsData,
                },
            },
            include: {
                items: true,
            },
        });

        res.json({ success: true, order });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ success: false, error: 'Failed to create order' });
    }
});

router.get('/', requireTelegramAuth, async (req, res) => {
    if (!isAdminRequest(req)) {
        if (isTelegramAuthConfigured() && adminIds.size === 0) {
            return res
                .status(403)
                .json({ success: false, error: 'Admin access is not configured' });
        }
        return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const status = normalizeStatus(
        typeof req.query.status === 'string' ? req.query.status : undefined
    );
    if (req.query.status && !status) {
        return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const telegramId =
        typeof req.query.telegramId === 'string' ? req.query.telegramId : undefined;
    const unassigned =
        req.query.unassigned === 'true' || req.query.unassigned === '1';
    const assignedTo =
        typeof req.query.assignedTo === 'string' ? req.query.assignedTo : undefined;
    const limitRaw = Number(req.query.limit ?? 50);
    const offsetRaw = Number(req.query.offset ?? 0);
    const take = Number.isFinite(limitRaw)
        ? Math.min(Math.max(limitRaw, 1), 100)
        : 50;
    const skip = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;

    try {
        const orders = await prisma.order.findMany({
            where: {
                status,
                assignedTo: unassigned ? null : assignedTo,
                user: telegramId ? { telegramId } : undefined,
            },
            include: {
                user: true,
                items: true,
            },
            orderBy: { createdAt: 'desc' },
            take,
            skip,
        });

        res.json({ orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch orders' });
    }
});

router.post('/:id/claim', requireTelegramAuth, async (req, res) => {
    if (!isAdminRequest(req)) {
        if (isTelegramAuthConfigured() && adminIds.size === 0) {
            return res
                .status(403)
                .json({ success: false, error: 'Admin access is not configured' });
        }
        return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const adminTelegramId = getAdminTelegramId(req);
    if (!adminTelegramId) {
        return res.status(400).json({ success: false, error: 'Missing admin telegram id' });
    }

    try {
        const result = await prisma.order.updateMany({
            where: {
                id: req.params.id,
                status: OrderStatus.PENDING,
                assignedTo: null,
            },
            data: {
                status: OrderStatus.IN_PROGRESS,
                assignedTo: adminTelegramId,
            },
        });

        if (result.count === 0) {
            return res
                .status(409)
                .json({ success: false, error: 'Order is already claimed' });
        }

        const order = await prisma.order.findUnique({
            where: { id: req.params.id },
            include: {
                user: true,
                items: true,
            },
        });

        res.json({ order });
    } catch (error) {
        console.error('Error claiming order:', error);
        res.status(500).json({ success: false, error: 'Failed to claim order' });
    }
});

router.get('/:id', requireTelegramAuth, async (req, res) => {
    if (!isAdminRequest(req)) {
        if (isTelegramAuthConfigured() && adminIds.size === 0) {
            return res
                .status(403)
                .json({ success: false, error: 'Admin access is not configured' });
        }
        return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    try {
        const order = await prisma.order.findUnique({
            where: { id: req.params.id },
            include: {
                user: true,
                items: true,
            },
        });

        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        res.json({ order });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch order' });
    }
});

router.patch('/:id', requireTelegramAuth, async (req, res) => {
    if (!isAdminRequest(req)) {
        if (isTelegramAuthConfigured() && adminIds.size === 0) {
            return res
                .status(403)
                .json({ success: false, error: 'Admin access is not configured' });
        }
        return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const status = normalizeStatus(
        typeof req.body?.status === 'string' ? req.body.status : undefined
    );
    if (req.body?.status && !status) {
        return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const adminNote =
        typeof req.body?.adminNote === 'string'
            ? req.body.adminNote.trim()
            : req.body?.adminNote === null
              ? null
              : undefined;

    const adminMessage =
        typeof req.body?.adminMessage === "string"
            ? req.body.adminMessage.trim()
            : req.body?.adminMessage === null
              ? null
              : undefined;

    const assignedToRaw =
        typeof req.body?.assignedTo === 'string'
            ? req.body.assignedTo.trim()
            : req.body?.assignedTo === null
              ? null
              : undefined;
    const assignedTo = assignedToRaw === '' ? null : assignedToRaw;

    const data = {
        ...(status ? { status } : {}),
        ...(adminNote !== undefined ? { adminNote } : {}),
        ...(adminMessage !== undefined ? { adminMessage } : {}),
        ...(assignedTo !== undefined ? { assignedTo } : {}),
    };

    if (Object.keys(data).length === 0) {
        return res.status(400).json({ success: false, error: 'No updates provided' });
    }

    try {
        const order = await prisma.order.update({
            where: { id: req.params.id },
            data,
            include: {
                user: true,
                items: true,
            },
        });

        res.json({ order });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ success: false, error: 'Failed to update order' });
    }
});

export default router;
