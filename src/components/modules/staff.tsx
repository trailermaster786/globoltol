"use client";
import { useState } from "react";
import { useStore } from "@/store/app-store";
import { can } from "@/lib/rbac";
import { formatDate } from "@/lib/format";
import {
  UserCog, Plus, Clock, TrendingUp, AlertTriangle, Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export function StaffModule() {
  const currentUser = useStore((s) => s.currentUser)!;
  const staff = useStore((s) => s.staff);
  const plazas = useStore((s) => s.plazas);
  const addStaff = useStore((s) => s.addStaff);
  const currentTenantId = useStore((s) => s.currentTenantId);
  const [designationFilter, setDesignationFilter] = useState("ALL");
  const [addOpen, setAddOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", designation: "LANE_OPERATOR" as string, plazaId: "" });

  const visibleStaff = staff
    .filter((s) => currentUser.role === "SUPER_ADMIN" || s.tenantId === currentTenantId)
    .filter((s) => designationFilter === "ALL" ? true : s.designation === designationFilter);

  const activeCount = visibleStaff.filter((s) => s.status === "ACTIVE").length;
  const onLeaveCount = visibleStaff.filter((s) => s.status === "ON_LEAVE").length;
  const operators = visibleStaff.filter((s) => s.designation === "LANE_OPERATOR");
  const avgTxnsPerHour = operators.length > 0
    ? operators.reduce((s, o) => s + (o.metrics?.txnsPerHour ?? 0), 0) / operators.length
    : 0;
  const totalCashVariance = operators.reduce((s, o) => s + Math.abs(o.metrics?.cashVariance ?? 0), 0);

  const handleAddStaff = () => {
    if (!newStaff.name.trim()) {
      toast.error("Name is required");
      return;
    }
    addStaff({
      name: newStaff.name.trim(),
      designation: newStaff.designation as any,
      plazaId: newStaff.plazaId || undefined,
    });
    toast.success("Staff added", { description: `${newStaff.name} — ${newStaff.designation.replace("_", " ")}` });
    setNewStaff({ name: "", designation: "LANE_OPERATOR", plazaId: "" });
    setAddOpen(false);
  };

  const shifts = [
    { staff: visibleStaff[0]?.name ?? "Karan Mehta", lane: "L1 · TP-0048", shift: "06:00 – 14:00", status: "active" },
    { staff: visibleStaff[1]?.name ?? "Meera Kapoor", lane: "L2 · TP-0048", shift: "06:00 – 14:00", status: "active" },
    { staff: visibleStaff[2]?.name ?? "Nikhil Rao", lane: "L3 · TP-0048", shift: "14:00 – 22:00", status: "upcoming" },
    { staff: visibleStaff[3]?.name ?? "Pooja Nair", lane: "L4 · TP-0048", shift: "22:00 – 06:00", status: "upcoming" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Staff" value={visibleStaff.length} icon={UserCog} sub={`${activeCount} active · ${onLeaveCount} on leave`} />
        <StatCard label="Lane Operators" value={operators.length} icon={Clock} sub="Active shift coverage" />
        <StatCard label="Avg Txns/Hour" value={avgTxnsPerHour.toFixed(0)} icon={TrendingUp} variant="revenue" sub="Across all operators" />
        <StatCard label="Cash Variance (24h)" value={`₹${totalCashVariance.toFixed(0)}`} icon={AlertTriangle} variant={totalCashVariance > 100 ? "warning" : "default"} sub="Sum of |variance| across operators" />
      </div>

      <Tabs defaultValue="roster">
        <TabsList>
          <TabsTrigger value="roster"><Calendar className="h-3.5 w-3.5 mr-1.5" /> Shift Roster</TabsTrigger>
          <TabsTrigger value="staff"><UserCog className="h-3.5 w-3.5 mr-1.5" /> Staff Directory</TabsTrigger>
          <TabsTrigger value="performance"><TrendingUp className="h-3.5 w-3.5 mr-1.5" /> Performance Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="roster">
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-sm font-semibold mb-3">Today's Shift Roster</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {shifts.map((s, i) => (
                <div key={i} className="p-3 border rounded-md">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-semibold">{s.staff}</div>
                      <div className="text-xs text-muted-foreground font-mono">{s.lane}</div>
                    </div>
                    <Badge variant="outline" className={s.status === "active" ? "text-[0.6rem] border-emerald-500 text-emerald-700 bg-emerald-50" : "text-[0.6rem] border-blue-500 text-blue-700 bg-blue-50"}>
                      {s.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {s.shift}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="staff">
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold">Staff Directory</h3>
                <p className="text-xs text-muted-foreground">All staff with role, plaza assignment, and status</p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={designationFilter} onValueChange={setDesignationFilter}>
                  <SelectTrigger className="w-48 h-9"><SelectValue placeholder="Filter by role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Roles</SelectItem>
                    <SelectItem value="LANE_OPERATOR">Lane Operator</SelectItem>
                    <SelectItem value="PLAZA_MANAGER">Plaza Manager</SelectItem>
                    <SelectItem value="FINANCE_OFFICER">Finance Officer</SelectItem>
                    <SelectItem value="ENFORCEMENT">Enforcement</SelectItem>
                    <SelectItem value="SUPPORT">Support</SelectItem>
                    <SelectItem value="AUDITOR">Auditor</SelectItem>
                  </SelectContent>
                </Select>
                {can(currentUser.role, "staff", "create") && (
                  <Button size="sm" onClick={() => setAddOpen(true)}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Staff
                  </Button>
                )}
              </div>
            </div>

            <div className="rounded-md border max-h-[560px] overflow-y-auto scrollbar-thin">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Plaza</TableHead>
                    <TableHead>Hire Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleStaff.map((s) => {
                    const plaza = plazas.find((p) => p.id === s.plazaId);
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">{s.employeeId}</TableCell>
                        <TableCell className="text-sm font-medium">{s.name}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[0.65rem]">{s.designation.replace("_", " ")}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{plaza?.name ?? "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(s.hireDate)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className={`h-1.5 w-1.5 rounded-full ${s.status === "ACTIVE" ? "bg-emerald-500" : s.status === "ON_LEAVE" ? "bg-amber-500" : "bg-zinc-400"}`} />
                            {s.status.replace("_", " ").toLowerCase()}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-sm font-semibold mb-3">Operator Performance Metrics</h3>
            <div className="rounded-md border max-h-[560px] overflow-y-auto scrollbar-thin">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead>Operator</TableHead>
                    <TableHead>Plaza</TableHead>
                    <TableHead className="text-right">Txns/Hour</TableHead>
                    <TableHead className="text-right">Error Rate</TableHead>
                    <TableHead className="text-right">Cash Variance</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operators.map((o) => {
                    const plaza = plazas.find((p) => p.id === o.plazaId);
                    const m = o.metrics!;
                    const perfScore = Math.max(0, 100 - m.errorRate * 1000 - Math.abs(m.cashVariance) / 10);
                    return (
                      <TableRow key={o.id}>
                        <TableCell className="text-sm font-medium">{o.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{plaza?.name}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{m.txnsPerHour}</TableCell>
                        <TableCell className={`text-right font-mono text-xs ${m.errorRate > 0.02 ? "text-destructive" : "text-emerald-600"}`}>
                          {(m.errorRate * 100).toFixed(2)}%
                        </TableCell>
                        <TableCell className={`text-right font-mono text-xs ${Math.abs(m.cashVariance) > 100 ? "text-destructive" : Math.abs(m.cashVariance) > 50 ? "text-amber-600" : "text-emerald-600"}`}>
                          {m.cashVariance > 0 ? "+" : ""}₹{m.cashVariance.toFixed(0)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                              <div className="h-full" style={{ width: `${perfScore}%`, background: perfScore > 80 ? "#10B981" : perfScore > 60 ? "#E0A030" : "#EF4444" }} />
                            </div>
                            <span className="text-[0.65rem] text-muted-foreground">{perfScore.toFixed(0)}/100</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Staff Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-teal" />
              Add New Staff Member
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Full Name *</Label>
              <Input
                value={newStaff.name}
                onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                placeholder="e.g., Mohammed Al Balushi"
              />
            </div>
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Designation</Label>
              <Select value={newStaff.designation} onValueChange={(v) => setNewStaff({ ...newStaff, designation: v })}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LANE_OPERATOR">Lane Operator</SelectItem>
                  <SelectItem value="PLAZA_MANAGER">Plaza Manager</SelectItem>
                  <SelectItem value="FINANCE_OFFICER">Finance Officer</SelectItem>
                  <SelectItem value="ENFORCEMENT">Enforcement</SelectItem>
                  <SelectItem value="SUPPORT">Support</SelectItem>
                  <SelectItem value="AUDITOR">Auditor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Plaza Assignment</Label>
              <Select value={newStaff.plazaId} onValueChange={(v) => setNewStaff({ ...newStaff, plazaId: v })}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select plaza (optional)" /></SelectTrigger>
                <SelectContent>
                  {plazas.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAddStaff} style={{ background: "linear-gradient(135deg, #2E8B8B 0%, #1F6868 100%)" }}>
              <Plus className="h-4 w-4 mr-1.5" /> Add Staff
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, variant = "default", sub }: {
  label: string; value: string | number; icon: any; variant?: string; sub?: string;
}) {
  const accent = variant === "revenue" ? "border-l-4 border-l-[var(--color-gold)]"
    : variant === "warning" ? "border-l-4 border-l-destructive"
    : "border-l-4 border-l-teal";
  return (
    <div className={`bg-card border border-border rounded-lg p-4 ${accent}`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        <div className="h-8 w-8 rounded-md bg-teal/10 grid place-items-center">
          <Icon className="h-4 w-4 text-teal" />
        </div>
      </div>
      <div className="text-xl font-bold text-foreground">{value}</div>
      {sub && <div className="text-[0.65rem] text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}
