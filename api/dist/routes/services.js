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
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const services = yield prisma_1.prisma.service.findMany({
            where: { active: true },
            include: {
                plans: {
                    where: { active: true },
                    orderBy: [{ sortOrder: 'asc' }, { durationMonths: 'asc' }],
                },
            },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        });
        res.json({ services });
    }
    catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch services' });
    }
}));
exports.default = router;
