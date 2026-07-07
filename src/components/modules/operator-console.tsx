"use client";
import { useState, useMemo, useEffect } from "react";
import { useStore } from "@/store/app-store";
import { OmanPlateInput, OMAN_REGIONS } from "@/components/common/oman-plate-input";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { Vehicle, VehicleClassCode, PaymentMethod, Transaction } from "@/lib/types";
import {
  Car, Truck, Bus, Bike, MapPin, Calculator, Wallet, CreditCard,
  Banknote, Smartphone, CheckCircle2, ArrowRight, RotateCcw,
  Printer, AlertCircle, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Card,
} from "@/components/ui/card";
import { toast } from "sonner";

const VEHICLE_CLASS_ICONS: Record<VehicleClassCode, typeof Car> = {
  CAR: Car,
  LCV: Truck,
  HCV: Truck,
  BUS: Bus,
  MULTI_AXLE: Truck,
  OVERSIZED: Truck,
  TWO_WHEELER: Bike,
};

const STEPS = [
  { num: 1, label: "Vehicle & Plate", icon: Car },
  { num: 2, label: "Trip Details", icon: MapPin },
  { num: 3, label: "Toll Calculation", icon: Calculator },
  { num: 4, label: "Payment", icon: Wallet },
  { num: 5, label: "Confirm & Receipt", icon: CheckCircle2 },
];

export function OperatorConsole() {
  const plazas = useStore((s) => s.plazas);
  const lanes = useStore((s) => s.lanes);
  const vehicleClasses = useStore((s) => s.vehicleClasses);
  const rateCards = useStore((s) => s.rateCards);
  const vehicles = useStore((s) => s.vehicles);
  const wallets = useStore((s) => s.wallets);
  const tags = useStore((s) => s.tags);
  const transactions = useStore((s) => s.transactions);
  const addTransaction = useStore((s) => s.addTransaction);
  const currentUser = useStore((s) => s.currentUser)!;
  const pushAudit = useStore((s) => s.pushAudit);

  // Form state
  const [vehicleClass, setVehicleClass] = useState<VehicleClassCode | "">("");
  const [plate, setPlate] = useState("");
  const [plazaId, setPlazaId] = useState(plazas[0]?.id ?? "");
  const [laneId, setLaneId] = useState("");
  const [direction, setDirection] = useState<"FORWARD" | "REVERSE">("FORWARD");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [cashTendered, setCashTendered] = useState<string>("");
  const [submittedTxn, setSubmittedTxn] = useState<Transaction | null>(null);

  // Lookup matched vehicle by plate
  const matchedVehicle: Vehicle | undefined = useMemo(
    () => vehicles.find((v) => v.plateNumber === plate),
    [plate, vehicles]
  );

  const matchedTag = matchedVehicle
    ? tags.find((t) => t.vehicleId === matchedVehicle.id && t.status === "ACTIVE")
    : undefined;
  const matchedWallet = matchedTag
    ? wallets.find((w) => w.tagId === matchedTag.id)
    : undefined;

  // Auto-select vehicle class if matched vehicle has one
  useEffect(() => {
    if (matchedVehicle && !vehicleClass) {
      setVehicleClass(matchedVehicle.vehicleClassCode);
    }
  }, [matchedVehicle]);

  // Rate lookup
  const rateCard = useMemo(() => {
    if (!plazaId || !vehicleClass) return null;
    return rateCards.find(
      (rc) => rc.plazaId === plazaId && rc.vehicleClassCode === vehicleClass && rc.status === "ACTIVE"
    );
  }, [plazaId, vehicleClass, rateCards]);

  const baseAmount = rateCard?.singleJourney ?? 0;
  const taxAmount = +(baseAmount * 0.05).toFixed(3); // 5% VAT in Oman
  const totalAmount = +(baseAmount + taxAmount).toFixed(3);

  // Cash change calculation
  const tenderedNum = parseFloat(cashTendered) || 0;
  const change = +(tenderedNum - totalAmount).toFixed(3);
  const cashSufficient = paymentMethod !== "CASH" || tenderedNum >= totalAmount;

  // Wallet sufficiency
  const walletSufficient = paymentMethod !== "WALLET" || (matchedWallet?.balance ?? 0) >= totalAmount;

  // Validation per step
  const step1Valid = plate.match(/^\d{1,6}-[A-Z]+$/) && vehicleClass !== "";
  const step2Valid = plazaId !== "" && laneId !== "";
  const step3Valid = rateCard !== null && totalAmount > 0;
  const step4Valid = paymentMethod !== "" && cashSufficient && walletSufficient;
  const allValid = step1Valid && step2Valid && step3Valid && step4Valid;

  const plazaLanes = lanes.filter((l) => l.plazaId === plazaId);

  const handleSubmit = () => {
    if (!allValid) {
      toast.error("Please complete all steps before submitting");
      return;
    }
    const txnId = `txn-${String(transactions.length + 1).padStart(5, "0")}`;
    const txn: Transaction = {
      id: txnId,
      tenantId: "tnt-1",
      plazaId,
      laneId,
      vehicleId: matchedVehicle?.id,
      tagId: matchedTag?.id,
      walletId: matchedWallet?.id,
      vehicleClassCode: vehicleClass as VehicleClassCode,
      plateCaptured: plate,
      amount: baseAmount,
      taxAmount,
      totalAmount,
      paymentMethod,
      status: "SUCCESS",
      idempotencyKey: `idk-${plazas.find(p => p.id === plazaId)?.code}-${laneId}-${Date.now()}`,
      capturedAt: new Date().toISOString(),
    };
    addTransaction(txn);
    pushAudit({
      tenantId: "tnt-1",
      actorName: currentUser.name,
      action: "CREATE",
      module: "transactions",
      entityType: "transaction",
      entityId: txnId,
      afterValue: JSON.stringify({ plate, amount: totalAmount, method: paymentMethod }),
      ipAddress: "10.0.1.42",
    });
    setSubmittedTxn(txn);
    toast.success("Transaction captured", {
      description: `${plate} · ${formatCurrency(totalAmount, "OMR")} · ${paymentMethod}`,
    });
  };

  const handleReset = () => {
    setVehicleClass("");
    setPlate("");
    setLaneId("");
    setDirection("FORWARD");
    setPaymentMethod("CASH");
    setCashTendered("");
    setSubmittedTxn(null);
  };

  // ---- RECEIPT VIEW ----
  if (submittedTxn) {
    return <ReceiptView txn={submittedTxn} onReset={handleReset} plaza={plazas.find(p => p.id === submittedTxn.plazaId)?.name ?? ""} lane={lanes.find(l => l.id === submittedTxn.laneId)?.number ?? 0} operatorName={currentUser.name} />;
  }

  // ---- CONSOLE VIEW ----
  return (
    <div className="min-h-screen bg-canvas">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-navy">Operator Console</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Lane transaction entry — {currentUser.name}
              </p>
            </div>
            <Badge variant="outline" className="border-teal text-teal bg-teal/5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
              Lane Open
            </Badge>
          </div>

          {/* Step progress indicator */}
          <div className="flex items-center justify-between bg-card border border-border rounded-lg p-3 mt-4">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const valid = [step1Valid, step2Valid, step3Valid, step4Valid, allValid][i];
              return (
                <div key={step.num} className="flex items-center flex-1 last:flex-none">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "h-9 w-9 rounded-full grid place-items-center text-xs font-bold transition-all",
                        valid
                          ? "bg-emerald-500 text-white"
                          : "bg-muted text-muted-foreground border border-border"
                      )}
                    >
                      {valid ? <CheckCircle2 className="h-4 w-4" /> : step.num}
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-[0.65rem] text-muted-foreground uppercase tracking-wider">Step {step.num}</div>
                      <div className="text-xs font-medium text-foreground">{step.label}</div>
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={cn("flex-1 h-0.5 mx-2 sm:mx-3 transition-colors", valid ? "bg-emerald-400" : "bg-border")} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* ---- STEP 1: VEHICLE & PLATE ---- */}
          <Card className="p-5 border-l-4 border-l-teal">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-md bg-teal/10 grid place-items-center">
                <Car className="h-4 w-4 text-teal" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-navy">Step 1 · Vehicle & Plate</h2>
                <p className="text-[0.65rem] text-muted-foreground">Select class, enter Oman plate (auto-dash)</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium mb-1.5 block">Vehicle Class</Label>
                <Select
                  value={vehicleClass}
                  onValueChange={(v) => setVehicleClass(v as VehicleClassCode)}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select vehicle class" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleClasses.map((vc) => {
                      const Icon = VEHICLE_CLASS_ICONS[vc.code];
                      return (
                        <SelectItem key={vc.code} value={vc.code}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{vc.label}</span>
                            <Badge variant="outline" className="text-[0.55rem] ml-auto">{vc.axleCount} axle</Badge>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium mb-1.5 block">Plate Number (Oman)</Label>
                <OmanPlateInput
                  value={plate}
                  onChange={setPlate}
                  autoFocus
                />
              </div>

              {/* Matched vehicle info */}
              {matchedVehicle && (
                <div className="p-3 rounded-md bg-teal/5 border border-teal/20">
                  <div className="flex items-center gap-2 text-xs text-teal font-medium mb-1">
                    <User className="h-3.5 w-3.5" />
                    Registered Vehicle Found
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-[0.6rem] text-muted-foreground uppercase">Owner</div>
                      <div className="font-medium">{matchedVehicle.ownerName}</div>
                    </div>
                    <div>
                      <div className="text-[0.6rem] text-muted-foreground uppercase">Wallet Balance</div>
                      <div className={cn("font-mono font-bold", matchedWallet && matchedWallet.balance < 5 ? "text-amber-600" : "text-emerald-600")}>
                        {matchedWallet ? formatCurrency(matchedWallet.balance, "OMR") : "—"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {plate && !matchedVehicle && plate.match(/^\d{1,6}-[A-Z]+$/) && (
                <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-700 flex items-start gap-2">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <div>
                    <strong>Unregistered plate.</strong> This vehicle has no wallet — cash or card payment only. ANPR image will be captured.
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* ---- STEP 2: TRIP DETAILS ---- */}
          <Card className="p-5 border-l-4 border-l-[var(--color-slate-blue)]">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-md bg-[var(--color-slate-blue)]/10 grid place-items-center">
                <MapPin className="h-4 w-4" style={{ color: "var(--color-slate-blue)" }} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-navy">Step 2 · Trip Details</h2>
                <p className="text-[0.65rem] text-muted-foreground">Plaza, lane, and direction</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium mb-1.5 block">Toll Plaza</Label>
                <Select value={plazaId} onValueChange={(v) => { setPlazaId(v); setLaneId(""); }}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select plaza" />
                  </SelectTrigger>
                  <SelectContent>
                    {plazas.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[0.65rem] text-muted-foreground">{p.code}</span>
                          <span>{p.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium mb-1.5 block">Lane</Label>
                <Select value={laneId} onValueChange={setLaneId} disabled={!plazaId}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select lane" />
                  </SelectTrigger>
                  <SelectContent>
                    {plazaLanes.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        <div className="flex items-center gap-2">
                          <span>L{l.number}</span>
                          <Badge variant="outline" className="text-[0.55rem]">{l.type.replace("_", "/")}</Badge>
                          <span className="text-[0.6rem] text-muted-foreground">{l.direction}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium mb-1.5 block">Direction</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["FORWARD", "REVERSE"] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDirection(d)}
                      className={cn(
                        "h-10 rounded-md border-2 text-xs font-semibold transition-all",
                        direction === d
                          ? "border-teal bg-teal/10 text-teal"
                          : "border-border bg-background text-muted-foreground hover:bg-muted/30"
                      )}
                    >
                      {d === "FORWARD" ? "→ Forward" : "← Reverse"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* ---- STEP 3: TOLL CALCULATION ---- */}
          <Card className="p-5 border-l-4 border-l-[var(--color-gold)]">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-md bg-[var(--color-gold)]/10 grid place-items-center">
                <Calculator className="h-4 w-4" style={{ color: "var(--color-gold-dark)" }} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-navy">Step 3 · Toll Calculation</h2>
                <p className="text-[0.65rem] text-muted-foreground">Auto-calculated from rate card</p>
              </div>
            </div>

            {rateCard ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-md bg-muted/40">
                    <div className="text-[0.6rem] text-muted-foreground uppercase tracking-wider">Vehicle Class</div>
                    <div className="font-medium text-sm mt-0.5">
                      {vehicleClasses.find(vc => vc.code === vehicleClass)?.label}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-md bg-muted/40">
                    <div className="text-[0.6rem] text-muted-foreground uppercase tracking-wider">Rate Card Version</div>
                    <div className="font-medium text-sm mt-0.5">v{rateCard.version}</div>
                  </div>
                </div>

                <div className="p-4 rounded-md border border-border bg-card">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base toll</span>
                      <span className="font-mono font-medium">{formatCurrency(baseAmount, "OMR")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">VAT (5%)</span>
                      <span className="font-mono font-medium">{formatCurrency(taxAmount, "OMR")}</span>
                    </div>
                    <div className="border-t border-border pt-1.5 mt-1.5 flex justify-between items-center">
                      <span className="font-semibold text-foreground">Total Due</span>
                      <span className="font-mono font-bold text-lg text-[var(--color-gold-dark)]">
                        {formatCurrency(totalAmount, "OMR")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[0.65rem] text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  Rate effective from {new Date(rateCard.effectiveFrom).toLocaleDateString("en-OM")}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <Calculator className="h-8 w-8 mx-auto mb-2 opacity-30" />
                Complete Step 1 &amp; 2 to calculate toll
              </div>
            )}
          </Card>

          {/* ---- STEP 4: PAYMENT ---- */}
          <Card className="p-5 border-l-4 border-l-emerald-500">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-md bg-emerald-500/10 grid place-items-center">
                <Wallet className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-navy">Step 4 · Payment Method</h2>
                <p className="text-[0.65rem] text-muted-foreground">Select how the customer pays</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {([
                { method: "CASH" as const, label: "Cash", icon: Banknote, available: true },
                { method: "WALLET" as const, label: "Wallet / RFID", icon: Wallet, available: !!matchedWallet },
                { method: "CARD" as const, label: "Card", icon: CreditCard, available: true },
                { method: "UPI" as const, label: "UPI / Bank", icon: Smartphone, available: true },
              ]).map(({ method, label, icon: Icon, available }) => (
                <button
                  key={method}
                  onClick={() => available && setPaymentMethod(method)}
                  disabled={!available}
                  className={cn(
                    "h-14 rounded-md border-2 flex flex-col items-center justify-center gap-1 transition-all",
                    paymentMethod === method
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : available
                        ? "border-border bg-background text-muted-foreground hover:border-emerald-300 hover:bg-emerald-50/30"
                        : "border-border bg-muted/30 text-muted-foreground/50 cursor-not-allowed"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-semibold">{label}</span>
                </button>
              ))}
            </div>

            {/* Conditional payment fields */}
            {paymentMethod === "CASH" && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">Cash Tendered (OMR)</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  placeholder="0.000"
                  className="h-11 font-mono text-lg"
                />
                {tenderedNum > 0 && (
                  <div className={cn(
                    "p-2.5 rounded-md text-xs flex items-center justify-between",
                    change >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                  )}>
                    <span>{change >= 0 ? "Change to return" : "Insufficient cash"}</span>
                    <span className="font-mono font-bold">
                      {change >= 0 ? formatCurrency(change, "OMR") : formatCurrency(Math.abs(change), "OMR")}
                    </span>
                  </div>
                )}
              </div>
            )}

            {paymentMethod === "WALLET" && matchedWallet && (
              <div className="p-3 rounded-md bg-muted/40 text-xs">
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Current Balance</span>
                  <span className="font-mono font-semibold">{formatCurrency(matchedWallet.balance, "OMR")}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">After Deduction</span>
                  <span className={cn("font-mono font-bold", matchedWallet.balance - totalAmount < 0 ? "text-red-600" : "text-emerald-600")}>
                    {formatCurrency(matchedWallet.balance - totalAmount, "OMR")}
                  </span>
                </div>
                {matchedWallet.balance - totalAmount < 0 && (
                  <div className="text-red-600 text-[0.65rem] mt-2 flex items-center gap-1.5">
                    <AlertCircle className="h-3 w-3" />
                    Insufficient wallet balance — choose another method or top up
                  </div>
                )}
              </div>
            )}

            {paymentMethod === "CARD" && (
              <div className="p-3 rounded-md bg-muted/40 text-xs text-muted-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Insert card on PIN pad. Customer approves amount {formatCurrency(totalAmount, "OMR")}.
              </div>
            )}

            {paymentMethod === "UPI" && (
              <div className="p-3 rounded-md bg-muted/40 text-xs text-muted-foreground flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Show QR code to customer. Awaiting payment confirmation…
              </div>
            )}
          </Card>

          {/* ---- STEP 5: CONFIRM & SUBMIT ---- */}
          <Card className="p-5 lg:col-span-2 border-l-4 border-l-navy">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-md bg-navy/10 grid place-items-center">
                <CheckCircle2 className="h-4 w-4 text-navy" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-navy">Step 5 · Confirm &amp; Submit</h2>
                <p className="text-[0.65rem] text-muted-foreground">Review transaction details before capture</p>
              </div>
            </div>

            {/* Summary grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <SummaryItem label="Plate" value={plate || "—"} mono />
              <SummaryItem label="Vehicle Class" value={vehicleClass ? vehicleClasses.find(vc => vc.code === vehicleClass)?.label ?? vehicleClass : "—"} />
              <SummaryItem label="Plaza" value={plazas.find(p => p.id === plazaId)?.code ?? "—"} mono />
              <SummaryItem label="Lane" value={laneId ? `L${lanes.find(l => l.id === laneId)?.number}` : "—"} mono />
              <SummaryItem label="Direction" value={direction} />
              <SummaryItem label="Payment" value={paymentMethod} />
              <SummaryItem label="Total Due" value={formatCurrency(totalAmount, "OMR")} mono accent />
              <SummaryItem
                label="Status"
                value={allValid ? "Ready to capture" : "Incomplete"}
                status={allValid ? "ok" : "warn"}
              />
            </div>

            {/* Action bar */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={handleReset} className="text-xs">
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Clear Form
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!allValid}
                className="h-11 px-8 text-sm font-semibold"
                style={{
                  background: allValid
                    ? "linear-gradient(135deg, #2E8B8B 0%, #1F6868 100%)"
                    : "var(--muted)",
                  color: allValid ? "white" : "var(--muted-foreground)",
                }}
              >
                Capture Transaction
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            {!allValid && (
              <div className="mt-3 text-[0.65rem] text-muted-foreground flex items-center gap-1.5">
                <AlertCircle className="h-3 w-3" />
                Complete all 4 steps above to enable capture
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function SummaryItem({
  label,
  value,
  mono,
  accent,
  status,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
  status?: "ok" | "warn";
}) {
  return (
    <div className="p-2.5 rounded-md border border-border bg-background">
      <div className="text-[0.55rem] text-muted-foreground uppercase tracking-wider mb-0.5">{label}</div>
      <div
        className={cn(
          "text-sm font-semibold",
          mono && "font-mono",
          accent && "text-[var(--color-gold-dark)]",
          status === "ok" && "text-emerald-600",
          status === "warn" && "text-amber-600"
        )}
      >
        {value}
      </div>
    </div>
  );
}

// =====================================================================
// RECEIPT VIEW — shown after successful transaction capture
// =====================================================================
function ReceiptView({
  txn,
  onReset,
  plaza,
  lane,
  operatorName,
}: {
  txn: Transaction;
  onReset: () => void;
  plaza: string;
  lane: number;
  operatorName: string;
}) {
  return (
    <div className="min-h-screen bg-canvas grid place-items-center p-4">
      <div className="max-w-md w-full">
        {/* Success banner */}
        <div className="text-center mb-6">
          <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 grid place-items-center mb-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-navy">Transaction Captured</h1>
          <p className="text-xs text-muted-foreground mt-1">Toll receipt generated successfully</p>
        </div>

        {/* Receipt */}
        <Card className="p-6 border-2 border-dashed border-border">
          <div className="text-center pb-4 border-b border-dashed border-border">
            <div className="text-sm font-bold text-navy tracking-wider">GLOBAL TOLL</div>
            <div className="text-[0.6rem] text-muted-foreground mt-0.5">Oman Toll Operations LLC</div>
            <div className="text-[0.6rem] text-muted-foreground">VAT: OM-1234567</div>
          </div>

          <div className="py-4 space-y-2 text-xs">
            <ReceiptRow label="Receipt No" value={txn.id.toUpperCase()} mono />
            <ReceiptRow label="Date / Time" value={formatDateTime(txn.capturedAt)} />
            <ReceiptRow label="Plaza" value={plaza} />
            <ReceiptRow label="Lane" value={`L${lane}`} mono />
            <ReceiptRow label="Operator" value={operatorName} />
            <ReceiptRow label="Vehicle Plate" value={txn.plateCaptured ?? "—"} mono accent />
            <ReceiptRow label="Vehicle Class" value={txn.vehicleClassCode ?? "—"} />
            <ReceiptRow label="Payment Method" value={txn.paymentMethod} />
          </div>

          <div className="py-4 border-t border-dashed border-border space-y-1.5 text-xs">
            <ReceiptRow label="Base Toll" value={formatCurrency(txn.amount, "OMR")} mono />
            <ReceiptRow label="VAT (5%)" value={formatCurrency(txn.taxAmount, "OMR")} mono />
            <div className="flex items-center justify-between pt-2 mt-2 border-t border-border">
              <span className="font-bold text-navy">TOTAL PAID</span>
              <span className="font-mono font-bold text-lg text-[var(--color-gold-dark)]">
                {formatCurrency(txn.totalAmount, "OMR")}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-dashed border-border text-center text-[0.6rem] text-muted-foreground">
            <div>Thank you for using Global Toll</div>
            <div className="mt-0.5">Keep this receipt for your records · Toll-free: 800-TOLL-OM</div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Print Receipt
          </Button>
          <Button
            className="flex-1"
            onClick={onReset}
            style={{ background: "linear-gradient(135deg, #2E8B8B 0%, #1F6868 100%)" }}
          >
            <RotateCcw className="h-4 w-4 mr-2" /> Next Customer
          </Button>
        </div>
      </div>
    </div>
  );
}

function ReceiptRow({
  label,
  value,
  mono,
  accent,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-medium",
          mono && "font-mono",
          accent && "text-[var(--color-gold-dark)] font-bold"
        )}
      >
        {value}
      </span>
    </div>
  );
}
