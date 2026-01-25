import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, ShoppingBag, Loader2 } from "lucide-react";
import { useCart } from "../context/CartContext";
import { api } from "../lib/api";
import { getTelegramUser } from "../lib/telegram";
import { openSupportChat } from "../lib/support";
import { CheckoutSheet, type CheckoutDetails } from "../components/CheckoutSheet";

export function Cart() {
    const { cartItems, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [checkoutDetails, setCheckoutDetails] = useState<CheckoutDetails>({
        customerContact: getTelegramUser().username ? `@${getTelegramUser().username}` : "",
        customerNote: "",
    });

    const handleSubmitOrder = async (details: CheckoutDetails) => {
        if (cartItems.length === 0) return;

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

            alert("Заказ успешно создан! Сейчас откроем чат с администратором.");
            setIsCheckoutOpen(false);
            openSupportChat();
            clearCart();
        } catch (error) {
            console.error(error);
            const message = error instanceof Error ? error.message : "Ошибка при создании заказа. Попробуйте позже.";
            alert(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 pb-24 min-h-screen">
            <h1 className="text-2xl font-bold mb-6">Корзина</h1>

            {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
                    <ShoppingBag className="w-16 h-16 mb-4 opacity-20" />
                    <p>Корзина пуста</p>
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
                                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl text-white shrink-0"
                                    style={{ backgroundColor: item.serviceColor }}
                                >
                                    {item.serviceIcon}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold truncate">{item.serviceName}</h3>
                                    <p className="text-xs text-muted-foreground">
                                        {item.accountType === "ready" ? "Готовый аккаунт" : "На ваш аккаунт"} • {item.durationLabel}
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
                                <span className="text-muted-foreground">Итого:</span>
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
                                        Обработка...
                                    </>
                                ) : (
                                    "Оформить заказ"
                                )}
                            </button>
                            <p className="text-xs text-muted-foreground text-center mt-2">
                                Оплата пока не подключена — заказ уйдет менеджеру.
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
