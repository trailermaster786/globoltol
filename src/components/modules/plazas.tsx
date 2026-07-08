"use client";
import { useState, useMemo } from "react";
import { useStore } from "@/store/app-store";
import { can } from "@/lib/rbac";
import { PageContainer, SectionCard, StatusDot } from "@/components/common/ui";
import { formatDateTime, timeAgo } from "@/lib/format";
import {
  Building2, Plus, MapPin, Activity, Cpu, AlertTriangle,
  Settings2, X,
} from "lucide-react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export function PlazasModule() {
  const currentUser = useStore((s) => s.currentUser)!;
  const plazas = useStore((s) => s.plazas);
  const highways = useStore((s) => s.highways);
  const lanes = useStore((s) => s.lanes);
  const devices = useStore((s) => s.devices);
  const currentTenantId = useStore((s) => s.currentTenantId);
  const pushAudit = useStore((s) => s.pushAudit);

  const [selectedPlazaId, setSelectedPlazaId] = useState<string | null>(null);
  const [closeLaneDialog, setCloseLaneDialog] = useState<string | null>(null);
  const [closeReason, setCloseReason] = useState("");

  // SUPER_ADMIN sees all; others see their tenant only
  const visiblePlazas = plazas.filter(
    (p) => currentUser.role === "SUPER_ADMIN" || p.tenantId === currentTenantId
  );

  const plazaLanes = useMemo(
    () => lanes.filter((l) => l.plazaId === selectedPlazaId),
    [lanes, selectedPlazaId]
  );

  const canEdit = can(currentUser.role, "plazas", "edit");
  const canCreate = can(currentUser.role, "plazas", "create");

  const handleSetLaneStatus = (laneId: string, status: "OPEN" | "CLOSED" | "MAINTENANCE") => {
    pushAudit({
      tenantId: currentTenantId,
      actorName: currentUser.name,
      action: "UPDATE",
      module: "plazas",
      entityType: "lane",
      entityId: laneId,
      beforeValue: JSON.stringify({ status: lanes.find(l => l.id === laneId)?.status }),
      afterValue: JSON.stringify({ status, reason: closeReason || undefined }),
      ipAddress: "10.0.1.42",
    });
    toast.success(`Lane ${status === "OPEN" ? "reopened" : status === "CLOSED" ? "closed" : "set to maintenance"}`, {
      description: closeReason || `Lane status updated successfully`,
    });
    setCloseLaneDialog(null);
    setCloseReason("");
  };

  return (
    <PageContainer>
      {/* Highway & Plaza overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {visiblePlazas.map((p) => {
          const hw = highways.find((h) => h.id === p.highwayId);
          const plzLanes = lanes.filter((l) => l.plazaId === p.id);
          const openCount = plzLanes.filter((l) => l.status === "OPEN").length;
          const faultyCount = plzLanes.filter((l) => l.status === "FAULTED").length;
          const isSelected = selectedPlazaId === p.id;
          return (
            <Card
              key={p.id}
              className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? "ring-2 ring-teal" : ""}`}
              onClick={() => setSelectedPlazaId(p.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-md bg-teal/10 grid place-items-center">
                      <Building2 className="h-4 w-4 text-teal" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{p.name}</CardTitle>
                      <div className="text-[0.65rem] text-muted-foreground font-mono mt-0.5">
                        {p.code} · KM {p.kmMark}
                      </div>
                    </div>
                  </div>
                  <StatusDot status={p.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {hw?.code} — {hw?.name.slice(0, 25)}
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div>
                    <div className="text-base font-bold text-emerald-600">{openCount}</div>
                    <div className="text-[0.55rem] text-muted-foreground uppercase">Open</div>
                  </div>
                  <div>
                    <div className="text-base font-bold text-amber-600">
                      {plzLanes.filter((l) => l.status === "MAINTENANCE").length}
                    </div>
                    <div className="text-[0.55rem] text-muted-foreground uppercase">Maint.</div>
                  </div>
                  <div>
                    <div className="text-base font-bold text-destructive">{faultyCount}</div>
                    <div className="text-[0.55rem] text-muted-foreground uppercase">Faulted</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {canCreate && (
          <Card className="border-dashed border-2 grid place-items-center text-center cursor-pointer hover:border-teal hover:bg-muted/30 min-h-[180px]">
            <div className="p-4">
              <div className="h-9 w-9 mx-auto rounded-md bg-muted grid place-items-center mb-2">
                <Plus className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-sm font-medium">Add Toll Plaza</div>
              <div className="text-[0.65rem] text-muted-foreground mt-1">
                Register a new plaza on a highway
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Plaza detail panel */}
      {selectedPlazaId && (
        <SectionCard
          title={`${plazas.find(p => p.id === selectedPlazaId)?.name} — Lane Operations`}
          description="Real-time lane status, device health, and shift control"
          action={
            <Button variant="ghost" size="sm" onClick={() => setSelectedPlazaId(null)}>
              <X className="h-4 w-4" />
            </Button>
          }
        >
          <Tabs defaultValue="lanes">
            <TabsList className="mb-4">
              <TabsTrigger value="lanes">Lanes ({plazaLanes.length})</TabsTrigger>
              <TabsTrigger value="devices">Devices</TabsTrigger>
              <TabsTrigger value="config">Configuration</TabsTrigger>
            </TabsList>

            <TabsContent value="lanes">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Lane</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="w-24">Direction</TableHead>
                      <TableHead className="w-32">Status</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plazaLanes.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-mono text-xs">L{l.number}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[0.65rem]">
                            {l.type.replace("_", "/")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{l.direction}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs font-medium">
                            <StatusDot status={l.status} />
                            {l.status}
                          </div>
                          {l.reason && (
                            <div className="text-[0.6rem] text-muted-foreground mt-0.5">
                              {l.reason}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {timeAgo(l.updatedAt)}
                        </TableCell>
                        <TableCell>
                          {canEdit ? (
                            <div className="flex gap-1">
                              {l.status !== "OPEN" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-[0.65rem]"
                                  onClick={() => handleSetLaneStatus(l.id, "OPEN")}
                                >
                                  Open
                                </Button>
                              )}
                              {l.status !== "CLOSED" && (
                                <Dialog open={closeLaneDialog === l.id} onOpenChange={(o) => setCloseLaneDialog(o ? l.id : null)}>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="h-7 text-[0.65rem]">
                                      Close
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Close Lane L{l.number}</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-3">
                                      <div>
                                        <Label htmlFor="reason">Reason (logged to audit trail)</Label>
                                        <Input
                                          id="reason"
                                          value={closeReason}
                                          onChange={(e) => setCloseReason(e.target.value)}
                                          placeholder="e.g., Scheduled barrier maintenance"
                                        />
                                      </div>
                                      <div className="text-xs text-muted-foreground bg-muted/40 p-2 rounded">
                                        Closing this lane will reroute traffic. Operators will be reassigned automatically.
                                      </div>
                                    </div>
                                    <DialogFooter>
                                      <Button variant="outline" onClick={() => setCloseLaneDialog(null)}>
                                        Cancel
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        onClick={() => handleSetLaneStatus(l.id, "CLOSED")}
                                      >
                                        Close Lane
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              )}
                              {l.status !== "MAINTENANCE" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-[0.65rem]"
                                  onClick={() => handleSetLaneStatus(l.id, "MAINTENANCE")}
                                >
                                  Maint.
                                </Button>
                              )}
                            </div>
                          ) : (
                            <span className="text-[0.65rem] text-muted-foreground">view-only</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="devices">
              <DeviceHealthTable laneIds={plazaLanes.map((l) => l.id)} devices={devices.filter(d => plazaLanes.some(l => l.id === d.laneId))} />
            </TabsContent>

            <TabsContent value="config">
              <PlazaConfiguration plazaId={selectedPlazaId} />
            </TabsContent>
          </Tabs>
        </SectionCard>
      )}

      {/* Highway listing */}
      <SectionCard
        title="Highway Network"
        description={`${highways.filter(h => currentUser.role === "SUPER_ADMIN" || h.tenantId === currentTenantId).length} highways under management`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {highways
            .filter((h) => currentUser.role === "SUPER_ADMIN" || h.tenantId === currentTenantId)
            .map((h) => {
              const hwPlazas = plazas.filter((p) => p.highwayId === h.id);
              return (
                <div key={h.id} className="p-3 rounded-md border border-border bg-background">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs text-teal font-semibold">{h.code}</span>
                    <Badge variant="outline" className="text-[0.6rem]">{h.region}</Badge>
                  </div>
                  <div className="text-sm font-semibold">{h.name}</div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
                    <span>{h.lengthKm} km</span>
                    <span>{hwPlazas.length} plazas</span>
                  </div>
                </div>
              );
            })}
        </div>
      </SectionCard>
    </PageContainer>
  );
}

function DeviceHealthTable({ laneIds, devices }: { laneIds: string[]; devices: ReturnType<typeof useStore.getState>["devices"] }) {
  return (
    <div className="rounded-md border max-h-96 overflow-y-auto scrollbar-thin">
      <Table>
        <TableHeader className="sticky top-0 bg-card">
          <TableRow>
            <TableHead className="w-16">Lane</TableHead>
            <TableHead>Device</TableHead>
            <TableHead>Serial</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead className="w-32">Status</TableHead>
            <TableHead>Last Heartbeat</TableHead>
            <TableHead>Firmware</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devices.map((d) => {
            const lane = laneIds.find((id) => id === d.laneId);
            return (
              <TableRow key={d.id}>
                <TableCell className="font-mono text-xs">{d.laneId.slice(-8)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-xs">
                    <Cpu className="h-3 w-3 text-muted-foreground" />
                    {d.type.replace("_", " ")}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">{d.serialNo}</TableCell>
                <TableCell className="text-xs">{d.vendor}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <StatusDot status={d.status} />
                    {d.status}
                  </div>
                  {d.errorCode && (
                    <div className="text-[0.6rem] text-destructive mt-0.5 font-mono">
                      {d.errorCode}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {d.lastHeartbeat ? timeAgo(d.lastHeartbeat) : "—"}
                </TableCell>
                <TableCell className="text-xs font-mono">{d.firmware}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function PlazaConfiguration({ plazaId }: { plazaId: string }) {
  const plazas = useStore((s) => s.plazas);
  const plaza = plazas.find((p) => p.id === plazaId);
  if (!plaza) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plaza Details</h4>
        <div className="space-y-2 text-xs">
          <ConfigRow label="Plaza Code" value={plaza.code} />
          <ConfigRow label="Highway" value={plaza.highwayId} />
          <ConfigRow label="KM Mark" value={`${plaza.kmMark} km`} />
          <ConfigRow label="Direction" value={plaza.direction} />
          <ConfigRow label="Coordinates" value={`${plaza.latitude?.toFixed(4)}, ${plaza.longitude?.toFixed(4)}`} />
          <ConfigRow label="Status" value={plaza.status} />
        </div>
      </div>
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Operational Settings</h4>
        <div className="space-y-2 text-xs">
          <ConfigRow label="Operating Hours" value="24 × 7" />
          <ConfigRow label="Cash Lanes" value="4" />
          <ConfigRow label="ETC Lanes" value="6" />
          <ConfigRow label="ANPR Lanes" value="2" />
          <ConfigRow label="Shift Pattern" value="3 × 8hr shifts" />
          <ConfigRow label="Last Maintenance" value={formatDateTime(new Date(Date.now() - 5 * 24 * 60 * 60_000).toISOString())} />
        </div>
      </div>
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
