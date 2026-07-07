"use client";
import { useState } from "react";
import { useStore, roleLabel } from "@/store/app-store";
import { GlobalTollLogo } from "@/components/brand/logo";
import { Shield, ChevronRight, Eye, EyeOff } from "lucide-react";
import { ROLES } from "@/lib/rbac";

export function LoginScreen() {
  const users = useStore((s) => s.users);
  const login = useStore((s) => s.login);
  const [email, setEmail] = useState("admin@nhai-expressways.in");
  const [password, setPassword] = useState("•••••••••");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = () => {
    const u = users.find((x) => x.email === email);
    if (!u) {
      setError("No account found with that email in the demo. Use a role below.");
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
        {/* Decorative arch motif */}
        <svg
          className="absolute -bottom-20 -right-20 opacity-10"
          width="400"
          height="400"
          viewBox="0 0 64 64"
          fill="none"
        >
          <path
            d="M 11 24 C 11 12, 53 12, 53 24"
            stroke="#2E8B8B"
            strokeWidth="3"
            fill="none"
          />
          <rect x="8" y="22" width="5" height="34" rx="1.5" fill="#2E8B8B" />
          <rect x="51" y="22" width="5" height="34" rx="1.5" fill="#2E8B8B" />
          <path
            d="M 13 56 C 24 54, 34 48, 44 38 C 50 32, 56 28, 62 22"
            stroke="#2E8B8B"
            strokeWidth="3"
            fill="none"
          />
        </svg>

        <div className="relative z-10">
          <GlobalTollLogo size={48} variant="dark" />
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-3xl font-bold tracking-tight leading-tight">
            The enterprise toll-tax<br />management platform
          </h1>
          <p className="text-sm opacity-80 max-w-md leading-relaxed">
            Production-grade, multi-tenant SaaS for operating toll roads,
            bridges, tunnels, and highway networks. Real-time transaction
            processing, settlement, enforcement, and analytics — built to
            handle millions of transactions with zero downtime tolerance.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-6 max-w-md">
            <div>
              <div className="text-2xl font-bold text-[#E0A030]">99.95%</div>
              <div className="text-[0.65rem] opacity-70 uppercase tracking-wider">Uptime SLA</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#E0A030]">&lt;200ms</div>
              <div className="text-[0.65rem] opacity-70 uppercase tracking-wider">p95 lane txn</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#E0A030]">14</div>
              <div className="text-[0.65rem] opacity-70 uppercase tracking-wider">Modules</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-[0.7rem] opacity-60 flex items-center gap-2">
          <Shield className="h-3.5 w-3.5" />
          ISO 27001 · SOC 2 Type II · PCI-DSS compliant
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
              Access your Global Toll operator console
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
                placeholder="you@operator.in"
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
              Sign in to console
              <ChevronRight className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 text-[0.65rem] text-muted-foreground">
              <Shield className="h-3 w-3" />
              MFA enforced for all admin-tier roles. Sessions time out after 30 min idle.
            </div>
          </div>

          {/* Demo role quick-pick */}
          <div className="border-t border-border pt-5">
            <div className="text-xs font-medium text-muted-foreground mb-2.5 uppercase tracking-wider">
              Demo — pick a role perspective
            </div>
            <div className="grid grid-cols-1 gap-1.5 max-h-72 overflow-y-auto scrollbar-thin pr-1">
              {users.slice(0, 9).map((u) => {
                const role = ROLES[u.role];
                return (
                  <button
                    key={u.id}
                    onClick={() => login(u.id)}
                    className="flex items-center gap-3 p-2.5 rounded-md border border-border hover:border-teal hover:bg-muted/40 text-left transition-colors"
                  >
                    <div className="h-8 w-8 rounded-md bg-teal/10 text-teal grid place-items-center text-xs font-bold shrink-0">
                      {u.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold truncate">{u.name}</div>
                      <div className="text-[0.65rem] text-muted-foreground truncate">
                        {roleLabel(u.role)} · {u.email}
                      </div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </button>
                );
              })}
            </div>
            <p className="text-[0.6rem] text-muted-foreground mt-3 leading-relaxed">
              {roleLabel("AUDITOR")} role has read-only access across the platform.
              {" "}{roleLabel("LANE_OPERATOR")} only sees the transactions console.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
