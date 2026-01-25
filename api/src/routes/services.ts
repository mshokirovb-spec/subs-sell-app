import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
    try {
        const services = await prisma.service.findMany({
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
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch services' });
    }
});

export default router;
