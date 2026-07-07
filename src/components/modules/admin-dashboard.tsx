"use client";
import { useState, useMemo } from "react";
import { useStore } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDateTime, formatDate, timeAgo } from "@/lib/format";
import type { VehicleClassCode } from "@/lib/types";
import { GlobalTollLogo } from "@/components/brand/logo";
import { roleLabel } from "@/store/app-store";
import {
  LayoutDashboard, Building2, Tag as TagIcon, Car, ShieldCheck,
  LogOut, IndianRupee, Activity, Gauge, AlertTriangle, TrendingUp,
  Plus, Edit3, Trash2, MapPin, Cpu, CheckCircle2, X, Hash,
  UserCog, Calendar, Ban, Search, Filter, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "plazas", label: "Plazas & Lanes", icon: Building2 },
  { key: "pricing", label: "Pricing & Rates", icon: TagIcon },
  { key: "vehicles", label: "Vehicles", icon: Car },
  { key: "audit", label: "Audit Log", icon: ShieldCheck },
] as const;

type TabKey = typeof TABS[number]["key"];

export function AdminDashboard() {
  const currentUser = useStore((s) => s.currentUser)!;
  const logout = useStore((s) => s.logout);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const initials = currentUser.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* Top header */}
      <header className="h-16 sticky top-0 z-30 bg-card border-b border-border flex items-center px-4 sm:px-6 gap-4">
        <GlobalTollLogo size={36} showWordmark={false} />
        <div className="hidden md:block">
          <div className="text-sm font-bold text-navy">Oman Toll Operations</div>
          <div className="text-[0.65rem] text-muted-foreground">Admin Console</div>
        </div>

        <div className="flex-1" />

        {/* Tab nav (horizontal on desktop) */}
        <nav className="hidden lg:flex items-center gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors",
                  active
                    ? "bg-teal text-white"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/40">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-teal text-white text-[0.65rem] font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <div className="text-xs font-semibold leading-tight">{currentUser.name}</div>
              <div className="text-[0.6rem] text-muted-foreground leading-tight">
                {roleLabel(currentUser.role)}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="text-destructive hover:text-destructive">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Mobile tab nav */}
      <div className="lg:hidden border-b border-border bg-card overflow-x-auto">
        <div className="flex items-center gap-1 px-3 py-2 min-w-max">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors shrink-0",
                  active
                    ? "bg-teal text-white"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <main className="flex-1 overflow-x-hidden">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "plazas" && <PlazasTab />}
        {activeTab === "pricing" && <PricingTab />}
        {activeTab === "vehicles" && <VehiclesTab />}
        {activeTab === "audit" && <AuditTab />}
      </main>
    </div>
  );
}

// =====================================================================
// TAB 1 — OVERVIEW (dashboard KPIs + charts)
// =====================================================================
const HOURS = ["00", "03", "06", "09", "12", "15", "18", "21"];

function OverviewTab() {
  const transactions = useStore((s) => s.transactions);
  const plazas = useStore((s) => s.plazas);
  const lanes = useStore((s) => s.lanes);
  const devices = useStore((s) => s.devices);
  const violations = useStore((s) => s.violations);
  const vehicles = useStore((s) => s.vehicles);
  const vehicleClasses = useStore((s) => s.vehicleClasses);

  const totalRevenue = transactions
    .filter((t) => t.status === "SUCCESS")
    .reduce((s, t) => s + t.totalAmount, 0);
  const txnCount = transactions.length;
  const openLanes = lanes.filter((l) => l.status === "OPEN").length;
  const faultyLanes = lanes.filter((l) => l.status === "FAULTED").length;
  const offlineDevices = devices.filter((d) => d.status === "OFFLINE" || d.status === "ERROR").length;

  // Hourly revenue (last 24h, bucketed by 3h)
  const now = Date.now();
  const hourlyData = HOURS.map((h, i) => {
    const start = now - (24 - i * 3) * 60 * 60_000;
    const end = start + 3 * 60 * 60_000;
    const bucketTxns = transactions.filter((t) => {
      const tTime = new Date(t.capturedAt).getTime();
      return tTime >= start && tTime < end && t.status === "SUCCESS";
    });
    return {
      hour: `${h}:00`,
      revenue: bucketTxns.reduce((s, t) => s + t.totalAmount, 0),
      txns: bucketTxns.length,
    };
  });

  // Vehicle class distribution
  const classColors: Record<string, string> = {
    CAR: "#2E8B8B",
    HCV: "#2C3E50",
    LCV: "#5C7A8A",
    BUS: "#7AB3A3",
    MULTI_AXLE: "#E0A030",
    TWO_WHEELER: "#B07D1E",
    OVERSIZED: "#9CA3AF",
  };
  const classBreakdown = vehicleClasses
    .map((vc) => ({
      name: vc.label.split(" ")[0],
      code: vc.code,
      value: transactions.filter((t) => t.vehicleClassCode === vc.code).length,
    }))
    .filter((x) => x.value > 0);

  // Recent transactions feed
  const recentTxns = transactions.slice(0, 8);

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label="Total Revenue"
          value={formatCurrency(totalRevenue, "OMR")}
          icon={IndianRupee}
          variant="revenue"
          delta={txnCount > 0 ? `${txnCount} transactions` : "Awaiting first txn"}
        />
        <KpiCard
          label="Lane Uptime"
          value={`${((openLanes / Math.max(lanes.length, 1)) * 100).toFixed(0)}%`}
          icon={Activity}
          delta={`${openLanes}/${lanes.length} lanes open`}
          deltaPositive
        />
        <KpiCard
          label="Avg Txn Time"
          value="142ms"
          icon={Gauge}
          delta="Within SLA (<200ms)"
          deltaPositive
        />
        <KpiCard
          label="System Health"
          value={offlineDevices === 0 ? "Healthy" : `${offlineDevices} alerts`}
          icon={AlertTriangle}
          variant={offlineDevices === 0 ? "default" : "warning"}
          delta={faultyLanes === 0 ? "All systems normal" : `${faultyLanes} lanes need attention`}
          deltaPositive={faultyLanes === 0}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-navy">Revenue & Transaction Volume</h3>
              <p className="text-xs text-muted-foreground">Last 24 hours (3-hour buckets)</p>
            </div>
            <Badge variant="outline" className="text-[0.65rem]">
              <TrendingUp className="h-3 w-3 mr-1" /> Live
            </Badge>
          </div>
          <div className="h-64">
            {txnCount > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E0A030" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#E0A030" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v, "OMR", { compact: true })} />
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [formatCurrency(v, "OMR"), "Revenue"]} />
                  <Area type="monotone" dataKey="revenue" stroke="#E0A030" strokeWidth={2.5} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState message="No transactions yet. Capture transactions from the Operator Console to see analytics here." />
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-navy mb-1">Vehicle Class Mix</h3>
          <p className="text-xs text-muted-foreground mb-3">Distribution of captured transactions</p>
          <div className="h-56">
            {classBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={classBreakdown} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {classBreakdown.map((entry) => (
                      <Cell key={entry.code} fill={classColors[entry.code] ?? "#9CA3AF"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState message="Awaiting transaction data" small />
            )}
          </div>
        </Card>
      </div>

      {/* Plaza status + recent transactions */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-navy mb-3">Plaza Status Overview</h3>
          <div className="space-y-2">
            {plazas.map((p) => {
              const plzLanes = lanes.filter((l) => l.plazaId === p.id);
              const openCount = plzLanes.filter((l) => l.status === "OPEN").length;
              const plzDevices = devices.filter((d) => plzLanes.some((l) => l.id === d.laneId));
              const onlineDevices = plzDevices.filter((d) => d.status === "ONLINE").length;
              return (
                <div key={p.id} className="p-3 border border-border rounded-md flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-md bg-teal/10 grid place-items-center">
                      <Building2 className="h-4 w-4 text-teal" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{p.name}</div>
                      <div className="text-[0.65rem] text-muted-foreground font-mono">
                        {p.code} · KM {p.kmMark}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-center">
                      <div className="font-bold text-emerald-600">{openCount}/{plzLanes.length}</div>
                      <div className="text-[0.55rem] text-muted-foreground uppercase">Lanes</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">{onlineDevices}/{plzDevices.length}</div>
                      <div className="text-[0.55rem] text-muted-foreground uppercase">Devices</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-navy">Recent Transactions</h3>
            <Button size="sm" variant="ghost" className="text-[0.65rem] h-7">
              <Download className="h-3 w-3 mr-1" /> Export
            </Button>
          </div>
          {recentTxns.length > 0 ? (
            <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
              {recentTxns.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-2.5 border border-border rounded-md text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono font-bold text-navy">{t.plateCaptured}</span>
                    <Badge variant="outline" className="text-[0.55rem]">{t.vehicleClassCode}</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{timeAgo(t.capturedAt)}</span>
                    <span className="font-mono font-bold text-[var(--color-gold-dark)]">
                      {formatCurrency(t.totalAmount, "OMR")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No transactions captured yet.
              <div className="text-[0.65rem] mt-1">Log in as Lane Operator to begin capturing toll transactions.</div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function KpiCard({
  label, value, icon: Icon, variant = "default", delta, deltaPositive = true,
}: {
  label: string;
  value: string;
  icon: typeof IndianRupee;
  variant?: "default" | "revenue" | "warning";
  delta?: string;
  deltaPositive?: boolean;
}) {
  const accent =
    variant === "revenue" ? "border-l-4 border-l-[var(--color-gold)]"
    : variant === "warning" ? "border-l-4 border-l-destructive"
    : "border-l-4 border-l-teal";
  return (
    <Card className={`p-4 sm:p-5 ${accent}`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        <div className={cn(
          "h-8 w-8 rounded-md grid place-items-center",
          variant === "revenue" ? "bg-[var(--color-accent)]" : "bg-teal/10"
        )}>
          <Icon className={cn("h-4 w-4", variant === "revenue" ? "text-[var(--color-gold-dark)]" : "text-teal")} />
        </div>
      </div>
      <div className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">{value}</div>
      {delta && (
        <div className={cn(
          "flex items-center gap-1 mt-2 text-[0.65rem] font-medium",
          deltaPositive ? "text-emerald-600" : "text-destructive"
        )}>
          {deltaPositive ? <TrendingUp className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
          {delta}
        </div>
      )}
    </Card>
  );
}

function EmptyChartState({ message, small }: { message: string; small?: boolean }) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center text-muted-foreground", small ? "h-full" : "h-full")}>
      <Activity className={cn(small ? "h-6 w-6" : "h-8 w-8", "opacity-30 mb-2")} />
      <div className="text-xs">{message}</div>
    </div>
  );
}

// =====================================================================
// TAB 2 — PLAZAS & LANES (CRUD)
// =====================================================================
function PlazasTab() {
  const plazas = useStore((s) => s.plazas);
  const highways = useStore((s) => s.highways);
  const lanes = useStore((s) => s.lanes);
  const devices = useStore((s) => s.devices);
  const pushAudit = useStore((s) => s.pushAudit);
  const currentUser = useStore((s) => s.currentUser)!;
  const [selectedPlaza, setSelectedPlaza] = useState<string | null>(null);
  const [addPlazaOpen, setAddPlazaOpen] = useState(false);
  const [newPlaza, setNewPlaza] = useState({ code: "", name: "", kmMark: "", highwayId: highways[0]?.id ?? "" });
  const [addLaneOpen, setAddLaneOpen] = useState(false);
  const [newLane, setNewLane] = useState({ number: "", type: "CASH", direction: "FORWARD" });

  const plazaLanes = lanes.filter((l) => l.plazaId === selectedPlaza);

  const handleAddPlaza = () => {
    if (!newPlaza.code || !newPlaza.name) {
      toast.error("Code and Name are required");
      return;
    }
    pushAudit({
      tenantId: "tnt-1",
      actorName: currentUser.name,
      action: "CREATE",
      module: "plazas",
      entityType: "plaza",
      entityId: `plz-new-${Date.now()}`,
      afterValue: JSON.stringify(newPlaza),
      ipAddress: "10.0.1.42",
    });
    toast.success("Plaza created", { description: `${newPlaza.code} — ${newPlaza.name}` });
    setNewPlaza({ code: "", name: "", kmMark: "", highwayId: highways[0]?.id ?? "" });
    setAddPlazaOpen(false);
  };

  const handleAddLane = () => {
    if (!newLane.number) {
      toast.error("Lane number required");
      return;
    }
    pushAudit({
      tenantId: "tnt-1",
      actorName: currentUser.name,
      action: "CREATE",
      module: "plazas",
      entityType: "lane",
      entityId: `lane-new-${Date.now()}`,
      afterValue: JSON.stringify({ plazaId: selectedPlaza, ...newLane }),
      ipAddress: "10.0.1.42",
    });
    toast.success("Lane added", { description: `Lane ${newLane.number} · ${newLane.type.replace("_", "/")}` });
    setNewLane({ number: "", type: "CASH", direction: "FORWARD" });
    setAddLaneOpen(false);
  };

  const handleDeletePlaza = (plazaId: string, plazaName: string) => {
    pushAudit({
      tenantId: "tnt-1",
      actorName: currentUser.name,
      action: "DELETE",
      module: "plazas",
      entityType: "plaza",
      entityId: plazaId,
      beforeValue: JSON.stringify({ name: plazaName }),
      ipAddress: "10.0.1.42",
    });
    toast.success("Plaza deleted", { description: plazaName });
    setSelectedPlaza(null);
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-navy">Toll Plaza & Lane Management</h2>
          <p className="text-xs text-muted-foreground">Manage plazas, lanes, and connected devices</p>
        </div>
        <Button onClick={() => setAddPlazaOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Plaza
        </Button>
      </div>

      {/* Plaza cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plazas.map((p) => {
          const plzLanes = lanes.filter((l) => l.plazaId === p.id);
          const openCount = plzLanes.filter((l) => l.status === "OPEN").length;
          const hw = highways.find((h) => h.id === p.highwayId);
          const isSelected = selectedPlaza === p.id;
          return (
            <Card
              key={p.id}
              className={cn(
                "p-4 cursor-pointer transition-all hover:shadow-md",
                isSelected && "ring-2 ring-teal"
              )}
              onClick={() => setSelectedPlaza(isSelected ? null : p.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-md bg-teal/10 grid place-items-center">
                    <Building2 className="h-4 w-4 text-teal" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{p.name}</div>
                    <div className="text-[0.65rem] text-muted-foreground font-mono">{p.code} · KM {p.kmMark}</div>
                  </div>
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => toast.info("Edit form would open here")}>
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-destructive"
                    onClick={() => handleDeletePlaza(p.id, p.name)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[0.65rem] text-muted-foreground mb-3">
                <MapPin className="h-3 w-3" />
                {hw?.code} — {hw?.name}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="font-bold text-emerald-600">{openCount}</div>
                  <div className="text-[0.55rem] text-muted-foreground uppercase">Open</div>
                </div>
                <div>
                  <div className="font-bold">{plzLanes.length}</div>
                  <div className="text-[0.55rem] text-muted-foreground uppercase">Total Lanes</div>
                </div>
                <div>
                  <div className="font-bold text-amber-600">
                    {plzLanes.filter((l) => l.status === "MAINTENANCE").length}
                  </div>
                  <div className="text-[0.55rem] text-muted-foreground uppercase">Maint.</div>
                </div>
              </div>
            </Card>
          );
        })}

        <Card
          className="border-dashed border-2 grid place-items-center text-center cursor-pointer hover:border-teal hover:bg-muted/30 min-h-[180px]"
          onClick={() => setAddPlazaOpen(true)}
        >
          <div className="p-4">
            <div className="h-9 w-9 mx-auto rounded-md bg-muted grid place-items-center mb-2">
              <Plus className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-sm font-medium">Add Toll Plaza</div>
            <div className="text-[0.65rem] text-muted-foreground mt-1">Register a new plaza</div>
          </div>
        </Card>
      </div>

      {/* Lane detail panel */}
      {selectedPlaza && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-navy">
                {plazas.find(p => p.id === selectedPlaza)?.name} — Lanes & Devices
              </h3>
              <p className="text-xs text-muted-foreground">{plazaLanes.length} lanes configured</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setAddLaneOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Lane
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedPlaza(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lane</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Devices</TableHead>
                  <TableHead>Last Update</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plazaLanes.map((l) => {
                  const laneDevices = devices.filter((d) => d.laneId === l.id);
                  return (
                    <TableRow key={l.id}>
                      <TableCell className="font-mono text-xs font-bold">L{l.number}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[0.65rem]">{l.type.replace("_", "/")}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{l.direction}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <span className={cn("h-1.5 w-1.5 rounded-full", l.status === "OPEN" ? "bg-emerald-500" : "bg-amber-500")} />
                          {l.status}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs">
                          <Cpu className="h-3 w-3 text-muted-foreground" />
                          {laneDevices.length} devices
                          <span className="text-emerald-600">· {laneDevices.filter(d => d.status === "ONLINE").length} online</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{timeAgo(l.updatedAt)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" className="h-7 text-[0.65rem]">
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Add plaza dialog */}
      <Dialog open={addPlazaOpen} onOpenChange={setAddPlazaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Toll Plaza</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Plaza Code *</Label>
                <Input value={newPlaza.code} onChange={(e) => setNewPlaza({ ...newPlaza, code: e.target.value })} placeholder="TP-004" />
              </div>
              <div>
                <Label>KM Mark</Label>
                <Input type="number" value={newPlaza.kmMark} onChange={(e) => setNewPlaza({ ...newPlaza, kmMark: e.target.value })} placeholder="42" />
              </div>
            </div>
            <div>
              <Label>Plaza Name *</Label>
              <Input value={newPlaza.name} onChange={(e) => setNewPlaza({ ...newPlaza, name: e.target.value })} placeholder="e.g., Sohar Gate Plaza" />
            </div>
            <div>
              <Label>Highway</Label>
              <Select value={newPlaza.highwayId} onValueChange={(v) => setNewPlaza({ ...newPlaza, highwayId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {highways.map((h) => (
                    <SelectItem key={h.id} value={h.id}>{h.code} — {h.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPlazaOpen(false)}>Cancel</Button>
            <Button onClick={handleAddPlaza}>Create Plaza</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add lane dialog */}
      <Dialog open={addLaneOpen} onOpenChange={setAddLaneOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Lane to {plazas.find(p => p.id === selectedPlaza)?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Lane Number *</Label>
              <Input type="number" value={newLane.number} onChange={(e) => setNewLane({ ...newLane, number: e.target.value })} placeholder="5" />
            </div>
            <div>
              <Label>Lane Type</Label>
              <Select value={newLane.type} onValueChange={(v) => setNewLane({ ...newLane, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="ETC_RFID">ETC / RFID</SelectItem>
                  <SelectItem value="HYBRID">Hybrid</SelectItem>
                  <SelectItem value="EXPRESS_HOV">Express / HOV</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Direction</Label>
              <Select value={newLane.direction} onValueChange={(v) => setNewLane({ ...newLane, direction: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FORWARD">Forward</SelectItem>
                  <SelectItem value="REVERSE">Reverse</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddLaneOpen(false)}>Cancel</Button>
            <Button onClick={handleAddLane}>Add Lane</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =====================================================================
// TAB 3 — PRICING & RATES
// =====================================================================
function PricingTab() {
  const rateCards = useStore((s) => s.rateCards);
  const plazas = useStore((s) => s.plazas);
  const vehicleClasses = useStore((s) => s.vehicleClasses);
  const pushAudit = useStore((s) => s.pushAudit);
  const currentUser = useStore((s) => s.currentUser)!;
  const [selectedPlaza, setSelectedPlaza] = useState<string>(plazas[0]?.id ?? "");
  const [editRateOpen, setEditRateOpen] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const filteredCards = rateCards.filter((rc) => rc.plazaId === selectedPlaza);

  const handleUpdateRate = (rateCardId: string, currentValue: number) => {
    const newValue = parseFloat(editValue);
    if (isNaN(newValue) || newValue < 0) {
      toast.error("Enter a valid amount");
      return;
    }
    pushAudit({
      tenantId: "tnt-1",
      actorName: currentUser.name,
      action: "UPDATE",
      module: "pricing",
      entityType: "ratecard",
      entityId: rateCardId,
      beforeValue: JSON.stringify({ singleJourney: currentValue }),
      afterValue: JSON.stringify({ singleJourney: newValue }),
      ipAddress: "10.0.1.42",
    });
    toast.success("Rate updated", {
      description: `${formatCurrency(newValue, "OMR")} — new version will be effective immediately`,
    });
    setEditRateOpen(null);
    setEditValue("");
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-navy">Pricing & Toll Rate Engine</h2>
          <p className="text-xs text-muted-foreground">Manage rate cards per plaza × vehicle class</p>
        </div>
        <Select value={selectedPlaza} onValueChange={setSelectedPlaza}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter by plaza" />
          </SelectTrigger>
          <SelectContent>
            {plazas.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Rate cards table */}
      <Card className="p-5">
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle Class</TableHead>
                <TableHead>Axles</TableHead>
                <TableHead className="text-right">Single Journey</TableHead>
                <TableHead className="text-right">Round Journey</TableHead>
                <TableHead className="text-right">Monthly Pass</TableHead>
                <TableHead>Effective</TableHead>
                <TableHead>Version</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCards.map((rc) => {
                const vc = vehicleClasses.find((c) => c.code === rc.vehicleClassCode);
                const isEditing = editRateOpen === rc.id;
                return (
                  <TableRow key={rc.id}>
                    <TableCell className="text-sm font-medium">{vc?.label}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[0.6rem]">{vc?.axleCount} axle</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.001"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-7 w-24 ml-auto text-xs font-mono"
                          autoFocus
                        />
                      ) : (
                        <span className="font-mono text-xs font-semibold">
                          {formatCurrency(rc.singleJourney, "OMR")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      {rc.roundJourney ? formatCurrency(rc.roundJourney, "OMR") : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      {rc.monthlyPass ? formatCurrency(rc.monthlyPass, "OMR") : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(rc.effectiveFrom)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[0.6rem] font-mono">v{rc.version}</Badge>
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <div className="flex gap-1">
                          <Button size="sm" className="h-7 text-[0.65rem]" onClick={() => handleUpdateRate(rc.id, rc.singleJourney)}>
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-[0.65rem]" onClick={() => setEditRateOpen(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[0.65rem]"
                          onClick={() => {
                            setEditRateOpen(rc.id);
                            setEditValue(String(rc.singleJourney));
                          }}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 p-3 bg-muted/30 rounded-md text-xs flex items-start gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Rate versioning:</strong> Edits create a new version with effective-date scheduling.
            All changes are recorded in the immutable audit log with before/after values.
          </div>
        </div>
      </Card>
    </div>
  );
}

// =====================================================================
// TAB 4 — VEHICLES
// =====================================================================
function VehiclesTab() {
  const vehicles = useStore((s) => s.vehicles);
  const tags = useStore((s) => s.tags);
  const wallets = useStore((s) => s.wallets);
  const vehicleClasses = useStore((s) => s.vehicleClasses);
  const pushAudit = useStore((s) => s.pushAudit);
  const currentUser = useStore((s) => s.currentUser)!;
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string>("ALL");
  const [addOpen, setAddOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ plate: "", ownerName: "", vehicleClassCode: "CAR" });

  const filtered = vehicles
    .filter((v) => classFilter === "ALL" ? true : v.vehicleClassCode === classFilter)
    .filter((v) => search ? v.plateNumber.toLowerCase().includes(search.toLowerCase()) || v.ownerName.toLowerCase().includes(search.toLowerCase()) : true);

  const handleAddVehicle = () => {
    if (!newVehicle.plate || !newVehicle.ownerName) {
      toast.error("Plate and owner name are required");
      return;
    }
    pushAudit({
      tenantId: "tnt-1",
      actorName: currentUser.name,
      action: "CREATE",
      module: "vehicles",
      entityType: "vehicle",
      entityId: `veh-new-${Date.now()}`,
      afterValue: JSON.stringify(newVehicle),
      ipAddress: "10.0.1.42",
    });
    toast.success("Vehicle registered", { description: `${newVehicle.plate} linked to ${newVehicle.ownerName}` });
    setNewVehicle({ plate: "", ownerName: "", vehicleClassCode: "CAR" });
    setAddOpen(false);
  };

  const handleBlacklist = (vehicleId: string, plate: string) => {
    pushAudit({
      tenantId: "tnt-1",
      actorName: currentUser.name,
      action: "UPDATE",
      module: "vehicles",
      entityType: "vehicle",
      entityId: vehicleId,
      beforeValue: JSON.stringify({ status: "ACTIVE" }),
      afterValue: JSON.stringify({ status: "BLACKLISTED" }),
      ipAddress: "10.0.1.42",
    });
    toast.success("Vehicle blacklisted", { description: `${plate} flagged at all lanes` });
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-navy">Vehicle Registry</h2>
          <p className="text-xs text-muted-foreground">{vehicles.length} registered vehicles</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Register Vehicle
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search plate or owner…" className="pl-9" />
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Classes</SelectItem>
            {vehicleClasses.map((vc) => (
              <SelectItem key={vc.code} value={vc.code}>{vc.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Vehicles table */}
      <Card className="p-5">
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plate Number</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Tag Status</TableHead>
                <TableHead>Wallet Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((v) => {
                const tag = tags.find((t) => t.vehicleId === v.id);
                const wallet = tag ? wallets.find((w) => w.tagId === tag.id) : null;
                return (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono font-bold text-xs">{v.plateNumber}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[0.65rem]">
                        {vehicleClasses.find(vc => vc.code === v.vehicleClassCode)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{v.ownerName}</TableCell>
                    <TableCell>
                      {tag ? (
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className={cn("h-1.5 w-1.5 rounded-full", tag.status === "ACTIVE" ? "bg-emerald-500" : "bg-zinc-400")} />
                          {tag.status}
                        </div>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {wallet ? formatCurrency(wallet.balance, "OMR") : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className={cn("h-1.5 w-1.5 rounded-full", v.status === "ACTIVE" ? "bg-emerald-500" : "bg-red-500")} />
                        {v.status === "ACTIVE" ? "Active" : "Blacklisted"}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(v.createdAt)}</TableCell>
                    <TableCell>
                      {v.status === "ACTIVE" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[0.65rem] text-destructive"
                          onClick={() => handleBlacklist(v.id, v.plateNumber)}
                        >
                          <Ban className="h-3 w-3" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-xs text-muted-foreground">
            <Car className="h-8 w-8 mx-auto mb-2 opacity-30" />
            No vehicles match your filters.
          </div>
        )}
      </Card>

      {/* Add vehicle dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register New Vehicle</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Plate Number (Oman format) *</Label>
              <Input
                value={newVehicle.plate}
                onChange={(e) => setNewVehicle({ ...newVehicle, plate: e.target.value.toUpperCase() })}
                placeholder="12345-A"
                className="font-mono uppercase"
              />
              <div className="text-[0.65rem] text-muted-foreground mt-1">Format: 1-6 digits, dash, region letter (A-K)</div>
            </div>
            <div>
              <Label>Owner Name *</Label>
              <Input value={newVehicle.ownerName} onChange={(e) => setNewVehicle({ ...newVehicle, ownerName: e.target.value })} placeholder="e.g., Mohammed Al Balushi" />
            </div>
            <div>
              <Label>Vehicle Class</Label>
              <Select value={newVehicle.vehicleClassCode} onValueChange={(v) => setNewVehicle({ ...newVehicle, vehicleClassCode: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {vehicleClasses.map((vc) => (
                    <SelectItem key={vc.code} value={vc.code}>{vc.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAddVehicle}>Register Vehicle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =====================================================================
// TAB 5 — AUDIT LOG
// =====================================================================
function AuditTab() {
  const auditLogs = useStore((s) => s.auditLogs);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");

  const filtered = auditLogs
    .filter((l) => actionFilter === "ALL" ? true : l.action === actionFilter)
    .filter((l) => search
      ? l.actorName.toLowerCase().includes(search.toLowerCase()) ||
        l.module.toLowerCase().includes(search.toLowerCase()) ||
        l.entityId?.toLowerCase().includes(search.toLowerCase())
      : true
    );

  const ACTION_COLORS: Record<string, string> = {
    CREATE: "border-emerald-500 text-emerald-700 bg-emerald-50",
    UPDATE: "border-blue-500 text-blue-700 bg-blue-50",
    DELETE: "border-red-500 text-red-700 bg-red-50",
    APPROVE: "border-purple-500 text-purple-700 bg-purple-50",
    LOGIN: "border-teal text-teal bg-teal/5",
    LOGOUT: "border-zinc-400 text-zinc-600 bg-zinc-50",
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-navy">Security & Audit Trail</h2>
          <p className="text-xs text-muted-foreground">Immutable, hash-chained log of all admin actions</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-3.5 w-3.5 mr-1.5" /> Export Log
        </Button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 border-l-4 border-l-teal">
          <div className="text-xs text-muted-foreground uppercase">Total Events</div>
          <div className="text-xl font-bold">{auditLogs.length}</div>
        </Card>
        <Card className="p-3 border-l-4 border-l-emerald-500">
          <div className="text-xs text-muted-foreground uppercase">Creates</div>
          <div className="text-xl font-bold text-emerald-600">{auditLogs.filter(l => l.action === "CREATE").length}</div>
        </Card>
        <Card className="p-3 border-l-4 border-l-blue-500">
          <div className="text-xs text-muted-foreground uppercase">Updates</div>
          <div className="text-xl font-bold text-blue-600">{auditLogs.filter(l => l.action === "UPDATE").length}</div>
        </Card>
        <Card className="p-3 border-l-4 border-l-destructive">
          <div className="text-xs text-muted-foreground uppercase">Deletions</div>
          <div className="text-xl font-bold text-destructive">{auditLogs.filter(l => l.action === "DELETE").length}</div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by actor, module, or entity…" className="pl-9" />
        </div>
        <div className="flex gap-1">
          {["ALL", "CREATE", "UPDATE", "DELETE"].map((a) => (
            <Button
              key={a}
              size="sm"
              variant={actionFilter === a ? "default" : "outline"}
              className="h-9 text-xs"
              onClick={() => setActionFilter(a)}
            >
              {a}
            </Button>
          ))}
        </div>
      </div>

      {/* Audit log table */}
      <Card className="p-5">
        <div className="rounded-md border max-h-[600px] overflow-y-auto scrollbar-thin">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead className="w-40">Timestamp</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Changes</TableHead>
                <TableHead>IP</TableHead>
                <TableHead className="w-20">Hash</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 80).map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-[0.65rem] text-muted-foreground font-mono">
                    {formatDateTime(l.createdAt)}
                  </TableCell>
                  <TableCell className="text-xs font-medium">{l.actorName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-[0.6rem]", ACTION_COLORS[l.action] ?? "")}>
                      {l.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[0.6rem]">{l.module}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-[0.65rem] text-muted-foreground">{l.entityId ?? "—"}</TableCell>
                  <TableCell className="text-[0.65rem]">
                    {l.beforeValue && <div className="text-destructive line-through opacity-60">{l.beforeValue}</div>}
                    {l.afterValue && <div className="text-emerald-700">{l.afterValue}</div>}
                    {!l.beforeValue && !l.afterValue && <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="font-mono text-[0.65rem] text-muted-foreground">{l.ipAddress ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-[0.6rem] text-muted-foreground font-mono">
                      <Hash className="h-2.5 w-2.5" />
                      {l.hashChain?.slice(0, 8)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-xs text-muted-foreground">
            <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />
            No audit entries match your filters.
          </div>
        )}
      </Card>
    </div>
  );
}
