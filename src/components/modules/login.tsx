"use client";
import { useState } from "react";
import { useStore } from "@/store/app-store";
import { useI18n } from "@/lib/i18n";
import { GlobalTollLogo } from "@/components/brand/logo";
import {
  Shield, ChevronRight, Eye, EyeOff, UserCog, Car, ArrowRight,
  Globe, Sun, Moon, Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function LoginScreen() {
  const users = useStore((s) => s.users);
  const login = useStore((s) => s.login);
  const plazas = useStore((s) => s.plazas);
  const setSelectedPlazaStore = useStore((s) => s.setSelectedPlaza);
  const setOpeningFloatStore = useStore((s) => s.setOpeningFloat);
  const { lang, setLang, t } = useI18n();
  const [email, setEmail] = useState("admin@omantoll.om");
  const [password, setPassword] = useState("•••••••••");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Plaza shift modal state
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [selectedPlaza, setSelectedPlaza] = useState("");
  const [openingFloat, setOpeningFloat] = useState("");

  const admin = users.find((u) => u.role === "ADMIN");
  const operator = users.find((u) => u.role === "OPERATOR");

  const handleLogin = () => {
    const u = users.find((x) => x.email === email);
    if (!u) {
      setError(t("login.noAccount"));
      return;
    }
    setError("");
    login(u.id);
  };

  const handleOperatorClick = () => {
    setShiftModalOpen(true);
  };

  const handleOpenShift = () => {
    if (!selectedPlaza || !openingFloat) {
      toast.error(t("plaza.required"));
      return;
    }
    const float = parseFloat(openingFloat);
    if (isNaN(float) || float < 0) {
      toast.error(t("plaza.required"));
      return;
    }
    setSelectedPlazaStore(selectedPlaza);
    setOpeningFloatStore(float);
    setShiftModalOpen(false);
    toast.success(`${t("plaza.openShift")} — ${formatCurrency(float)} OMR`);
    if (operator) login(operator.id);
  };

  const formatCurrency = (val: number) => val.toFixed(3);

  const isRTL = lang === "ar";

  return (
    <div
      className={cn(
        "min-h-screen grid lg:grid-cols-2",
        isRTL && "[direction:rtl]"
      )}
      style={{
        background:
          theme === "dark"
            ? "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #1a1a2e 100%)"
            : "linear-gradient(135deg, #F2F2F0 0%, #FFFFFF 40%, #F2F2F0 100%)",
      }}
    >
      {/* Top-right controls */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        {/* Language switcher */}
        <div className="flex items-center gap-1 bg-card/80 backdrop-blur-sm border border-border rounded-lg px-2 py-1.5">
          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as "en" | "ar")}
            className="bg-transparent text-xs font-medium text-foreground border-none outline-none cursor-pointer"
          >
            <option value="en">EN</option>
            <option value="ar">AR</option>
          </select>
        </div>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="h-8 w-8 rounded-lg bg-card/80 backdrop-blur-sm border border-border grid place-items-center hover:bg-muted transition-colors"
        >
          {theme === "light" ? (
            <Moon className="h-3.5 w-3.5 text-foreground" />
          ) : (
            <Sun className="h-3.5 w-3.5 text-foreground" />
          )}
        </button>
      </div>

      {/* Left brand panel */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 text-white relative overflow-hidden"
        style={{
          background:
            theme === "dark"
              ? "linear-gradient(155deg, #0f3443 0%, #0a1628 50%, #0d1b2a 100%)"
              : "linear-gradient(155deg, #2C3E50 0%, #1F2D3D 50%, #1A2B3C 100%)",
        }}
      >
        <svg
          className="absolute -bottom-20 -right-20 opacity-10"
          width="400"
          height="400"
          viewBox="0 0 64 64"
          fill="none"
        >
          <path d="M 11 24 C 11 12, 53 12, 53 24" stroke="#2E8B8B" strokeWidth="3" fill="none" />
          <rect x="8" y="22" width="5" height="34" rx="1.5" fill="#2E8B8B" />
          <rect x="51" y="22" width="5" height="34" rx="1.5" fill="#2E8B8B" />
          <path d="M 13 56 C 24 54, 34 48, 44 38 C 50 32, 56 28, 62 22" stroke="#2E8B8B" strokeWidth="3" fill="none" />
        </svg>

        <div className="relative z-10">
          <GlobalTollLogo size={48} variant="dark" />
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-3xl font-bold tracking-tight leading-tight">
            {t("login.brandTitle")}
          </h1>
          <p className="text-sm opacity-80 max-w-md leading-relaxed">
            {t("login.brandDesc")}
          </p>

          <div className="grid grid-cols-3 gap-4 pt-6 max-w-md">
            <div>
              <div className="text-2xl font-bold text-[#E0A030]">3</div>
              <div className="text-[0.65rem] opacity-70 uppercase tracking-wider">{t("login.plazas")}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#E0A030]">12</div>
              <div className="text-[0.65rem] opacity-70 uppercase tracking-wider">{t("login.lanes")}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#E0A030]">7</div>
              <div className="text-[0.65rem] opacity-70 uppercase tracking-wider">{t("login.vehicleClasses")}</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-[0.7rem] opacity-60 flex items-center gap-2">
          <Shield className="h-3.5 w-3.5" />
          {t("login.compliance")}
        </div>
      </div>

      {/* Right login panel */}
      <div className={cn("flex items-center justify-center p-8 lg:p-16", isRTL && "direction-ltr")}>
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden mb-6">
            <GlobalTollLogo size={40} />
          </div>

          <div>
            <h2 className={cn("text-2xl font-bold text-foreground", isRTL && "text-right")}>{t("login.title")}</h2>
            <p className={cn("text-sm text-muted-foreground mt-1", isRTL && "text-right")}>
              {t("login.subtitle")}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className={cn("text-xs font-medium text-foreground mb-1.5 block", isRTL && "text-right")}>
                {t("login.email")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                placeholder="you@omantoll.om"
                dir="ltr"
              />
            </div>
            <div>
              <div className={cn("flex items-center justify-between mb-1.5", isRTL && "flex-row-reverse")}>
                <label className="text-xs font-medium text-foreground">{t("login.password")}</label>
                <button className="text-xs text-teal hover:underline">
                  {t("login.forgot")}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 px-3 pr-10 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground", isRTL ? "left-3" : "right-3")}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              className="w-full h-10 rounded-md text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #2E8B8B 0%, #1F6868 100%)",
              }}
            >
              {t("login.signIn")}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Demo role quick-pick */}
          <div className="border-t border-border pt-5">
            <div className={cn("text-xs font-medium text-muted-foreground mb-2.5 uppercase tracking-wider", isRTL && "text-right")}>
              {t("login.quickAccess")}
            </div>
            <div className="grid grid-cols-1 gap-2">
              {admin && (
                <button
                  onClick={() => login(admin.id)}
                  className="flex items-center gap-3 p-3 rounded-md border-2 border-border hover:border-teal hover:bg-teal/5 text-left transition-all group"
                >
                  <div className="h-10 w-10 rounded-md bg-teal/10 text-teal grid place-items-center shrink-0">
                    <UserCog className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-foreground">{t("login.admin")}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {admin.email} · {t("login.adminDesc")}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-teal group-hover:translate-x-0.5 transition-all" />
                </button>
              )}
              {operator && (
                <button
                  onClick={handleOperatorClick}
                  className="flex items-center gap-3 p-3 rounded-md border-2 border-border hover:border-[var(--color-gold)] hover:bg-amber-50/30 text-left transition-all group"
                >
                  <div className="h-10 w-10 rounded-md bg-[var(--color-gold)]/15 grid place-items-center shrink-0" style={{ color: "var(--color-gold-dark)" }}>
                    <Car className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-foreground">{t("login.operator")}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {operator.email} · {t("login.operatorDesc")}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-[var(--color-gold-dark)] group-hover:translate-x-0.5 transition-all" />
                </button>
              )}
            </div>
            <p className={cn("text-[0.6rem] text-muted-foreground mt-3 leading-relaxed", isRTL && "text-right")}>
              {t("login.operatorNote")}
            </p>
          </div>
        </div>
      </div>

      {/* Plaza Selection + Opening Float Modal */}
      <Dialog open={shiftModalOpen} onOpenChange={setShiftModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-teal" />
              {t("plaza.title")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-medium mb-1.5 block">{t("plaza.plazaStation")}</Label>
              <Select value={selectedPlaza} onValueChange={setSelectedPlaza}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={t("plaza.selectPlaza")} />
                </SelectTrigger>
                <SelectContent>
                  {plazas.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[0.65rem] text-muted-foreground">{p.code}</span>
                        <span>{p.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium mb-1.5 block">{t("plaza.openingFloat")}</Label>
              <Input
                type="number"
                step="0.001"
                min="0"
                value={openingFloat}
                onChange={(e) => setOpeningFloat(e.target.value)}
                placeholder={t("plaza.floatPlaceholder")}
                className="h-11 font-mono text-lg"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShiftModalOpen(false)}>
              {t("plaza.cancel")}
            </Button>
            <Button
              onClick={handleOpenShift}
              style={{ background: "linear-gradient(135deg, #2E8B8B 0%, #1F6868 100%)" }}
            >
              {t("plaza.openShift")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
