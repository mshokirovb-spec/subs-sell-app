import { type HTMLMotionProps, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export function GlassCard({ children, className, hoverEffect = true, ...props }: GlassCardProps) {
    return (
        <motion.div
            className={cn(
                "glass rounded-2xl p-4 transition-all duration-300",
                hoverEffect && "cursor-pointer hover:bg-white/10 hover:border-white/20 hover:shadow-xl hover:-translate-y-1",
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
}
