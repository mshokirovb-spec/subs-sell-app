import { useState, useEffect, useMemo } from "react";
import { BottomNav } from "./components/BottomNav";
import { Catalog } from "./pages/Catalog";
import { Cart } from "./pages/Cart";
import { Profile } from "./pages/Profile";
import { CartProvider } from "./context/CartContext";
import { Admin } from "./pages/Admin";
import { getTelegramInitData, getTelegramUser } from "./lib/telegram";
import { isAdminUser } from "./lib/admin";
import { api } from "./lib/api";

function App() {
  const [activeTab, setActiveTab] = useState("catalog");
  const telegramUser = useMemo(() => getTelegramUser(), []);
  const isAdmin = isAdminUser(telegramUser.id);

  // Set dark mode by default as requested
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    const initData = getTelegramInitData();
    if (!initData) return;

    // Best-effort: create/update User row as soon as the mini-app opens.
    api.ensureMe({
      telegramId: telegramUser.id,
      username: telegramUser.username,
      firstName: telegramUser.firstName,
    }).catch(() => {});
  }, [telegramUser.id, telegramUser.username, telegramUser.firstName]);

  return (
    <CartProvider>
      <div className="min-h-screen bg-background text-foreground font-sans antialiased">
        <main className="max-w-md mx-auto min-h-screen relative bg-background">
          {activeTab === "catalog" && <Catalog />}
          {activeTab === "cart" && <Cart />}
          {activeTab === "profile" && <Profile />}
          {activeTab === "admin" && isAdmin && <Admin />}

          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        </main>
      </div>
    </CartProvider>
  );
}

export default App;
