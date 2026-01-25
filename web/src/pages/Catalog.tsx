import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Check, ShoppingCart, Plus, Minus } from "lucide-react";
import { useCart } from "../context/CartContext";
import { api } from "../lib/api";
import type { AccountType, Plan, Service } from "../lib/types";

const fallbackIcon = "📦";

export function Catalog() {
    const { addToCart } = useCart();
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [accountType, setAccountType] = useState<AccountType | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        let isMounted = true;

        const loadServices = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await api.getServices();
                if (isMounted) {
                    setServices(data);
                }
            } catch {
                if (isMounted) {
                    setError("Не удалось загрузить каталог");
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadServices();

        return () => {
            isMounted = false;
        };
    }, []);

    const availablePlans = useMemo(() => {
        if (!selectedService || !accountType) return [];
        return selectedService.plans
            .filter((plan) => plan.accountType === accountType)
            .sort((a, b) => a.durationMonths - b.durationMonths);
    }, [selectedService, accountType]);

    const handleServiceClick = (service: Service) => {
        setSelectedService(service);
        setAccountType(null);
        setSelectedPlan(null);
        setQuantity(1);
    };

    const handleBack = () => {
        setSelectedService(null);
        setAccountType(null);
        setSelectedPlan(null);
        setQuantity(1);
    };

    const handleAccountTypeChange = (type: AccountType) => {
        setAccountType(type);
        const plans = selectedService?.plans
            .filter((plan) => plan.accountType === type)
            .sort((a, b) => a.durationMonths - b.durationMonths);
        setSelectedPlan(plans?.[0] ?? null);
    };

    const calculatePrice = () => {
        return selectedPlan?.price ?? 0;
    };

    const handleAddToCart = () => {
        if (!selectedService || !selectedPlan || !accountType) return;

        addToCart({
            serviceId: selectedService.id,
            planId: selectedPlan.id,
            serviceName: selectedService.name,
            serviceIcon: selectedService.icon ?? fallbackIcon,
            serviceColor: selectedService.color ?? "#334155",
            accountType,
            durationLabel: selectedPlan.durationLabel,
            price: selectedPlan.price,
            quantity,
        });

        handleBack();
    };

    const handleBuyNow = () => {
        handleAddToCart();
    };

    return (
        <div className="p-4 pb-40 min-h-[100dvh]">
            <AnimatePresence mode="wait">
                {!selectedService ? (
                    <motion.div
                        key="catalog"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <h1 className="text-2xl font-bold mb-6">Каталог</h1>
                        {isLoading ? (
                            <div className="text-sm text-muted-foreground">Загрузка...</div>
                        ) : error ? (
                            <div className="text-sm text-destructive">{error}</div>
                        ) : services.length === 0 ? (
                            <div className="text-sm text-muted-foreground">Каталог пуст</div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {services.map((service) => (
                                    <motion.div
                                        key={service.id}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleServiceClick(service)}
                                        className="aspect-square rounded-xl bg-card border border-border flex flex-col items-center justify-center p-4 shadow-sm active:shadow-inner transition-all cursor-pointer"
                                    >
                                        <div
                                            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-3 text-white shadow-md"
                                            style={{ backgroundColor: service.color ?? "#334155" }}
                                        >
                                            {service.icon ?? fallbackIcon}
                                        </div>
                                        <span className="font-semibold text-sm text-center leading-tight">
                                            {service.name}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="detail"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex flex-col h-full"
                    >
                        <div className="flex items-center mb-4">
                            <button
                                onClick={handleBack}
                                className="p-2 -ml-2 mr-2 rounded-full hover:bg-accent active:bg-accent/80 transition-colors"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <h1 className="text-xl font-bold">{selectedService.name}</h1>
                        </div>

                        <div className="flex justify-center mb-6">
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl text-white shadow-lg"
                                style={{ backgroundColor: selectedService.color ?? "#334155" }}
                            >
                                {selectedService.icon ?? fallbackIcon}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <button
                                onClick={() => handleAccountTypeChange("ready")}
                                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 relative ${
                                    accountType === "ready"
                                        ? "border-primary bg-primary/5 text-primary"
                                        : "border-border bg-card hover:border-primary/30"
                                }`}
                            >
                                <span className="font-semibold text-sm">Готовый аккаунт</span>
                                {accountType === "ready" && (
                                    <div className="absolute top-2 right-2">
                                        <Check className="w-3 h-3" />
                                    </div>
                                )}
                            </button>
                            <button
                                onClick={() => handleAccountTypeChange("own")}
                                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 relative ${
                                    accountType === "own"
                                        ? "border-primary bg-primary/5 text-primary"
                                        : "border-border bg-card hover:border-primary/30"
                                }`}
                            >
                                <span className="font-semibold text-sm">На ваш аккаунт</span>
                                {accountType === "own" && (
                                    <div className="absolute top-2 right-2">
                                        <Check className="w-3 h-3" />
                                    </div>
                                )}
                            </button>
                        </div>

                        {accountType && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-3"
                            >
                                <h3 className="font-semibold text-sm text-muted-foreground">Выберите срок</h3>
                                {availablePlans.length === 0 ? (
                                    <div className="text-xs text-muted-foreground">
                                        Нет вариантов для выбранного типа
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        {availablePlans.map((plan) => (
                                            <button
                                                key={plan.id}
                                                onClick={() => setSelectedPlan(plan)}
                                                className={`p-3 rounded-lg border transition-all text-sm font-medium ${
                                                    selectedPlan?.id === plan.id
                                                        ? "border-primary bg-primary text-primary-foreground shadow-md"
                                                        : "border-border bg-card hover:bg-accent"
                                                }`}
                                            >
                                                {plan.durationLabel}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {accountType && selectedPlan && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-6 flex items-center justify-between p-3 bg-card border border-border rounded-xl"
                            >
                                <span className="font-semibold text-sm">Количество</span>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center hover:bg-accent/80 transition-colors"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="font-bold w-4 text-center">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center hover:bg-accent/80 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        <AnimatePresence>
                            {accountType && selectedPlan && (
                                <motion.div
                                    initial={{ opacity: 0, y: 100 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 100 }}
                                    className="fixed bottom-[64px] left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
                                >
                                    <div className="max-w-md mx-auto w-full">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-muted-foreground text-sm">Итого:</span>
                                            <span className="text-xl font-bold">
                                                {calculatePrice() * quantity} ₽
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-4 gap-3">
                                            <button
                                                onClick={handleAddToCart}
                                                className="col-span-1 py-3.5 rounded-xl bg-accent text-accent-foreground font-bold flex items-center justify-center hover:bg-accent/80 transition-colors"
                                            >
                                                <ShoppingCart className="w-6 h-6" />
                                            </button>
                                            <button
                                                onClick={handleBuyNow}
                                                className="col-span-3 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-lg active:scale-[0.98] transition-all"
                                            >
                                                Купить сейчас
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
