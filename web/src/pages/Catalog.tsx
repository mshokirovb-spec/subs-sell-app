import { useMemo, useState } from "react";
import { useServices } from "../hooks/useServices";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Check, ShoppingCart, Plus, Minus, Search, Sparkles } from "lucide-react";
import { useCart } from "../context/CartContext";
import { ServiceIcon } from "../components/ServiceIcon";
import type { AccountType, Plan, Service } from "../lib/types";
import { looksLikeImageUrl, resolveServiceIcon } from "../lib/serviceIcons";
import { useSettings } from "../context/SettingsContext";
import { GlassCard } from "../components/ui/GlassCard";
import { Badge } from "../components/ui/Badge";

const fallbackIcon = "📦";

const COMING_SOON_SERVICE_NAMES = new Set([
    "Spotify",
    "Netflix",
    "Discord",
    "YouTube",
    "PS Plus",
]);

const CATEGORIES = ["Все", "Кино", "Музыка", "Игры", "Работа", "VPN"];

export function Catalog() {
    const { t } = useSettings();
    const { addToCart } = useCart();

    // React Query hook
    const { data: services = [], isLoading, error: queryError } = useServices();

    // Derived error string
    const error = queryError instanceof Error ? queryError.message : null;

    const [selectedCategory, setSelectedCategory] = useState("Все");
    const [searchQuery, setSearchQuery] = useState("");

    // Selection state
    const [comingSoonService, setComingSoonService] = useState<Service | null>(null);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [accountType, setAccountType] = useState<AccountType | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [quantity, setQuantity] = useState(1);

    const selectedServiceIcon = selectedService
        ? resolveServiceIcon(selectedService, fallbackIcon)
        : fallbackIcon;
    const selectedServiceIsImageIcon = looksLikeImageUrl(selectedServiceIcon);

    const filteredServices = useMemo(() => {
        return services.filter(service => {
            const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase());
            // Mock category logic since backend doesn't provide it yet
            const matchesCategory = selectedCategory === "Все" || true;
            return matchesSearch && matchesCategory;
        });
    }, [services, searchQuery, selectedCategory]);

    const availablePlans = useMemo(() => {
        if (!selectedService || !accountType) return [];
        return selectedService.plans
            .filter((plan) => plan.accountType === accountType)
            .sort((a, b) => a.durationMonths - b.durationMonths);
    }, [selectedService, accountType]);

    const handleServiceClick = (service: Service) => {
        if (COMING_SOON_SERVICE_NAMES.has(service.name)) {
            setComingSoonService(service);
            return;
        }
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
        <div className="min-h-screen pb-40 bg-[url('/bg-grid.svg')] bg-fixed bg-cover">
            {/* Decorative background gradients */}
            <div className="fixed top-0 left-0 w-full h-96 bg-primary/10 blur-[100px] pointer-events-none -z-10" />
            <div className="fixed bottom-0 right-0 w-full h-96 bg-accent/10 blur-[100px] pointer-events-none -z-10" />

            <AnimatePresence mode="wait">
                {!selectedService ? (
                    <motion.div
                        key="catalog"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-4 pt-6"
                    >
                        {/* Header & Search */}
                        <div className="mb-8 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                                        Каталог
                                    </h1>
                                    <p className="text-sm text-muted-foreground">Найди свою подписку</p>
                                </div>
                                <div className="p-2 bg-primary/10 rounded-full">
                                    <Sparkles className="w-5 h-5 text-primary" />
                                </div>
                            </div>

                            <div className="relative group">
                                <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Поиск сервисов..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-sans placeholder:text-muted-foreground/50"
                                />
                            </div>

                            {/* Categories */}
                            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat
                                            ? "bg-primary text-white shadow-lg shadow-primary/25"
                                            : "bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10"
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Grid */}
                        {isLoading ? (
                            <div className="grid grid-cols-2 gap-3">
                                {Array.from({ length: 6 }).map((_, index) => (
                                    <div key={index} className="aspect-[4/5] bg-white/5 rounded-2xl animate-pulse" />
                                ))}
                            </div>
                        ) : error ? (
                            <div className="p-6 text-center rounded-2xl bg-destructive/10 border border-destructive/20">
                                <p className="text-destructive mb-2">Ошибка загрузки</p>
                                <p className="text-xs text-destructive/80">{error}</p>
                            </div>
                        ) : filteredServices.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                Сервисы не найдены
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {filteredServices.map((service) => {
                                    const icon = resolveServiceIcon(service, fallbackIcon);
                                    const isImageIcon = looksLikeImageUrl(icon);

                                    return (
                                        <GlassCard
                                            key={service.id}
                                            onClick={() => handleServiceClick(service)}
                                            className="aspect-[4/5] flex flex-col items-center justify-between p-4 group relative overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                            <div className="w-full flex justify-end">
                                                <Badge variant="secondary" className="scale-90 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Popular
                                                </Badge>
                                            </div>

                                            <div
                                                className={`w-16 h-16 flex items-center justify-center overflow-hidden mb-2 transition-transform group-hover:scale-110 duration-500 ${isImageIcon
                                                    ? "rounded-2xl shadow-lg"
                                                    : "rounded-full shadow-lg shadow-primary/20"
                                                    }`}
                                                style={!isImageIcon ? { backgroundColor: service.color ?? "#334155" } : undefined}
                                            >
                                                <ServiceIcon
                                                    icon={icon}
                                                    alt={service.name}
                                                    fallback={service.icon ?? fallbackIcon}
                                                    className={isImageIcon ? "w-full h-full object-cover" : "text-3xl text-white"}
                                                />
                                            </div>

                                            <div className="text-center w-full z-10">
                                                <h3 className="font-bold text-lg mb-1 truncate">{service.name}</h3>
                                                <p className="text-xs text-muted-foreground">от 199 ₽</p>
                                            </div>
                                        </GlassCard>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                ) : (
                    // Detail View - Kept largely same functionality but improved UI
                    <motion.div
                        key="detail"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col h-full bg-background px-4 pt-6"
                    >
                        <div className="flex items-center mb-6">
                            <button
                                onClick={handleBack}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 active:scale-95 transition-all border border-white/10"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <h1 className="text-xl font-bold ml-4 font-display">{selectedService.name}</h1>
                        </div>

                        <div className="flex justify-center mb-8">
                            <div
                                className={`w-24 h-24 flex items-center justify-center overflow-hidden shadow-2xl shadow-primary/20 ${selectedServiceIsImageIcon
                                    ? "rounded-3xl border-2 border-white/10"
                                    : "rounded-full"
                                    }`}
                                style={!selectedServiceIsImageIcon ? { backgroundColor: selectedService.color ?? "#334155" } : undefined}
                            >
                                <ServiceIcon
                                    icon={selectedServiceIcon}
                                    alt={selectedService.name}
                                    fallback={fallbackIcon}
                                    className={selectedServiceIsImageIcon ? "w-full h-full object-cover" : "text-4xl text-white"}
                                />
                            </div>
                        </div>

                        <GlassCard className="mb-6 space-y-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Тип аккаунта</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {['ready', 'own'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => handleAccountTypeChange(type as AccountType)}
                                        className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 relative overflow-hidden ${accountType === type
                                            ? "border-primary bg-primary/20 text-primary shadow-lg shadow-primary/10"
                                            : "border-white/10 bg-white/5 hover:bg-white/10"
                                            }`}
                                    >
                                        <span className="font-semibold text-sm">{type === 'ready' ? t('catalog_ready_account') : t('catalog_own_account')}</span>
                                        {accountType === type && (
                                            <motion.div
                                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                className="absolute top-2 right-2 bg-primary text-white rounded-full p-0.5"
                                            >
                                                <Check className="w-3 h-3" />
                                            </motion.div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </GlassCard>

                        {accountType && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Срок подписки</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {availablePlans.map((plan) => (
                                        <button
                                            key={plan.id}
                                            onClick={() => setSelectedPlan(plan)}
                                            className={`p-3 rounded-lg border transition-all text-sm font-medium ${selectedPlan?.id === plan.id
                                                ? "border-primary bg-primary text-white shadow-md shadow-primary/20"
                                                : "border-white/10 bg-white/5 hover:bg-white/10"
                                                }`}
                                        >
                                            {plan.durationLabel}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Footer Actions (Quantity & Buy) */}
                        {accountType && selectedPlan && (
                            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-xl border-t border-white/10 z-40 pb-safe">
                                <div className="max-w-md mx-auto space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-1 border border-white/10">
                                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-md">
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="font-bold w-4 text-center">{quantity}</span>
                                            <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-md">
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground">Итого к оплате</p>
                                            <p className="text-2xl font-bold font-display text-primary">{calculatePrice() * quantity} ₽</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-3">
                                        <button onClick={handleAddToCart} className="col-span-1 py-4 rounded-xl bg-accent/20 text-accent font-bold flex items-center justify-center hover:bg-accent/30 border border-accent/20 transition-colors">
                                            <ShoppingCart className="w-6 h-6" />
                                        </button>
                                        <button onClick={handleBuyNow} className="col-span-3 py-4 rounded-xl bg-cta text-white font-bold text-lg shadow-lg shadow-cta/25 active:scale-[0.98] transition-all">
                                            {t('catalog_buy_now')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Coming Soon Modal */}
            <AnimatePresence>
                {comingSoonService && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        onClick={() => setComingSoonService(null)}
                    >
                        <GlassCard className="w-full max-w-sm text-center border-white/20">
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-3xl">
                                🔒
                            </div>
                            <h3 className="text-xl font-bold mb-2">Скоро будет доступно</h3>
                            <p className="text-muted-foreground mb-6">Сервис {comingSoonService.name} появится в ближайшее время!</p>
                            <button onClick={() => setComingSoonService(null)} className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 font-semibold transition-colors">
                                {t('catalog_ok')}
                            </button>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
