"use client";
import { useState } from "react";
import { useStore } from "@/store/app-store";
import { can } from "@/lib/rbac";
import { PageContainer, SectionCard, StatCard, StatusDot } from "@/components/common/ui";
import { formatDate, timeAgo } from "@/lib/format";
import {
  UserCog, Plus, Clock, TrendingUp, AlertTriangle, Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export function StaffModule() {
  const currentUser = useStore((s) => s.currentUser)!;
  const staff = useStore((s) => s.staff);
  const plazas = useStore((s) => s.plazas);
  const currentTenantId = useStore((s) => s.currentTenantId);
  const [designationFilter, setDesignationFilter] = useState("ALL");

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

  // Shift roster for today
  const shifts = [
    { staff: visibleStaff[0]?.name ?? "Karan Mehta", lane: "L1 · TP-0048", shift: "06:00 – 14:00", status: "active" },
    { staff: visibleStaff[1]?.name ?? "Meera Kapoor", lane: "L2 · TP-0048", shift: "06:00 – 14:00", status: "active" },
    { staff: visibleStaff[2]?.name ?? "Nikhil Rao", lane: "L3 · TP-0048", shift: "14:00 – 22:00", status: "upcoming" },
    { staff: visibleStaff[3]?.name ?? "Pooja Nair", lane: "L4 · TP-0048", shift: "22:00 – 06:00", status: "upcoming" },
  ];

  return (
    <PageContainer>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Staff"
          value={visibleStaff.length}
          icon={UserCog}
          sub={`${activeCount} active · ${onLeaveCount} on leave`}
        />
        <StatCard
          label="Lane Operators"
          value={operators.length}
          icon={Clock}
          sub="Active shift coverage"
        />
        <StatCard
          label="Avg Txns/Hour"
          value={avgTxnsPerHour.toFixed(0)}
          icon={TrendingUp}
          variant="revenue"
          sub="Across all operators"
        />
        <StatCard
          label="Cash Variance (24h)"
          value={`₹${totalCashVariance.toFixed(0)}`}
          icon={AlertTriangle}
          variant={totalCashVariance > 100 ? "warning" : "default"}
          sub="Sum of |variance| across operators"
        />
      </div>

      <Tabs defaultValue="roster">
        <TabsList>
          <TabsTrigger value="roster">
            <Calendar className="h-3.5 w-3.5 mr-1.5" /> Shift Roster
          </TabsTrigger>
          <TabsTrigger value="staff">
            <UserCog className="h-3.5 w-3.5 mr-1.5" /> Staff Directory
          </TabsTrigger>
          <TabsTrigger value="performance">
            <TrendingUp className="h-3.5 w-3.5 mr-1.5" /> Performance Metrics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roster">
          <SectionCard
            title="Today's Shift Roster"
            description="3 × 8-hour shift pattern per plaza with auto-rotation"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {shifts.map((s, i) => (
                <div key={i} className="p-3 border rounded-md">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-semibold">{s.staff}</div>
                      <div className="text-xs text-muted-foreground font-mono">{s.lane}</div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        s.status === "active"
                          ? "text-[0.6rem] border-emerald-500 text-emerald-700 bg-emerald-50"
                          : "text-[0.6rem] border-blue-500 text-blue-700 bg-blue-50"
                      }
                    >
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
          </SectionCard>
        </TabsContent>

        <TabsContent value="staff">
          <SectionCard
            title="Staff Directory"
            description="All staff with role, plaza assignment, and status"
            action={
              <div className="flex items-center gap-2">
                <Select value={designationFilter} onValueChange={setDesignationFilter}>
                  <SelectTrigger className="w-48 h-9">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
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
                  <Button size="sm" onClick={() => toast.info("Staff onboarding form", { description: "Add new employee with role + plaza assignment + shift pattern" })}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Staff
                  </Button>
                )}
              </div>
            }
          >
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
                        <TableCell>
                          <Badge variant="outline" className="text-[0.65rem]">
                            {s.designation.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {plaza?.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(s.hireDate)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs">
                            <StatusDot status={s.status} />
                            {s.status.replace("_", " ").toLowerCase()}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="performance">
          <SectionCard
            title="Operator Performance Metrics"
            description="Transactions/hour, error rate, cash variance — per operator"
          >
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
                              <div
                                className="h-full"
                                style={{
                                  width: `${perfScore}%`,
                                  background: perfScore > 80 ? "#10B981" : perfScore > 60 ? "#E0A030" : "#EF4444",
                                }}
                              />
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
          </SectionCard>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
