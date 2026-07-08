"use client";
import { useState } from "react";
import { useStore } from "@/store/app-store";
import { PageContainer, SectionCard } from "@/components/common/ui";
import { formatCurrency } from "@/lib/format";
import {
  FileBarChart, Download, Calendar, Filter, FileText,
  Save, Mail, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const STANDARD_REPORTS = [
  { id: "rpt-001", name: "Revenue by Plaza", description: "Daily/weekly/monthly revenue breakdown per plaza", category: "Revenue", schedule: "Daily 06:00", format: "PDF + XLSX", lastRun: "2h ago" },
  { id: "rpt-002", name: "Traffic Volume Summary", description: "Vehicle count by class, plaza, time-of-day", category: "Traffic", schedule: "Daily 06:00", format: "PDF + CSV", lastRun: "2h ago" },
  { id: "rpt-003", name: "Violation Summary", description: "Violations by type, status, plaza with evidence links", category: "Enforcement", schedule: "Weekly Mon 09:00", format: "PDF", lastRun: "1d ago" },
  { id: "rpt-004", name: "Exemption Usage Report", description: "VIP/emergency/defense vehicle exemptions log", category: "Compliance", schedule: "Monthly 1st 10:00", format: "PDF + XLSX", lastRun: "5d ago" },
  { id: "rpt-005", name: "Tag Issuance Stats", description: "New/replaced/lost tags by month and plaza", category: "Operations", schedule: "Weekly Mon 09:00", format: "XLSX", lastRun: "1d ago" },
  { id: "rpt-006", name: "Device Uptime Report", description: "Per-device uptime %, error codes, MTBF", category: "Operations", schedule: "Daily 06:00", format: "PDF", lastRun: "2h ago" },
  { id: "rpt-007", name: "GST Filing Report", description: "Tax collected, output GST, jurisdiction-wise split", category: "Compliance", schedule: "Monthly 1st 10:00", format: "XLSX + JSON (GSTN API)", lastRun: "5d ago" },
  { id: "rpt-008", name: "Cash Reconciliation Log", description: "Shift-wise cash expected vs collected vs variance", category: "Finance", schedule: "Daily 23:00", format: "PDF + XLSX", lastRun: "8h ago" },
];

const revenueByPlaza = [
  { plaza: "Gurgaon", revenue: 485000, txns: 5420 },
  { plaza: "Jaipur", revenue: 392000, txns: 4180 },
  { plaza: "Agra", revenue: 268000, txns: 3240 },
  { plaza: "Nagpur", revenue: 215000, txns: 2890 },
  { plaza: "Andheri", revenue: 184000, txns: 3120 },
  { plaza: "Goregaon", revenue: 142000, txns: 2480 },
];

const trafficTrend = [
  { day: "Mon", cars: 4200, hcv: 850, lcv: 1100 },
  { day: "Tue", cars: 4500, hcv: 920, lcv: 1180 },
  { day: "Wed", cars: 4380, hcv: 880, lcv: 1150 },
  { day: "Thu", cars: 4620, hcv: 940, lcv: 1210 },
  { day: "Fri", cars: 5180, hcv: 1050, lcv: 1320 },
  { day: "Sat", cars: 5800, hcv: 760, lcv: 980 },
  { day: "Sun", cars: 6240, hcv: 580, lcv: 720 },
];

export function ReportsModule() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");

  return (
    <PageContainer>
      <Tabs defaultValue="library">
        <TabsList>
          <TabsTrigger value="library">
            <FileText className="h-3.5 w-3.5 mr-1.5" /> Standard Library
          </TabsTrigger>
          <TabsTrigger value="builder">
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Custom Builder
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            <Calendar className="h-3.5 w-3.5 mr-1.5" /> Scheduled
          </TabsTrigger>
          <TabsTrigger value="regulatory">
            <FileBarChart className="h-3.5 w-3.5 mr-1.5" /> Regulatory Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="library">
          <SectionCard
            title="Standard Report Library"
            description="8 pre-built reports with scheduling and email delivery"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {STANDARD_REPORTS.map((r) => (
                <Card
                  key={r.id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${selectedReport === r.id ? "ring-2 ring-teal" : ""}`}
                  onClick={() => setSelectedReport(r.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-md bg-teal/10 grid place-items-center">
                        <FileText className="h-4 w-4 text-teal" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold">{r.name}</h4>
                        <Badge variant="outline" className="text-[0.6rem] mt-0.5">{r.category}</Badge>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{r.description}</p>
                  <div className="flex items-center justify-between text-[0.65rem] text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {r.schedule}
                    </div>
                    <div>last run: {r.lastRun}</div>
                  </div>
                  <div className="flex gap-1.5 mt-3">
                    <Button size="sm" variant="outline" className="h-7 text-[0.65rem] flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.success("Report generation queued", { description: `${r.name} · ${r.format} · ~30s` });
                      }}
                    >
                      <Download className="h-3 w-3 mr-1" /> Generate
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-[0.65rem]"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.success("Scheduled email delivery configured", { description: "Will send to finance@operator.in on schedule" });
                      }}
                    >
                      <Mail className="h-3 w-3" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </SectionCard>

          {/* Selected report preview */}
          {selectedReport && (
            <SectionCard
              title={`${STANDARD_REPORTS.find(r => r.id === selectedReport)?.name} — Preview`}
              description="Generated from live data"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueByPlaza}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis dataKey="plaza" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#6B7280" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => formatCurrency(v, "INR", { compact: true })}
                      />
                      <Tooltip
                        contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12 }}
                        formatter={(v: number) => [formatCurrency(v, "INR"), "Revenue"]}
                      />
                      <Bar dataKey="revenue" radius={[4, 4, 0, 0]} fill="#2E8B8B" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trafficTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Line type="monotone" dataKey="cars" stroke="#2E8B8B" strokeWidth={2} />
                      <Line type="monotone" dataKey="hcv" stroke="#2C3E50" strokeWidth={2} />
                      <Line type="monotone" dataKey="lcv" stroke="#E0A030" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </SectionCard>
          )}
        </TabsContent>

        <TabsContent value="builder">
          <SectionCard
            title="Custom Report Builder"
            description="Drag-drop fields, filters, save & schedule — no-code UI"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="space-y-3 lg:col-span-1">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Report Definition
                </h4>
                <div>
                  <Label htmlFor="rpt-name">Report Name</Label>
                  <Input id="rpt-name" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="e.g., Weekend Evening HCV Revenue" />
                </div>
                <div>
                  <Label>Data Source</Label>
                  <Select defaultValue="transactions">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transactions">Transactions</SelectItem>
                      <SelectItem value="violations">Violations</SelectItem>
                      <SelectItem value="settlements">Settlements</SelectItem>
                      <SelectItem value="vehicles">Vehicles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Group By</Label>
                  <Select defaultValue="plaza">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plaza">Plaza</SelectItem>
                      <SelectItem value="lane">Lane</SelectItem>
                      <SelectItem value="vehicleClass">Vehicle Class</SelectItem>
                      <SelectItem value="hour">Hour of Day</SelectItem>
                      <SelectItem value="day">Day of Week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Metric</Label>
                  <Select defaultValue="revenue">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue">Total Revenue</SelectItem>
                      <SelectItem value="count">Transaction Count</SelectItem>
                      <SelectItem value="avg">Average Txn Value</SelectItem>
                      <SelectItem value="failRate">Failure Rate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Filters</Label>
                  <div className="space-y-1.5 mt-1">
                    {["Vehicle Class = HCV", "Time = Weekend 18:00–22:00", "Status = SUCCESS"].map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-2 border rounded text-xs">
                        <span>{f}</span>
                        <Badge variant="outline" className="text-[0.6rem]">filter</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <Button className="w-full" onClick={() => toast.success("Custom report saved", { description: `${customName || "Untitled report"} saved and ready to schedule` })}>
                  <Save className="h-3.5 w-3.5 mr-1.5" /> Save & Schedule
                </Button>
              </div>

              <div className="lg:col-span-2 border rounded-md p-4 bg-muted/20 min-h-96">
                <div className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5" />
                  Live Preview (updated as you build)
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueByPlaza}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis dataKey="plaza" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#6B7280" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => formatCurrency(v, "INR", { compact: true })}
                      />
                      <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="revenue" radius={[4, 4, 0, 0]} fill="#E0A030" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="scheduled">
          <SectionCard
            title="Scheduled Reports"
            description="Recurring report delivery via email/SFTP"
          >
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Last Run</TableHead>
                    <TableHead>Next Run</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {STANDARD_REPORTS.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm font-medium">{r.name}</TableCell>
                      <TableCell className="text-xs">{r.schedule}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">finance@operator.in</TableCell>
                      <TableCell><Badge variant="outline" className="text-[0.65rem]">{r.format}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.lastRun}</TableCell>
                      <TableCell className="text-xs">{r.id === "rpt-001" ? "in 22h" : r.id === "rpt-008" ? "in 4h" : "tomorrow 06:00"}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" className="h-7 text-[0.65rem]">
                          <Download className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="regulatory">
          <SectionCard
            title="Regulatory Export Formats"
            description="Configurable per tenant's jurisdiction — highway authority / tax authority specs"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { name: "NHAI Monthly Return", format: "XML · NHAI Spec v3.2", deadline: "5th of every month", status: "ready" },
                { name: "GST Return GSTR-1", format: "JSON · GSTN API", deadline: "11th of every month", status: "ready" },
                { name: "TDS Reconciliation", format: "CSV · TRACES Format", deadline: "Quarterly", status: "ready" },
                { name: "State Transport Authority Report", format: "PDF + XLSX", deadline: "15th of every month", status: "ready" },
                { name: "Vehicle Class Audit Trail", format: "CSV", deadline: "On-demand", status: "ready" },
                { name: "PCI-DSS Quarterly Attestation", format: "PDF", deadline: "Quarterly", status: "queued" },
              ].map((r, i) => (
                <Card key={i} className="p-3">
                  <div className="flex items-start justify-between mb-1.5">
                    <div>
                      <div className="text-sm font-semibold">{r.name}</div>
                      <div className="text-[0.65rem] text-muted-foreground font-mono mt-0.5">{r.format}</div>
                    </div>
                    <Badge variant="outline" className={
                      r.status === "ready"
                        ? "text-[0.6rem] border-emerald-500 text-emerald-700"
                        : "text-[0.6rem] border-amber-500 text-amber-700"
                    }>
                      {r.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">Deadline: {r.deadline}</div>
                </Card>
              ))}
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
