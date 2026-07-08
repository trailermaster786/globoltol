"use client";
import { useMemo } from "react";
import { useStore } from "@/store/app-store";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";

export default function AdminDashboardModule() {
  const { transactions, plazas, staff } = useStore();
  const { t } = useI18n();

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayTxns = transactions.filter((tx) => tx.capturedAt.startsWith(today));
    const totalRevenue = todayTxns.reduce((s, tx) => s + tx.totalAmount, 0);
    const activePlazas = plazas.filter((p) => p.status === "OPEN");
    return { totalRevenue, txToday: todayTxns.length, activePlazas: activePlazas.length, totalPlazas: plazas.length };
  }, [transactions, plazas]);

  const recentTxns = useMemo(() => {
    return [...transactions].sort((a, b) => b.capturedAt.localeCompare(a.capturedAt)).slice(0, 8);
  }, [transactions]);

  const plazaStats = useMemo(() => {
    const map: Record<string, { name: string; txCount: number; revenue: number }> = {};
    plazas.forEach((p) => { map[p.id] = { name: p.name, txCount: 0, revenue: 0 }; });
    transactions.forEach((tx) => {
      if (tx.plazaId) {
        const entry = map[tx.plazaId];
        if (entry) { entry.txCount++; entry.revenue += tx.totalAmount; }
      }
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [transactions, plazas]);

  const vehicleStats = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((tx) => {
      if (tx.vehicleClassCode) map[tx.vehicleClassCode] = (map[tx.vehicleClassCode] || 0) + 1;
    });
    const total = transactions.length || 1;
    return Object.entries(map)
      .map(([code, count]) => ({ code, count, pct: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count);
  }, [transactions]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="text-sm text-muted-foreground">{t("admin.totalRevenue")}</div>
          <div className="text-2xl font-bold mt-1">OMR {stats.totalRevenue.toFixed(3)}</div>
          <div className="text-xs text-muted-foreground mt-1">Today</div>
        </Card>
        <Card className="p-5 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="text-sm text-muted-foreground">{t("admin.transactionsToday")}</div>
          <div className="text-2xl font-bold mt-1">{stats.txToday.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">Completed</div>
        </Card>
        <Card className="p-5 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="text-sm text-muted-foreground">{t("admin.activePlazas")}</div>
          <div className="text-2xl font-bold mt-1">{stats.activePlazas}</div>
          <div className="text-xs text-muted-foreground mt-1">of {stats.totalPlazas} total</div>
        </Card>
        <Card className="p-5 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="text-sm text-muted-foreground">{t("admin.operatorsOnDuty")}</div>
          <div className="text-2xl font-bold mt-1">{staff.filter((s) => s.status === "ACTIVE").length}</div>
          <div className="text-xs text-muted-foreground mt-1">Active staff</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-5 dark:bg-zinc-900 dark:border-zinc-800">
          <h3 className="font-semibold mb-4 text-sm">{t("admin.plazaPerformance")}</h3>
          {plazaStats.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 text-sm">{t("admin.noData")}</div>
          ) : (
            <div className="space-y-3">
              {plazaStats.map((ps) => (
                <div key={ps.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 dark:bg-zinc-800">
                  <div>
                    <div className="font-medium text-sm">{ps.name}</div>
                    <div className="text-xs text-muted-foreground">{ps.txCount} transactions</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">OMR {ps.revenue.toFixed(3)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5 dark:bg-zinc-900 dark:border-zinc-800">
          <h3 className="font-semibold mb-4 text-sm">{t("admin.vehicleMix")}</h3>
          {vehicleStats.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 text-sm">{t("admin.noData")}</div>
          ) : (
            <div className="space-y-3">
              {vehicleStats.map((vs) => (
                <div key={vs.code} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{vs.code}</span>
                    <span className="text-muted-foreground">{vs.pct}%</span>
                  </div>
                  <div className="w-full bg-muted dark:bg-zinc-800 rounded-full h-2">
                    <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${vs.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-5 dark:bg-zinc-900 dark:border-zinc-800">
        <h3 className="font-semibold mb-4 text-sm">{t("admin.recentTransactions")}</h3>
        {recentTxns.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 text-sm">{t("admin.noData")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b dark:border-zinc-800">
                  <th className="pb-2 font-medium">Receipt</th>
                  <th className="pb-2 font-medium">Plate</th>
                  <th className="pb-2 font-medium">Vehicle</th>
                  <th className="pb-2 font-medium">Plaza</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Payment</th>
                  <th className="pb-2 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentTxns.map((tx) => (
                  <tr key={tx.id} className="border-b last:border-0 dark:border-zinc-800">
                    <td className="py-2 font-mono text-xs">{tx.id.slice(-8)}</td>
                    <td className="py-2">{tx.plateCaptured || "—"}</td>
                    <td className="py-2">{tx.vehicleClassCode || "—"}</td>
                    <td className="py-2">{plazas.find((p) => p.id === tx.plazaId)?.name || "—"}</td>
                    <td className="py-2 font-semibold">OMR {tx.totalAmount.toFixed(3)}</td>
                    <td className="py-2">{tx.paymentMethod}</td>
                    <td className="py-2 text-muted-foreground">{tx.capturedAt.split("T")[1]?.slice(0, 5)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

