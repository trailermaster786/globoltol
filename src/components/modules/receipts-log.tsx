"use client";
import { useMemo, useState } from "react";
import { useStore } from "@/store/app-store";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PAGE_SIZE = 15;

export default function ReceiptsLogModule() {
  const { transactions, plazas, deleteTransaction } = useStore();
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [plazaFilter, setPlazaFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [reprintTx, setReprintTx] = useState<typeof transactions[0] | null>(null);

  const plazaNames = useMemo(() => {
    const map: Record<string, string> = {};
    plazas.forEach((p) => { map[p.id] = p.name; });
    return map;
  }, [plazas]);

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const plate = tx.plateCaptured || "";
      if (search && !plate.toLowerCase().includes(search.toLowerCase()) && !tx.id.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "ALL" && tx.status !== statusFilter) return false;
      if (plazaFilter !== "ALL" && tx.plazaId !== plazaFilter) return false;
      if (paymentFilter !== "ALL" && tx.paymentMethod !== paymentFilter) return false;
      return true;
    });
  }, [transactions, search, statusFilter, plazaFilter, paymentFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCSV = () => {
    const headers = ["Receipt #", "Date", "Plate", "Vehicle", "Plaza", "Amount (OMR)", "Payment", "Status"];
    const rows = filtered.map((tx) => [tx.id, tx.capturedAt.slice(0, 10), tx.plateCaptured || "", tx.vehicleClassCode || "", plazaNames[tx.plazaId || ""] || "", tx.totalAmount.toFixed(3), tx.paymentMethod, tx.status]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this receipt?")) {
      deleteTransaction(id);
    }
  };

  const handleReprint = (tx: typeof transactions[0]) => {
    setReprintTx(tx);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Input placeholder={t("receiptLog.search")} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="max-w-sm dark:bg-zinc-900 dark:border-zinc-700" />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border rounded-lg text-sm dark:bg-zinc-900 dark:border-zinc-700 dark:text-white">
          <option value="ALL">{t("receiptLog.allStatus")}</option>
          <option value="SUCCESS">Success</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
        </select>
        <select value={plazaFilter} onChange={(e) => { setPlazaFilter(e.target.value); setPage(1); }} className="px-3 py-2 border rounded-lg text-sm dark:bg-zinc-900 dark:border-zinc-700 dark:text-white">
          <option value="ALL">{t("receiptLog.allPlazas")}</option>
          {plazas.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={paymentFilter} onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }} className="px-3 py-2 border rounded-lg text-sm dark:bg-zinc-900 dark:border-zinc-700 dark:text-white">
          <option value="ALL">{t("receiptLog.allPayment")}</option>
          <option value="CASH">Cash</option>
          <option value="WALLET">Wallet</option>
          <option value="CARD">Card</option>
          <option value="UPI">UPI</option>
        </select>
        <Button onClick={exportCSV} variant="outline" size="sm" className="dark:border-zinc-700">{t("receiptLog.exportCSV")}</Button>
      </div>

      {/* Reprint Modal */}
      {reprintTx && (
        <Card className="p-6 dark:bg-zinc-900 dark:border-zinc-800 max-w-md mx-auto">
          <h3 className="font-semibold mb-4 text-center">Reprint Receipt</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Receipt #</span><span className="font-mono">{reprintTx.id.slice(-8)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{reprintTx.capturedAt.replace("T", " ").slice(0, 16)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Plate</span><span>{reprintTx.plateCaptured || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Vehicle</span><span>{reprintTx.vehicleClassCode || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Plaza</span><span>{plazaNames[reprintTx.plazaId || ""] || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-semibold">OMR {reprintTx.totalAmount.toFixed(3)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><span>{reprintTx.paymentMethod}</span></div>
          </div>
          <div className="flex gap-2 mt-4 justify-center">
            <Button onClick={() => window.print()}>🖨️ Print</Button>
            <Button variant="outline" onClick={() => setReprintTx(null)} className="dark:border-zinc-700">{t("common.close")}</Button>
          </div>
        </Card>
      )}

      <Card className="dark:bg-zinc-900 dark:border-zinc-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b dark:border-zinc-800">
                <th className="p-3 font-medium">{t("receiptLog.receiptNo")}</th>
                <th className="p-3 font-medium">{t("receiptLog.date")}</th>
                <th className="p-3 font-medium">{t("receiptLog.plate")}</th>
                <th className="p-3 font-medium">{t("receiptLog.vehicleClass")}</th>
                <th className="p-3 font-medium">{t("receiptLog.plaza")}</th>
                <th className="p-3 font-medium">{t("receiptLog.amount")}</th>
                <th className="p-3 font-medium">{t("receiptLog.payment")}</th>
                <th className="p-3 font-medium">{t("receiptLog.status")}</th>
                <th className="p-3 font-medium">Reprint</th>
                <th className="p-3 font-medium">{t("stations.delete")}</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((tx) => (
                <tr key={tx.id} className="border-b last:border-0 dark:border-zinc-800 hover:bg-muted/50 dark:hover:bg-zinc-800/50">
                  <td className="p-3 font-mono text-xs">{tx.id.slice(-8)}</td>
                  <td className="p-3 text-xs">{tx.capturedAt.replace("T", " ").slice(0, 16)}</td>
                  <td className="p-3">{tx.plateCaptured || "—"}</td>
                  <td className="p-3">{tx.vehicleClassCode || "—"}</td>
                  <td className="p-3">{plazaNames[tx.plazaId || ""] || "—"}</td>
                  <td className="p-3 font-semibold">OMR {tx.totalAmount.toFixed(3)}</td>
                  <td className="p-3">{tx.paymentMethod}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${tx.status === "SUCCESS" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : tx.status === "PENDING" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="p-3"><Button variant="ghost" size="sm" onClick={() => handleReprint(tx)}>🖨️</Button></td>
                  <td className="p-3"><Button variant="ghost" size="sm" onClick={() => handleDelete(tx.id)} className="text-red-600 hover:text-red-700">🗑️</Button></td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">{t("common.noResults")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between p-3 border-t dark:border-zinc-800 text-sm text-muted-foreground">
          <span>{t("receiptLog.showing")} {paged.length} {t("receiptLog.of")} {filtered.length} {t("receiptLog.receipts")}</span>
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
