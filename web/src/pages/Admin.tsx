import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { getTelegramUser } from "../lib/telegram";
import { isAdminUser } from "../lib/admin";
import type { Order } from "../lib/types";
import { RefreshCw } from "lucide-react";
import { Skeleton } from "../components/Skeleton";
import { useToast } from "../context/ToastContext";

const statusOptions: Array<{ value: Order["status"] | "ALL"; label: string }> = [
    { value: "PENDING", label: "Новые" },
    { value: "IN_PROGRESS", label: "В работе" },
    { value: "COMPLETED", label: "Выполнено" },
    { value: "CANCELLED", label: "Отменено" },
    { value: "ALL", label: "Все" },
];

const statusStyles: Record<Order["status"], string> = {
    PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    IN_PROGRESS: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    COMPLETED: "bg-green-500/10 text-green-400 border-green-500/30",
    CANCELLED: "bg-red-500/10 text-red-400 border-red-500/30",
};

const statusLabels: Record<Order["status"], string> = {
    PENDING: "Новый",
    IN_PROGRESS: "В работе",
    COMPLETED: "Выполнен",
    CANCELLED: "Отменен",
};

export function Admin() {
    const user = getTelegramUser();
    const isAdmin = isAdminUser(user.id);
    const [orders, setOrders] = useState<Order[]>([]);
    const [statusFilter, setStatusFilter] = useState<Order["status"] | "ALL">(
        "PENDING"
    );
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        if (!isAdmin) return;

        let isMounted = true;

        const loadOrders = async () => {
            try {
                setIsLoading(true);
                const data = await api.getOrders(
                    user.id,
                    statusFilter === "ALL" ? undefined : statusFilter,
                    statusFilter === "PENDING"
                );
                if (isMounted) {
                    setOrders(data);
                    setError(null);
                }
            } catch {
                if (isMounted) {
                    setError("Не удалось загрузить заказы");
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadOrders();

        return () => {
            isMounted = false;
        };
    }, [statusFilter, isAdmin, user.id, reloadKey]);

    const handleOrderUpdated = (updated: Order) => {
        setOrders((prev) => {
            const shouldHidePending =
                statusFilter === "PENDING" &&
                (updated.status !== "PENDING" || Boolean(updated.assignedTo));

            if (shouldHidePending) {
                return prev.filter((order) => order.id !== updated.id);
            }

            return prev.map((order) => (order.id === updated.id ? updated : order));
        });
    };

    if (!isAdmin) {
        return (
            <div className="p-4 pb-24 min-h-screen">
                <h1 className="text-2xl font-bold mb-4">Админ</h1>
                <div className="text-sm text-muted-foreground">
                    Нет доступа к панели администратора.
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 pb-24 min-h-screen">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Админ</h1>
                <button
                    onClick={() => setReloadKey((prev) => prev + 1)}
                    className="p-2 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
                    title="Обновить"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            <div className="flex gap-2 flex-wrap mb-6">
                {statusOptions.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => setStatusFilter(option.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${statusFilter === option.value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card border-border text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div
                            key={index}
                            className="bg-card border border-border rounded-2xl p-4 space-y-4"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-10" />
                                    <Skeleton className="h-5 w-24" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                                <Skeleton className="h-6 w-20 rounded-full" />
                            </div>
                            <div className="space-y-2">
                                {Array.from({ length: 2 }).map((__, row) => (
                                    <div
                                        key={row}
                                        className="flex items-center justify-between text-sm border border-border rounded-xl px-3 py-2"
                                    >
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-3 w-28" />
                                        </div>
                                        <div className="space-y-2 text-right">
                                            <Skeleton className="h-4 w-16 ml-auto" />
                                            <Skeleton className="h-3 w-10 ml-auto" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <Skeleton className="h-3 w-12" />
                                <Skeleton className="h-6 w-24" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="text-sm text-destructive">{error}</div>
            ) : orders.length === 0 ? (
                <div className="text-sm text-muted-foreground">Нет заказов</div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            adminId={user.id}
                            onUpdated={handleOrderUpdated}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function OrderCard({
    order,
    adminId,
    onUpdated,
}: {
    order: Order;
    adminId: string;
    onUpdated: (order: Order) => void;
}) {
    const [status, setStatus] = useState<Order["status"]>(order.status);
    const [adminNote, setAdminNote] = useState(order.adminNote ?? "");
    const [adminMessage, setAdminMessage] = useState(order.adminMessage ?? "");
    const [assignedTo, setAssignedTo] = useState(order.assignedTo ?? "");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { showToast } = useToast();

    useEffect(() => {
        setStatus(order.status);
        setAdminNote(order.adminNote ?? "");
        setAdminMessage(order.adminMessage ?? "");
        setAssignedTo(order.assignedTo ?? "");
    }, [order.id, order.status, order.adminNote, order.adminMessage, order.assignedTo]);

    const hasChanges =
        status !== order.status ||
        adminNote !== (order.adminNote ?? "") ||
        adminMessage !== (order.adminMessage ?? "") ||
        assignedTo !== (order.assignedTo ?? "");


    const [isClaiming, setIsClaiming] = useState(false);

    const canClaim = order.status === "PENDING" && !order.assignedTo;

    const handleClaim = async () => {
        if (!canClaim) return;

        setIsClaiming(true);
        try {
            const claimed = await api.claimOrder(order.id, adminId);
            onUpdated(claimed);
            showToast("Заказ взят в работу", "success");
            setError(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Не удалось взять заказ";
            setError(message);
            showToast(message, "error");
        } finally {
            setIsClaiming(false);
        }
    };

    const handleSave = async () => {
        if (!hasChanges) return;

        setIsSaving(true);
        try {
            const updated = await api.updateOrder(order.id, adminId, {
                status,
                adminNote: adminNote.trim() ? adminNote.trim() : null,
                adminMessage: adminMessage.trim() ? adminMessage.trim() : null,
                assignedTo: assignedTo.trim() ? assignedTo.trim() : null,
            });
            onUpdated(updated);
            showToast("Изменения сохранены", "success");
            setError(null);
        } catch {
            setError("Не удалось обновить заказ");
            showToast("Ошибка при сохранении", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-xs text-muted-foreground">Заказ</div>
                    <div className="font-semibold">#{order.id.slice(0, 8)}</div>
                    <div className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString()}
                    </div>
                </div>
                <div
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusStyles[status]
                        }`}
                >
                    {statusLabels[status]}
                </div>
            </div>

            <div className="flex gap-2">
                {canClaim ? (
                    <button
                        onClick={handleClaim}
                        disabled={isClaiming}
                        className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isClaiming ? "Берем..." : "Взять заказ"}
                    </button>
                ) : null}
            </div>

            <div className="text-sm">
                <div className="font-semibold">Покупатель</div>
                <div className="text-muted-foreground">
                    {order.user.username ? `@${order.user.username}` : "без имени"} · {order.user.telegramId}
                </div>
            </div>


            {(order.customerContact || order.customerNote) ? (
                <div className="space-y-2 text-sm">
                    {order.customerContact ? (
                        <div className="border border-border rounded-xl px-3 py-2">
                            <div className="text-xs text-muted-foreground">Контакт</div>
                            <div className="font-medium break-words">{order.customerContact}</div>
                        </div>
                    ) : null}
                    {order.customerNote ? (
                        <div className="border border-border rounded-xl px-3 py-2">
                            <div className="text-xs text-muted-foreground">Комментарий</div>
                            <div className="font-medium whitespace-pre-wrap break-words">{order.customerNote}</div>
                        </div>
                    ) : null}
                </div>
            ) : null}

            <div className="space-y-2">
                {order.items.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-center justify-between text-sm border border-border rounded-xl px-3 py-2"
                    >
                        <div>
                            <div className="font-medium">{item.serviceName}</div>
                            <div className="text-xs text-muted-foreground">
                                {item.accountType === "ready" ? "Готовый" : "На мой"} · {item.durationLabel}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-semibold">{item.price * item.quantity} ₽</div>
                            <div className="text-xs text-muted-foreground">x{item.quantity}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between text-sm">
                <div className="text-muted-foreground">Итого</div>
                <div className="text-lg font-bold">{order.totalAmount} ₽</div>
            </div>

            <div className="grid gap-3">
                <label className="text-xs text-muted-foreground">Статус</label>
                <div className="grid grid-cols-2 gap-2">
                    {(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const).map(
                        (value) => (
                            <button
                                key={value}
                                onClick={() => setStatus(value)}
                                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${status === value
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-card border-border text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {statusLabels[value]}
                            </button>
                        )
                    )}
                </div>
            </div>

            <div className="grid gap-2">
                <label className="text-xs text-muted-foreground">Назначен на</label>
                <div className="flex gap-2">
                    <input
                        value={assignedTo}
                        onChange={(event) => setAssignedTo(event.target.value)}
                        placeholder="Telegram ID"
                        className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-sm"
                    />
                    <button
                        onClick={() => setAssignedTo(adminId)}
                        className="px-3 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-semibold"
                    >
                        На меня
                    </button>
                </div>
            </div>

            <div className="grid gap-2">
                <label className="text-xs text-muted-foreground">Заметка</label>
                <textarea
                    value={adminNote}
                    onChange={(event) => setAdminNote(event.target.value)}
                    placeholder="Комментарий по заказу"
                    className="min-h-[80px] px-3 py-2 rounded-xl bg-background border border-border text-sm"
                />
            </div>


            <div className="grid gap-2">
                <label className="text-xs text-muted-foreground">Сообщение клиенту</label>
                <textarea
                    value={adminMessage}
                    onChange={(event) => setAdminMessage(event.target.value)}
                    placeholder="Что отправить клиенту после выполнения (логин/пароль/инструкция)"
                    className="min-h-[90px] px-3 py-2 rounded-xl bg-background border border-border text-sm"
                />
            </div>

            {error && <div className="text-xs text-destructive">{error}</div>}

            <button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isSaving ? "Сохранение..." : "Сохранить"}
            </button>
        </div>
    );
}
