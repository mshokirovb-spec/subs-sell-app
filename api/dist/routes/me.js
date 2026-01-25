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
// Ensures there is a User row for the current Telegram user.
// In production this relies on verified initData; in dev it falls back to provided IDs.
router.post('/ensure', telegramAuth_1.requireTelegramAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const telegramUser = (0, telegramAuth_1.getRequestTelegramUser)(req);
    if (!telegramUser) {
        return res
            .status(400)
            .json({ success: false, error: 'Missing telegram user' });
    }
    try {
        const user = yield prisma.user.upsert({
            where: { telegramId: telegramUser.id },
            update: Object.assign(Object.assign({}, (telegramUser.username ? { username: telegramUser.username } : {})), (telegramUser.firstName ? { firstName: telegramUser.firstName } : {})),
            create: {
                telegramId: telegramUser.id,
                username: telegramUser.username,
                firstName: telegramUser.firstName,
            },
        });
        res.json({ success: true, user });
    }
    catch (error) {
        console.error('Error ensuring user:', error);
        res.status(500).json({ success: false, error: 'Failed to ensure user' });
    }
}));
exports.default = router;
