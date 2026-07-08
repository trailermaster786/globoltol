"use client";
import { useMemo, useState } from "react";
import { useStore } from "@/store/app-store";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function FinancialReportsModule() {
  const { transactions, plazas, vehicleClasses } = useStore();
  const { t } = useI18n();
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));

  const plazaNames = useMemo(() => {
    const map: Record<string, string> = {};
    plazas.forEach((p) => { map[p.id] = p.name; });
    return map;
  }, [plazas]);

  const vehicleNames = useMemo(() => {
    const map: Record<string, string> = {};
    vehicleClasses.forEach((vc) => { map[vc.code] = vc.label; });
    return map;
  }, [vehicleClasses]);

  const filtered = useMemo(() => {
    const d = new Date(selectedDate);
    if (period === "daily") {
      const ds = selectedDate;
      return transactions.filter((tx) => tx.capturedAt.startsWith(ds));
    } else if (period === "weekly") {
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      const ws = weekStart.toISOString().slice(0, 10);
      const we = weekEnd.toISOString().slice(0, 10);
      return transactions.filter((tx) => { const ds = tx.capturedAt.slice(0, 10); return ds >= ws && ds <= we; });
    } else {
      const ms = selectedDate.slice(0, 7);
      return transactions.filter((tx) => tx.capturedAt.startsWith(ms));
    }
  }, [transactions, period, selectedDate]);

  const totalRevenue = filtered.reduce((s, tx) => s + tx.totalAmount, 0);
  const totalTax = filtered.reduce((s, tx) => s + tx.taxAmount, 0);
  const avgTransaction = filtered.length > 0 ? totalRevenue / filtered.length : 0;

  const byPlaza = useMemo(() => {
    const map: Record<string, { name: string; count: number; revenue: number }> = {};
    plazas.forEach((p) => { map[p.id] = { name: p.name, count: 0, revenue: 0 }; });
    filtered.forEach((tx) => {
      if (tx.plazaId) {
        const entry = map[tx.plazaId];
        if (entry) { entry.count++; entry.revenue += tx.totalAmount; }
      }
    });
    return Object.values(map).filter((v) => v.count > 0).sort((a, b) => b.revenue - a.revenue);
  }, [filtered, plazas]);

  const byVehicle = useMemo(() => {
    const map: Record<string, { code: string; count: number; revenue: number }> = {};
    filtered.forEach((tx) => {
      if (tx.vehicleClassCode) {
        if (!map[tx.vehicleClassCode]) map[tx.vehicleClassCode] = { code: tx.vehicleClassCode, count: 0, revenue: 0 };
        map[tx.vehicleClassCode].count++;
        map[tx.vehicleClassCode].revenue += tx.totalAmount;
      }
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [filtered]);

  const byPayment = useMemo(() => {
    const map: Record<string, { method: string; count: number; revenue: number }> = {};
    filtered.forEach((tx) => {
      if (!map[tx.paymentMethod]) map[tx.paymentMethod] = { method: tx.paymentMethod, count: 0, revenue: 0 };
      map[tx.paymentMethod].count++;
      map[tx.paymentMethod].revenue += tx.totalAmount;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [filtered]);

  const exportCSV = () => {
    const headers = ["Date", "Plate", "Vehicle", "Plaza", "Base", "Tax", "Total", "Payment"];
    const rows = filtered.map((tx) => [tx.capturedAt.slice(0, 10), tx.plateCaptured || "", tx.vehicleClassCode || "", plazaNames[tx.plazaId || ""] || "", tx.amount.toFixed(3), tx.taxAmount.toFixed(3), tx.totalAmount.toFixed(3), tx.paymentMethod]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financial-${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-muted dark:bg-zinc-800 rounded-lg p-1">
          {(["daily", "weekly", "monthly"] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${period === p ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}>
              {t(`finance.${p}`)}
            </button>
          ))}
        </div>
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-3 py-2 border rounded-lg text-sm dark:bg-zinc-900 dark:border-zinc-700 dark:text-white" />
        <Button onClick={exportCSV} variant="outline" size="sm" className="dark:border-zinc-700">{t("finance.exportCSV")}</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="text-sm text-muted-foreground">{t("finance.totalRevenue")}</div>
          <div className="text-2xl font-bold mt-1">OMR {totalRevenue.toFixed(3)}</div>
        </Card>
        <Card className="p-5 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="text-sm text-muted-foreground">{t("finance.totalTransactions")}</div>
          <div className="text-2xl font-bold mt-1">{filtered.length}</div>
        </Card>
        <Card className="p-5 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="text-sm text-muted-foreground">{t("finance.avgTransaction")}</div>
          <div className="text-2xl font-bold mt-1">OMR {avgTransaction.toFixed(3)}</div>
        </Card>
        <Card className="p-5 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="text-sm text-muted-foreground">{t("finance.vatCollected")}</div>
          <div className="text-2xl font-bold mt-1">OMR {totalTax.toFixed(3)}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 dark:bg-zinc-900 dark:border-zinc-800">
          <h3 className="font-semibold mb-4 text-sm">{t("finance.revenueByPlaza")}</h3>
          {byPlaza.length === 0 ? (
            <div className="text-center text-muted-foreground py-4 text-sm">{t("common.noResults")}</div>
          ) : (
            <div className="space-y-3">
              {byPlaza.map((p) => (
                <div key={p.name} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 dark:bg-zinc-800">
                  <div>
                    <div className="font-medium text-sm">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.count} txns</div>
                  </div>
                  <div className="font-semibold text-sm">OMR {p.revenue.toFixed(3)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5 dark:bg-zinc-900 dark:border-zinc-800">
          <h3 className="font-semibold mb-4 text-sm">{t("finance.revenueByVehicle")}</h3>
          {byVehicle.length === 0 ? (
            <div className="text-center text-muted-foreground py-4 text-sm">{t("common.noResults")}</div>
          ) : (
            <div className="space-y-3">
              {byVehicle.map((v) => (
                <div key={v.code} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 dark:bg-zinc-800">
                  <div>
                    <div className="font-medium text-sm">{vehicleNames[v.code] || v.code}</div>
                    <div className="text-xs text-muted-foreground">{v.count} txns</div>
                  </div>
                  <div className="font-semibold text-sm">OMR {v.revenue.toFixed(3)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5 dark:bg-zinc-900 dark:border-zinc-800">
          <h3 className="font-semibold mb-4 text-sm">{t("finance.revenueByPayment")}</h3>
          {byPayment.length === 0 ? (
            <div className="text-center text-muted-foreground py-4 text-sm">{t("common.noResults")}</div>
          ) : (
            <div className="space-y-3">
              {byPayment.map((pm) => (
                <div key={pm.method} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 dark:bg-zinc-800">
                  <div>
                    <div className="font-medium text-sm">{pm.method}</div>
                    <div className="text-xs text-muted-foreground">{pm.count} txns</div>
                  </div>
                  <div className="font-semibold text-sm">OMR {pm.revenue.toFixed(3)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

