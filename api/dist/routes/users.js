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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const telegramAuth_1 = require("../lib/telegramAuth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const calculateDaysSince = (date) => {
    const diffMs = Date.now() - date.getTime();
    if (diffMs <= 0)
        return 0;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};
router.get('/:telegramId/profile', telegramAuth_1.requireTelegramAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const telegramId = String((_a = req.params.telegramId) !== null && _a !== void 0 ? _a : '').trim();
    if (!telegramId) {
        return res.status(400).json({ success: false, error: 'Invalid telegramId' });
    }
    const requestUser = (0, telegramAuth_1.getRequestTelegramUser)(req);
    if (requestUser && requestUser.id !== telegramId) {
        return res
            .status(403)
            .json({ success: false, error: 'Profile access denied' });
    }
    const limitRaw = Number((_b = req.query.limit) !== null && _b !== void 0 ? _b : 10);
    const take = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 10;
    try {
        let user = yield prisma.user.findUnique({
            where: { telegramId },
        });
        if (!user && requestUser) {
            // Create the user on first launch (when Telegram auth is present).
            user = yield prisma.user.create({
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
        const orders = yield prisma.order.findMany({
            where: {
                userId: user.id,
            },
            include: {
                items: true,
            },
            orderBy: { createdAt: 'desc' },
            take,
        });
        const ordersCount = yield prisma.order.count({
            where: { userId: user.id },
        });
        const totalSpentResult = yield prisma.order.aggregate({
            where: {
                userId: user.id,
                status: { not: client_1.OrderStatus.CANCELLED },
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
                totalSpent: (_c = totalSpentResult._sum.totalAmount) !== null && _c !== void 0 ? _c : 0,
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
    }
    catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch profile' });
    }
}));
exports.default = router;
