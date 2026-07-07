"use client";
import { useState } from "react";
import { useStore } from "@/store/app-store";
import { can } from "@/lib/rbac";
import { PageContainer, SectionCard, StatusDot, StatCard } from "@/components/common/ui";
import { formatCurrency, formatDate, timeAgo } from "@/lib/format";
import {
  Wallet, Car, Ticket, Plus, History, MapPin, TrendingUp,
  CreditCard, MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export function CustomerModule() {
  const currentUser = useStore((s) => s.currentUser)!;
  const vehicles = useStore((s) => s.vehicles);
  const tags = useStore((s) => s.tags);
  const wallets = useStore((s) => s.wallets);
  const transactions = useStore((s) => s.transactions);
  const supportTickets = useStore((s) => s.supportTickets);
  const plazas = useStore((s) => s.plazas);
  const currentTenantId = useStore((s) => s.currentTenantId);
  const pushAudit = useStore((s) => s.pushAudit);

  // For demo, show a representative customer view using first vehicle of current tenant
  const customerVehicles = vehicles.filter(
    (v) => v.tenantId === currentTenantId
  ).slice(0, 8);

  const totalBalance = customerVehicles.reduce((sum, v) => {
    const tag = tags.find((t) => t.vehicleId === v.id);
    const wallet = tag ? wallets.find((w) => w.tagId === tag.id) : null;
    return sum + (wallet?.balance ?? 0);
  }, 0);

  const customerTxns = transactions
    .filter((t) => t.tenantId === currentTenantId && t.status === "SUCCESS")
    .slice(0, 15);

  const openTickets = supportTickets.filter((t) => t.tenantId === currentTenantId && t.status !== "CLOSED");

  const handleTopUp = (amount: number) => {
    pushAudit({
      tenantId: currentTenantId,
      actorName: currentUser.name,
      action: "CREATE",
      module: "customer",
      entityType: "wallet",
      entityId: "topup",
      afterValue: JSON.stringify({ amount, method: "UPI" }),
      ipAddress: "10.0.1.42",
    });
    toast.success("Wallet topped up", { description: `₹${amount} added via UPI. New balance updated.` });
  };

  return (
    <PageContainer>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Wallet Balance"
          value={formatCurrency(totalBalance, "INR", { compact: true })}
          icon={Wallet}
          variant="revenue"
          sub={`${customerVehicles.length} linked vehicles`}
        />
        <StatCard
          label="Active Tags"
          value={tags.filter(t => customerVehicles.some(v => v.id === t.vehicleId)).length}
          icon={Car}
          sub="RFID FASTag-equivalent"
        />
        <StatCard
          label="Trips This Month"
          value={customerTxns.length}
          icon={History}
          sub={`${formatCurrency(customerTxns.reduce((s, t) => s + t.totalAmount, 0), "INR", { compact: true })} spent`}
        />
        <StatCard
          label="Open Support Tickets"
          value={openTickets.length}
          icon={Ticket}
          variant={openTickets.length > 0 ? "warning" : "default"}
          sub={openTickets.length > 0 ? "Awaiting response" : "All resolved"}
        />
      </div>

      <Tabs defaultValue="wallet">
        <TabsList>
          <TabsTrigger value="wallet">
            <Wallet className="h-3.5 w-3.5 mr-1.5" /> Wallet & Top-up
          </TabsTrigger>
          <TabsTrigger value="trips">
            <History className="h-3.5 w-3.5 mr-1.5" /> Trip History
          </TabsTrigger>
          <TabsTrigger value="tickets">
            <Ticket className="h-3.5 w-3.5 mr-1.5" /> Support Tickets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wallet">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <SectionCard
              title="Wallet Top-up"
              description="Recharge via UPI, card, net banking, or auto-recharge"
              className="lg:col-span-1"
            >
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {[200, 500, 1000, 2000, 5000, 10000].map((amt) => (
                    <Button
                      key={amt}
                      variant="outline"
                      className="h-12 text-sm font-semibold"
                      onClick={() => handleTopUp(amt)}
                    >
                      ₹{amt}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input type="number" placeholder="Custom amount" />
                  <Button onClick={() => handleTopUp(750)}>
                    <CreditCard className="h-3.5 w-3.5 mr-1.5" /> Top Up
                  </Button>
                </div>
                <div className="p-3 bg-muted/30 rounded text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-3.5 w-3.5 text-teal" />
                    <strong>Auto-recharge enabled</strong>
                  </div>
                  When balance drops below ₹150, automatically recharge ₹1,000 via saved UPI ID.
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Linked Vehicles & Tags"
              description="Multi-vehicle account management"
              className="lg:col-span-2"
            >
              <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
                {customerVehicles.map((v) => {
                  const tag = tags.find((t) => t.vehicleId === v.id);
                  const wallet = tag ? wallets.find((w) => w.tagId === tag.id) : null;
                  return (
                    <div key={v.id} className="p-3 border rounded-md flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-teal/10 grid place-items-center">
                          <Car className="h-5 w-5 text-teal" />
                        </div>
                        <div>
                          <div className="font-mono font-semibold text-sm">{v.plateNumber}</div>
                          <div className="text-xs text-muted-foreground">{v.ownerName}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-sm">
                          {wallet ? formatCurrency(wallet.balance) : "—"}
                        </div>
                        <div className="flex items-center gap-1.5 justify-end mt-0.5">
                          {tag && <StatusDot status={tag.status} />}
                          <span className="text-[0.65rem] text-muted-foreground">
                            {tag?.status ?? "no tag"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent value="trips">
          <SectionCard
            title="Trip History"
            description="Recent toll transactions across all plazas with map view"
          >
            <div className="rounded-md border max-h-[500px] overflow-y-auto scrollbar-thin">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Plaza</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invoice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerTxns.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(t.capturedAt)}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {plazas.find(p => p.id === t.plazaId)?.name}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold">
                        {t.plateCaptured}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[0.65rem]">{t.paymentMethod}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-medium">
                        {formatCurrency(t.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs">
                          <StatusDot status={t.status} />
                          {t.status.toLowerCase()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" className="h-7 text-[0.65rem]"
                          onClick={() => toast.info("Invoice PDF ready", { description: `Invoice ${t.id}.pdf generated with GST breakdown` })}
                        >
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="tickets">
          <SectionCard
            title="Support Tickets"
            description="Track and raise issues with customer support"
            action={
              <Button size="sm">
                <Plus className="h-3.5 w-3.5 mr-1.5" /> New Ticket
              </Button>
            }
          >
            <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin">
              {supportTickets.map((t) => (
                <div key={t.id} className="p-3 border rounded-md">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold">{t.id}</span>
                      <Badge variant="outline" className="text-[0.6rem]">{t.category}</Badge>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={
                          t.priority === "URGENT" ? "text-[0.6rem] border-red-500 text-red-700" :
                          t.priority === "HIGH" ? "text-[0.6rem] border-amber-500 text-amber-700" :
                          t.priority === "MEDIUM" ? "text-[0.6rem] border-blue-500 text-blue-700" :
                          "text-[0.6rem] text-muted-foreground"
                        }
                      >
                        {t.priority}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          t.status === "OPEN" ? "text-[0.6rem] border-blue-500 text-blue-700" :
                          t.status === "IN_PROGRESS" ? "text-[0.6rem] border-amber-500 text-amber-700" :
                          t.status === "RESOLVED" ? "text-[0.6rem] border-emerald-500 text-emerald-700" :
                          "text-[0.6rem] text-muted-foreground"
                        }
                      >
                        {t.status.replace("_", " ").toLowerCase()}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-sm font-medium">{t.subject}</div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                    <span>{t.customerName}</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {timeAgo(t.createdAt)}
                    </span>
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
