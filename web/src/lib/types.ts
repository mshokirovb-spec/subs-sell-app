export type AccountType = 'ready' | 'own';

export interface Plan {
    id: string;
    accountType: AccountType;
    durationLabel: string;
    durationMonths: number;
    price: number;
}

export interface Service {
    id: string;
    name: string;
    description?: string | null;
    icon?: string | null;
    color?: string | null;
    plans: Plan[];
}

export interface OrderItem {
    id: string;
    serviceName: string;
    accountType: AccountType;
    durationLabel: string;
    price: number;
    quantity: number;
}

export interface OrderUser {
    telegramId: string;
    username?: string | null;
    firstName?: string | null;
}

export interface Order {
    id: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    totalAmount: number;
    customerContact?: string | null;
    customerNote?: string | null;
    adminMessage?: string | null;
    adminNote?: string | null;
    assignedTo?: string | null;
    createdAt: string;
    user: OrderUser;
    items: OrderItem[];
}

export interface ProfileStats {
    ordersCount: number;
    totalSpent: number;
    daysWithUs: number;
}

export interface ProfileOrder {
    id: string;
    status: Order['status'];
    totalAmount: number;
    createdAt: string;
    customerContact?: string | null;
    customerNote?: string | null;
    adminMessage?: string | null;
    assignedTo?: string | null;
    items: OrderItem[];
}

export interface ProfileResponse {
    user: OrderUser;
    stats: ProfileStats;
    orders: ProfileOrder[];
}
