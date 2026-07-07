"use client";
import { useStore } from "@/store/app-store";
import { can } from "@/lib/rbac";
import { NAV_GROUPS, NAV_ITEMS } from "./nav-config";
import { GlobalTollLogo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export function Sidebar() {
  const currentUser = useStore((s) => s.currentUser);
  const activeModule = useStore((s) => s.activeModule);
  const setActiveModule = useStore((s) => s.setActiveModule);

  return (
    <aside
      className="w-64 shrink-0 h-screen sticky top-0 flex flex-col border-r"
      style={{
        background: "var(--sidebar)",
        borderColor: "var(--sidebar-border)",
      }}
    >
      {/* Logo header */}
      <div
        className="h-16 flex items-center px-5 border-b"
        style={{ borderColor: "var(--sidebar-border)" }}
      >
        <GlobalTollLogo size={36} variant="dark" />
      </div>

      <ScrollArea className="flex-1 scrollbar-thin">
        <nav className="px-3 py-4">
          {NAV_GROUPS.map((g) => {
            const items = NAV_ITEMS.filter((i) => i.group === g.group);
            const visible = items.filter((i) =>
              currentUser ? can(currentUser.role, i.key, "view") : false
            );
            if (visible.length === 0) return null;
            return (
              <div key={g.group} className="mb-5">
                <div
                  className="px-3 mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em]"
                  style={{ color: "var(--sidebar-foreground)", opacity: 0.55 }}
                >
                  {g.label}
                </div>
                <ul className="space-y-0.5">
                  {visible.map((item) => {
                    const Icon = item.icon;
                    const active = activeModule === item.key;
                    return (
                      <li key={item.key}>
                        <button
                          onClick={() => setActiveModule(item.key)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-left",
                            "hover:bg-[var(--sidebar-accent)]"
                          )}
                          style={{
                            background: active ? "var(--sidebar-primary)" : "transparent",
                            color: active
                              ? "var(--sidebar-primary-foreground)"
                              : "var(--sidebar-foreground)",
                            fontWeight: active ? 600 : 500,
                          }}
                          title={item.description}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer status */}
      <div
        className="px-4 py-3 border-t text-[0.65rem]"
        style={{
          borderColor: "var(--sidebar-border)",
          color: "var(--sidebar-foreground)",
          opacity: 0.6,
        }}
      >
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>All systems operational · p95 142ms</span>
        </div>
        <div className="mt-1">Global Toll v2.4.0 · Build 2026.07</div>
      </div>
    </aside>
  );
}
