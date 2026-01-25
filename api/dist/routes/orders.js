"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const telegramAuth_1 = require("../lib/telegramAuth");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const adminIds = new Set(((_a = process.env.ADMIN_TELEGRAM_IDS) !== null && _a !== void 0 ? _a : '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean));
const getAdminTelegramId = (req) => { var _a, _b, _c; return String((_c = (_b = (_a = req.telegramUser) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : req.header('x-telegram-id')) !== null && _c !== void 0 ? _c : '').trim(); };
const isAdminRequest = (req) => {
    const authConfigured = (0, telegramAuth_1.isTelegramAuthConfigured)();
    // In production (when Telegram auth is configured) we require explicit admin IDs.
    if (authConfigured && adminIds.size === 0)
        return false;
    if (adminIds.size === 0)
        return true;
    const telegramId = getAdminTelegramId(req);
    return Boolean(telegramId && adminIds.has(telegramId));
};
const normalizeStatus = (status) => {
    if (!status)
        return undefined;
    const normalized = status.toUpperCase();
    return Object.values(client_1.OrderStatus).includes(normalized)
        ? normalized
        : undefined;
};
router.post('/', telegramAuth_1.requireTelegramAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { customerContact, customerNote, items } = (_a = req.body) !== null && _a !== void 0 ? _a : {};
        const telegramUser = (0, telegramAuth_1.getRequestTelegramUser)(req);
        if (!(telegramUser === null || telegramUser === void 0 ? void 0 : telegramUser.id) || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, error: 'Invalid order payload' });
        }
        const normalizedItems = new Map();
        for (const item of items) {
            const planId = String((_b = item === null || item === void 0 ? void 0 : item.planId) !== null && _b !== void 0 ? _b : '').trim();
            const quantity = Math.floor(Number((_c = item === null || item === void 0 ? void 0 : item.quantity) !== null && _c !== void 0 ? _c : 1));
            if (!planId || !Number.isFinite(quantity) || quantity <= 0) {
                return res.status(400).json({ success: false, error: 'Invalid order item' });
            }
            normalizedItems.set(planId, ((_d = normalizedItems.get(planId)) !== null && _d !== void 0 ? _d : 0) + quantity);
        }
        const planIds = Array.from(normalizedItems.keys());
        const plans = yield prisma.plan.findMany({
            where: { id: { in: planIds }, active: true },
            include: { service: true },
        });
        if (plans.length !== planIds.length) {
            return res.status(400).json({ success: false, error: 'Some plans are unavailable' });
        }
        const planById = new Map(plans.map((plan) => [plan.id, plan]));
        const itemsData = planIds.map((planId) => {
            var _a;
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
                quantity: (_a = normalizedItems.get(planId)) !== null && _a !== void 0 ? _a : 1,
            };
        });
        const totalAmount = itemsData.reduce((sum, item) => sum + item.price * item.quantity, 0);
        let user = yield prisma.user.findUnique({
            where: { telegramId: telegramUser.id },
        });
        if (!user) {
            user = yield prisma.user.create({
                data: {
                    telegramId: telegramUser.id,
                    username: telegramUser.username,
                    firstName: telegramUser.firstName,
                },
            });
        }
        else if ((telegramUser.username && user.username !== telegramUser.username) || (telegramUser.firstName && user.firstName !== telegramUser.firstName)) {
            user = yield prisma.user.update({
                where: { id: user.id },
                data: Object.assign(Object.assign({}, (telegramUser.username ? { username: telegramUser.username } : {})), (telegramUser.firstName ? { firstName: telegramUser.firstName } : {})),
            });
        }
        const order = yield prisma.order.create({
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
    }
    catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ success: false, error: 'Failed to create order' });
    }
}));
router.get('/', telegramAuth_1.requireTelegramAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (!isAdminRequest(req)) {
        if ((0, telegramAuth_1.isTelegramAuthConfigured)() && adminIds.size === 0) {
            return res
                .status(403)
                .json({ success: false, error: 'Admin access is not configured' });
        }
        return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    const status = normalizeStatus(typeof req.query.status === 'string' ? req.query.status : undefined);
    if (req.query.status && !status) {
        return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    const telegramId = typeof req.query.telegramId === 'string' ? req.query.telegramId : undefined;
    const unassigned = req.query.unassigned === 'true' || req.query.unassigned === '1';
    const assignedTo = typeof req.query.assignedTo === 'string' ? req.query.assignedTo : undefined;
    const limitRaw = Number((_a = req.query.limit) !== null && _a !== void 0 ? _a : 50);
    const offsetRaw = Number((_b = req.query.offset) !== null && _b !== void 0 ? _b : 0);
    const take = Number.isFinite(limitRaw)
        ? Math.min(Math.max(limitRaw, 1), 100)
        : 50;
    const skip = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;
    try {
        const orders = yield prisma.order.findMany({
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
    }
    catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch orders' });
    }
}));
router.post('/:id/claim', telegramAuth_1.requireTelegramAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!isAdminRequest(req)) {
        if ((0, telegramAuth_1.isTelegramAuthConfigured)() && adminIds.size === 0) {
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
        const result = yield prisma.order.updateMany({
            where: {
                id: req.params.id,
                status: client_1.OrderStatus.PENDING,
                assignedTo: null,
            },
            data: {
                status: client_1.OrderStatus.IN_PROGRESS,
                assignedTo: adminTelegramId,
            },
        });
        if (result.count === 0) {
            return res
                .status(409)
                .json({ success: false, error: 'Order is already claimed' });
        }
        const order = yield prisma.order.findUnique({
            where: { id: req.params.id },
            include: {
                user: true,
                items: true,
            },
        });
        res.json({ order });
    }
    catch (error) {
        console.error('Error claiming order:', error);
        res.status(500).json({ success: false, error: 'Failed to claim order' });
    }
}));
router.get('/:id', telegramAuth_1.requireTelegramAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!isAdminRequest(req)) {
        if ((0, telegramAuth_1.isTelegramAuthConfigured)() && adminIds.size === 0) {
            return res
                .status(403)
                .json({ success: false, error: 'Admin access is not configured' });
        }
        return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    try {
        const order = yield prisma.order.findUnique({
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
    }
    catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch order' });
    }
}));
router.patch('/:id', telegramAuth_1.requireTelegramAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (!isAdminRequest(req)) {
        if ((0, telegramAuth_1.isTelegramAuthConfigured)() && adminIds.size === 0) {
            return res
                .status(403)
                .json({ success: false, error: 'Admin access is not configured' });
        }
        return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    const status = normalizeStatus(typeof ((_a = req.body) === null || _a === void 0 ? void 0 : _a.status) === 'string' ? req.body.status : undefined);
    if (((_b = req.body) === null || _b === void 0 ? void 0 : _b.status) && !status) {
        return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    const adminNote = typeof ((_c = req.body) === null || _c === void 0 ? void 0 : _c.adminNote) === 'string'
        ? req.body.adminNote.trim()
        : ((_d = req.body) === null || _d === void 0 ? void 0 : _d.adminNote) === null
            ? null
            : undefined;
    const adminMessage = typeof ((_e = req.body) === null || _e === void 0 ? void 0 : _e.adminMessage) === "string"
        ? req.body.adminMessage.trim()
        : ((_f = req.body) === null || _f === void 0 ? void 0 : _f.adminMessage) === null
            ? null
            : undefined;
    const assignedToRaw = typeof ((_g = req.body) === null || _g === void 0 ? void 0 : _g.assignedTo) === 'string'
        ? req.body.assignedTo.trim()
        : ((_h = req.body) === null || _h === void 0 ? void 0 : _h.assignedTo) === null
            ? null
            : undefined;
    const assignedTo = assignedToRaw === '' ? null : assignedToRaw;
    const data = Object.assign(Object.assign(Object.assign(Object.assign({}, (status ? { status } : {})), (adminNote !== undefined ? { adminNote } : {})), (adminMessage !== undefined ? { adminMessage } : {})), (assignedTo !== undefined ? { assignedTo } : {}));
    if (Object.keys(data).length === 0) {
        return res.status(400).json({ success: false, error: 'No updates provided' });
    }
    try {
        const order = yield prisma.order.update({
            where: { id: req.params.id },
            data,
            include: {
                user: true,
                items: true,
            },
        });
        res.json({ order });
    }
    catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ success: false, error: 'Failed to update order' });
    }
}));
exports.default = router;
