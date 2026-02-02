import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useProfile(telegramId: string) {
    return useQuery({
        queryKey: ["profile", telegramId],
        queryFn: () => api.getProfile(telegramId),
        enabled: !!telegramId,
    });
}
