"use client";
import { useState } from "react";
import { useStore } from "@/store/app-store";
import { GlobalTollLogo } from "@/components/brand/logo";
import {
  Shield, ChevronRight, Eye, EyeOff, UserCog, Car, ArrowRight,
} from "lucide-react";

export function LoginScreen() {
  const users = useStore((s) => s.users);
  const login = useStore((s) => s.login);
  const [email, setEmail] = useState("admin@omantoll.om");
  const [password, setPassword] = useState("•••••••••");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const admin = users.find((u) => u.role === "ADMIN");
  const operator = users.find((u) => u.role === "OPERATOR");

  const handleLogin = () => {
    const u = users.find((x) => x.email === email);
    if (!u) {
      setError("No account found with that email. Use one of the role buttons below.");
      return;
    }
    setError("");
    login(u.id);
  };

  return (
    <div
      className="min-h-screen grid lg:grid-cols-2"
      style={{
        background:
          "linear-gradient(135deg, #F2F2F0 0%, #FFFFFF 40%, #F2F2F0 100%)",
      }}
    >
      {/* Left brand panel */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 text-white relative overflow-hidden"
        style={{
          background:
            "linear-gradient(155deg, #2C3E50 0%, #1F2D3D 50%, #1A2B3C 100%)",
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
            Oman Toll Operations<br />Management Platform
          </h1>
          <p className="text-sm opacity-80 max-w-md leading-relaxed">
            Production toll-tax management for the Sultanate of Oman.
            Real-time lane transaction capture, Oman plate auto-formatting,
            multi-plaza operations, and complete financial audit trails.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-6 max-w-md">
            <div>
              <div className="text-2xl font-bold text-[#E0A030]">3</div>
              <div className="text-[0.65rem] opacity-70 uppercase tracking-wider">Toll Plazas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#E0A030]">12</div>
              <div className="text-[0.65rem] opacity-70 uppercase tracking-wider">Active Lanes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#E0A030]">7</div>
              <div className="text-[0.65rem] opacity-70 uppercase tracking-wider">Vehicle Classes</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-[0.7rem] opacity-60 flex items-center gap-2">
          <Shield className="h-3.5 w-3.5" />
          ISO 27001 · SOC 2 Type II · Oman VAT Compliant
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden mb-6">
            <GlobalTollLogo size={40} />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">Sign in</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Access your Global Toll console
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Work email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                placeholder="you@omantoll.om"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-foreground">Password</label>
                <button className="text-xs text-teal hover:underline">
                  Forgot?
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
              Sign in
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Demo role quick-pick */}
          <div className="border-t border-border pt-5">
            <div className="text-xs font-medium text-muted-foreground mb-2.5 uppercase tracking-wider">
              Quick access — choose your role
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
                    <div className="text-sm font-semibold text-foreground">Administrator</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {admin.email} · Full dashboard &amp; management access
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-teal group-hover:translate-x-0.5 transition-all" />
                </button>
              )}
              {operator && (
                <button
                  onClick={() => login(operator.id)}
                  className="flex items-center gap-3 p-3 rounded-md border-2 border-border hover:border-[var(--color-gold)] hover:bg-amber-50/30 text-left transition-all group"
                >
                  <div className="h-10 w-10 rounded-md bg-[var(--color-gold)]/15 grid place-items-center shrink-0" style={{ color: "var(--color-gold-dark)" }}>
                    <Car className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-foreground">Lane Operator</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {operator.email} · 5-step transaction console
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-[var(--color-gold-dark)] group-hover:translate-x-0.5 transition-all" />
                </button>
              )}
            </div>
            <p className="text-[0.6rem] text-muted-foreground mt-3 leading-relaxed">
              Operator sees only the transaction entry console. Admin sees the full dashboard with
              plazas, pricing, vehicles, and audit management.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
