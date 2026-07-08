"use client";
import { useMemo, useState } from "react";
import { useStore } from "@/store/app-store";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function OperatorShiftsModule() {
  const { shifts, transactions, plazas } = useStore();
  const { t } = useI18n();

  const plazaNames = useMemo(() => {
    const map: Record<string, string> = {};
    plazas.forEach((p) => { map[p.id] = p.name; });
    return map;
  }, [plazas]);

  const getShiftStats = (shiftId: string) => {
    const txns = transactions.filter((tx) => {
      const txPlazaId = tx.plazaId;
      const shift = shifts.find((s) => s.id === shiftId);
      return shift && txPlazaId === shift.plazaId && tx.capturedAt >= shift.startedAt && (!shift.endedAt || tx.capturedAt <= shift.endedAt);
    });
    return { txCount: txns.length, revenue: txns.reduce((s, tx) => s + tx.totalAmount, 0) };
  };

  const formatDuration = (start: string, end?: string) => {
    const s = new Date(start).getTime();
    const e = end ? new Date(end).getTime() : Date.now();
    const diff = e - s;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t("shifts.title")}</h2>

      <Card className="dark:bg-zinc-900 dark:border-zinc-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b dark:border-zinc-800">
                <th className="p-3 font-medium">Shift ID</th>
                <th className="p-3 font-medium">{t("shifts.operator")}</th>
                <th className="p-3 font-medium">{t("shifts.plaza")}</th>
                <th className="p-3 font-medium">{t("shifts.started")}</th>
                <th className="p-3 font-medium">{t("shifts.ended")}</th>
                <th className="p-3 font-medium">{t("shifts.duration")}</th>
                <th className="p-3 font-medium">{t("shifts.transactions")}</th>
                <th className="p-3 font-medium">Revenue</th>
                <th className="p-3 font-medium">{t("shifts.status")}</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((shift) => {
                const stats = getShiftStats(shift.id);
                return (
                  <tr key={shift.id} className="border-b last:border-0 dark:border-zinc-800 hover:bg-muted/50 dark:hover:bg-zinc-800/50">
                    <td className="p-3 font-mono text-xs">{shift.id.slice(-8)}</td>
                    <td className="p-3">{shift.operatorName}</td>
                    <td className="p-3">{shift.plazaName}</td>
                    <td className="p-3 text-xs">{shift.startedAt.replace("T", " ").slice(0, 16)}</td>
                    <td className="p-3 text-xs">{shift.endedAt ? shift.endedAt.replace("T", " ").slice(0, 16) : "—"}</td>
                    <td className="p-3">{formatDuration(shift.startedAt, shift.endedAt)}</td>
                    <td className="p-3">{stats.txCount}</td>
                    <td className="p-3 font-semibold">OMR {stats.revenue.toFixed(3)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${shift.status === "OPEN" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                        {shift.status === "OPEN" ? t("shifts.open") : t("shifts.closed")}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {shifts.length === 0 && (
                <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">{t("common.noResults")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
