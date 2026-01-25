import { AccountType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const services = [
    { name: 'Spotify', icon: '🎵', color: '#22c55e', basePrice: 199, sortOrder: 1 },
    { name: 'ChatGPT', icon: '🤖', color: '#14b8a6', basePrice: 299, sortOrder: 2 },
    { name: 'Netflix', icon: '🎬', color: '#dc2626', basePrice: 399, sortOrder: 3 },
    { name: 'YouTube', icon: '▶️', color: '#ef4444', basePrice: 149, sortOrder: 4 },
    { name: 'Discord', icon: '🎮', color: '#6366f1', basePrice: 249, sortOrder: 5 },
    { name: 'PS Plus', icon: '➕', color: '#eab308', basePrice: 499, sortOrder: 6 },
];

const durations = [
    { label: '1 Месяц', months: 1, multiplier: 1 },
    { label: '3 Месяца', months: 3, multiplier: 2.8 },
    { label: '6 Месяцев', months: 6, multiplier: 5.5 },
    { label: '1 Год', months: 12, multiplier: 10 },
];

async function main() {
    for (const service of services) {
        const createdService = await prisma.service.upsert({
            where: { name: service.name },
            update: {
                icon: service.icon,
                color: service.color,
                sortOrder: service.sortOrder,
            },
            create: {
                name: service.name,
                icon: service.icon,
                color: service.color,
                sortOrder: service.sortOrder,
            },
        });

        await prisma.plan.deleteMany({ where: { serviceId: createdService.id } });

        const plans = [] as Array<{
            serviceId: string;
            accountType: AccountType;
            durationLabel: string;
            durationMonths: number;
            price: number;
            sortOrder: number;
        }>;

        durations.forEach((duration, index) => {
            const price = Math.round(service.basePrice * duration.multiplier);
            plans.push({
                serviceId: createdService.id,
                accountType: AccountType.ready,
                durationLabel: duration.label,
                durationMonths: duration.months,
                price,
                sortOrder: index + 1,
            });
            plans.push({
                serviceId: createdService.id,
                accountType: AccountType.own,
                durationLabel: duration.label,
                durationMonths: duration.months,
                price,
                sortOrder: index + 1,
            });
        });

        await prisma.plan.createMany({ data: plans });
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
