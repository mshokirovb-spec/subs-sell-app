import { Moon, Sun, Globe, ChevronLeft, Check } from "lucide-react";
import { useSettings } from "../context/SettingsContext";

interface SettingsProps {
    onBack: () => void;
}

export function Settings({ onBack }: SettingsProps) {
    const { theme, language, toggleTheme, setLanguage, t } = useSettings();

    return (
        <div className="p-4 pb-24 min-h-screen">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 rounded-full hover:bg-accent transition-colors"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold">{t('settings_title')}</h1>
            </div>

            <div className="space-y-6">
                {/* Theme Section */}
                <div className="bg-card border border-border rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-4">
                        {theme === 'dark' ? (
                            <Moon className="w-5 h-5 text-primary" />
                        ) : (
                            <Sun className="w-5 h-5 text-primary" />
                        )}
                        <h2 className="font-semibold">{t('settings_theme')}</h2>
                    </div>

                    <div className="flex bg-accent/50 p-1 rounded-xl">
                        <button
                            onClick={() => theme === 'dark' && toggleTheme()}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${theme === 'light'
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {t('settings_theme_light')}
                        </button>
                        <button
                            onClick={() => theme === 'light' && toggleTheme()}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${theme === 'dark'
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {t('settings_theme_dark')}
                        </button>
                    </div>
                </div>

                {/* Language Section */}
                <div className="bg-card border border-border rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-4">
                        <Globe className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold">{t('settings_language')}</h2>
                    </div>

                    <div className="space-y-2">
                        <button
                            onClick={() => setLanguage('ru')}
                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${language === 'ru'
                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                    : 'bg-accent/30 hover:bg-accent text-foreground border border-transparent'
                                }`}
                        >
                            <span>{t('settings_lang_ru')}</span>
                            {language === 'ru' && <Check className="w-4 h-4" />}
                        </button>

                        <button
                            onClick={() => setLanguage('en')}
                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${language === 'en'
                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                    : 'bg-accent/30 hover:bg-accent text-foreground border border-transparent'
                                }`}
                        >
                            <span>{t('settings_lang_en')}</span>
                            {language === 'en' && <Check className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
