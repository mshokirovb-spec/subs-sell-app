import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { translations, type TranslationKey, type Language } from "../lib/translations";

type Theme = "light" | "dark";

interface SettingsContextType {
    theme: Theme;
    language: Language;
    toggleTheme: () => void;
    setLanguage: (lang: Language) => void;
    t: (key: TranslationKey) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
    // Initialize state from localStorage or defaults
    const [theme, setTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem("theme");
        return (saved as Theme) || "dark";
    });

    const [language, setLanguage] = useState<Language>(() => {
        const saved = localStorage.getItem("language");
        return (saved as Language) || "ru";
    });

    // Apply theme to document
    useEffect(() => {
        const root = document.documentElement;
        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
        localStorage.setItem("theme", theme);
    }, [theme]);

    // Persist language and update document
    useEffect(() => {
        document.documentElement.lang = language;
        localStorage.setItem("language", language);
    }, [language]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    };

    const t = (key: TranslationKey): string => {
        return translations[language][key] || key;
    };

    return (
        <SettingsContext.Provider value={{ theme, language, toggleTheme, setLanguage, t }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
}
