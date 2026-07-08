"use client";
import { useState } from "react";
import { useStore } from "@/store/app-store";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function VehicleCategoriesModule() {
  const { vehicleClasses, addVehicleClass, updateVehicleClass } = useStore();
  const { t } = useI18n();
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", label: "", description: "", axleCount: 2 });

  const handleSave = () => {
    if (!form.code || !form.label) return;
    if (editing) {
      updateVehicleClass(editing, { label: form.label, description: form.description, axleCount: form.axleCount });
    } else {
      addVehicleClass({ ...form });
    }
    setShowForm(false);
    setEditing(null);
    setForm({ code: "", label: "", description: "", axleCount: 2 });
  };

  const startEdit = (v: typeof vehicleClasses[0]) => {
    setForm({ code: v.code, label: v.label, description: v.description, axleCount: v.axleCount });
    setEditing(v.code);
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">{t("vehicles.title")}</h2>
        <Button onClick={() => { setShowForm(true); setEditing(null); setForm({ code: "", label: "", description: "", axleCount: 2 }); }}>{t("vehicles.add")}</Button>
      </div>

      {showForm && (
        <Card className="p-5 dark:bg-zinc-900 dark:border-zinc-800">
          <h3 className="font-semibold mb-4">{editing ? t("common.edit") : t("vehicles.add")}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">{t("vehicles.code")}</label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "") })} placeholder="CAR" disabled={!!editing} className="mt-1 dark:bg-zinc-800 dark:border-zinc-700" />
            </div>
            <div>
              <label className="text-sm font-medium">{t("vehicles.name")}</label>
              <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Sedan / SUV" className="mt-1 dark:bg-zinc-800 dark:border-zinc-700" />
            </div>
            <div>
              <label className="text-sm font-medium">{t("vehicles.description")}</label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 dark:bg-zinc-800 dark:border-zinc-700" />
            </div>
            <div>
              <label className="text-sm font-medium">{t("vehicles.axleCount")}</label>
              <Input type="number" min={1} max={10} value={form.axleCount} onChange={(e) => setForm({ ...form, axleCount: parseInt(e.target.value) || 2 })} className="mt-1 dark:bg-zinc-800 dark:border-zinc-700" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSave}>{t("vehicles.save")}</Button>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditing(null); }} className="dark:border-zinc-700">{t("vehicles.cancel")}</Button>
          </div>
        </Card>
      )}

      <Card className="dark:bg-zinc-900 dark:border-zinc-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b dark:border-zinc-800">
                <th className="p-3 font-medium">{t("vehicles.code")}</th>
                <th className="p-3 font-medium">{t("vehicles.name")}</th>
                <th className="p-3 font-medium">{t("vehicles.description")}</th>
                <th className="p-3 font-medium">{t("vehicles.axleCount")}</th>
                <th className="p-3 font-medium">{t("vehicles.edit")}</th>
              </tr>
            </thead>
            <tbody>
              {vehicleClasses.map((v) => (
                <tr key={v.code} className="border-b last:border-0 dark:border-zinc-800 hover:bg-muted/50 dark:hover:bg-zinc-800/50">
                  <td className="p-3 font-mono text-xs font-semibold">{v.code}</td>
                  <td className="p-3">{v.label}</td>
                  <td className="p-3 text-muted-foreground">{v.description}</td>
                  <td className="p-3">{v.axleCount}</td>
                  <td className="p-3"><Button variant="ghost" size="sm" onClick={() => startEdit(v)}>{t("vehicles.edit")}</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
