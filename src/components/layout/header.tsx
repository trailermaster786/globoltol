"use client";
import { useState } from "react";
import { useStore, roleLabel } from "@/store/app-store";
import { ROLES } from "@/lib/rbac";
import { MODULE_TITLES } from "./nav-config";
import {
  Bell, ChevronDown, LogOut, Search, Shield, Building2,
  UserCircle2, CheckCircle2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Header() {
  const currentUser = useStore((s) => s.currentUser);
  const activeModule = useStore((s) => s.activeModule);
  const tenants = useStore((s) => s.tenants);
  const currentTenantId = useStore((s) => s.currentTenantId);
  const switchTenant = useStore((s) => s.switchTenant);
  const users = useStore((s) => s.users);
  const login = useStore((s) => s.login);
  const logout = useStore((s) => s.logout);
  const notifications = useStore((s) => s.notifications);

  const [q, setQ] = useState("");
  const moduleMeta = MODULE_TITLES[activeModule];
  const initials = (currentUser?.name ?? "")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const unreadNotifs = notifications.filter((n) =>
    n.createdAt && (Date.now() - new Date(n.createdAt).getTime()) < 24 * 60 * 60_000
  ).length;

  return (
    <header className="h-16 sticky top-0 z-30 bg-card border-b border-border flex items-center px-6 gap-4">
      {/* Module title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-foreground truncate">
          {moduleMeta?.title}
        </h1>
        <p className="text-xs text-muted-foreground truncate hidden md:block">
          {moduleMeta?.subtitle}
        </p>
      </div>

      {/* Search */}
      <div className="hidden lg:block w-64 relative">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search plazas, plates, txns…"
          className="pl-9 h-9 text-sm bg-muted/40 border-0"
        />
      </div>

      {/* Tenant selector — only for SUPER_ADMIN */}
      {currentUser?.role === "SUPER_ADMIN" && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="hidden md:flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-background hover:bg-muted text-sm">
              <Building2 className="h-3.5 w-3.5 text-teal" />
              <span className="font-medium max-w-32 truncate">
                {tenants.find((t) => t.id === currentTenantId)?.name}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Switch tenant context
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {tenants.map((t) => (
              <DropdownMenuItem
                key={t.id}
                onClick={() => switchTenant(t.id)}
                className="flex items-start justify-between gap-2 py-2"
              >
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{t.name}</div>
                  <div className="text-[0.65rem] text-muted-foreground">
                    {t.subscriptionTier} · {t.status}
                  </div>
                </div>
                {t.id === currentTenantId && (
                  <CheckCircle2 className="h-4 w-4 text-teal shrink-0 mt-0.5" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="relative h-9 w-9 grid place-items-center rounded-md hover:bg-muted">
            <Bell className="h-4 w-4 text-foreground" />
            {unreadNotifs > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-gold" />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 p-0">
          <div className="px-3 py-2 border-b border-border">
            <div className="text-sm font-semibold">Notifications</div>
            <div className="text-[0.65rem] text-muted-foreground">
              {unreadNotifs} events in last 24h
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto scrollbar-thin">
            {notifications.slice(0, 8).map((n) => (
              <div
                key={n.id}
                className="px-3 py-2 border-b border-border last:border-0 hover:bg-muted/50"
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <Badge
                    variant="outline"
                    className="text-[0.55rem] h-4 px-1.5 font-medium"
                  >
                    {n.channel}
                  </Badge>
                  <span className="text-[0.65rem] text-muted-foreground">
                    {n.template}
                  </span>
                </div>
                <p className="text-xs text-foreground line-clamp-2">
                  {n.payload}
                </p>
              </div>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Role switcher (demo) + user menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 h-9 px-2 rounded-md hover:bg-muted">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-teal text-white text-[0.65rem] font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold leading-tight max-w-32 truncate">
                {currentUser?.name}
              </div>
              <div className="text-[0.6rem] text-muted-foreground leading-tight">
                {currentUser ? roleLabel(currentUser.role) : ""}
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-2">
            <Shield className="h-3.5 w-3.5" />
            Demo: switch role perspective
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {users.slice(0, 9).map((u) => (
            <DropdownMenuItem
              key={u.id}
              onClick={() => login(u.id)}
              className="flex items-center gap-2 py-1.5"
            >
              <UserCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium truncate">{u.name}</div>
                <div className="text-[0.6rem] text-muted-foreground">
                  {roleLabel(u.role)}
                </div>
              </div>
              {u.id === currentUser?.id && (
                <CheckCircle2 className="h-3.5 w-3.5 text-teal" />
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
            <LogOut className="h-3.5 w-3.5 mr-2" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
