"use client";
import { useMemo, useState } from "react";
import { useStore } from "@/store/app-store";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ManageStationsModule() {
  const { plazas, addPlaza, updatePlaza } = useStore();
  const { t } = useI18n();
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", region: "", laneCount: 4, status: "OPEN" as "OPEN" | "CLOSED" | "MAINTENANCE" });

  const handleSave = () => {
    if (!form.name || !form.code) return;
    if (editing) {
      updatePlaza(editing, { name: form.name, code: form.code, status: form.status });
    } else {
      addPlaza({ name: form.name, code: form.code, status: form.status });
    }
    setShowForm(false);
    setEditing(null);
    setForm({ name: "", code: "", region: "", laneCount: 4, status: "OPEN" });
  };

  const startEdit = (p: typeof plazas[0]) => {
    setForm({ name: p.name, code: p.code, region: "", laneCount: 4, status: p.status });
    setEditing(p.id);
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">{t("stations.title")}</h2>
        <Button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: "", code: "", region: "", laneCount: 4, status: "OPEN" }); }}>{t("stations.add")}</Button>
      </div>

      {showForm && (
        <Card className="p-5 dark:bg-zinc-900 dark:border-zinc-800">
          <h3 className="font-semibold mb-4">{editing ? t("common.edit") : t("stations.add")}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">{t("stations.name")}</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Muscat Gate" className="mt-1 dark:bg-zinc-800 dark:border-zinc-700" />
            </div>
            <div>
              <label className="text-sm font-medium">{t("stations.code")}</label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="MCT-01" className="mt-1 dark:bg-zinc-800 dark:border-zinc-700" />
            </div>
            <div>
              <label className="text-sm font-medium">{t("stations.status")}</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "OPEN" | "CLOSED" | "MAINTENANCE" })} className="w-full px-3 py-2 border rounded-lg text-sm mt-1 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white">
                <option value="OPEN">{t("stations.active")}</option>
                <option value="CLOSED">{t("stations.inactive")}</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSave}>{t("stations.save")}</Button>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditing(null); }} className="dark:border-zinc-700">{t("stations.cancel")}</Button>
          </div>
        </Card>
      )}

      <Card className="dark:bg-zinc-900 dark:border-zinc-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b dark:border-zinc-800">
                <th className="p-3 font-medium">{t("stations.name")}</th>
                <th className="p-3 font-medium">{t("stations.code")}</th>
                <th className="p-3 font-medium">{t("stations.status")}</th>
                <th className="p-3 font-medium">{t("stations.edit")}</th>
              </tr>
            </thead>
            <tbody>
              {plazas.map((p) => (
                <tr key={p.id} className="border-b last:border-0 dark:border-zinc-800 hover:bg-muted/50 dark:hover:bg-zinc-800/50">
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 font-mono text-xs">{p.code}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.status === "OPEN" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                      {p.status === "OPEN" ? t("stations.active") : t("stations.inactive")}
                    </span>
                  </td>
                  <td className="p-3"><Button variant="ghost" size="sm" onClick={() => startEdit(p)}>{t("stations.edit")}</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

