"use client";
import { useMemo } from "react";
import { useStore } from "@/store/app-store";
import { PageContainer, StatCard, SectionCard, StatusDot } from "@/components/common/ui";
import { formatCurrency, formatNumber, timeAgo } from "@/lib/format";
import {
  IndianRupee, Activity, Gauge, AlertTriangle, TrendingUp,
  Car, Building2, ShieldAlert, Clock, ArrowUpRight,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const HOURS = ["00", "02", "04", "06", "08", "10", "12", "14", "16", "18", "20", "22"];

function genHourlyRevenue() {
  // realistic bimodal traffic pattern — morning + evening peaks
  return HOURS.map((h, i) => {
    const base = i >= 6 && i <= 10 ? 1.5 + (i - 6) * 0.3
               : i >= 16 && i <= 20 ? 1.7 + (i - 16) * 0.25
               : 0.5 + Math.random() * 0.5;
    return {
      hour: `${h}:00`,
      revenue: Math.round(base * 85000 + Math.random() * 12000),
      txns: Math.round(base * 920 + Math.random() * 80),
    };
  });
}

const VEHICLE_CLASS_COLORS: Record<string, string> = {
  CAR: "#2E8B8B",
  HCV: "#2C3E50",
  LCV: "#5C7A8A",
  BUS: "#7AB3A3",
  MULTI_AXLE: "#E0A030",
  TWO_WHEELER: "#B07D1E",
  OVERSIZED: "#9CA3AF",
};

export function DashboardModule() {
  const transactions = useStore((s) => s.transactions);
  const plazas = useStore((s) => s.plazas);
  const lanes = useStore((s) => s.lanes);
  const devices = useStore((s) => s.devices);
  const violations = useStore((s) => s.violations);
  const vehicles = useStore((s) => s.vehicles);
  const vehicleClasses = useStore((s) => s.vehicleClasses);
  const currentTenantId = useStore((s) => s.currentTenantId);

  const tenantTxns = useMemo(
    () => transactions.filter((t) => t.tenantId === currentTenantId),
    [transactions, currentTenantId]
  );
  const tenantPlazas = plazas.filter((p) => p.tenantId === currentTenantId);
  const tenantLanes = lanes.filter((l) =>
    tenantPlazas.some((p) => p.id === l.plazaId)
  );
  const tenantDevices = devices.filter((d) =>
    tenantLanes.some((l) => l.id === d.laneId)
  );

  // KPIs
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayMs = todayStart.getTime();
  const todayTxns = tenantTxns.filter(
    (t) => Date.parse(t.capturedAt) >= todayMs
  );
  const todayRevenue = todayTxns
    .filter((t) => t.status === "SUCCESS")
    .reduce((sum, t) => sum + t.totalAmount, 0);
  const totalRevenue = tenantTxns
    .filter((t) => t.status === "SUCCESS")
    .reduce((sum, t) => sum + t.totalAmount, 0);
  const successRate = todayTxns.length > 0
    ? (todayTxns.filter((t) => t.status === "SUCCESS").length / todayTxns.length) * 100
    : 100;
  const openLanes = tenantLanes.filter((l) => l.status === "OPEN").length;
  const faultyLanes = tenantLanes.filter((l) => l.status === "FAULTED").length;
  const offlineDevices = tenantDevices.filter(
    (d) => d.status === "OFFLINE" || d.status === "ERROR"
  ).length;
  const pendingViolations = violations.filter(
    (v) => v.tenantId === currentTenantId && (v.status === "DETECTED" || v.status === "CHALLAN_ISSUED")
  ).length;

  // 7-day revenue trend
  const revenueTrend = useMemo(() => {
    const days: { day: string; revenue: number; txns: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const start = d.getTime();
      const end = start + 24 * 60 * 60_000;
      const dayTxns = tenantTxns.filter(
        (t) =>
          Date.parse(t.capturedAt) >= start &&
          Date.parse(t.capturedAt) < end &&
          t.status === "SUCCESS"
      );
      days.push({
        day: d.toLocaleDateString("en-IN", { weekday: "short" }),
        revenue: dayTxns.reduce((s, t) => s + t.totalAmount, 0),
        txns: dayTxns.length,
      });
    }
    return days;
  }, [tenantTxns]);

  const hourlyData = useMemo(() => genHourlyRevenue(), []);

  // Vehicle class breakdown — computed inline (React Compiler handles memoization)
  const classCounts: Record<string, number> = {};
  todayTxns.forEach((t) => {
    if (t.vehicleClassCode)
      classCounts[t.vehicleClassCode] = (classCounts[t.vehicleClassCode] ?? 0) + 1;
  });
  const classBreakdown = vehicleClasses
    .map((vc) => ({
      name: vc.label,
      code: vc.code,
      value: classCounts[vc.code] ?? 0,
    }))
    .filter((x) => x.value > 0);

  // Top plazas by revenue
  const byPlaza: Record<string, number> = {};
  tenantTxns
    .filter((t) => t.status === "SUCCESS" && t.plazaId)
    .forEach((t) => {
      byPlaza[t.plazaId!] = (byPlaza[t.plazaId!] ?? 0) + t.totalAmount;
    });
  const topPlazas = Object.entries(byPlaza)
    .map(([plazaId, revenue]) => ({
      name: tenantPlazas.find((p) => p.id === plazaId)?.name ?? plazaId,
      code: tenantPlazas.find((p) => p.id === plazaId)?.code ?? "",
      revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Live lane status matrix
  const liveLanes = tenantLanes.slice(0, 24).map((l) => {
    const plaza = tenantPlazas.find((p) => p.id === l.plazaId);
    return { ...l, plazaName: plaza?.name ?? "", plazaCode: plaza?.code ?? "" };
  });

  // Anomalies
  const anomalies = [
    ...(offlineDevices > 0 ? [{
      severity: "high" as const,
      title: `${offlineDevices} device(s) offline`,
      detail: "ANPR/RFID readers not responding — may impact transaction capture",
      time: "5m ago",
    }] : []),
    ...(faultyLanes > 0 ? [{
      severity: "high" as const,
      title: `${faultyLanes} lane(s) in FAULTED state`,
      detail: "Manual fallback activated; cash operators reassigned",
      time: "12m ago",
    }] : []),
    {
      severity: "medium" as const,
      title: "Revenue spike at TP-0210 (+38% vs 7-day avg)",
      detail: "Holiday weekend traffic surge detected by anomaly engine",
      time: "32m ago",
    },
    {
      severity: "low" as const,
      title: `${pendingViolations} violations pending challan issuance`,
      detail: "Auto-evidence packages ready for enforcement review",
      time: "1h ago",
    },
  ];

  return (
    <PageContainer>
      {/* Top KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Revenue Today"
          value={formatCurrency(todayRevenue, "INR", { compact: true })}
          delta="+12.4% vs yesterday"
          deltaPositive
          icon={IndianRupee}
          variant="revenue"
          sub={`${formatNumber(todayTxns.length)} transactions`}
        />
        <StatCard
          label="Avg Txn Time"
          value="142ms"
          delta="−18ms p95"
          deltaPositive
          icon={Gauge}
          sub="Target: <200ms · SLA met"
        />
        <StatCard
          label="Lane Uptime"
          value={`${((openLanes / Math.max(tenantLanes.length, 1)) * 100).toFixed(1)}%`}
          delta={`${openLanes}/${tenantLanes.length} lanes open`}
          deltaPositive
          icon={Activity}
          sub={`${faultyLanes} faulty · ${offlineDevices} devices offline`}
        />
        <StatCard
          label="Success Rate"
          value={`${successRate.toFixed(1)}%`}
          delta={successRate >= 95 ? "Above target" : "Below 95% target"}
          deltaPositive={successRate >= 95}
          icon={TrendingUp}
          variant={successRate >= 95 ? "default" : "warning"}
          sub={`${todayTxns.filter(t => t.status === "FAILED").length} failed txns today`}
        />
      </div>

      {/* Revenue trend + vehicle class breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <SectionCard
          title="7-Day Revenue Trend"
          description="Daily gross revenue (Gold = revenue per brand spec)"
          className="xl:col-span-2"
          action={
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-semibold text-foreground">
                {formatCurrency(revenueTrend.reduce((s, d) => s + d.revenue, 0), "INR", { compact: true })}
              </span>
            </div>
          }
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E0A030" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#E0A030" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatCurrency(v, "INR", { compact: true })}
                />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #E5E7EB",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [formatCurrency(v, "INR"), "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#E0A030"
                  strokeWidth={2.5}
                  fill="url(#revGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard
          title="Vehicle Class Mix"
          description="Today's transaction distribution"
        >
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={classBreakdown}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {classBreakdown.map((entry) => (
                    <Cell
                      key={entry.code}
                      fill={VEHICLE_CLASS_COLORS[entry.code] ?? "#9CA3AF"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #E5E7EB",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 10 }}
                  formatter={(value, entry) => (
                    <span style={{ color: "#374151" }}>
                      {value} ({entry?.payload?.value ?? 0})
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      {/* Hourly traffic + top plazas */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <SectionCard
          title="Hourly Transaction Volume"
          description="Real-time traffic across all plazas (bimodal peak pattern)"
          className="xl:col-span-2"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatNumber(v, true)}
                />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #E5E7EB",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="txns" radius={[4, 4, 0, 0]} fill="#2E8B8B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard
          title="Top Plazas by Revenue"
          description="Today's top 5 performing plazas"
        >
          <div className="space-y-3">
            {topPlazas.map((p, i) => {
              const maxRev = topPlazas[0]?.revenue ?? 1;
              return (
                <div key={p.code}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-5 w-5 rounded grid place-items-center text-[0.6rem] font-bold text-white shrink-0"
                        style={{
                          background: i === 0 ? "#E0A030" : i === 1 ? "#5C7A8A" : i === 2 ? "#2E8B8B" : "#9CA3AF",
                        }}
                      >
                        {i + 1}
                      </span>
                      <span className="font-medium text-foreground truncate">{p.name}</span>
                    </div>
                    <span className="font-semibold text-foreground shrink-0 ml-2">
                      {formatCurrency(p.revenue, "INR", { compact: true })}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(p.revenue / maxRev) * 100}%`,
                        background: i === 0 ? "#E0A030" : "#2E8B8B",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>

      {/* Live traffic monitor + anomalies */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <SectionCard
          title="Live Lane Monitor"
          description={`${tenantLanes.length} lanes across ${tenantPlazas.length} plazas · auto-refresh every 5s`}
          className="xl:col-span-2"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-72 overflow-y-auto scrollbar-thin pr-2">
            {liveLanes.map((l) => {
              const color =
                l.status === "OPEN" ? "#10B981" :
                l.status === "FAULTED" ? "#EF4444" :
                l.status === "MAINTENANCE" ? "#F59E0B" : "#9CA3AF";
              return (
                <div
                  key={l.id}
                  className="p-2.5 rounded-md border border-border bg-background"
                  title={l.reason ?? l.status}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[0.65rem] font-mono text-muted-foreground">
                      {l.plazaCode}·L{l.number}
                    </span>
                    <StatusDot status={l.status} />
                  </div>
                  <div className="text-[0.7rem] font-medium truncate">{l.type.replace("_", "/")}</div>
                  <div className="text-[0.6rem] text-muted-foreground truncate">{l.plazaName}</div>
                  <div className="text-[0.55rem] mt-0.5" style={{ color }}>
                    {l.status}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard
          title="Anomaly Detection"
          description="ML-based alerts on revenue, traffic, devices"
        >
          <div className="space-y-2.5 max-h-72 overflow-y-auto scrollbar-thin pr-1">
            {anomalies.map((a, i) => (
              <div
                key={i}
                className="p-3 rounded-md border bg-background"
                style={{
                  borderColor: a.severity === "high" ? "rgba(192,57,43,0.25)" : a.severity === "medium" ? "rgba(224,160,48,0.25)" : "rgba(46,139,139,0.2)",
                  background: a.severity === "high" ? "rgba(192,57,43,0.04)" : a.severity === "medium" ? "rgba(224,160,48,0.05)" : "rgba(46,139,139,0.03)",
                }}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle
                    className="h-3.5 w-3.5 shrink-0 mt-0.5"
                    style={{
                      color: a.severity === "high" ? "#C0392B" : a.severity === "medium" ? "#B07D1E" : "#2E8B8B",
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-foreground">{a.title}</div>
                    <div className="text-[0.65rem] text-muted-foreground mt-0.5">{a.detail}</div>
                    <div className="text-[0.55rem] text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {a.time}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Bottom stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SectionCard>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-teal/10 grid place-items-center">
              <Building2 className="h-5 w-5 text-teal" />
            </div>
            <div>
              <div className="text-xl font-bold">{tenantPlazas.length}</div>
              <div className="text-[0.65rem] text-muted-foreground uppercase tracking-wider">Active Plazas</div>
            </div>
          </div>
        </SectionCard>
        <SectionCard>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-navy/10 grid place-items-center">
              <Car className="h-5 w-5" style={{ color: "#2C3E50" }} />
            </div>
            <div>
              <div className="text-xl font-bold">{formatNumber(vehicles.filter(v => v.tenantId === currentTenantId).length)}</div>
              <div className="text-[0.65rem] text-muted-foreground uppercase tracking-wider">Registered Vehicles</div>
            </div>
          </div>
        </SectionCard>
        <SectionCard>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md grid place-items-center" style={{ background: "rgba(224,160,48,0.12)" }}>
              <ArrowUpRight className="h-5 w-5" style={{ color: "#B07D1E" }} />
            </div>
            <div>
              <div className="text-xl font-bold">{formatCurrency(totalRevenue, "INR", { compact: true })}</div>
              <div className="text-[0.65rem] text-muted-foreground uppercase tracking-wider">Lifetime Revenue</div>
            </div>
          </div>
        </SectionCard>
        <SectionCard>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-destructive/10 grid place-items-center">
              <ShieldAlert className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <div className="text-xl font-bold">{pendingViolations}</div>
              <div className="text-[0.65rem] text-muted-foreground uppercase tracking-wider">Open Violations</div>
            </div>
          </div>
        </SectionCard>
      </div>
    </PageContainer>
  );
}
