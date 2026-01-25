import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export interface CheckoutDetails {
    customerContact: string;
    customerNote: string;
}

export function CheckoutSheet({
    open,
    isLoading,
    details,
    onDetailsChange,
    onClose,
    onConfirm,
}: {
    open: boolean;
    isLoading: boolean;
    details: CheckoutDetails;
    onDetailsChange: (details: CheckoutDetails) => void;
    onClose: () => void;
    onConfirm: () => void;
}) {
    const normalizedContact = details.customerContact.trim();
    const normalizedNote = details.customerNote.trim();

    const isValid = useMemo(() => {
        // Contact is optional because Telegram user id is always available.
        if (normalizedContact.length > 200) return false;
        if (normalizedNote.length > 2000) return false;
        return true;
    }, [normalizedContact.length, normalizedNote.length]);

    return (
        <AnimatePresence>
            {open ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40 bg-black/60"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 40, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                        className="absolute left-0 right-0 bottom-0 bg-card border-t border-border rounded-t-3xl p-4"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="max-w-md mx-auto space-y-4">
                            <div>
                                <div className="text-lg font-bold">Оформление</div>
                                <div className="text-xs text-muted-foreground">
                                    Оплата не подключена. Оставь данные, чтобы админ смог выполнить заказ.
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-muted-foreground">Контакт (необязательно)</label>
                                <input
                                    value={details.customerContact}
                                    onChange={(event) =>
                                        onDetailsChange({
                                            ...details,
                                            customerContact: event.target.value,
                                        })
                                    }
                                    placeholder="@username / телефон / email"
                                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm"
                                    maxLength={200}
                                    disabled={isLoading}
                                />
                                <div className="text-[11px] text-muted-foreground">
                                    По умолчанию с тобой свяжутся в Telegram.
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-muted-foreground">Комментарий к заказу</label>
                                <textarea
                                    value={details.customerNote}
                                    onChange={(event) =>
                                        onDetailsChange({
                                            ...details,
                                            customerNote: event.target.value,
                                        })
                                    }
                                    placeholder="Например: регион, почта/логин, любые детали"
                                    className="w-full min-h-[110px] px-3 py-2 rounded-xl bg-background border border-border text-sm"
                                    maxLength={2000}
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2">
                                <button
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="py-3 rounded-xl bg-accent text-accent-foreground font-semibold disabled:opacity-70"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={onConfirm}
                                    disabled={!isValid || isLoading}
                                    className="py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-70"
                                >
                                    {isLoading ? 'Оформляем...' : 'Подтвердить'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}
