"use client";
import { useState } from "react";
import { useStore } from "@/store/app-store";
import { can } from "@/lib/rbac";
import { PageContainer, SectionCard, StatusDot, StatCard } from "@/components/common/ui";
import { timeAgo } from "@/lib/format";
import {
  Bell, Mail, MessageSquare, Smartphone, Plus, Send, Megaphone,
  CheckCircle2, XCircle, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const CHANNEL_ICONS: Record<string, typeof Bell> = {
  SMS: Smartphone,
  EMAIL: Mail,
  PUSH: Bell,
  WHATSAPP: MessageSquare,
};

const TEMPLATES = [
  { code: "TXN_SUCCESS", name: "Transaction Success", channel: "SMS", body: "₹{amount} deducted at {plaza}. Balance ₹{balance}. Txn {txnId}." },
  { code: "TXN_FAILED", name: "Transaction Failed", channel: "SMS", body: "Payment failed at {plaza}. Reason: {reason}. Please retry or top up wallet." },
  { code: "LOW_BALANCE", name: "Low Balance Alert", channel: "PUSH", body: "Wallet balance below ₹{threshold}. Auto-recharge enabled." },
  { code: "TAG_EXPIRING", name: "Tag Expiry Notice", channel: "WHATSAPP", body: "Your RFID tag expires in {days} days. Renew now to avoid lane delays." },
  { code: "CHALLAN_ISSUED", name: "Challan Issued", channel: "EMAIL", body: "E-Challan {challanNo} issued for {plate}. Amount ₹{amount} due by {dueDate}." },
  { code: "PLAZA_CLOSED", name: "Plaza Closure Alert", channel: "EMAIL", body: "{plaza} closed for maintenance {startTime}–{endTime}. Plan alternate route." },
  { code: "WELCOME", name: "Welcome to Global Toll", channel: "EMAIL", body: "Hi {name}, your account is ready. Tag {rfid} linked to {plate}." },
];

export function NotificationsModule() {
  const currentUser = useStore((s) => s.currentUser)!;
  const notifications = useStore((s) => s.notifications);
  const currentTenantId = useStore((s) => s.currentTenantId);
  const pushNotification = useStore((s) => s.pushNotification);

  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastChannel, setBroadcastChannel] = useState("SMS");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const canEdit = can(currentUser.role, "notifications", "edit");

  const visibleNotifs = notifications.filter(
    (n) => currentUser.role === "SUPER_ADMIN" || n.tenantId === currentTenantId
  );

  const stats = {
    total: visibleNotifs.length,
    delivered: visibleNotifs.filter((n) => n.status === "DELIVERED").length,
    sent: visibleNotifs.filter((n) => n.status === "SENT").length,
    queued: visibleNotifs.filter((n) => n.status === "QUEUED").length,
    failed: visibleNotifs.filter((n) => n.status === "FAILED").length,
  };

  const handleBroadcast = () => {
    if (!broadcastMessage.trim()) {
      toast.error("Message required");
      return;
    }
    pushNotification({
      tenantId: currentTenantId,
      channel: broadcastChannel as "SMS" | "EMAIL" | "PUSH" | "WHATSAPP",
      template: "BROADCAST",
      recipient: "ALL_CUSTOMERS",
      payload: broadcastMessage,
      status: "QUEUED",
    });
    toast.success("Broadcast queued", {
      description: `Sending to all customers via ${broadcastChannel} (~12,000 recipients)`,
    });
    setBroadcastMessage("");
    setBroadcastOpen(false);
  };

  return (
    <PageContainer>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Sent (24h)" value={stats.total} icon={Send} sub="Across all channels" />
        <StatCard label="Delivered" value={stats.delivered} icon={CheckCircle2} delta={`${((stats.delivered / Math.max(stats.total, 1)) * 100).toFixed(1)}% rate`} deltaPositive />
        <StatCard label="Queued" value={stats.queued} icon={Clock} variant="warning" sub="Awaiting dispatch" />
        <StatCard label="Failed" value={stats.failed} icon={XCircle} variant="warning" delta="requires retry" deltaPositive={false} />
      </div>

      <Tabs defaultValue="log">
        <TabsList>
          <TabsTrigger value="log">
            <Bell className="h-3.5 w-3.5 mr-1.5" /> Delivery Log
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Mail className="h-3.5 w-3.5 mr-1.5" /> Templates
          </TabsTrigger>
          <TabsTrigger value="broadcast">
            <Megaphone className="h-3.5 w-3.5 mr-1.5" /> Broadcast
          </TabsTrigger>
        </TabsList>

        <TabsContent value="log">
          <SectionCard
            title="Notification Delivery Log"
            description="Real-time dispatch across SMS, email, push, and WhatsApp channels"
          >
            <div className="rounded-md border max-h-[560px] overflow-y-auto scrollbar-thin">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead className="w-20">Channel</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleNotifs.slice(0, 80).map((n) => {
                    const Icon = CHANNEL_ICONS[n.channel] ?? Bell;
                    return (
                      <TableRow key={n.id}>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-[0.65rem] font-medium">{n.channel}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[0.6rem]">{n.template}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-[0.65rem]">{n.recipient}</TableCell>
                        <TableCell className="text-xs max-w-md truncate">{n.payload}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs">
                            <StatusDot status={n.status} />
                            {n.status.toLowerCase()}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {n.sentAt ? timeAgo(n.sentAt) : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="templates">
          <SectionCard
            title="Notification Templates"
            description="Brand-styled templates with variable substitution"
            action={
              canEdit && (
                <Button size="sm">
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> New Template
                </Button>
              )
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TEMPLATES.map((t) => {
                const Icon = CHANNEL_ICONS[t.channel] ?? Bell;
                return (
                  <div key={t.code} className="p-3 border rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-md bg-teal/10 grid place-items-center">
                          <Icon className="h-4 w-4 text-teal" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{t.name}</div>
                          <div className="font-mono text-[0.6rem] text-muted-foreground">{t.code}</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[0.6rem]">{t.channel}</Badge>
                    </div>
                    <div className="p-2 bg-muted/30 rounded text-xs font-mono">
                      {t.body}
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="broadcast">
          <SectionCard
            title="Broadcast Announcements"
            description="Send urgent messages to all customers (e.g., plaza closures, maintenance)"
          >
            <div className="max-w-xl space-y-4">
              <div>
                <Label>Channel</Label>
                <Select value={broadcastChannel} onValueChange={setBroadcastChannel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SMS">SMS (all registered phones)</SelectItem>
                    <SelectItem value="EMAIL">Email (all registered emails)</SelectItem>
                    <SelectItem value="PUSH">Push notification (mobile app)</SelectItem>
                    <SelectItem value="WHATSAPP">WhatsApp Business API</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Target Segment</Label>
                <Select defaultValue="ALL">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All customers (~12,000)</SelectItem>
                    <SelectItem value="FLEET">Fleet/corporate accounts only</SelectItem>
                    <SelectItem value="PLAZA_TP0048">Customers who used TP-0048 in last 30 days</SelectItem>
                    <SelectItem value="LOW_BALANCE">Customers with low wallet balance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Message</Label>
                <Textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="e.g., TP-0580 Udaipur Gateway Plaza will be closed for maintenance on 10 Jul 2026 from 04:00 to 06:00 IST. Please plan alternate routes."
                  rows={4}
                />
                <div className="text-[0.65rem] text-muted-foreground mt-1 flex items-center justify-between">
                  <span>{broadcastMessage.length} chars · {broadcastChannel === "SMS" ? "1 SMS segment / 160 chars" : "no limit"}</span>
                  {broadcastChannel === "SMS" && <span>Estimated cost: ₹{(broadcastMessage.length / 160 + 1) * 0.18 * 12000}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">Preview</Button>
                <Button onClick={handleBroadcast} disabled={!canEdit}>
                  <Send className="h-3.5 w-3.5 mr-1.5" /> Send Broadcast
                </Button>
              </div>
              {!canEdit && (
                <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
                  Your role ({currentUser.role}) does not have permission to send broadcasts.
                </div>
              )}
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
