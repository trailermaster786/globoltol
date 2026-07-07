"use client";
import { useState } from "react";
import { useStore } from "@/store/app-store";
import { can } from "@/lib/rbac";
import { PageContainer, SectionCard } from "@/components/common/ui";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  Tag, Plus, GitBranch, Percent, Calendar, ToggleRight, Clock, Users,
} from "lucide-react";
import {
  Card,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export function PricingModule() {
  const currentUser = useStore((s) => s.currentUser)!;
  const plazas = useStore((s) => s.plazas);
  const rateCards = useStore((s) => s.rateCards);
  const rateRules = useStore((s) => s.rateRules);
  const discountPlans = useStore((s) => s.discountPlans);
  const vehicleClasses = useStore((s) => s.vehicleClasses);
  const currentTenantId = useStore((s) => s.currentTenantId);

  const [selectedPlaza, setSelectedPlaza] = useState<string>("ALL");
  const canEdit = can(currentUser.role, "pricing", "edit");

  const visiblePlazas = plazas.filter(
    (p) => currentUser.role === "SUPER_ADMIN" || p.tenantId === currentTenantId
  );
  const visibleRateCards = rateCards.filter((rc) =>
    visiblePlazas.some((p) => p.id === rc.plazaId)
  );
  const visibleRateRules = rateRules.filter(
    (rr) => currentUser.role === "SUPER_ADMIN" || rr.tenantId === currentTenantId
  );
  const visibleDiscounts = discountPlans.filter(
    (dp) => currentUser.role === "SUPER_ADMIN" || dp.tenantId === currentTenantId
  );

  const filteredRateCards = selectedPlaza === "ALL"
    ? visibleRateCards
    : visibleRateCards.filter((rc) => rc.plazaId === selectedPlaza);

  return (
    <PageContainer>
      <Tabs defaultValue="ratecards">
        <TabsList>
          <TabsTrigger value="ratecards">
            <Tag className="h-3.5 w-3.5 mr-1.5" /> Rate Cards
          </TabsTrigger>
          <TabsTrigger value="rules">
            <Percent className="h-3.5 w-3.5 mr-1.5" /> Dynamic Rules
          </TabsTrigger>
          <TabsTrigger value="discounts">
            <Users className="h-3.5 w-3.5 mr-1.5" /> Discounts & Exemptions
          </TabsTrigger>
          <TabsTrigger value="versioning">
            <GitBranch className="h-3.5 w-3.5 mr-1.5" /> Version History
          </TabsTrigger>
        </TabsList>

        {/* Rate cards */}
        <TabsContent value="ratecards" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Select value={selectedPlaza} onValueChange={setSelectedPlaza}>
              <SelectTrigger className="w-72">
                <SelectValue placeholder="Filter by plaza" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Plazas</SelectItem>
                {visiblePlazas.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {can(currentUser.role, "pricing", "create") && (
              <Button>
                <Plus className="h-4 w-4 mr-2" /> New Rate Card
              </Button>
            )}
          </div>

          <SectionCard
            title="Active Rate Cards"
            description="Single/round-journey and monthly pass rates per plaza × vehicle class"
          >
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plaza</TableHead>
                    <TableHead>Vehicle Class</TableHead>
                    <TableHead className="text-right">Single Journey</TableHead>
                    <TableHead className="text-right">Round Journey</TableHead>
                    <TableHead className="text-right">Monthly Pass</TableHead>
                    <TableHead>Effective</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRateCards.map((rc) => {
                    const plaza = plazas.find((p) => p.id === rc.plazaId);
                    return (
                      <TableRow key={rc.id}>
                        <TableCell className="text-xs">
                          <div className="font-medium">{plaza?.name}</div>
                          <div className="font-mono text-[0.6rem] text-muted-foreground">{plaza?.code}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[0.65rem]">
                            {vehicleClasses.find(vc => vc.code === rc.vehicleClassCode)?.label ?? rc.vehicleClassCode}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-medium">
                          {formatCurrency(rc.singleJourney)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {rc.roundJourney ? formatCurrency(rc.roundJourney) : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                          {rc.monthlyPass ? formatCurrency(rc.monthlyPass) : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(rc.effectiveFrom)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[0.6rem] font-mono">v{rc.version}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              rc.status === "ACTIVE"
                                ? "text-[0.65rem] border-emerald-500 text-emerald-700 bg-emerald-50"
                                : rc.status === "DRAFT"
                                  ? "text-[0.65rem] border-amber-500 text-amber-700 bg-amber-50"
                                  : "text-[0.65rem] text-muted-foreground"
                            }
                          >
                            {rc.status}
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

        {/* Dynamic pricing rules */}
        <TabsContent value="rules" className="space-y-4">
          <SectionCard
            title="Dynamic / Congestion Pricing Rules"
            description="If/then rule engine — applied in priority order on top of base rate card"
            action={
              canEdit && (
                <Button size="sm">
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> New Rule
                </Button>
              )
            }
          >
            <div className="space-y-2">
              {visibleRateRules.map((rr) => (
                <Card key={rr.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h4 className="text-sm font-semibold">{rr.name}</h4>
                        <Badge variant="outline" className="text-[0.6rem] font-mono">
                          Priority {rr.priority}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            rr.action === "DISCOUNT"
                              ? "text-[0.6rem] border-emerald-500 text-emerald-700"
                              : rr.action === "SURCHARGE"
                                ? "text-[0.6rem] border-amber-500 text-amber-700"
                                : "text-[0.6rem] border-blue-500 text-blue-700"
                          }
                        >
                          {rr.action.replace("_", " ")} · {rr.value}{rr.action === "MULTIPLIER" ? "×" : rr.action === "DISCOUNT" ? "" : "₹"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {rr.condition.timeOfDay && (
                          <Badge variant="secondary" className="text-[0.6rem]">
                            <Clock className="h-2.5 w-2.5 mr-1" />
                            {rr.condition.timeOfDay.replace("_", " ")}
                          </Badge>
                        )}
                        {rr.condition.dayType && (
                          <Badge variant="secondary" className="text-[0.6rem]">
                            <Calendar className="h-2.5 w-2.5 mr-1" />
                            {rr.condition.dayType}
                          </Badge>
                        )}
                        {rr.condition.congestionLevel && (
                          <Badge variant="secondary" className="text-[0.6rem]">
                            Congestion: {rr.condition.congestionLevel}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rr.enabled}
                        onCheckedChange={(checked) => {
                          toast.success(`Rule ${checked ? "enabled" : "disabled"}`, {
                            description: rr.name,
                          });
                        }}
                        disabled={!canEdit}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        {/* Discounts & exemptions */}
        <TabsContent value="discounts" className="space-y-4">
          <SectionCard
            title="Discount Plans & Subscriptions"
            description="Frequent-user, monthly pass, fleet, local resident, government exemption"
            action={
              canEdit && (
                <Button size="sm">
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> New Plan
                </Button>
              )
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {visibleDiscounts.map((dp) => (
                <Card key={dp.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-semibold">{dp.name}</h4>
                      <Badge variant="outline" className="text-[0.6rem] mt-1">
                        {dp.type.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-teal">
                        {dp.valueType === "PERCENTAGE"
                          ? `${dp.value * 100}%`
                          : formatCurrency(dp.value)}
                      </div>
                      <div className="text-[0.6rem] text-muted-foreground uppercase">
                        {dp.valueType}
                      </div>
                    </div>
                  </div>
                  {dp.eligibility && (
                    <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded mt-2">
                      <strong className="text-foreground">Eligibility:</strong> {dp.eligibility}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Government-Mandated Exemptions"
            description="VIP, emergency services, defense vehicles — applied automatically at lane"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { name: "VIP Convoy", code: "VIP" },
                { name: "Ambulance", code: "EMR" },
                { name: "Fire Brigade", code: "FIRE" },
                { name: "Police Vehicle", code: "POL" },
                { name: "Defense Forces", code: "DEF" },
                { name: "Chief Minister", code: "CM" },
                { name: "President of India", code: "PREZ" },
                { name: "Foreign Dignitary", code: "FRN" },
              ].map((ex) => (
                <div key={ex.code} className="p-2.5 border border-border rounded-md text-center bg-muted/20">
                  <div className="font-mono text-[0.6rem] text-muted-foreground">{ex.code}</div>
                  <div className="text-xs font-medium mt-0.5">{ex.name}</div>
                  <div className="text-[0.55rem] text-emerald-600 mt-1">100% exempt</div>
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        {/* Version history */}
        <TabsContent value="versioning" className="space-y-4">
          <SectionCard
            title="Rate Card Version History"
            description="Effective-date scheduling with full change-history audit"
          >
            <div className="space-y-3">
              {[
                { version: 3, plaza: "TP-0048 Gurgaon–Rewari", class: "CAR", change: "Single journey ₹80 → ₹85 (+6.25%)", effective: "01 Jun 2026", status: "ACTIVE", approvedBy: "Anjali Gupta (TENANT_ADMIN)" },
                { version: 2, plaza: "TP-0048 Gurgaon–Rewari", class: "CAR", change: "Single journey ₹75 → ₹80 (+6.67%)", effective: "01 Jan 2026", status: "ARCHIVED", approvedBy: "Anjali Gupta (TENANT_ADMIN)" },
                { version: 1, plaza: "TP-0048 Gurgaon–Rewari", class: "CAR", change: "Initial rate card", effective: "15 Mar 2025", status: "ARCHIVED", approvedBy: "Platform Onboarding" },
                { version: 2, plaza: "TP-0210 Jaipur Bypass", class: "HCV", change: "Single journey ₹245 → ₹265 (+8.16%)", effective: "01 Jun 2026", status: "ACTIVE", approvedBy: "Anjali Gupta (TENANT_ADMIN)" },
              ].map((v, i) => (
                <div key={i} className="flex items-center gap-4 p-3 border border-border rounded-md">
                  <div className="h-10 w-10 rounded-full grid place-items-center bg-teal/10 text-teal">
                    <span className="text-xs font-bold">v{v.version}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{v.plaza} — {v.class}</div>
                    <div className="text-xs text-muted-foreground">{v.change}</div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="text-muted-foreground">Effective {v.effective}</div>
                    <div className="text-[0.6rem] text-muted-foreground mt-0.5">{v.approvedBy}</div>
                  </div>
                  <Badge
                    variant="outline"
                    className={v.status === "ACTIVE" ? "text-[0.6rem] border-emerald-500 text-emerald-700" : "text-[0.6rem] text-muted-foreground"}
                  >
                    {v.status}
                  </Badge>
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
