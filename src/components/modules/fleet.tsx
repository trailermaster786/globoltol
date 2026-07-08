"use client";
import { useState } from "react";
import { useStore } from "@/store/app-store";
import { PageContainer, SectionCard, StatCard } from "@/components/common/ui";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  Truck, Building2, FileText, Plus, IndianRupee, BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";

export function FleetModule() {
  const corporateAccounts = useStore((s) => s.corporateAccounts);
  const invoices = useStore((s) => s.invoices);
  const transactions = useStore((s) => s.transactions);
  const currentTenantId = useStore((s) => s.currentTenantId);
  const pushAudit = useStore((s) => s.pushAudit);

  const visibleAccounts = corporateAccounts.filter(
    (a) => a.tenantId === currentTenantId
  );
  const visibleInvoices = invoices.filter((inv) =>
    visibleAccounts.some((a) => a.id === inv.corporateAccountId)
  );

  const totalCreditLimit = visibleAccounts.reduce((s, a) => s + a.creditLimit, 0);
  const totalVehicles = visibleAccounts.reduce((s, a) => s + a.vehicleCount, 0);
  const overdueAmount = visibleInvoices
    .filter((i) => i.status === "OVERDUE")
    .reduce((s, i) => s + i.totalAmount, 0);

  // Fleet spend chart by account
  const fleetSpend = visibleAccounts.map((a) => {
    const acctInvoices = visibleInvoices.filter((i) => i.corporateAccountId === a.id);
    return {
      name: a.name.split(" ").slice(0, 2).join(" "),
      spend: acctInvoices.reduce((s, i) => s + i.totalAmount, 0),
      vehicles: a.vehicleCount,
    };
  });

  return (
    <PageContainer>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Corporate Accounts"
          value={visibleAccounts.length}
          icon={Building2}
          sub={`${totalVehicles} fleet vehicles`}
        />
        <StatCard
          label="Total Credit Limit"
          value={formatCurrency(totalCreditLimit, "INR", { compact: true })}
          icon={IndianRupee}
          variant="revenue"
          sub="Post-paid billing"
        />
        <StatCard
          label="Open Invoices"
          value={visibleInvoices.filter((i) => i.status === "ISSUED").length}
          icon={FileText}
          sub={formatCurrency(visibleInvoices.filter((i) => i.status === "ISSUED").reduce((s, i) => s + i.totalAmount, 0), "INR", { compact: true })}
        />
        <StatCard
          label="Overdue Amount"
          value={formatCurrency(overdueAmount, "INR", { compact: true })}
          icon={Truck}
          variant="warning"
          delta={overdueAmount > 0 ? "Requires follow-up" : "All current"}
          deltaPositive={overdueAmount === 0}
        />
      </div>

      <Tabs defaultValue="accounts">
        <TabsList>
          <TabsTrigger value="accounts">
            <Building2 className="h-3.5 w-3.5 mr-1.5" /> Corporate Accounts
          </TabsTrigger>
          <TabsTrigger value="invoices">
            <FileText className="h-3.5 w-3.5 mr-1.5" /> Invoices
          </TabsTrigger>
          <TabsTrigger value="dashboard">
            <BarChart3 className="h-3.5 w-3.5 mr-1.5" /> Fleet Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounts">
          <SectionCard
            title="Corporate Fleet Accounts"
            description="Centralized billing, credit limit management, GST-compliant invoices"
            action={
              <Button size="sm" onClick={() => toast.info("Onboarding wizard", { description: "Multi-step form with KYC + GSTIN verification + credit check" })}>
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Onboard Account
              </Button>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {visibleAccounts.map((a) => {
                const acctInvoices = visibleInvoices.filter((i) => i.corporateAccountId === a.id);
                const outstanding = acctInvoices
                  .filter((i) => i.status === "ISSUED" || i.status === "OVERDUE")
                  .reduce((s, i) => s + i.totalAmount, 0);
                const utilization = (outstanding / a.creditLimit) * 100;
                return (
                  <div key={a.id} className="p-4 border rounded-md">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-semibold">{a.name}</h4>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
                          GSTIN: {a.gstin ?? "—"}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[0.6rem]">
                        {a.billingCycle}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                      <div>
                        <div className="text-[0.6rem] text-muted-foreground uppercase">Vehicles</div>
                        <div className="font-semibold">{a.vehicleCount}</div>
                      </div>
                      <div>
                        <div className="text-[0.6rem] text-muted-foreground uppercase">Credit Limit</div>
                        <div className="font-semibold">{formatCurrency(a.creditLimit, "INR", { compact: true })}</div>
                      </div>
                      <div>
                        <div className="text-[0.6rem] text-muted-foreground uppercase">Outstanding</div>
                        <div className="font-semibold text-amber-700">{formatCurrency(outstanding, "INR", { compact: true })}</div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[0.65rem] mb-1">
                        <span className="text-muted-foreground">Credit utilization</span>
                        <span className={`font-medium ${utilization > 80 ? "text-destructive" : utilization > 50 ? "text-amber-600" : "text-emerald-600"}`}>
                          {utilization.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full"
                          style={{
                            width: `${Math.min(utilization, 100)}%`,
                            background: utilization > 80 ? "#C0392B" : utilization > 50 ? "#E0A030" : "#10B981",
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-[0.65rem] text-muted-foreground mt-2">
                      Contact: {a.contactEmail}
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="invoices">
          <SectionCard
            title="GST-Compliant Invoices"
            description="Bulk invoicing with PO number tagging — weekly / monthly / quarterly"
          >
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice No</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">GST</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleInvoices.map((inv) => {
                    const acct = visibleAccounts.find((a) => a.id === inv.corporateAccountId);
                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono text-xs">{inv.invoiceNo}</TableCell>
                        <TableCell className="text-xs">{acct?.name}</TableCell>
                        <TableCell className="text-xs">{inv.period}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{formatCurrency(inv.amount)}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">{formatCurrency(inv.taxAmount)}</TableCell>
                        <TableCell className="text-right font-mono text-xs font-semibold">{formatCurrency(inv.totalAmount)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(inv.issueDate)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(inv.dueDate)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              inv.status === "PAID" ? "text-[0.65rem] border-emerald-500 text-emerald-700 bg-emerald-50" :
                              inv.status === "OVERDUE" ? "text-[0.65rem] border-red-500 text-red-700 bg-red-50" :
                              inv.status === "ISSUED" ? "text-[0.65rem] border-blue-500 text-blue-700 bg-blue-50" :
                              "text-[0.65rem] text-muted-foreground"
                            }
                          >
                            {inv.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="dashboard">
          <SectionCard
            title="Fleet Spend Analytics"
            description="Per-account spend with vehicle count comparison"
          >
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fleetSpend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => formatCurrency(v, "INR", { compact: true })}
                  />
                  <Tooltip
                    contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => [formatCurrency(v, "INR"), "Spend"]}
                  />
                  <Bar dataKey="spend" radius={[4, 4, 0, 0]} fill="#E0A030" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
              {visibleAccounts.map((a) => (
                <div key={a.id} className="p-3 border rounded-md">
                  <div className="text-xs font-semibold truncate">{a.name}</div>
                  <div className="text-[0.65rem] text-muted-foreground mt-1">
                    {a.vehicleCount} vehicles · avg {formatCurrency(Math.round(fleetSpend.find(f => f.name.includes(a.name.split(" ")[0]))?.spend / a.vehicleCount || 0), "INR", { compact: true })}/vehicle
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
