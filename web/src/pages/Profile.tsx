import { useMemo, useState } from "react";
import { User, Package, Clock, Settings as SettingsIcon, Headphones, History, ChevronRight } from "lucide-react";
import { useProfile } from "../hooks/useProfile";
import { getTelegramUser } from "../lib/telegram";
import { Skeleton } from "../components/Skeleton";
import { useSettings } from "../context/SettingsContext";
import type { ProfileOrder } from "../lib/types";
import { openSupportBotForOrder } from "../lib/supportBot";
import { Settings } from "./Settings";

const statusLabels: Record<ProfileOrder["status"], string> = {
    PENDING: "profile_status_new",
    IN_PROGRESS: "profile_status_work",
    COMPLETED: "profile_status_done",
    CANCELLED: "profile_status_cancel",
};

const statusStyles: Record<ProfileOrder["status"], string> = {
    PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    IN_PROGRESS: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    COMPLETED: "bg-green-500/10 text-green-400 border-green-500/30",
    CANCELLED: "bg-red-500/10 text-red-400 border-red-500/30",
};

export function Profile() {
    const { t } = useSettings();
    const telegramUser = getTelegramUser();
    const [showSettings, setShowSettings] = useState(false);

    const { data, isLoading, error: queryError } = useProfile(telegramUser.id);

    const stats = data?.stats ?? { ordersCount: 0, totalSpent: 0, daysWithUs: 0 };
    const orders = data?.orders ?? [];

    // If we have data, we assume no error unless query fails
    const error = queryError ? t('profile_error_loading') : null;

    const user = useMemo(
        () => ({
            name: telegramUser.firstName ?? "User",
            username: telegramUser.username ? `@${telegramUser.username}` : "no username",
            avatarUrl: null as string | null,
            id: telegramUser.id,
        }),
        [telegramUser]
    );

    if (showSettings) {
        return <Settings onBack={() => setShowSettings(false)} />;
    }

    const menuItems = [
        { icon: History, label: t('profile_history'), href: "#orders" },
        { icon: Headphones, label: t('profile_support'), href: "https://t.me/ShMukhammad" },
        { icon: SettingsIcon, label: t('profile_settings'), action: () => setShowSettings(true) },
    ];

    return (
        <div className="p-4 pb-24 min-h-screen">
            <h1 className="text-2xl font-bold mb-6">{t('profile_title')}</h1>

            <div className="flex items-center gap-4 mb-8">
                <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-4xl text-muted-foreground overflow-hidden">
                    {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                        <User className="w-10 h-10" />
                    )}
                </div>
                <div>
                    <h2 className="text-xl font-bold">{user.name}</h2>
                    <p className="text-muted-foreground">{user.username}</p>
                    <p className="text-xs text-muted-foreground mt-1">ID: {user.id}</p>
                </div>
            </div>

            {error ? (
                <div className="text-sm text-destructive mb-6">{error}</div>
            ) : null}

            {isLoading ? (
                <div className="grid grid-cols-3 gap-3 mb-8">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div
                            key={index}
                            className="bg-card border border-border rounded-xl p-3 flex flex-col items-center justify-center text-center"
                        >
                            <Skeleton className="w-6 h-6 rounded-full mb-2" />
                            <Skeleton className="h-5 w-10 mb-2" />
                            <Skeleton className="h-3 w-14" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-3 mb-8">
                    <div className="bg-card border border-border rounded-xl p-3 flex flex-col items-center justify-center text-center">
                        <Package className="w-6 h-6 text-primary mb-2" />
                        <span className="text-lg font-bold">{stats.ordersCount}</span>
                        <span className="text-xs text-muted-foreground">{t('profile_orders_stat')}</span>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-3 flex flex-col items-center justify-center text-center">
                        <span className="text-xl font-bold text-primary mb-1">₽</span>
                        <span className="text-lg font-bold">{stats.totalSpent.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">{t('profile_spent_stat')}</span>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-3 flex flex-col items-center justify-center text-center">
                        <Clock className="w-6 h-6 text-primary mb-2" />
                        <span className="text-lg font-bold">{stats.daysWithUs}</span>
                        <span className="text-xs text-muted-foreground">{t('profile_days_stat')}</span>
                    </div>
                </div>
            )}

            <div className="space-y-2 mb-8">
                {menuItems.map((item, index) => (
                    <button
                        key={index}
                        onClick={() => item.action ? item.action() : window.location.href = item.href!}
                        className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:bg-accent transition-colors text-left"
                    >
                        <div className="flex items-center gap-3">
                            <item.icon className="w-5 h-5 text-muted-foreground" />
                            <span className="font-medium">{item.label}</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </button>
                ))}
            </div>

            <div id="orders" className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{t('profile_history')}</h2>
                    {isLoading ? (
                        <span className="text-xs text-muted-foreground">{t('loading')}</span>
                    ) : null}
                </div>

                {isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 2 }).map((_, index) => (
                            <div key={index} className="bg-card border border-border rounded-2xl p-4 space-y-3">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-2/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-sm text-muted-foreground">{t('profile_no_orders')}</div>
                ) : (
                    <div className="space-y-3">
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                className="bg-card border border-border rounded-2xl p-4 space-y-3"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="text-xs text-muted-foreground">{t('profile_order')}</div>
                                        <div className="font-semibold">#{order.id.slice(0, 8)}</div>
                                        <div className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</div>
                                    </div>
                                    <div
                                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusStyles[order.status]}`}
                                    >
                                        {/* @ts-ignore */}
                                        {t(statusLabels[order.status])}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {order.items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between text-sm border border-border rounded-xl px-3 py-2"
                                        >
                                            <div>
                                                <div className="font-medium">{item.serviceName}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {item.accountType === "ready" ? t('catalog_ready_account') : t('catalog_own_account')} · {item.durationLabel}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold">{item.price * item.quantity} ₽</div>
                                                <div className="text-xs text-muted-foreground">x{item.quantity}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {(order.customerContact || order.customerNote || order.adminMessage) ? (
                                    <div className="space-y-2 text-sm">
                                        {order.customerContact ? (
                                            <div className="border border-border rounded-xl px-3 py-2">
                                                <div className="text-xs text-muted-foreground">{t('profile_contact')}</div>
                                                <div className="font-medium break-words">{order.customerContact}</div>
                                            </div>
                                        ) : null}
                                        {order.customerNote ? (
                                            <div className="border border-border rounded-xl px-3 py-2">
                                                <div className="text-xs text-muted-foreground">{t('profile_comment')}</div>
                                                <div className="font-medium whitespace-pre-wrap break-words">{order.customerNote}</div>
                                            </div>
                                        ) : null}
                                        {order.adminMessage ? (
                                            <div className="border border-border rounded-xl px-3 py-2 bg-accent/30">
                                                <div className="text-xs text-muted-foreground">{t('profile_admin_message')}</div>
                                                <div className="font-medium whitespace-pre-wrap break-words">{order.adminMessage}</div>
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}

                                {order.status === "COMPLETED" ? (
                                    <button
                                        onClick={() => openSupportBotForOrder(order.id)}
                                        className="w-full py-2.5 rounded-xl bg-destructive text-destructive-foreground font-semibold"
                                    >
                                        {t('profile_problem')}
                                    </button>
                                ) : null}

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">{t('catalog_total')}</span>
                                    <span className="text-lg font-bold">{order.totalAmount} ₽</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
