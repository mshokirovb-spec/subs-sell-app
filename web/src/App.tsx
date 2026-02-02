import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { BottomNav } from "./components/BottomNav";
import { Catalog } from "./pages/Catalog";
import { Cart } from "./pages/Cart";
import { Profile } from "./pages/Profile";
import { CartProvider } from "./context/CartContext";
import { Admin } from "./pages/Admin";
import { SettingsProvider } from "./context/SettingsContext";
import { getTelegramInitData, getTelegramUser } from "./lib/telegram";
import { isAdminUser } from "./lib/admin";
import { api } from "./lib/api";
import { IntroSplash } from "./components/IntroSplash";

function App() {
  const [activeTab, setActiveTab] = useState("catalog");
  const [showIntro, setShowIntro] = useState(true);
  const telegramUser = useMemo(() => getTelegramUser(), []);
  const isAdmin = isAdminUser(telegramUser.id);

  useEffect(() => {
    const initData = getTelegramInitData();
    if (!initData) return;

    // Best-effort: create/update User row as soon as the mini-app opens.
    api.ensureMe({
      telegramId: telegramUser.id,
      username: telegramUser.username,
      firstName: telegramUser.firstName,
    }).catch(() => { });
  }, [telegramUser.id, telegramUser.username, telegramUser.firstName]);

  return (
    <SettingsProvider>
      <CartProvider>
        <div className="min-h-screen bg-background text-foreground font-sans antialiased">
          <motion.main
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            className="max-w-md mx-auto min-h-screen relative bg-background"
          >
            {activeTab === "catalog" && <Catalog />}
            {activeTab === "cart" && <Cart />}
            {activeTab === "profile" && <Profile />}
            {activeTab === "admin" && isAdmin && <Admin />}

            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
          </motion.main>

          {showIntro ? (
            <IntroSplash
              title="Wasub"
              stepSeconds={0.5}
              onFinish={() => setShowIntro(false)}
            />
          ) : null}
        </div>
      </CartProvider>
    </SettingsProvider>
  );
}

export default App;
