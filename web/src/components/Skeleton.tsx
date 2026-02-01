import type { HTMLAttributes } from "react";
import { cn } from "../lib/utils";

type SkeletonProps = HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            aria-hidden
            className={cn(
                "animate-pulse rounded-md bg-muted/40",
                className
            )}
            {...props}
        />
    );
}
