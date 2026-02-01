const DEFAULT_FALLBACK_ICON = "📦";

const normalizeName = (name: string) => name.trim().toLowerCase();

const iconByServiceName: Record<string, string> = {
    spotify: "/icons/spotify.png",
    gemini: "/icons/gemini.png",
    youtube: "/icons/youtube.png",
    discord: "/icons/discord.png",
    netflix: "/icons/netflix.png",
    chatgpt: "/icons/chatgpt.png",
};

export const looksLikeImageUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return false;

    if (trimmed.startsWith("data:image/")) return true;
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return true;
    if (trimmed.startsWith("/")) return true;

    return /\.(svg|png|jpe?g|webp|gif)(\?.*)?$/i.test(trimmed);
};

export const resolveServiceIcon = (
    service: { name?: string | null; icon?: string | null },
    fallback = DEFAULT_FALLBACK_ICON
) => {
    const rawIcon = typeof service.icon === "string" ? service.icon.trim() : "";

    // If backend returns a URL/path, honor it.
    if (rawIcon && looksLikeImageUrl(rawIcon)) return rawIcon;

    const rawName = typeof service.name === "string" ? service.name : "";
    const mapped = iconByServiceName[normalizeName(rawName)];
    if (mapped) return mapped;

    // Otherwise keep the backend icon (emoji) or fallback.
    return rawIcon || fallback;
};
