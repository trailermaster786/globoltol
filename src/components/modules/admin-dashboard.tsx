"use client";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/store/theme-store";
import { useStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";

// Sub-modules
import AdminDashboardModule from "./admin-dashboard-module";
import ReceiptsLogModule from "./receipts-log";
import OperatorShiftsModule from "./operator-shifts";
import ManageStationsModule from "./manage-stations";
import RateCardsModule from "./rate-cards";
import ManageOperatorsModule from "./manage-operators";
import VehicleCategoriesModule from "./vehicle-categories";
import FinancialReportsModule from "./financial-reports";
import AuditLogsModule from "./audit-logs";

type AdminView =
  | "dashboard"
  | "receipts"
  | "shifts"
  | "stations"
  | "rates"
  | "operators"
  | "vehicles"
  | "finance"
  | "audit";

const MENU_ITEMS: { key: AdminView; icon: string; labelKey: string }[] = [
  { key: "dashboard", icon: "📊", labelKey: "admin.dashboard" },
  { key: "receipts", icon: "🧾", labelKey: "admin.receiptsLog" },
  { key: "shifts", icon: "🕐", labelKey: "admin.operatorShifts" },
  { key: "stations", icon: "🛣️", labelKey: "admin.manageStations" },
  { key: "rates", icon: "💰", labelKey: "admin.rateCards" },
  { key: "operators", icon: "👤", labelKey: "admin.manageOperators" },
  { key: "vehicles", icon: "🚗", labelKey: "admin.vehicleCategories" },
  { key: "finance", icon: "📈", labelKey: "admin.financialReports" },
  { key: "audit", icon: "📋", labelKey: "admin.auditLogs" },
];

export function AdminDashboard() {
  const { t, lang, setLang } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const { logout } = useStore();
  const [view, setLocalView] = useState<AdminView>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderModule = () => {
    switch (view) {
      case "dashboard": return <AdminDashboardModule />;
      case "receipts": return <ReceiptsLogModule />;
      case "shifts": return <OperatorShiftsModule />;
      case "stations": return <ManageStationsModule />;
      case "rates": return <RateCardsModule />;
      case "operators": return <ManageOperatorsModule />;
      case "vehicles": return <VehicleCategoriesModule />;
      case "finance": return <FinancialReportsModule />;
      case "audit": return <AuditLogsModule />;
      default: return <AdminDashboardModule />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-16"} transition-all duration-300 bg-card border-r dark:bg-zinc-950 dark:border-zinc-800 flex flex-col`}>
        {/* Logo */}
        <div className="p-4 border-b dark:border-zinc-800 flex items-center gap-3">
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm leading-tight">Global Toll</div>
              <div className="text-xs text-muted-foreground truncate">Oman Operations</div>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 rounded hover:bg-muted dark:hover:bg-zinc-800 text-muted-foreground">
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => setLocalView(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                view === item.key
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-zinc-800"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {sidebarOpen && <span>{t(item.labelKey)}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-2 border-t dark:border-zinc-800 space-y-1">
          <button
            onClick={() => { logout(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <span className="text-base">🚪</span>
            {sidebarOpen && <span>{t("admin.logout")}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-14 border-b bg-card/80 backdrop-blur dark:bg-zinc-950/80 dark:border-zinc-800 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="font-semibold text-sm">{MENU_ITEMS.find((m) => m.key === view) ? t(MENU_ITEMS.find((m) => m.key === view)!.labelKey) : ""}</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="flex gap-1 bg-muted dark:bg-zinc-800 rounded-lg p-1">
              <button
                onClick={() => setLang("en")}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${lang === "en" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                EN
              </button>
              <button
                onClick={() => setLang("ar")}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${lang === "ar" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                AR
              </button>
            </div>
            {/* Theme Toggle */}
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-muted dark:hover:bg-zinc-800 text-muted-foreground transition-colors" title={theme === "light" ? t("common.dark") : t("common.light")}>
              {theme === "light" ? "🌙" : "☀️"}
            </button>
          </div>
        </header>

        {/* Module Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {renderModule()}
        </main>
      </div>
    </div>
  );
}
