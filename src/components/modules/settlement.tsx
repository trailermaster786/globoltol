"use client";
import { useState } from "react";
import { useStore } from "@/store/app-store";
import { can } from "@/lib/rbac";
import { PageContainer, SectionCard, StatusDot, StatCard } from "@/components/common/ui";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import {
  Wallet, Lock, AlertTriangle, CheckCircle2, FileText, ArrowRightLeft,
  Banknote, Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

export function SettlementModule() {
  const currentUser = useStore((s) => s.currentUser)!;
  const settlements = useStore((s) => s.settlements);
  const transactions = useStore((s) => s.transactions);
  const currentTenantId = useStore((s) => s.currentTenantId);
  const lockSettlement = useStore((s) => s.lockSettlement);
  const pushAudit = useStore((s) => s.pushAudit);

  const [lockDialog, setLockDialog] = useState<string | null>(null);

  const visibleSettlements = settlements.filter(
    (s) => currentUser.role === "SUPER_ADMIN" || s.tenantId === currentTenantId
  );
  const canApprove = can(currentUser.role, "settlement", "approve");

  const totalSettled = visibleSettlements
    .filter((s) => s.status === "LOCKED" || s.status === "MATCHED")
    .reduce((sum, s) => sum + s.totalAmount, 0);
  const totalVariance = visibleSettlements.reduce((sum, s) => sum + Math.abs(s.variance), 0);
  const openCount = visibleSettlements.filter((s) => s.status === "OPEN").length;
  const varianceCount = visibleSettlements.filter((s) => s.status === "VARIANCE").length;

  const handleLock = (id: string) => {
    lockSettlement(id, `${currentUser.name} (${currentUser.role})`);
    pushAudit({
      tenantId: currentTenantId,
      actorName: currentUser.name,
      action: "APPROVE",
      module: "settlement",
      entityType: "settlement",
      entityId: id,
      afterValue: JSON.stringify({ status: "LOCKED" }),
      ipAddress: "10.0.1.42",
    });
    toast.success("Settlement locked", {
      description: "End-of-day close complete. No back-dated edits without approval workflow.",
    });
    setLockDialog(null);
  };

  return (
    <PageContainer>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Settled (today)"
          value={formatCurrency(totalSettled, "INR", { compact: true })}
          icon={Wallet}
          variant="revenue"
          sub={`${visibleSettlements.length} batches`}
        />
        <StatCard
          label="Open Batches"
          value={openCount}
          icon={FileText}
          delta="awaiting close"
          sub="Cash + bank reconciliation"
        />
        <StatCard
          label="Variance Cases"
          value={varianceCount}
          icon={AlertTriangle}
          variant="warning"
          delta={`${formatCurrency(totalVariance, "INR", { compact: true })} total`}
          deltaPositive={false}
          sub="Requires investigation"
        />
        <StatCard
          label="Interop Settlement"
          value={formatCurrency(visibleSettlements.filter(s => s.type === "INTEROP_CLEARING").reduce((sum, s) => sum + s.totalAmount, 0), "INR", { compact: true })}
          icon={ArrowRightLeft}
          sub="Cross-network tag clearing"
        />
      </div>

      <Tabs defaultValue="batches">
        <TabsList>
          <TabsTrigger value="batches">Settlement Batches</TabsTrigger>
          <TabsTrigger value="disputes">Disputes & Chargebacks</TabsTrigger>
          <TabsTrigger value="eod">End-of-Day Close</TabsTrigger>
        </TabsList>

        <TabsContent value="batches">
          <SectionCard
            title="Daily Settlement Batches"
            description="Cash reconciliation, bank settlement files, interop clearing"
          >
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Txns</TableHead>
                    <TableHead className="text-right">Expected</TableHead>
                    <TableHead className="text-right">Actual</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleSettlements.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.id}</TableCell>
                      <TableCell className="text-xs">{formatDate(s.batchDate)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[0.6rem]">
                          {s.type.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs">{s.transactionCount.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        {formatCurrency(s.expectedAmount, "INR", { compact: true })}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-medium">
                        {formatCurrency(s.totalAmount, "INR", { compact: true })}
                      </TableCell>
                      <TableCell className={`text-right font-mono text-xs ${s.variance === 0 ? "text-emerald-600" : "text-destructive"}`}>
                        {s.variance === 0 ? "—" : `${s.variance > 0 ? "+" : ""}${formatCurrency(s.variance, "INR", { compact: true })}`}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs">
                          <StatusDot status={s.status} />
                          {s.status}
                        </div>
                        {s.lockedBy && (
                          <div className="text-[0.6rem] text-muted-foreground mt-0.5">
                            by {s.lockedBy.split(" ").slice(0, 2).join(" ")}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {canApprove && s.status === "OPEN" && (
                          <Dialog open={lockDialog === s.id} onOpenChange={(o) => setLockDialog(o ? s.id : null)}>
                            <Button size="sm" variant="outline" className="h-7 text-[0.65rem]" onClick={() => setLockDialog(s.id)}>
                              <Lock className="h-3 w-3 mr-1" /> Lock
                            </Button>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Lock Settlement Batch {s.id}?</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-2 text-xs">
                                <div className="p-3 bg-muted/40 rounded">
                                  <div className="font-semibold mb-1">End-of-Day Close</div>
                                  Once locked, no back-dated edits are permitted without a formal approval
                                  workflow. This action is recorded in the immutable audit log with your name,
                                  role, IP, and timestamp.
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="p-2 border rounded">
                                    <div className="text-[0.6rem] text-muted-foreground uppercase">Batch Total</div>
                                    <div className="font-mono font-bold">{formatCurrency(s.totalAmount)}</div>
                                  </div>
                                  <div className="p-2 border rounded">
                                    <div className="text-[0.6rem] text-muted-foreground uppercase">Variance</div>
                                    <div className={`font-mono font-bold ${s.variance === 0 ? "text-emerald-600" : "text-destructive"}`}>
                                      {formatCurrency(s.variance)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setLockDialog(null)}>Cancel</Button>
                                <Button onClick={() => handleLock(s.id)}>
                                  <Lock className="h-3.5 w-3.5 mr-1.5" /> Confirm Lock
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                        {s.status === "VARIANCE" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[0.65rem] text-amber-700 border-amber-500"
                            onClick={() => toast.info("Investigation opened", { description: "Dispute workflow initiated for batch " + s.id })}
                          >
                            Investigate
                          </Button>
                        )}
                        {s.status === "LOCKED" && (
                          <Badge variant="outline" className="text-[0.6rem] border-emerald-500 text-emerald-700">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Closed
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="disputes">
          <SectionCard
            title="Disputes & Chargebacks"
            description="Evidence attachment (ANPR photo, transaction log) for chargeback defense"
          >
            <div className="space-y-3">
              {[
                { id: "dsp-001", txn: "txn-00342", plate: "MH-12-AB-1234", amount: 410, reason: "Customer claims tag was not used", status: "EVIDENCE_REQUIRED", date: "2h ago" },
                { id: "dsp-002", txn: "txn-00298", plate: "DL-08-CD-5678", amount: 85, reason: "Bank chargeback — insufficient funds claim", status: "CONTESTED", date: "1d ago" },
                { id: "dsp-003", txn: "txn-00201", plate: "KA-01-EF-9012", amount: 265, reason: "Double charge dispute (resolved — idempotency confirmed)", status: "RESOLVED", date: "3d ago" },
              ].map((d) => (
                <div key={d.id} className="p-3 border rounded-md flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-semibold">{d.id}</span>
                      <Badge variant="outline" className="text-[0.6rem]">{d.txn}</Badge>
                      <span className="font-mono text-xs">{d.plate}</span>
                    </div>
                    <div className="text-xs text-foreground">{d.reason}</div>
                    <div className="text-[0.65rem] text-muted-foreground mt-1">{d.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-semibold">{formatCurrency(d.amount)}</div>
                    <Badge
                      variant="outline"
                      className={
                        d.status === "RESOLVED"
                          ? "text-[0.6rem] border-emerald-500 text-emerald-700 mt-1"
                          : d.status === "CONTESTED"
                            ? "text-[0.6rem] border-amber-500 text-amber-700 mt-1"
                            : "text-[0.6rem] border-blue-500 text-blue-700 mt-1"
                      }
                    >
                      {d.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="eod">
          <SectionCard
            title="End-of-Day Close Procedure"
            description="Automated lock — no back-dated edits without approval workflow"
          >
            <div className="space-y-3">
              {[
                { step: "1", title: "Cash shift reconciliation", description: "Lane operators close their tills. Variance flagged if >₹50.", icon: Banknote, status: "complete" },
                { step: "2", title: "Bank settlement file generation", description: "Net position sent to acquiring bank for settlement.", icon: Building2, status: "complete" },
                { step: "3", title: "Interop clearing batch", description: "Cross-network tag transactions settled via clearinghouse.", icon: ArrowRightLeft, status: "in-progress" },
                { step: "4", title: "Variance investigation queue", description: "Open disputes and variance cases flagged for finance review.", icon: AlertTriangle, status: "pending" },
                { step: "5", title: "EOD lock + audit hash", description: "All batches locked; hash-chained audit entry written.", icon: Lock, status: "pending" },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.step} className="flex items-center gap-3 p-3 border rounded">
                    <div className={`h-10 w-10 rounded-full grid place-items-center shrink-0 ${
                      s.status === "complete" ? "bg-emerald-100 text-emerald-700" :
                      s.status === "in-progress" ? "bg-blue-100 text-blue-700" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {s.status === "complete" ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">STEP {s.step}</span>
                        {s.status === "in-progress" && (
                          <Badge className="text-[0.6rem] bg-blue-100 text-blue-700 hover:bg-blue-100">In Progress</Badge>
                        )}
                      </div>
                      <div className="text-sm font-semibold mt-0.5">{s.title}</div>
                      <div className="text-xs text-muted-foreground">{s.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
