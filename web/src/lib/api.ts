import type { Order, ProfileResponse, Service } from './types';
import { getTelegramInitData } from './telegram';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

const telegramInitHeaders = (): Record<string, string> => {
    const initData = getTelegramInitData().trim();
    return initData ? { 'x-telegram-init-data': initData } : {};
};

const parseErrorMessage = async (response: Response) => {
    try {
        const data = await response.json();
        if (data && typeof data.error === 'string') return data.error;
        if (data && typeof data.message === 'string') return data.message;
    } catch {
        // ignore
    }
    return `${response.status} ${response.statusText}`.trim();
};


export interface CreateOrderData {
    telegramId: string;
    username?: string;
    firstName?: string;
    customerContact?: string;
    customerNote?: string;
    items: {
        planId: string;
        quantity: number;
    }[];
}

export interface UpdateOrderData {
    status?: Order['status'];
    adminNote?: string | null;
    adminMessage?: string | null;
    assignedTo?: string | null;
}

const adminHeaders = (telegramId?: string): Record<string, string> => ({
    ...telegramInitHeaders(),
    ...(telegramId ? { 'x-telegram-id': telegramId } : {}),
});

export const api = {
    getServices: async (): Promise<Service[]> => {
        const response = await fetch(`${API_URL}/services`);

        if (!response.ok) {
            throw new Error(await parseErrorMessage(response));
        }

        const data = await response.json();
        return data.services ?? [];
    },
    ensureMe: async (data: { telegramId: string; username?: string; firstName?: string }) => {
        const response = await fetch(`${API_URL}/me/ensure`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...telegramInitHeaders(),
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(await parseErrorMessage(response));
        }

        return response.json();
    },
    getProfile: async (telegramId: string): Promise<ProfileResponse> => {
        const response = await fetch(`${API_URL}/users/${telegramId}/profile`, {
            headers: {
                ...telegramInitHeaders(),
            },
        });

        if (!response.ok) {
            throw new Error(await parseErrorMessage(response));
        }

        return response.json();
    },
    createOrder: async (data: CreateOrderData) => {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...telegramInitHeaders(),
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(await parseErrorMessage(response));
        }

        return response.json();
    },
    getOrders: async (
        telegramId: string,
        status?: Order['status'],
        unassigned?: boolean
    ): Promise<Order[]> => {
        const searchParams = new URLSearchParams();
        if (status) {
            searchParams.set('status', status);
        }
        if (unassigned) {
            searchParams.set('unassigned', 'true');
        }

        const response = await fetch(
            `${API_URL}/orders${searchParams.toString() ? `?${searchParams}` : ''}`,
            {
                headers: {
                    ...adminHeaders(telegramId),
                },
            }
        );

        if (!response.ok) {
            throw new Error(await parseErrorMessage(response));
        }

        const data = await response.json();
        return data.orders ?? [];
    },
    claimOrder: async (orderId: string, telegramId: string): Promise<Order> => {
        const response = await fetch(`${API_URL}/orders/${orderId}/claim`, {
            method: 'POST',
            headers: {
                ...adminHeaders(telegramId),
            },
        });

        if (!response.ok) {
            throw new Error(await parseErrorMessage(response));
        }

        const data = await response.json();
        return data.order;
    },
    updateOrder: async (
        orderId: string,
        telegramId: string,
        payload: UpdateOrderData
    ): Promise<Order> => {
        const response = await fetch(`${API_URL}/orders/${orderId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...adminHeaders(telegramId),
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(await parseErrorMessage(response));
        }

        const data = await response.json();
        return data.order;
    },
};
