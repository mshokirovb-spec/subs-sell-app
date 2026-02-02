import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, ShoppingBag, Loader2 } from "lucide-react";
import { useCart } from "../context/CartContext";
import { api } from "../lib/api";
import { getTelegramUser } from "../lib/telegram";
import { openSupportChat } from "../lib/support";
import { CheckoutSheet, type CheckoutDetails } from "../components/CheckoutSheet";
import { ServiceIcon } from "../components/ServiceIcon";
import { resolveServiceIcon } from "../lib/serviceIcons";
import { useSettings } from "../context/SettingsContext";

export function Cart() {
    const { t } = useSettings();
    const { cartItems, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [checkoutDetails, setCheckoutDetails] = useState<CheckoutDetails>({
        customerContact: getTelegramUser().username ? `@${getTelegramUser().username}` : "",
        customerNote: "",
    });

    const handleSubmitOrder = async (details: CheckoutDetails) => {
        if (cartItems.length === 0) return;

        // Check if any item is "ready" account (needs admin chat)
        const hasReadyAccount = cartItems.some(item => item.accountType === "ready");

        setIsLoading(true);
        try {
            const user = getTelegramUser();

            await api.createOrder({
                telegramId: user.id,
                username: user.username,
                firstName: user.firstName,
                customerContact: details.customerContact,
                customerNote: details.customerNote,
                items: cartItems.map(item => ({
                    planId: item.planId,
                    quantity: item.quantity
                }))
            });

            setIsCheckoutOpen(false);
            clearCart();

            if (hasReadyAccount) {
                // Ready account - need to chat with admin
                alert(t('cart_success_ready'));
                openSupportChat();
            } else {
                // Own account - admin will handle without chat
                alert(t('cart_success_own'));
            }
        } catch (error) {
            console.error(error);
            const message = error instanceof Error ? error.message : t('cart_error_create');
            alert(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 pb-24 min-h-screen">
            <h1 className="text-2xl font-bold mb-6">{t('cart_title')}</h1>

            {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
                    <ShoppingBag className="w-16 h-16 mb-4 opacity-20" />
                    <p>{t('cart_empty')}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {cartItems.map((item) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm"
                            >
                                <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden text-2xl text-white shrink-0"
                                    style={{ backgroundColor: item.serviceColor }}
                                >
                                    <ServiceIcon
                                        icon={resolveServiceIcon(
                                            { name: item.serviceName, icon: item.serviceIcon },
                                            item.serviceIcon
                                        )}
                                        alt={item.serviceName}
                                        fallback={item.serviceIcon}
                                    />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold truncate">{item.serviceName}</h3>
                                    <p className="text-xs text-muted-foreground">
                                        {item.accountType === "ready" ? t('catalog_ready_account') : t('catalog_own_account')} • {item.durationLabel}
                                    </p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="flex items-center bg-accent rounded-lg">
                                            <button
                                                onClick={() => updateQuantity(item.id, -1)}
                                                className="w-8 h-8 flex items-center justify-center hover:bg-black/5 active:bg-black/10 rounded-l-lg"
                                                disabled={isLoading}
                                            >
                                                -
                                            </button>
                                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, 1)}
                                                className="w-8 h-8 flex items-center justify-center hover:bg-black/5 active:bg-black/10 rounded-r-lg"
                                                disabled={isLoading}
                                            >
                                                +
                                            </button>
                                        </div>
                                        <span className="font-bold ml-auto">{item.price * item.quantity} ₽</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                                    disabled={isLoading}
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    <div className="fixed bottom-[64px] left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border z-20">
                        <div className="max-w-md mx-auto w-full">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-muted-foreground">{t('cart_total')}</span>
                                <span className="text-2xl font-bold">{totalPrice} ₽</span>
                            </div>
                            <button
                                onClick={() => {
                                    const user = getTelegramUser();
                                    setCheckoutDetails({
                                        customerContact: user.username ? `@${user.username}` : "",
                                        customerNote: "",
                                    });
                                    setIsCheckoutOpen(true);
                                }}
                                disabled={isLoading}
                                className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        {t('cart_processing')}
                                    </>
                                ) : (
                                    t('cart_checkout')
                                )}
                            </button>
                            <p className="text-xs text-muted-foreground text-center mt-2">
                                {t('cart_payment_notice')}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <CheckoutSheet
                open={isCheckoutOpen}
                isLoading={isLoading}
                details={checkoutDetails}
                onDetailsChange={setCheckoutDetails}
                onClose={() => setIsCheckoutOpen(false)}
                onConfirm={() => handleSubmitOrder(checkoutDetails)}
            />
        </div>
    );
}
