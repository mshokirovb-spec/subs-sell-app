import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const shuffle = (values: number[]) => {
    const arr = [...values];
    for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

type IntroSplashProps = {
    title?: string;
    stepSeconds?: number;
    onFinish: () => void;
};

export function IntroSplash({
    title = "Wasub",
    stepSeconds = 0.5,
    onFinish,
}: IntroSplashProps) {
    const letters = useMemo(() => Array.from(title), [title]);

    // Keep the random order stable for this mount.
    const [order] = useState(() => shuffle(letters.map((_, index) => index)));

    const positionByIndex = useMemo(() => {
        const map = new Map<number, number>();
        order.forEach((index, pos) => map.set(index, pos));
        return map;
    }, [order]);

    const doneRef = useRef(false);
    const finishOnce = () => {
        if (doneRef.current) return;
        doneRef.current = true;
        onFinish();
    };

    const lastStartDelay = Math.max(0, (letters.length - 1) * stepSeconds);
    const fadeDelay = letters.length * stepSeconds; // ~2.5s for 5 letters

    return (
        <AnimatePresence>
            <motion.div
                key="intro"
                className="fixed inset-0 z-50 flex items-center justify-center bg-background"
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: fadeDelay, duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
                onAnimationComplete={() => {
                    // Only finish when the container fade-out completes.
                    finishOnce();
                }}
                onClick={() => finishOnce()}
                style={{
                    background:
                        "radial-gradient(1000px 700px at 50% 30%, rgba(56,189,248,0.12), transparent 55%), radial-gradient(800px 600px at 20% 80%, rgba(34,197,94,0.10), transparent 60%), radial-gradient(900px 650px at 85% 75%, rgba(59,130,246,0.10), transparent 60%), hsl(var(--background))",
                }}
            >
                <div className="text-center select-none">
                    <div className="text-[52px] leading-none font-extrabold tracking-tight">
                        {letters.map((char, index) => {
                            const position = positionByIndex.get(index) ?? index;
                            return (
                                <motion.span
                                    key={`${index}-${char}`}
                                    className="inline-block"
                                    initial={{ opacity: 0, y: 14, filter: "blur(10px)" }}
                                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                    transition={{
                                        delay: position * stepSeconds,
                                        duration: 0.35,
                                        ease: [0.2, 0.8, 0.2, 1],
                                    }}
                                >
                                    {char}
                                </motion.span>
                            );
                        })}
                    </div>
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            delay: Math.min(lastStartDelay + 0.2, fadeDelay - 0.2),
                            duration: 0.25,
                        }}
                        className="mt-4 text-xs text-muted-foreground"
                    >
                        Нажмите, чтобы пропустить
                    </motion.div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
