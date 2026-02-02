import { cn } from "@/lib/utils";

interface BadgeProps {
    children: React.ReactNode;
    variant?: "default" | "outline" | "secondary" | "accent";
    className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
    const variants = {
        default: "bg-primary/20 text-primary border-primary/20",
        outline: "border border-white/20 text-muted-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        accent: "bg-cta/20 text-cta border-cta/20",
    };

    return (
        <span className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            variants[variant],
            className
        )}>
            {children}
        </span>
    );
}
