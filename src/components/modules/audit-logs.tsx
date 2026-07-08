"use client";
import { useMemo, useState } from "react";
import { useStore } from "@/store/app-store";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PAGE_SIZE = 20;

const SEVERITY_STYLES: Record<string, string> = {
  INFO: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  WARNING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  ERROR: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  CRITICAL: "bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300",
};

export default function AuditLogsModule() {
  const { auditLogs } = useStore();
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [userFilter, setUserFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const actions = useMemo(() => {
    const set = new Set(auditLogs.map((l) => l.action));
    return Array.from(set);
  }, [auditLogs]);

  const users = useMemo(() => {
    const set = new Set(auditLogs.map((l) => l.actorName));
    return Array.from(set);
  }, [auditLogs]);

  const filtered = useMemo(() => {
    return auditLogs.filter((log) => {
      if (search && !log.action.toLowerCase().includes(search.toLowerCase()) && !log.actorName.toLowerCase().includes(search.toLowerCase()) && !(log.entityType || "").toLowerCase().includes(search.toLowerCase())) return false;
      if (actionFilter !== "ALL" && log.action !== actionFilter) return false;
      if (userFilter !== "ALL" && log.actorName !== userFilter) return false;
      return true;
    });
  }, [auditLogs, search, actionFilter, userFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCSV = () => {
    const headers = ["Timestamp", "Action", "User", "Entity", "Module", "IP"];
    const rows = filtered.map((l) => [l.createdAt, l.action, l.actorName, l.entityType || "", l.module, l.ipAddress || ""]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSeverity = (action: string) => {
    if (action === "DELETE") return "CRITICAL";
    if (action === "UPDATE") return "WARNING";
    return "INFO";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <Input placeholder={t("audit.search")} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="max-w-sm dark:bg-zinc-900 dark:border-zinc-700" />
        <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }} className="px-3 py-2 border rounded-lg text-sm dark:bg-zinc-900 dark:border-zinc-700 dark:text-white">
          <option value="ALL">{t("audit.allActions")}</option>
          {actions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={userFilter} onChange={(e) => { setUserFilter(e.target.value); setPage(1); }} className="px-3 py-2 border rounded-lg text-sm dark:bg-zinc-900 dark:border-zinc-700 dark:text-white">
          <option value="ALL">{t("audit.allUsers")}</option>
          {users.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
        <Button variant="outline" size="sm" onClick={() => { setSearch(""); setActionFilter("ALL"); setUserFilter("ALL"); setPage(1); }} className="dark:border-zinc-700">{t("audit.clearFilters")}</Button>
        <Button onClick={exportCSV} variant="outline" size="sm" className="dark:border-zinc-700">{t("audit.export")}</Button>
      </div>

      <Card className="dark:bg-zinc-900 dark:border-zinc-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b dark:border-zinc-800">
                <th className="p-3 font-medium">{t("audit.timestamp")}</th>
                <th className="p-3 font-medium">{t("audit.action")}</th>
                <th className="p-3 font-medium">{t("audit.user")}</th>
                <th className="p-3 font-medium">{t("audit.details")}</th>
                <th className="p-3 font-medium">{t("audit.ip")}</th>
                <th className="p-3 font-medium">{t("audit.severity")}</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((log) => {
                const sev = getSeverity(log.action);
                return (
                  <tr key={log.id} className="border-b last:border-0 dark:border-zinc-800 hover:bg-muted/50 dark:hover:bg-zinc-800/50">
                    <td className="p-3 text-xs whitespace-nowrap">{log.createdAt.replace("T", " ").slice(0, 19)}</td>
                    <td className="p-3 font-mono text-xs">{log.action}</td>
                    <td className="p-3">{log.actorName}</td>
                    <td className="p-3 text-muted-foreground max-w-xs truncate">{log.entityType || "—"}</td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">{log.ipAddress || "—"}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${SEVERITY_STYLES[sev]}`}>
                        {sev}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {paged.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">{t("common.noResults")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between p-3 border-t dark:border-zinc-800 text-sm text-muted-foreground">
          <span>{t("audit.showing")} {paged.length} {t("audit.of")} {filtered.length} {t("audit.events")}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} className="dark:border-zinc-700">{t("common.prev")}</Button>
            <span className="px-3 py-1">{t("common.page")} {page} {t("common.of")} {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="dark:border-zinc-700">{t("common.next")}</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

