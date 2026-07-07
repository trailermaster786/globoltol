"use client";
import { useState } from "react";
import { useStore } from "@/store/app-store";
import { can } from "@/lib/rbac";
import { PageContainer, SectionCard, StatusDot, StatCard } from "@/components/common/ui";
import { formatCurrency, formatDate, formatDateTime, timeAgo } from "@/lib/format";
import {
  ShieldAlert, Camera, FileText, Gavel, ExternalLink, AlertTriangle,
  CheckCircle2, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const VIOLATION_LABELS: Record<string, string> = {
  UNPAID_PASS: "Unpaid Pass-through",
  TAG_MISMATCH: "Tag Mismatch",
  BLACKLISTED: "Blacklisted Vehicle",
  WRONG_LANE: "Wrong Lane Usage",
  OVERSPEED: "Over-speeding",
};

const VIOLATION_AMOUNTS: Record<string, number> = {
  UNPAID_PASS: 500,
  TAG_MISMATCH: 750,
  BLACKLISTED: 2000,
  WRONG_LANE: 300,
  OVERSPEED: 1500,
};

export function ViolationsModule() {
  const currentUser = useStore((s) => s.currentUser)!;
  const violations = useStore((s) => s.violations);
  const challans = useStore((s) => s.challans);
  const plazas = useStore((s) => s.plazas);
  const lanes = useStore((s) => s.lanes);
  const currentTenantId = useStore((s) => s.currentTenantId);
  const issueChallan = useStore((s) => s.issueChallan);
  const payChallan = useStore((s) => s.payChallan);

  const [issueDialog, setIssueDialog] = useState<string | null>(null);
  const [detailViolationId, setDetailViolationId] = useState<string | null>(null);

  const visibleViolations = violations.filter(
    (v) => currentUser.role === "SUPER_ADMIN" || v.tenantId === currentTenantId
  );
  const canIssue = can(currentUser.role, "violations", "create");

  const stats = {
    total: visibleViolations.length,
    detected: visibleViolations.filter((v) => v.status === "DETECTED").length,
    issued: visibleViolations.filter((v) => v.status === "CHALLAN_ISSUED").length,
    paid: visibleViolations.filter((v) => v.status === "PAID").length,
    escalated: visibleViolations.filter((v) => v.status === "ESCALATED").length,
  };

  const detailV = detailViolationId ? violations.find(v => v.id === detailViolationId) : null;
  const detailChallan = detailV ? challans.find(c => c.violationId === detailV.id) : null;

  const handleIssue = (violationId: string, type: string) => {
    const amount = VIOLATION_AMOUNTS[type] ?? 500;
    issueChallan(violationId, amount);
    toast.success("E-Challan issued", {
      description: `CHL-${Math.floor(Math.random() * 9000) + 1000} · ${formatCurrency(amount)} · Due in 15 days`,
    });
    setIssueDialog(null);
  };

  return (
    <PageContainer>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Total Violations" value={stats.total} icon={ShieldAlert} />
        <StatCard label="Detected" value={stats.detected} icon={AlertTriangle} variant="warning" sub="Awaiting review" />
        <StatCard label="Challans Issued" value={stats.issued} icon={FileText} sub="Pending payment" />
        <StatCard label="Paid" value={stats.paid} icon={CheckCircle2} variant="revenue" />
        <StatCard label="Escalated" value={stats.escalated} icon={Gavel} variant="warning" sub="Repeat offenders" />
      </div>

      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">Detection Queue</TabsTrigger>
          <TabsTrigger value="challans">Issued Challans</TabsTrigger>
          <TabsTrigger value="public">Public Payment Portal</TabsTrigger>
        </TabsList>

        <TabsContent value="queue">
          <SectionCard
            title="Auto-Detection Queue"
            description="ML-based violation detection with evidence packages ready for review"
          >
            <div className="rounded-md border max-h-[560px] overflow-y-auto scrollbar-thin">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead className="w-20">Violation</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Plate</TableHead>
                    <TableHead>Plaza · Lane</TableHead>
                    <TableHead>Detected</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-40">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleViolations.map((v) => {
                    const plaza = plazas.find((p) => p.id === v.plazaId);
                    const lane = lanes.find((l) => l.id === v.laneId);
                    return (
                      <TableRow key={v.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setDetailViolationId(v.id)}>
                        <TableCell className="font-mono text-[0.65rem]">{v.id}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[0.65rem]">
                            {VIOLATION_LABELS[v.type]}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs font-semibold">{v.plateCaptured}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {plaza?.code} · L{lane?.number}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{timeAgo(v.detectedAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs">
                            <StatusDot status={v.status} />
                            {v.status.replace("_", " ").toLowerCase()}
                          </div>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {canIssue && v.status === "DETECTED" && (
                            <Dialog open={issueDialog === v.id} onOpenChange={(o) => setIssueDialog(o ? v.id : null)}>
                              <Button size="sm" className="h-7 text-[0.65rem]" onClick={() => setIssueDialog(v.id)}>
                                <FileText className="h-3 w-3 mr-1" /> Issue Challan
                              </Button>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Issue E-Challan for {v.plateCaptured}?</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-3 text-xs">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="p-2 border rounded">
                                      <div className="text-[0.6rem] text-muted-foreground uppercase">Violation Type</div>
                                      <div className="font-medium">{VIOLATION_LABELS[v.type]}</div>
                                    </div>
                                    <div className="p-2 border rounded">
                                      <div className="text-[0.6rem] text-muted-foreground uppercase">Fine Amount</div>
                                      <div className="font-mono font-bold text-base">
                                        {formatCurrency(VIOLATION_AMOUNTS[v.type] ?? 500)}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="p-2 bg-muted/40 rounded">
                                    <strong>Evidence package attached:</strong> ANPR snapshot, GPS coordinates,
                                    lane ID, timestamp, and 30s video clip link. Customer will be notified via
                                    SMS + email + WhatsApp.
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setIssueDialog(null)}>Cancel</Button>
                                  <Button onClick={() => handleIssue(v.id, v.type)}>
                                    Issue Challan
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                          {v.status === "DETECTED" && !canIssue && (
                            <span className="text-[0.65rem] text-muted-foreground">view-only</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="challans">
          <SectionCard
            title="Issued E-Challans"
            description="Status tracking — issued, paid, overdue, appealed, escalated"
          >
            <div className="rounded-md border max-h-[560px] overflow-y-auto scrollbar-thin">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead>Challan No</TableHead>
                    <TableHead>Plate</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {challans.map((c) => {
                    const v = violations.find((vv) => vv.id === c.violationId);
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-xs">{c.challanNo}</TableCell>
                        <TableCell className="font-mono text-xs font-semibold">{v?.plateCaptured}</TableCell>
                        <TableCell className="text-right font-mono text-xs font-medium">
                          {formatCurrency(c.amount)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(c.issueDate)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(c.dueDate)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs">
                            <StatusDot status={c.status} />
                            {c.status.toLowerCase()}
                          </div>
                        </TableCell>
                        <TableCell>
                          {c.status === "ISSUED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[0.65rem] border-emerald-500 text-emerald-700"
                              onClick={() => {
                                payChallan(c.id);
                                toast.success("Challan marked as paid", { description: c.challanNo });
                              }}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Mark Paid
                            </Button>
                          )}
                          {c.status === "APPEALED" && (
                            <Badge variant="outline" className="text-[0.6rem] border-purple-500 text-purple-700">
                              Under review
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="public">
          <SectionCard
            title="Public E-Challan Payment Portal"
            description="No-login-required payment flow for violators — plate + challan ID lookup"
          >
            <div className="max-w-md mx-auto p-6 border-2 border-dashed border-border rounded-lg bg-background">
              <div className="text-center mb-4">
                <div className="h-12 w-12 mx-auto rounded-md bg-teal/10 grid place-items-center mb-2">
                  <ShieldAlert className="h-6 w-6 text-teal" />
                </div>
                <h3 className="text-base font-semibold">Pay Your E-Challan</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter your vehicle plate and challan number to view and pay
                </p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium">Vehicle Plate Number</label>
                  <input
                    type="text"
                    placeholder="MH-12-AB-1234"
                    className="mt-1 w-full h-9 px-3 rounded-md border border-input bg-background text-sm font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">Challan Number</label>
                  <input
                    type="text"
                    placeholder="CHL-TP-0048-1023"
                    className="mt-1 w-full h-9 px-3 rounded-md border border-input bg-background text-sm font-mono"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => toast.info("Demo lookup", { description: "In production this queries the regional transport authority API for plate-to-owner lookup." })}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Lookup Challan
                </Button>
              </div>
              <div className="mt-4 pt-4 border-t text-[0.65rem] text-muted-foreground text-center">
                Integration with regional transport authority / police API for
                plate-to-owner lookup. Payments processed via PCI-DSS compliant gateway.
              </div>
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>

      {/* Violation detail dialog with evidence */}
      <Dialog open={!!detailViolationId} onOpenChange={(o) => !o && setDetailViolationId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto scrollbar-thin">
          {detailV && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-destructive" />
                  Violation {detailV.id}
                  <Badge variant="outline" className="text-[0.6rem]">
                    {VIOLATION_LABELS[detailV.type]}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Evidence package */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5" /> Evidence Package
                  </h4>
                  <div className="aspect-video bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-md grid place-items-center text-zinc-400 text-xs mb-2">
                    <div className="text-center">
                      <Camera className="h-8 w-8 mx-auto mb-1 opacity-50" />
                      ANPR snapshot captured
                      <div className="font-mono text-[0.6rem] mt-1 opacity-70">{detailV.evidenceUrl}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 border rounded">
                      <div className="text-[0.6rem] text-muted-foreground uppercase">Captured At</div>
                      <div className="font-mono">{formatDateTime(detailV.detectedAt)}</div>
                    </div>
                    <div className="p-2 border rounded">
                      <div className="text-[0.6rem] text-muted-foreground uppercase">Plate</div>
                      <div className="font-mono font-bold">{detailV.plateCaptured}</div>
                    </div>
                    <div className="p-2 border rounded">
                      <div className="text-[0.6rem] text-muted-foreground uppercase">Plaza</div>
                      <div>{plazas.find(p => p.id === detailV.plazaId)?.name}</div>
                    </div>
                    <div className="p-2 border rounded">
                      <div className="text-[0.6rem] text-muted-foreground uppercase">Lane</div>
                      <div>L{lanes.find(l => l.id === detailV.laneId)?.number}</div>
                    </div>
                  </div>
                </div>

                {/* Status timeline */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Status Timeline
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Detected by ANPR + rule engine</span>
                      <span className="text-muted-foreground ml-auto">{formatDateTime(detailV.detectedAt)}</span>
                    </div>
                    {detailV.status !== "DETECTED" && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-blue-500" />
                        <span>E-challan issued</span>
                        <span className="text-muted-foreground ml-auto">{formatDate(detailV.detectedAt)}</span>
                      </div>
                    )}
                    {detailV.status === "PAID" && (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Payment received</span>
                      </div>
                    )}
                    {detailV.status === "APPEALED" && (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                        <span>Awaiting appeal review</span>
                      </div>
                    )}
                    {detailV.status === "ESCALATED" && (
                      <div className="flex items-center gap-2">
                        <XCircle className="h-3.5 w-3.5 text-red-500" />
                        <span>Escalated — repeat offender</span>
                      </div>
                    )}
                  </div>
                </div>

                {detailChallan && (
                  <div className="p-3 bg-muted/30 rounded text-xs">
                    <div className="font-semibold mb-1">Linked Challan</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>Number: <span className="font-mono">{detailChallan.challanNo}</span></div>
                      <div>Amount: <span className="font-mono font-bold">{formatCurrency(detailChallan.amount)}</span></div>
                      <div>Issued: {formatDate(detailChallan.issueDate)}</div>
                      <div>Due: {formatDate(detailChallan.dueDate)}</div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
