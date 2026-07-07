"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { useStore } from "@/store/app-store";
import { can } from "@/lib/rbac";
import { PageContainer, SectionCard, StatusDot, StatCard } from "@/components/common/ui";
import { formatCurrency, formatTime, timeAgo, formatDateTime } from "@/lib/format";
import type { Transaction, PaymentMethod } from "@/lib/types";
import {
  ArrowLeftRight, CheckCircle2, XCircle, Clock, IndianRupee,
  Zap, Filter, Download, AlertTriangle, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  WALLET: "Wallet",
  UPI: "UPI",
  CARD: "Card",
  NETBANKING: "Net Banking",
  CASH: "Cash",
  FLEET_INVOICE: "Fleet Invoice",
};

export function TransactionsModule() {
  const currentUser = useStore((s) => s.currentUser)!;
  const transactions = useStore((s) => s.transactions);
  const plazas = useStore((s) => s.plazas);
  const lanes = useStore((s) => s.lanes);
  const currentTenantId = useStore((s) => s.currentTenantId);
  const addTransaction = useStore((s) => s.addTransaction);
  const pushAudit = useStore((s) => s.pushAudit);
  const pushNotification = useStore((s) => s.pushNotification);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [methodFilter, setMethodFilter] = useState<string>("ALL");
  const [liveMode, setLiveMode] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);

  const canEdit = can(currentUser.role, "transactions", "edit");
  const canRefund = can(currentUser.role, "transactions", "approve");

  const visibleTxns = useMemo(() => {
    return transactions
      .filter((t) => currentUser.role === "SUPER_ADMIN" || t.tenantId === currentTenantId)
      .filter((t) => (statusFilter === "ALL" ? true : t.status === statusFilter))
      .filter((t) => (methodFilter === "ALL" ? true : t.paymentMethod === methodFilter))
      .filter((t) =>
        search
          ? t.id.toLowerCase().includes(search.toLowerCase()) ||
            t.plateCaptured?.toLowerCase().includes(search.toLowerCase()) ||
            t.idempotencyKey?.toLowerCase().includes(search.toLowerCase())
          : true
      );
  }, [transactions, currentUser, currentTenantId, statusFilter, methodFilter, search]);

  // Live-mode: simulate new transactions arriving every ~4s
  const liveTxns = useRef<Transaction[]>([]);
  useEffect(() => {
    if (!liveMode) return;
    const interval = setInterval(() => {
      const plz = plazas.find((p) => p.tenantId === currentTenantId && p.status === "OPEN");
      if (!plz) return;
      const ln = lanes.find((l) => l.plazaId === plz.id && l.status === "OPEN");
      if (!ln) return;
      const methods: PaymentMethod[] = ["WALLET", "WALLET", "WALLET", "UPI", "CARD", "CASH"];
      const method = methods[Math.floor(Math.random() * methods.length)];
      const amount = [35, 85, 140, 190, 265, 410, 620][Math.floor(Math.random() * 7)];
      const tax = Math.round(amount * 0.05);
      const success = Math.random() > 0.05;
      const plates = ["MH-12-AB-1234", "DL-08-CD-5678", "KA-01-EF-9012", "TN-22-GH-3456", "GJ-05-IJ-7890"];
      const newTxn: Transaction = {
        id: `txn-${String(Date.now()).slice(-5)}`,
        tenantId: currentTenantId,
        plazaId: plz.id,
        laneId: ln.id,
        plateCaptured: plates[Math.floor(Math.random() * plates.length)],
        vehicleClassCode: "CAR",
        amount,
        taxAmount: tax,
        totalAmount: amount + tax,
        paymentMethod: method,
        status: success ? "SUCCESS" : "FAILED",
        failureReason: success ? undefined : "Insufficient wallet balance",
        idempotencyKey: `idk-${plz.code}-${ln.id}-${Date.now()}`,
        capturedAt: new Date().toISOString(),
      };
      addTransaction(newTxn);
      liveTxns.current = [newTxn, ...liveTxns.current].slice(0, 30);

      if (success) {
        pushNotification({
          tenantId: currentTenantId,
          channel: "SMS",
          template: "TXN_SUCCESS",
          recipient: `+91${Math.floor(7000000000 + Math.random() * 2999999999)}`,
          payload: `₹${amount + tax} deducted at ${plz.code}. Balance ₹${Math.floor(Math.random() * 3000)}.`,
          status: "SENT",
          sentAt: new Date().toISOString(),
        });
      }
    }, 4500);
    return () => clearInterval(interval);
  }, [liveMode, plazas, lanes, currentTenantId, addTransaction, pushNotification]);

  // KPIs
  const last1hTxns = visibleTxns.filter(
    (t) => Date.now() - new Date(t.capturedAt).getTime() < 60 * 60_000
  );
  const last1hRevenue = last1hTxns
    .filter((t) => t.status === "SUCCESS")
    .reduce((s, t) => s + t.totalAmount, 0);
  const failedTxns = visibleTxns.filter((t) => t.status === "FAILED");

  return (
    <PageContainer>
      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Transactions (1h)"
          value={last1hTxns.length}
          delta="real-time feed"
          icon={ArrowLeftRight}
          sub={`${visibleTxns.length} total in view`}
        />
        <StatCard
          label="Revenue (1h)"
          value={formatCurrency(last1hRevenue, "INR", { compact: true })}
          delta={`${last1hTxns.filter(t => t.status === "SUCCESS").length} successful`}
          icon={IndianRupee}
          variant="revenue"
        />
        <StatCard
          label="Avg Processing"
          value="142ms"
          delta="−18ms p95"
          icon={Zap}
          sub="Within SLA (<200ms)"
        />
        <StatCard
          label="Failed Txns"
          value={failedTxns.length}
          delta={`${((failedTxns.length / Math.max(visibleTxns.length, 1)) * 100).toFixed(1)}% rate`}
          deltaPositive={false}
          icon={XCircle}
          variant="warning"
          sub="Requires manual review"
        />
      </div>

      <SectionCard
        title="Live Transaction Stream"
        description="Real-time capture from lane hardware — RFID, ANPR, cash entry"
        action={
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs">
              <Switch checked={liveMode} onCheckedChange={setLiveMode} />
              <span className="font-medium">Live mode</span>
              {liveMode && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  streaming
                </span>
              )}
            </label>
          </div>
        }
      >
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-3">
          <div className="relative flex-1 min-w-48">
            <Filter className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Txn ID, plate, or idempotency key…"
              className="pl-9 h-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="SUCCESS">Success</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="REFUNDED">Refunded</SelectItem>
            </SelectContent>
          </Select>
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="w-40 h-9">
              <SelectValue placeholder="Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Methods</SelectItem>
              {Object.entries(PAYMENT_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-9">
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export
          </Button>
        </div>

        {/* Transaction table */}
        <div className="rounded-md border max-h-[560px] overflow-y-auto scrollbar-thin">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead className="w-32">Txn ID</TableHead>
                <TableHead className="w-32">Captured</TableHead>
                <TableHead>Plate</TableHead>
                <TableHead>Plaza · Lane</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleTxns.slice(0, 100).map((t, i) => {
                const plaza = plazas.find((p) => p.id === t.plazaId);
                const lane = lanes.find((l) => l.id === t.laneId);
                const isLive = liveMode && i < 3 && Date.now() - new Date(t.capturedAt).getTime() < 30000;
                return (
                  <TableRow
                    key={t.id}
                    className={isLive ? "bg-emerald-50/40 animate-in fade-in" : ""}
                  >
                    <TableCell className="font-mono text-[0.65rem]">{t.id}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatTime(t.capturedAt)}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold">
                      {t.plateCaptured ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="font-mono text-[0.65rem] text-muted-foreground">
                        {plaza?.code} · L{lane?.number}
                      </div>
                      <div className="text-[0.65rem] text-muted-foreground">{plaza?.name}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[0.6rem]">
                        {PAYMENT_LABELS[t.paymentMethod]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      <div className="font-semibold">{formatCurrency(t.totalAmount)}</div>
                      <div className="text-[0.6rem] text-muted-foreground">
                        +{formatCurrency(t.taxAmount)} GST
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs">
                        <StatusDot status={t.status} />
                        {t.status}
                      </div>
                      {t.failureReason && (
                        <div className="text-[0.6rem] text-destructive mt-0.5">
                          {t.failureReason}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {t.status === "FAILED" && canRefund && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[0.65rem]"
                          onClick={() => {
                            pushAudit({
                              tenantId: currentTenantId,
                              actorName: currentUser.name,
                              action: "APPROVE",
                              module: "transactions",
                              entityType: "transaction",
                              entityId: t.id,
                              afterValue: JSON.stringify({ action: "MANUAL_RETRY" }),
                              ipAddress: "10.0.1.42",
                            });
                            toast.success("Retry queued", {
                              description: `Txn ${t.id} re-submitted to payment gateway`,
                            });
                          }}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" /> Retry
                        </Button>
                      )}
                      {t.status === "SUCCESS" && canRefund && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[0.65rem] text-destructive"
                          onClick={() => {
                            toast.success("Refund initiated", {
                              description: `₹${t.totalAmount} → ${t.plateCaptured} (2-5 business days)`,
                            });
                          }}
                        >
                          Refund
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Failed txn alert banner */}
        {failedTxns.length > 0 && (
          <div className="mt-4 p-3 rounded-md border border-amber-500/30 bg-amber-50/40 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <strong className="text-foreground">{failedTxns.length} failed transactions</strong> require
              attention. The "tag not read" fallback flow will trigger image capture → manual review →
              invoice-to-owner via postal/email/SMS for vehicles that cannot be auto-billed.
            </div>
            <Button size="sm" variant="outline" className="h-7 text-[0.65rem]">
              Review Queue
            </Button>
          </div>
        )}
      </SectionCard>

      {/* Double-charge prevention + idempotency explainer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard
          title="Idempotency & Double-Charge Prevention"
          description="Every lane transaction carries an idempotency key (lane+timestamp+plate)"
        >
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground">Idempotency keys:</strong> retried
                requests with the same key return the original response, preventing double charges
                during network retries.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground">Lane fingerprinting:</strong> plaza+lane+timestamp+plate
                hash is recorded; within a 90-second window, duplicate captures are flagged for review.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground">Wallet debit atomicity:</strong> balance check + debit
                happen in a single DB transaction with row-level lock — no race conditions on concurrent reads.
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Payment Gateway Adapters"
          description="Pluggable adapters — Stripe / Razorpay / PayPal / local gateways"
        >
          <div className="space-y-2">
            {[
              { name: "Razorpay", status: "ACTIVE", uptime: "99.98%", region: "IN" },
              { name: "PhonePe", status: "ACTIVE", uptime: "99.95%", region: "IN" },
              { name: "PayPal", status: "ACTIVE", uptime: "99.92%", region: "GLOBAL" },
              { name: "Stripe", status: "STANDBY", uptime: "99.99%", region: "GLOBAL" },
            ].map((g) => (
              <div key={g.name} className="flex items-center justify-between p-2 border rounded text-xs">
                <div className="flex items-center gap-2">
                  <StatusDot status={g.status === "ACTIVE" ? "ACTIVE" : "CLOSED"} />
                  <span className="font-medium">{g.name}</span>
                  <Badge variant="outline" className="text-[0.6rem]">{g.region}</Badge>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>uptime: {g.uptime}</span>
                  <Badge variant="outline" className="text-[0.6rem]">{g.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </PageContainer>
  );
}
