import { memo, useMemo, useState } from "react";
import { looksLikeImageUrl } from "../lib/serviceIcons";

interface ServiceIconProps {
    icon?: string;
    alt?: string;
    fallback?: string;
    className?: string;
}

const buildImageCandidates = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return [] as string[];

    // Data URLs have no meaningful alternative.
    if (trimmed.startsWith("data:image/")) return [trimmed];

    const match = /^([^?#]+)([?#].*)?$/.exec(trimmed);
    const path = match?.[1] ?? trimmed;
    const suffix = match?.[2] ?? "";

    const extMatch = /\.([a-z0-9]+)$/i.exec(path);
    if (!extMatch) return [trimmed];

    const ext = extMatch[1].toLowerCase();
    const base = path.slice(0, -(ext.length + 1));

    // Try the given extension first, then a few common alternates.
    const alternates = ["png", "jpg", "jpeg", "webp", "svg"];
    const candidates = [ext, ...alternates.filter((item) => item !== ext)];
    const uniq = Array.from(new Set(candidates));

    return uniq.map((item) => `${base}.${item}${suffix}`);
};

export const ServiceIcon = memo(function ServiceIcon({
    icon,
    alt = "",
    fallback = "📦",
    className,
}: ServiceIconProps) {
    const value = useMemo(() => String(icon ?? "").trim(), [icon]);
    const isImage = useMemo(() => looksLikeImageUrl(value), [value]);

    const candidates = useMemo(() => {
        if (!value || !isImage) return [] as string[];
        return buildImageCandidates(value);
    }, [value, isImage]);

    const [state, setState] = useState<{ key: string; index: number; failed: boolean }>(
        () => ({ key: value, index: 0, failed: false })
    );

    const effective = state.key === value ? state : { key: value, index: 0, failed: false };

    if (!value) {
        return <span aria-hidden>{fallback}</span>;
    }

    if (!isImage) {
        return <span aria-hidden>{value}</span>;
    }

    const src = candidates[effective.index];
    if (!src || effective.failed) {
        return <span aria-hidden>{fallback}</span>;
    }

    return (
        <img
            src={src}
            alt={alt}
            className={className ?? "w-full h-full object-cover block"}
            loading="lazy"
            decoding="async"
            onError={() => {
                setState((prev) => {
                    const current =
                        prev.key === value
                            ? prev
                            : { key: value, index: 0, failed: false };

                    if (current.index < candidates.length - 1) {
                        return { key: value, index: current.index + 1, failed: false };
                    }

                    return { key: value, index: current.index, failed: true };
                });
            }}
        />
    );
});
