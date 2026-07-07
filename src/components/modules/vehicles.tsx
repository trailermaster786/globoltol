"use client";
import { useState, useMemo } from "react";
import { useStore } from "@/store/app-store";
import { can } from "@/lib/rbac";
import { PageContainer, SectionCard, StatusDot, EmptyState } from "@/components/common/ui";
import { formatDateTime, formatDate, timeAgo } from "@/lib/format";
import {
  Car, Tag as TagIcon, Plus, Search, Upload, Ban, ShieldAlert,
  CheckCircle2, RefreshCw, Eye, ArrowUpRight,
} from "lucide-react";
import {
  Card, CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function VehiclesModule() {
  const currentUser = useStore((s) => s.currentUser)!;
  const vehicles = useStore((s) => s.vehicles);
  const tags = useStore((s) => s.tags);
  const wallets = useStore((s) => s.wallets);
  const vehicleClasses = useStore((s) => s.vehicleClasses);
  const currentTenantId = useStore((s) => s.currentTenantId);
  const pushAudit = useStore((s) => s.pushAudit);

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState("vehicles");
  const [detailVehicleId, setDetailVehicleId] = useState<string | null>(null);
  const [blacklistDialog, setBlacklistDialog] = useState<string | null>(null);
  const [blacklistReason, setBlacklistReason] = useState("");

  const canEdit = can(currentUser.role, "vehicles", "edit");

  const visibleVehicles = useMemo(() => {
    return vehicles
      .filter((v) => currentUser.role === "SUPER_ADMIN" || v.tenantId === currentTenantId)
      .filter((v) => (classFilter === "ALL" ? true : v.vehicleClassCode === classFilter))
      .filter((v) => (statusFilter === "ALL" ? true : v.status === statusFilter))
      .filter((v) =>
        search
          ? v.plateNumber.toLowerCase().includes(search.toLowerCase()) ||
            v.ownerName.toLowerCase().includes(search.toLowerCase())
          : true
      );
  }, [vehicles, currentUser, currentTenantId, classFilter, statusFilter, search]);

  const visibleTags = useMemo(() => {
    return tags.filter((t) => {
      const v = vehicles.find((vv) => vv.id === t.vehicleId);
      return v && (currentUser.role === "SUPER_ADMIN" || v.tenantId === currentTenantId);
    });
  }, [tags, vehicles, currentUser, currentTenantId]);

  const handleBlacklist = (vehicleId: string) => {
    pushAudit({
      tenantId: currentTenantId,
      actorName: currentUser.name,
      action: "UPDATE",
      module: "vehicles",
      entityType: "vehicle",
      entityId: vehicleId,
      beforeValue: JSON.stringify({ status: "ACTIVE" }),
      afterValue: JSON.stringify({ status: "BLACKLISTED", reason: blacklistReason }),
      ipAddress: "10.0.1.42",
    });
    toast.success("Vehicle blacklisted", {
      description: `All lanes flagged. ANPR cameras will alert on next detection.`,
    });
    setBlacklistDialog(null);
    setBlacklistReason("");
  };

  const stats = {
    total: visibleVehicles.length,
    active: visibleVehicles.filter((v) => v.status === "ACTIVE").length,
    blacklisted: visibleVehicles.filter((v) => v.status === "BLACKLISTED").length,
    tagsActive: visibleTags.filter((t) => t.status === "ACTIVE").length,
    tagsLost: visibleTags.filter((t) => t.status === "LOST").length,
  };

  const detailVehicle = detailVehicleId ? vehicles.find(v => v.id === detailVehicleId) : null;
  const detailTags = detailVehicle ? tags.filter(t => t.vehicleId === detailVehicle.id) : [];
  const detailWallet = detailTags.length > 0 ? wallets.find(w => w.tagId === detailTags[0].id) : null;

  return (
    <PageContainer>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-4 border-l-4 border-l-teal">
          <div className="text-xs text-muted-foreground uppercase">Total Vehicles</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-500">
          <div className="text-xs text-muted-foreground uppercase">Active</div>
          <div className="text-2xl font-bold text-emerald-600">{stats.active}</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-destructive">
          <div className="text-xs text-muted-foreground uppercase">Blacklisted</div>
          <div className="text-2xl font-bold text-destructive">{stats.blacklisted}</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-[var(--color-gold)]">
          <div className="text-xs text-muted-foreground uppercase">Active Tags</div>
          <div className="text-2xl font-bold">{stats.tagsActive}</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="text-xs text-muted-foreground uppercase">Lost Tags</div>
          <div className="text-2xl font-bold text-amber-600">{stats.tagsLost}</div>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="vehicles">
            <Car className="h-3.5 w-3.5 mr-1.5" /> Vehicles
          </TabsTrigger>
          <TabsTrigger value="tags">
            <TagIcon className="h-3.5 w-3.5 mr-1.5" /> RFID Tags
          </TabsTrigger>
          <TabsTrigger value="blacklist">
            <Ban className="h-3.5 w-3.5 mr-1.5" /> Watchlist
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search plate number or owner name…"
                className="pl-9"
              />
            </div>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Vehicle Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Classes</SelectItem>
                {vehicleClasses.map((vc) => (
                  <SelectItem key={vc.code} value={vc.code}>{vc.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="BLACKLISTED">Blacklisted</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" /> Import
            </Button>
            {can(currentUser.role, "vehicles", "create") && (
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Register
              </Button>
            )}
          </div>

          <SectionCard description={`${visibleVehicles.length} of ${vehicles.length} vehicles shown`}>
            <div className="rounded-md border max-h-[600px] overflow-y-auto scrollbar-thin">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead>Plate Number</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Tag Status</TableHead>
                    <TableHead>Wallet Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleVehicles.slice(0, 50).map((v) => {
                    const tag = tags.find((t) => t.vehicleId === v.id);
                    const wallet = tag ? wallets.find((w) => w.tagId === tag.id) : null;
                    const vc = vehicleClasses.find((c) => c.code === v.vehicleClassCode);
                    return (
                      <TableRow key={v.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setDetailVehicleId(v.id)}>
                        <TableCell className="font-mono font-semibold text-xs">{v.plateNumber}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[0.65rem]">{vc?.label ?? v.vehicleClassCode}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">{v.ownerName}</TableCell>
                        <TableCell>
                          {tag ? (
                            <div className="flex items-center gap-1.5 text-xs">
                              <StatusDot status={tag.status} />
                              {tag.status}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">No tag</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {wallet ? `₹${wallet.balance.toLocaleString("en-IN")}` : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs">
                            <StatusDot status={v.status} />
                            <span className={v.status === "BLACKLISTED" ? "text-destructive font-medium" : ""}>
                              {v.status}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(v.createdAt)}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => setDetailVehicleId(v.id)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {visibleVehicles.length > 50 && (
              <div className="text-xs text-muted-foreground text-center py-3">
                Showing first 50 of {visibleVehicles.length}. Refine filters to narrow results.
              </div>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="tags">
          <SectionCard title="RFID Tag Inventory" description="Tag issuance, activation, replacement lifecycle">
            <div className="rounded-md border max-h-[600px] overflow-y-auto scrollbar-thin">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead>RFID</TableHead>
                    <TableHead>Linked Plate</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Replaced</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleTags.slice(0, 50).map((t) => {
                    const v = vehicles.find((vv) => vv.id === t.vehicleId);
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-xs">{t.rfid}</TableCell>
                        <TableCell className="font-mono font-semibold text-xs">{v?.plateNumber ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[0.65rem]">{v?.vehicleClassCode.replace("_", " ")}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs">
                            <StatusDot status={t.status} />
                            {t.status}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(t.issuedAt)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {t.replacedAt ? formatDate(t.replacedAt) : "—"}
                        </TableCell>
                        <TableCell>
                          {canEdit && t.status === "ACTIVE" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[0.65rem]"
                              onClick={() => toast.success("Replacement tag queued", { description: `Old tag ${t.rfid.slice(-6)} will be deactivated on activation of new tag.` })}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" /> Replace
                            </Button>
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

        <TabsContent value="blacklist">
          <SectionCard
            title="Blacklist & Watchlist"
            description="Stolen vehicles, chronic evaders, wanted-list feed from law enforcement API"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {visibleVehicles.filter((v) => v.status === "BLACKLISTED").map((v) => (
                <Card key={v.id} className="p-4 border-l-4 border-l-destructive">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-mono font-bold text-sm">{v.plateNumber}</div>
                      <div className="text-xs text-muted-foreground">{v.ownerName}</div>
                    </div>
                    <Badge variant="destructive" className="text-[0.6rem]">BLACKLISTED</Badge>
                  </div>
                  <div className="text-xs text-foreground mt-2 p-2 bg-destructive/5 rounded">
                    <ShieldAlert className="h-3 w-3 inline mr-1.5 text-destructive" />
                    {v.blacklistReason ?? "Reason not specified"}
                  </div>
                  <div className="text-[0.65rem] text-muted-foreground mt-2">
                    Listed: {formatDate(v.createdAt)}
                  </div>
                </Card>
              ))}
              {visibleVehicles.filter((v) => v.status === "BLACKLISTED").length === 0 && (
                <EmptyState
                  icon={CheckCircle2}
                  title="No blacklisted vehicles"
                  description="All registered vehicles are in good standing."
                />
              )}
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>

      {/* Vehicle detail dialog */}
      <Dialog open={!!detailVehicleId} onOpenChange={(o) => !o && setDetailVehicleId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto scrollbar-thin">
          {detailVehicle && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-teal" />
                  {detailVehicle.plateNumber}
                  <Badge variant="outline" className="ml-2">
                    {vehicleClasses.find(c => c.code === detailVehicle.vehicleClassCode)?.label}
                  </Badge>
                  <StatusDot status={detailVehicle.status} />
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <DetailRow label="Owner" value={detailVehicle.ownerName} />
                  <DetailRow label="Status" value={detailVehicle.status} />
                  <DetailRow label="Vehicle Class" value={vehicleClasses.find(c => c.code === detailVehicle.vehicleClassCode)?.label ?? ""} />
                  <DetailRow label="Axle Count" value={String(vehicleClasses.find(c => c.code === detailVehicle.vehicleClassCode)?.axleCount ?? 2)} />
                  <DetailRow label="Registered" value={formatDate(detailVehicle.createdAt)} />
                  <DetailRow label="Tenant" value={detailVehicle.tenantId} />
                </div>

                {detailVehicle.blacklistReason && (
                  <div className="text-xs p-3 bg-destructive/5 border border-destructive/20 rounded-md">
                    <div className="font-semibold text-destructive mb-1 flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5" /> Blacklist Reason
                    </div>
                    {detailVehicle.blacklistReason}
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Linked Tags</h4>
                  <div className="space-y-1.5">
                    {detailTags.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-2 border rounded text-xs">
                        <span className="font-mono">{t.rfid}</span>
                        <div className="flex items-center gap-2">
                          <StatusDot status={t.status} />
                          <span>{t.status}</span>
                        </div>
                      </div>
                    ))}
                    {detailTags.length === 0 && (
                      <div className="text-xs text-muted-foreground p-2">No tags linked to this vehicle.</div>
                    )}
                  </div>
                </div>

                {detailWallet && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Wallet</h4>
                    <div className="p-3 border rounded-md bg-[var(--color-accent)]/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">Balance</span>
                        <span className="text-lg font-bold text-foreground">
                          ₹{detailWallet.balance.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <DetailRow label="Auto-recharge" value={detailWallet.autoRecharge ? "ON" : "OFF"} />
                        {detailWallet.autoRecharge && (
                          <>
                            <DetailRow label="Threshold" value={`₹${detailWallet.rechargeThreshold}`} />
                            <DetailRow label="Recharge Amount" value={`₹${detailWallet.rechargeAmount}`} />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {canEdit && detailVehicle.status === "ACTIVE" && (
                  <Dialog open={blacklistDialog === detailVehicle.id} onOpenChange={(o) => setBlacklistDialog(o ? detailVehicle.id : null)}>
                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button variant="outline">Edit Details</Button>
                      <Button
                        variant="destructive"
                        onClick={() => setBlacklistDialog(detailVehicle.id)}
                      >
                        <Ban className="h-4 w-4 mr-1.5" /> Add to Blacklist
                      </Button>
                    </div>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Blacklist {detailVehicle.plateNumber}?</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="bl-reason">Reason (logged to immutable audit trail)</Label>
                          <Textarea
                            id="bl-reason"
                            value={blacklistReason}
                            onChange={(e) => setBlacklistReason(e.target.value)}
                            placeholder="e.g., Confirmed stolen vehicle per NCRB report #12345"
                            rows={3}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground bg-muted/40 p-2 rounded">
                          Blacklisting will: (1) flag the vehicle at every ANPR camera, (2) freeze the linked wallet, (3) trigger automatic e-challan on next detection.
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setBlacklistDialog(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => handleBlacklist(detailVehicle.id)}>
                          Confirm Blacklist
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 border border-border rounded">
      <div className="text-[0.6rem] text-muted-foreground uppercase tracking-wider mb-0.5">{label}</div>
      <div className="font-medium text-foreground">{value}</div>
    </div>
  );
}
