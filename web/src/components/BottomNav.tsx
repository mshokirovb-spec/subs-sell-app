import { Home, ShoppingCart, Shield, User } from "lucide-react";
import { cn } from "../lib/utils";
import { useCart } from "../context/CartContext";
import { getTelegramUser } from "../lib/telegram";
import { isAdminUser } from "../lib/admin";

interface BottomNavProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
    const { totalItems } = useCart();
    const isAdmin = isAdminUser(getTelegramUser().id);

    const tabs = [
        { id: "catalog", label: "Каталог", icon: Home },
        { id: "cart", label: "Корзина", icon: ShoppingCart, badge: totalItems },
        { id: "profile", label: "Профиль", icon: User },
        ...(isAdmin ? [{ id: "admin", label: "Админ", icon: Shield }] : []),
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border pb-safe z-30">
            <div className="max-w-md mx-auto">
                <div className="flex justify-around items-center h-16">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={cn(
                                    "flex flex-col items-center justify-center w-full h-full transition-colors relative",
                                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <div className="relative">
                                    <Icon className="w-6 h-6 mb-1" />
                                    {tab.badge ? (
                                        <span className="absolute -top-1 -right-2 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] flex items-center justify-center">
                                            {tab.badge}
                                        </span>
                                    ) : null}
                                </div>
                                <span className="text-xs font-medium">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
