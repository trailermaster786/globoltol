"use client";
import { useMemo, useState } from "react";
import { useStore } from "@/store/app-store";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RateCardsModule() {
  const { rateCards, vehicleClasses, plazas, deleteRateCard, updateRateCard } = useStore();
  const { t } = useI18n();
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ singleJourney: 0, roundJourney: 0, monthlyPass: 0, status: "ACTIVE" as "ACTIVE" | "DRAFT" | "ARCHIVED" });

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

  const handleSave = () => {
    if (!editing) return;
    updateRateCard(editing, {
      singleJourney: form.singleJourney,
      roundJourney: form.roundJourney,
      monthlyPass: form.monthlyPass,
      status: form.status,
    });
    setShowForm(false);
    setEditing(null);
  };

  const startEdit = (r: typeof rateCards[0]) => {
    setForm({
      singleJourney: r.singleJourney,
      roundJourney: r.roundJourney || 0,
      monthlyPass: r.monthlyPass || 0,
      status: r.status,
    });
    setEditing(r.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this rate card?")) {
      deleteRateCard(id);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t("rates.title")}</h2>

      {showForm && (
        <Card className="p-5 dark:bg-zinc-900 dark:border-zinc-800">
          <h3 className="font-semibold mb-4">{t("common.edit")} Rate Card</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">{t("rates.baseToll")} (OMR)</label>
              <Input type="number" step="0.001" min={0} value={form.singleJourney} onChange={(e) => setForm({ ...form, singleJourney: parseFloat(e.target.value) || 0 })} className="mt-1 dark:bg-zinc-800 dark:border-zinc-700" />
            </div>
            <div>
              <label className="text-sm font-medium">Round Trip (OMR)</label>
              <Input type="number" step="0.001" min={0} value={form.roundJourney} onChange={(e) => setForm({ ...form, roundJourney: parseFloat(e.target.value) || 0 })} className="mt-1 dark:bg-zinc-800 dark:border-zinc-700" />
            </div>
            <div>
              <label className="text-sm font-medium">Monthly Pass (OMR)</label>
              <Input type="number" step="0.001" min={0} value={form.monthlyPass} onChange={(e) => setForm({ ...form, monthlyPass: parseFloat(e.target.value) || 0 })} className="mt-1 dark:bg-zinc-800 dark:border-zinc-700" />
            </div>
            <div>
              <label className="text-sm font-medium">{t("rates.status")}</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "ACTIVE" | "DRAFT" | "ARCHIVED" })} className="w-full px-3 py-2 border rounded-lg text-sm mt-1 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white">
                <option value="ACTIVE">Active</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSave}>{t("rates.save")}</Button>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditing(null); }} className="dark:border-zinc-700">{t("rates.cancel")}</Button>
          </div>
        </Card>
      )}

      <Card className="dark:bg-zinc-900 dark:border-zinc-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b dark:border-zinc-800">
                <th className="p-3 font-medium">{t("rates.vehicleClass")}</th>
                <th className="p-3 font-medium">Plaza</th>
                <th className="p-3 font-medium">{t("rates.baseToll")}</th>
                <th className="p-3 font-medium">Round Trip</th>
                <th className="p-3 font-medium">Monthly Pass</th>
                <th className="p-3 font-medium">Version</th>
                <th className="p-3 font-medium">{t("rates.status")}</th>
                <th className="p-3 font-medium">{t("rates.edit")}</th>
                <th className="p-3 font-medium">{t("rates.delete")}</th>
              </tr>
            </thead>
            <tbody>
              {rateCards.map((r) => (
                <tr key={r.id} className="border-b last:border-0 dark:border-zinc-800 hover:bg-muted/50 dark:hover:bg-zinc-800/50">
                  <td className="p-3">{vehicleNames[r.vehicleClassCode] || r.vehicleClassCode}</td>
                  <td className="p-3 text-xs">{plazaNames[r.plazaId || ""] || "All"}</td>
                  <td className="p-3 font-semibold">OMR {r.singleJourney.toFixed(3)}</td>
                  <td className="p-3">OMR {r.roundJourney?.toFixed(3) || "—"}</td>
                  <td className="p-3">OMR {r.monthlyPass?.toFixed(3) || "—"}</td>
                  <td className="p-3 font-mono text-xs">v{r.version}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.status === "ACTIVE" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3"><Button variant="ghost" size="sm" onClick={() => startEdit(r)}>{t("rates.edit")}</Button></td>
                  <td className="p-3"><Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)} className="text-red-600 hover:text-red-700">{t("rates.delete")}</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
