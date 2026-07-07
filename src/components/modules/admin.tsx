"use client";
import { useState } from "react";
import { useStore } from "@/store/app-store";
import { can } from "@/lib/rbac";
import { PageContainer, SectionCard, StatusDot, StatCard } from "@/components/common/ui";
import { formatDate } from "@/lib/format";
import {
  Settings, Building2, Key, Flag, Palette, Database, Plus, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export function AdminModule() {
  const currentUser = useStore((s) => s.currentUser)!;
  const tenants = useStore((s) => s.tenants);
  const addPlaza = useStore((s) => s.addPlaza);
  const [onboardOpen, setOnboardOpen] = useState(false);
  const [newTenant, setNewTenant] = useState({ name: "", legalName: "", taxId: "", subscriptionTier: "STARTER" });

  const canEdit = can(currentUser.role, "admin", "edit");
  const canCreate = can(currentUser.role, "admin", "create");

  const handleOnboard = () => {
    if (!newTenant.name) {
      toast.error("Tenant name required");
      return;
    }
    addPlaza(newTenant);
    toast.success("Tenant onboarded", {
      description: `${newTenant.name} created with ${newTenant.subscriptionTier} tier. Onboarding wizard email sent.`,
    });
    setNewTenant({ name: "", legalName: "", taxId: "", subscriptionTier: "STARTER" });
    setOnboardOpen(false);
  };

  return (
    <PageContainer>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Tenants" value={tenants.filter(t => t.status === "ACTIVE").length} icon={Building2} sub={`${tenants.length} total`} />
        <StatCard label="Trial Tenants" value={tenants.filter(t => t.status === "TRIAL").length} icon={Flag} sub="Pending conversion" />
        <StatCard label="Enterprise Tier" value={tenants.filter(t => t.subscriptionTier === "ENTERPRISE").length} icon={CheckCircle2} variant="revenue" />
        <StatCard label="API Keys Active" value={6} icon={Key} sub="Across all tenants" />
      </div>

      <Tabs defaultValue="tenants">
        <TabsList>
          <TabsTrigger value="tenants">
            <Building2 className="h-3.5 w-3.5 mr-1.5" /> Tenants
          </TabsTrigger>
          <TabsTrigger value="features">
            <Flag className="h-3.5 w-3.5 mr-1.5" /> Feature Flags
          </TabsTrigger>
          <TabsTrigger value="apikeys">
            <Key className="h-3.5 w-3.5 mr-1.5" /> API Keys
          </TabsTrigger>
          <TabsTrigger value="theming">
            <Palette className="h-3.5 w-3.5 mr-1.5" /> White-label Theming
          </TabsTrigger>
          <TabsTrigger value="backup">
            <Database className="h-3.5 w-3.5 mr-1.5" /> Backup & Retention
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tenants">
          <SectionCard
            title="Tenant Onboarding & Management"
            description="Multi-tenant administration with subscription tier management"
            action={
              canCreate && (
                <Button size="sm" onClick={() => setOnboardOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Onboard Tenant
                </Button>
              )
            }
          >
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Legal Name</TableHead>
                    <TableHead>Tax ID</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Timezone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{t.legalName}</TableCell>
                      <TableCell className="font-mono text-xs">{t.taxId}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            t.subscriptionTier === "ENTERPRISE" ? "text-[0.65rem] border-[#E0A030] text-[#B07D1E] bg-amber-50" :
                            t.subscriptionTier === "WHITE_LABEL" ? "text-[0.65rem] border-teal text-teal bg-teal/5" :
                            t.subscriptionTier === "GROWTH" ? "text-[0.65rem] border-blue-500 text-blue-700 bg-blue-50" :
                            "text-[0.65rem] text-muted-foreground"
                          }
                        >
                          {t.subscriptionTier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{t.currency}</TableCell>
                      <TableCell className="text-xs">{t.timezone}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs">
                          <StatusDot status={t.status === "ACTIVE" ? "ACTIVE" : t.status === "TRIAL" ? "TRIAL" : "CLOSED"} />
                          {t.status}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(t.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="features">
          <SectionCard
            title="Feature Flag Management"
            description="Enable/disable modules per tenant by subscription tier"
          >
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feature</TableHead>
                    {tenants.map((t) => (
                      <TableHead key={t.id} className="text-center text-xs">{t.name.slice(0, 12)}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    "Dashboard & Analytics",
                    "Multi-Plaza Operations",
                    "ANPR / Open-road Tolling",
                    "Dynamic Pricing Engine",
                    "Corporate Fleet Billing",
                    "E-Challan Workflow",
                    "Custom Report Builder",
                    "White-label Theming",
                    "API Access (3rd-party)",
                    "Interop Clearing",
                  ].map((feature, i) => (
                    <TableRow key={feature}>
                      <TableCell className="text-sm font-medium">{feature}</TableCell>
                      {tenants.map((t) => {
                        // enterprise = all on, growth = most on, starter = few, trial = subset
                        const tierFlags: Record<string, boolean[]> = {
                          ENTERPRISE: [true, true, true, true, true, true, true, true, true, true],
                          GROWTH: [true, true, true, true, true, true, false, false, true, false],
                          STARTER: [true, true, false, false, false, true, false, false, false, false],
                          WHITE_LABEL: [true, true, true, true, true, true, true, true, true, true],
                          TRIAL: [true, true, false, false, false, true, false, false, false, false],
                        };
                        const enabled = tierFlags[t.subscriptionTier]?.[i] ?? false;
                        return (
                          <TableCell key={t.id} className="text-center">
                            <Switch checked={enabled} disabled={!canEdit} />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="apikeys">
          <SectionCard
            title="API Key Management"
            description="Third-party integration keys with rate limiting and IP allowlist"
            action={
              canCreate && (
                <Button size="sm">
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Generate Key
                </Button>
              )
            }
          >
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Label</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Key (masked)</TableHead>
                    <TableHead>Scopes</TableHead>
                    <TableHead>Rate Limit</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { label: "Mobile App Production", tenant: "NHAI Expressways", key: "gt_live_••••8f3a", scopes: "read:txn, write:wallet", rate: "1000/min", used: "2m ago", status: "ACTIVE" },
                    { label: "Finance ETL Pipeline", tenant: "NHAI Expressways", key: "gt_live_••••2b1c", scopes: "read:all, read:audit", rate: "100/min", used: "1h ago", status: "ACTIVE" },
                    { label: "Police API Integration", tenant: "NHAI Expressways", key: "gt_live_••••9d4e", scopes: "read:violations, write:challan", rate: "50/min", used: "5h ago", status: "ACTIVE" },
                    { label: "Western Reporting", tenant: "Western Tollways", key: "gt_live_••••a7f2", scopes: "read:txn, read:settlement", rate: "200/min", used: "12m ago", status: "ACTIVE" },
                    { label: "Staging Test Key", tenant: "Coastal Bridge", key: "gt_test_••••e8b5", scopes: "read:all", rate: "10/min", used: "3d ago", status: "INACTIVE" },
                    { label: "Fleet Sync — Logistics Co", tenant: "NHAI Expressways", key: "gt_live_••••4c9d", scopes: "read:txn, write:invoice", rate: "500/min", used: "30m ago", status: "ACTIVE" },
                  ].map((k, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm font-medium">{k.label}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{k.tenant}</TableCell>
                      <TableCell className="font-mono text-xs">{k.key}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[0.6rem]">{k.scopes}</Badge></TableCell>
                      <TableCell className="text-xs font-mono">{k.rate}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{k.used}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs">
                          <StatusDot status={k.status === "ACTIVE" ? "ACTIVE" : "INACTIVE"} />
                          {k.status}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="theming">
          <SectionCard
            title="White-label Theming"
            description="Brand tokens per tenant — Global Toll retains default identity"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-md">
                <h4 className="text-sm font-semibold mb-3">Global Toll (default)</h4>
                <div className="space-y-2">
                  {[
                    { name: "Primary Teal", color: "#2E8B8B" },
                    { name: "Deep Navy", color: "#2C3E50" },
                    { name: "Slate Blue-Grey", color: "#5C7A8A" },
                    { name: "Gold Accent", color: "#E0A030" },
                    { name: "Canvas", color: "#F2F2F0" },
                  ].map((c) => (
                    <div key={c.name} className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded border" style={{ background: c.color }} />
                      <span className="text-xs flex-1">{c.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">{c.color}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 border rounded-md">
                <h4 className="text-sm font-semibold mb-3">Western Tollways (white-label)</h4>
                <div className="space-y-2">
                  {[
                    { name: "Primary", color: "#1E5F8E" },
                    { name: "Secondary", color: "#2A3F5F" },
                    { name: "Accent", color: "#F39C12" },
                    { name: "Canvas", color: "#F8F9FA" },
                  ].map((c) => (
                    <div key={c.name} className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded border" style={{ background: c.color }} />
                      <span className="text-xs flex-1">{c.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">{c.color}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-[0.65rem] text-muted-foreground">
                  Logo, font, and color overrides applied across all customer-facing screens,
                  PDF invoices, email templates, and SMS branding footer.
                </div>
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="backup">
          <SectionCard
            title="Backup & Data Retention"
            description="Automated backups, retention policy, point-in-time recovery"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Backup Schedule</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span>Transaction DB — full</span>
                    <span className="text-muted-foreground">Daily 02:00 IST</span>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span>Transaction DB — incremental</span>
                    <span className="text-muted-foreground">Every 15 min</span>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span>Analytics DB (Timescale)</span>
                    <span className="text-muted-foreground">Daily 03:00 IST</span>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span>Object storage (ANPR images, KYC)</span>
                    <span className="text-muted-foreground">Continuous (cross-region replication)</span>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span>Audit log (hash-chained)</span>
                    <span className="text-muted-foreground">Continuous (append-only, WORM)</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Retention Policy</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span>Transaction records</span>
                    <span className="text-muted-foreground">7 years (regulatory)</span>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span>ANPR images (non-violation)</span>
                    <span className="text-muted-foreground">30 days</span>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span>Violation evidence</span>
                    <span className="text-muted-foreground">7 years</span>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span>KYC documents</span>
                    <span className="text-muted-foreground">10 years after account closure</span>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span>Audit logs</span>
                    <span className="text-muted-foreground">10 years (immutable)</span>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>

      {/* Onboarding dialog */}
      <Dialog open={onboardOpen} onOpenChange={setOnboardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Onboard New Tenant</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="t-name">Tenant Display Name *</Label>
              <Input id="t-name" value={newTenant.name} onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })} placeholder="e.g., Eastern Highways Authority" />
            </div>
            <div>
              <Label htmlFor="t-legal">Legal Name</Label>
              <Input id="t-legal" value={newTenant.legalName} onChange={(e) => setNewTenant({ ...newTenant, legalName: e.target.value })} placeholder="e.g., Eastern Highways Authority Ltd" />
            </div>
            <div>
              <Label htmlFor="t-tax">Tax ID (GSTIN)</Label>
              <Input id="t-tax" value={newTenant.taxId} onChange={(e) => setNewTenant({ ...newTenant, taxId: e.target.value })} placeholder="29AAAAA0000A1Z5" />
            </div>
            <div>
              <Label>Subscription Tier</Label>
              <div className="grid grid-cols-4 gap-2 mt-1">
                {["STARTER", "GROWTH", "ENTERPRISE", "WHITE_LABEL"].map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setNewTenant({ ...newTenant, subscriptionTier: tier })}
                    className={`p-2 border rounded text-xs font-medium transition-colors ${
                      newTenant.subscriptionTier === tier
                        ? "border-teal bg-teal/10 text-teal"
                        : "border-border hover:bg-muted/30"
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOnboardOpen(false)}>Cancel</Button>
            <Button onClick={handleOnboard}>Onboard Tenant</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
