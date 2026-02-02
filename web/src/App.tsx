import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { BottomNav } from "./components/BottomNav";
import { CartProvider } from "./context/CartContext";
import { SettingsProvider } from "./context/SettingsContext";
import { ToastProvider } from "./context/ToastContext";
import { getTelegramInitData, getTelegramUser } from "./lib/telegram";
import { isAdminUser } from "./lib/admin";
import { api } from "./lib/api";
import { IntroSplash } from "./components/IntroSplash";

const Catalog = lazy(() => import("./pages/Catalog").then(m => ({ default: m.Catalog })));
const Cart = lazy(() => import("./pages/Cart").then(m => ({ default: m.Cart })));
const Profile = lazy(() => import("./pages/Profile").then(m => ({ default: m.Profile })));
const Admin = lazy(() => import("./pages/Admin").then(m => ({ default: m.Admin })));

const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

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
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <ToastProvider>
          <CartProvider>
            <div className="min-h-screen bg-background text-foreground font-sans antialiased">
              <motion.main
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
                className="max-w-md mx-auto min-h-screen relative bg-background"
              >
                <Suspense fallback={<PageLoader />}>
                  {activeTab === "catalog" && <Catalog />}
                  {activeTab === "cart" && <Cart />}
                  {activeTab === "profile" && <Profile />}
                  {activeTab === "admin" && isAdmin && <Admin />}
                </Suspense>

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
        </ToastProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}

export default App;
