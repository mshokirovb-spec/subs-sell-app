import { AccountType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const services = [
    { name: 'Spotify', icon: '🎵', color: '#22c55e', basePrice: 199, sortOrder: 1 },
    { name: 'ChatGPT', icon: '🤖', color: '#14b8a6', basePrice: 299, sortOrder: 2 },
    { name: 'Gemini', icon: '✨', color: '#0ea5e9', basePrice: 299, sortOrder: 3 },
    { name: 'Netflix', icon: '🎬', color: '#dc2626', basePrice: 399, sortOrder: 4 },
    { name: 'YouTube', icon: '▶️', color: '#ef4444', basePrice: 149, sortOrder: 5 },
    { name: 'Discord', icon: '🎮', color: '#6366f1', basePrice: 249, sortOrder: 6 },
    { name: 'PS Plus', icon: '➕', color: '#eab308', basePrice: 499, sortOrder: 7 },
];

const durations = [
    { label: '1 Месяц', months: 1, multiplier: 1 },
    { label: '3 Месяца', months: 3, multiplier: 2.8 },
    { label: '6 Месяцев', months: 6, multiplier: 5.5 },
    { label: '1 Год', months: 12, multiplier: 10 },
];

const planKey = (accountType: AccountType, durationMonths: number) =>
    `${accountType}:${durationMonths}`;

async function main() {
    for (const service of services) {
        const createdService = await prisma.service.upsert({
            where: { name: service.name },
            update: {
                icon: service.icon,
                color: service.color,
                sortOrder: service.sortOrder,
                active: true,
            },
            create: {
                name: service.name,
                icon: service.icon,
                color: service.color,
                sortOrder: service.sortOrder,
                active: true,
            },
        });

        const existingPlans = await prisma.plan.findMany({
            where: { serviceId: createdService.id },
        });

        const existingByKey = new Map<string, { id: string }>();
        for (const plan of existingPlans) {
            const key = planKey(plan.accountType, plan.durationMonths);
            if (!existingByKey.has(key)) {
                existingByKey.set(key, { id: plan.id });
            }
        }

        for (const [index, duration] of durations.entries()) {
            const price = Math.round(service.basePrice * duration.multiplier);
            const sortOrder = index + 1;

            const desired = [
                {
                    accountType: AccountType.ready,
                    durationLabel: duration.label,
                    durationMonths: duration.months,
                    price,
                    sortOrder,
                },
                {
                    accountType: AccountType.own,
                    durationLabel: duration.label,
                    durationMonths: duration.months,
                    price,
                    sortOrder,
                },
            ];

            for (const plan of desired) {
                const key = planKey(plan.accountType, plan.durationMonths);
                const existing = existingByKey.get(key);

                if (existing) {
                    await prisma.plan.update({
                        where: { id: existing.id },
                        data: {
                            durationLabel: plan.durationLabel,
                            durationMonths: plan.durationMonths,
                            price: plan.price,
                            sortOrder: plan.sortOrder,
                            active: true,
                        },
                    });
                } else {
                    await prisma.plan.create({
                        data: {
                            serviceId: createdService.id,
                            accountType: plan.accountType,
                            durationLabel: plan.durationLabel,
                            durationMonths: plan.durationMonths,
                            price: plan.price,
                            sortOrder: plan.sortOrder,
                            active: true,
                        },
                    });
                }
            }
        }
    }
}

main()
    .catch((error) => {
        console.error('Seed error:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
