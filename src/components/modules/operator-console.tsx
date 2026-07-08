"use client";
import { useState, useMemo, useEffect } from "react";
import { useStore } from "@/store/app-store";
import { useI18n } from "@/lib/i18n";
import { OmanPlateInput } from "@/components/common/oman-plate-input";
import { GlobalTollLogo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { Vehicle, VehicleClassCode, Transaction, Shift } from "@/lib/types";
import {
  Car, Truck, Bus, Bike, CheckCircle2, ArrowRight,
  RotateCcw, Printer, User, Globe, LogOut, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
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

const VEHICLE_CLASS_COLORS: Record<VehicleClassCode, string> = {
  CAR: "#2E8B8B",
  LCV: "#5C7A8A",
  HCV: "#2C3E50",
  BUS: "#7AB3A3",
  MULTI_AXLE: "#E0A030",
  OVERSIZED: "#9CA3AF",
  TWO_WHEELER: "#B07D1E",
};

function generateTrn(): string {
  const fixed = "1005313539";
  const random5 = String(Math.floor(10000 + Math.random() * 90000));
  return `TRN:${fixed}${random5}`;
}

export function OperatorConsole() {
  const plazas = useStore((s) => s.plazas);
  const lanes = useStore((s) => s.lanes);
  const vehicleClasses = useStore((s) => s.vehicleClasses);
  const rateCards = useStore((s) => s.rateCards);
  const vehicles = useStore((s) => s.vehicles);
  const wallets = useStore((s) => s.wallets);
  const tags = useStore((s) => s.tags);
  const transactions = useStore((s) => s.transactions);
  const shifts = useStore((s) => s.shifts);
  const selectedPlazaId = useStore((s) => s.selectedPlazaId);
  const openingFloat = useStore((s) => s.openingFloat);
  const addTransaction = useStore((s) => s.addTransaction);
  const addShift = useStore((s) => s.addShift);
  const endShift = useStore((s) => s.endShift);
  const currentUser = useStore((s) => s.currentUser)!;
  const pushAudit = useStore((s) => s.pushAudit);
  const logout = useStore((s) => s.logout);
  const { lang, setLang, t } = useI18n();

  const [vehicleClass, setVehicleClass] = useState<VehicleClassCode | "">("");
  const [plate, setPlate] = useState("");
  const [submittedTxn, setSubmittedTxn] = useState<Transaction | null>(null);
  const [currentShift, setCurrentShift] = useState<string | null>(null);

  const selectedPlaza = plazas.find(p => p.id === selectedPlazaId);

  // Auto-create shift on mount
  useEffect(() => {
    if (!currentShift && selectedPlaza) {
      const plazaLanes = lanes.filter(l => l.plazaId === selectedPlaza.id);
      const shiftId = `shift-${Date.now()}`;
      const newShift: Shift = {
        id: shiftId,
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        plazaId: selectedPlaza.id,
        plazaName: selectedPlaza.name,
        laneIds: plazaLanes.map(l => l.id),
        status: "OPEN",
        startedAt: new Date().toISOString(),
      };
      addShift(newShift);
      setCurrentShift(shiftId);
    }
  }, [selectedPlaza, lanes, currentUser, currentShift, addShift]);

  const displayClasses = vehicleClasses.filter(vc => vc.code !== "OVERSIZED");

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

  useEffect(() => {
    if (matchedVehicle && !vehicleClass) {
      setVehicleClass(matchedVehicle.vehicleClassCode);
    }
  }, [matchedVehicle]);

  const rateCard = useMemo(() => {
    if (!vehicleClass || !selectedPlaza) return null;
    return rateCards.find(
      (rc) => rc.vehicleClassCode === vehicleClass && rc.plazaId === selectedPlaza.id && rc.status === "ACTIVE"
    ) || rateCards.find(
      (rc) => rc.vehicleClassCode === vehicleClass && rc.status === "ACTIVE"
    );
  }, [vehicleClass, rateCards, selectedPlaza]);

  const baseAmount = rateCard?.singleJourney ?? 0;
  const taxAmount = +(baseAmount * 0.05).toFixed(3);
  const totalAmount = +(baseAmount + taxAmount).toFixed(3);

  const canSubmit = plate.match(/^\d{6}-[A-Z]+$/) && vehicleClass !== "" && rateCard !== null;

  const handleSubmit = () => {
    if (!canSubmit) {
      toast.error(lang === "ar" ? "يرجى إكمال جميع الحقول" : "Please complete all fields");
      return;
    }

    const plazaLane = lanes.find(l => l.plazaId === selectedPlaza?.id);

    const txnId = `txn-${String(transactions.length + 1).padStart(5, "0")}`;
    const txn: Transaction = {
      id: txnId,
      tenantId: "tnt-1",
      plazaId: selectedPlaza?.id,
      laneId: plazaLane?.id,
      vehicleId: matchedVehicle?.id,
      tagId: matchedTag?.id,
      walletId: matchedWallet?.id,
      vehicleClassCode: vehicleClass as VehicleClassCode,
      plateCaptured: plate,
      amount: baseAmount,
      taxAmount,
      totalAmount,
      paymentMethod: "CASH",
      status: "SUCCESS",
      idempotencyKey: `idk-${selectedPlaza?.code}-${plazaLane?.id}-${Date.now()}`,
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
      afterValue: JSON.stringify({ plate, amount: totalAmount }),
      ipAddress: "10.0.1.42",
    });
    setSubmittedTxn(txn);
    toast.success(lang === "ar" ? "تم التقاط المعاملة" : "Transaction captured", {
      description: `${plate} · ${formatCurrency(totalAmount, "OMR")}`,
    });
  };

  const handleLogout = () => {
    if (currentShift) {
      endShift(currentShift);
    }
    logout();
  };

  const handleReset = () => {
    setVehicleClass("");
    setPlate("");
    setSubmittedTxn(null);
  };

  if (submittedTxn) {
    return (
      <ReceiptView
        txn={submittedTxn}
        onReset={handleReset}
        plaza={selectedPlaza?.name ?? ""}
        lane={lanes.find(l => l.id === submittedTxn.laneId)?.number ?? 0}
        operatorName={currentUser.name}
        lang={lang}
        t={t}
      />
    );
  }

  const showGlassOverlay = plate.match(/^\d{1,6}-[A-Z]+$/) && vehicleClass && rateCard;

  return (
    <div className="min-h-screen bg-canvas relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal/5 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[var(--color-gold)]/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal/3 rounded-full blur-3xl animate-float" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-navy">{t("op.title")}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{currentUser.name} · {selectedPlaza?.name ?? "No Plaza"}</p>
            <p className="text-xs text-muted-foreground">Opening Float: OMR {openingFloat.toFixed(3)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-card border border-border text-xs font-medium hover:bg-muted transition-all hover:scale-105 active:scale-95"
            >
              <Globe className="h-3.5 w-3.5" />
              {lang === "en" ? "AR" : "EN"}
            </button>
            <Button variant="destructive" size="sm" onClick={handleLogout} className="h-9 gap-1.5 hover:scale-105 active:scale-95 transition-all">
              <LogOut className="h-3.5 w-3.5" />
              {lang === "ar" ? "خروج" : "Quit Shift"}
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          {/* STEP 1: VEHICLE CLASS CARDS */}
          <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-9 w-9 rounded-xl bg-teal/10 grid place-items-center">
                <Car className="h-5 w-5 text-teal" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-navy">{t("op.vehicleClass")}</h2>
                <p className="text-xs text-muted-foreground">{t("op.step1Desc")}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {displayClasses.map((vc) => {
                const Icon = VEHICLE_CLASS_ICONS[vc.code];
                const isSelected = vehicleClass === vc.code;
                const color = VEHICLE_CLASS_COLORS[vc.code];
                return (
                  <button
                    key={vc.code}
                    onClick={() => setVehicleClass(vc.code)}
                    className={cn(
                      "p-5 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all duration-300",
                      "hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]",
                      isSelected
                        ? "border-teal bg-teal/10 shadow-lg shadow-teal/10"
                        : "border-border bg-card hover:border-teal/40 hover:bg-teal/5"
                    )}
                  >
                    <div
                      className="h-14 w-14 rounded-2xl grid place-items-center transition-all duration-300"
                      style={{
                        backgroundColor: isSelected ? `${color}25` : `${color}10`,
                        transform: isSelected ? "scale(1.1)" : "scale(1)",
                      }}
                    >
                      <Icon className="h-7 w-7" style={{ color }} />
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-foreground">
                        {vc.label.split("/")[0].trim()}
                      </div>
                      <div className="text-[0.65rem] text-muted-foreground mt-0.5">
                        {vc.axleCount} {lang === "ar" ? "محور" : "axle"}
                      </div>
                    </div>
                    {isSelected && <div className="h-1.5 w-8 rounded-full bg-teal mt-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: PLATE + GLASSMORPHISM */}
          <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Card className="p-6 border-2 border-border/50 hover:border-teal/30 transition-all duration-300">
              <div className="flex items-center gap-2 mb-5">
                <div className="h-9 w-9 rounded-xl bg-[var(--color-gold)]/10 grid place-items-center">
                  <Zap className="h-5 w-5" style={{ color: "var(--color-gold-dark)" }} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-navy">{t("op.plateNumber")}</h2>
                  <p className="text-xs text-muted-foreground">{lang === "ar" ? "أدخل رقم لوحة المركبة" : "Enter the vehicle plate number"}</p>
                </div>
              </div>

              <Label className="text-xs font-medium mb-2 block">{t("op.plateNumber")}</Label>
              <OmanPlateInput value={plate} onChange={setPlate} autoFocus />

              {/* Glassmorphism Overlay */}
              {showGlassOverlay && (
                <div className="mt-5 animate-fade-in-up">
                  <div
                    className="rounded-2xl border border-white/30 shadow-2xl overflow-hidden"
                    style={{
                      background: "linear-gradient(135deg, rgba(46, 139, 139, 0.25) 0%, rgba(31, 104, 104, 0.35) 100%)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                    }}
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-12 w-12 rounded-2xl grid place-items-center"
                            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                          >
                            {(() => {
                              const Icon = VEHICLE_CLASS_ICONS[vehicleClass as VehicleClassCode];
                              return <Icon className="h-6 w-6 text-white" />;
                            })()}
                          </div>
                          <div>
                            <div className="text-base font-semibold text-white">
                              {vehicleClasses.find(vc => vc.code === vehicleClass)?.label}
                            </div>
                            <div className="text-xs text-white/80">{t("op.vehicleClass")}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-white font-mono">
                            {formatCurrency(baseAmount, "OMR")}
                          </div>
                          <div className="text-xs text-white/80">{t("op.baseToll")}</div>
                        </div>
                      </div>

                      <div className="space-y-2 border-t border-white/20 pt-3">
                        <div className="flex items-center justify-between text-sm text-white/90">
                          <span>{t("op.vat")} (5%)</span>
                          <span className="font-mono">{formatCurrency(taxAmount, "OMR")}</span>
                        </div>
                        <div className="flex items-center justify-between font-bold text-white pt-2 border-t border-white/20">
                          <span className="text-base">{t("op.totalDue")}</span>
                          <span className="font-mono text-2xl">{formatCurrency(totalAmount, "OMR")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {matchedVehicle && (
                <div className="mt-4 p-4 rounded-xl bg-teal/5 border border-teal/20 animate-fade-in">
                  <div className="flex items-center gap-2 text-sm text-teal font-medium mb-2">
                    <User className="h-4 w-4" />
                    {t("op.registeredVehicle")}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-[0.65rem] text-muted-foreground uppercase">{t("op.owner")}</div>
                      <div className="font-medium">{matchedVehicle.ownerName}</div>
                    </div>
                    <div>
                      <div className="text-[0.65rem] text-muted-foreground uppercase">{t("op.walletBalance")}</div>
                      <div className={cn("font-mono font-bold", matchedWallet && matchedWallet.balance < 5 ? "text-amber-600" : "text-emerald-600")}>
                        {matchedWallet ? formatCurrency(matchedWallet.balance, "OMR") : "—"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="flex items-center justify-between mt-6 pt-5 border-t border-border">
                <Button variant="outline" onClick={handleReset} className="gap-2 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                  <RotateCcw className="h-4 w-4" /> {t("op.clearForm")}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="h-12 px-10 text-sm font-semibold rounded-xl gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  style={{
                    background: canSubmit
                      ? "linear-gradient(135deg, #2E8B8B 0%, #1F6868 100%)"
                      : "var(--muted)",
                    color: canSubmit ? "white" : "var(--muted-foreground)",
                  }}
                >
                  {t("op.captureTxn")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-slow { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.05); } }
        @keyframes float { 0%, 100% { transform: translate(-50%, -50%) scale(1); } 50% { transform: translate(-50%, -50%) scale(1.1); } }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; opacity: 0; }
        .animate-fade-in-up { animation: fade-in-up 0.4s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.6s ease-out forwards; opacity: 0; }
        .animate-pulse-slow { animation: pulse-slow 6s ease-in-out infinite; }
        .animate-float { animation: float 8s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

// =====================================================================
// RECEIPT VIEW — Oman Tahseel-style tax invoice
// =====================================================================
function ReceiptView({
  txn, onReset, plaza, lane, operatorName, lang, t,
}: {
  txn: Transaction;
  onReset: () => void;
  plaza: string;
  lane: number;
  operatorName: string;
  lang: "en" | "ar";
  t: (key: string) => string;
}) {
  const trn = useMemo(() => generateTrn(), []);
  const txnDate = new Date(txn.capturedAt);
  const dateStr = txnDate.toLocaleDateString("en-CA"); // 2026-07-01
  const timeStr = txnDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }); // 09:12
  const vehicleLabel = txn.vehicleClassCode?.replace("_", " ") ?? "—";

  return (
    <div className="min-h-screen bg-canvas grid place-items-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-100 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-teal/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "2s" }} />
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Success banner */}
        <div className="text-center mb-6 animate-fade-in">
          <div className="h-20 w-20 mx-auto rounded-full bg-emerald-100 grid place-items-center mb-4 animate-bounce-in">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-navy">{t("receipt.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("receipt.subtitle")}</p>
        </div>

        {/* Receipt — Tahseel style */}
        <Card className="p-0 border border-border relative overflow-hidden animate-slide-up bg-white" style={{ animationDelay: "0.2s" }}>
          {/* Animated Stamps */}
          <div className="absolute top-6 right-6 z-10">
            <div className="stamp-approved">
              <svg width="85" height="85" viewBox="0 0 85 85">
                <circle cx="42.5" cy="42.5" r="38" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeDasharray="4 2" />
                <circle cx="42.5" cy="42.5" r="32" fill="none" stroke="#16a34a" strokeWidth="1.5" />
                <text x="42.5" y="38" textAnchor="middle" fill="#16a34a" fontSize="8" fontWeight="bold" fontFamily="Arial">
                  {t("receipt.approved")}
                </text>
                <text x="42.5" y="50" textAnchor="middle" fill="#16a34a" fontSize="10" fontWeight="900" fontFamily="Arial">
                  {t("receipt.paid")}
                </text>
              </svg>
            </div>
          </div>

          {/* Header — Logo + Company */}
          <div className="text-center py-5 px-4 border-b border-gray-200">
            <div className="flex justify-center mb-2">
              <GlobalTollLogo size={44} variant="dark" />
            </div>
            <div className="text-[11px] text-gray-700 leading-relaxed">
              <div className="font-semibold">هيئة الطرق السريعة والمركبات</div>
              <div>Royal Oman Police — Transport &amp; Licensing</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Muscat, Sultanate of Oman</div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center py-3 border-b border-gray-200">
            <div className="text-[11px] text-gray-500">(Payment Receipt)</div>
            <div className="text-sm font-bold text-gray-800">فاتورة ضريبة / Tax Invoice</div>
          </div>

          {/* TRN + Date */}
          <div className="px-5 py-4 border-b border-gray-200 space-y-2 text-[11px]">
            <div className="flex justify-between">
              <span className="text-gray-500">TRN:</span>
              <span className="font-mono font-bold text-gray-800">{trn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">التاريخ / Date:</span>
              <span className="font-mono text-gray-800">{dateStr}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">الوقت / Time:</span>
              <span className="font-mono text-gray-800">{timeStr} {lang === "ar" ? "ص" : ""}</span>
            </div>
          </div>

          {/* Vehicle + Toll Details */}
          <div className="px-5 py-4 border-b border-gray-200 text-[11px]">
            <div className="flex justify-between mb-2">
              <span className="text-gray-500">رقم اللوحة / Vehicle Plate:</span>
              <span className="font-mono font-bold text-gray-800">{txn.plateCaptured ?? "—"}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-500">نوع المركبة / Vehicle Class:</span>
              <span className="font-mono text-gray-800">{vehicleLabel}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-500">المحطة / Plaza:</span>
              <span className="text-gray-800">{plaza}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-500">الحارة / Lane:</span>
              <span className="font-mono text-gray-800">L{lane}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">المشغل / Operator:</span>
              <span className="text-gray-800">{operatorName}</span>
            </div>
          </div>

          {/* Amount Breakdown */}
          <div className="px-5 py-4 border-b border-gray-200 text-[11px]">
            <div className="flex justify-between mb-2">
              <span className="text-gray-500">مبلغ الرسوم / Base Toll:</span>
              <span className="font-mono text-gray-800">OMR {formatCurrency(txn.amount, "OMR")}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-500">ضريبة القيمة المضافة / VAT (5%):</span>
              <span className="font-mono text-gray-800">OMR {formatCurrency(txn.taxAmount, "OMR")}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-500">الرسوم الإدارية / Admin Fee:</span>
              <span className="font-mono text-gray-800">OMR 0.500</span>
            </div>
            <div className="border-t border-gray-300 mt-2 pt-2 flex justify-between">
              <span className="font-bold text-gray-800">المبلغ الإجمالي / Total Amount:</span>
              <span className="font-mono font-bold text-sm text-gray-900">OMR {formatCurrency(txn.totalAmount + 0.5, "OMR")}</span>
            </div>
          </div>

          {/* Amount in words */}
          <div className="px-5 py-3 border-b border-gray-200 text-[10px] text-gray-500">
            <span className="font-semibold">المبلغ بالحروف / Amount in Words:</span>
            <span className="text-gray-700"> {amountInWords(txn.totalAmount + 0.5)}</span>
          </div>

          {/* QR Code — links to receipt page */}
          <div className="px-5 py-4 flex justify-center">
            <div className="p-2 bg-white border border-gray-300 rounded-lg">
              {(() => {
                const receiptUrl = typeof window !== "undefined"
                  ? `${window.location.origin}/receipt?trn=${encodeURIComponent(trn)}&date=${encodeURIComponent(dateStr)}&time=${encodeURIComponent(timeStr)}&plate=${encodeURIComponent(txn.plateCaptured ?? "—")}&vehicle=${encodeURIComponent(vehicleLabel)}&plaza=${encodeURIComponent(plaza)}&lane=${encodeURIComponent("L" + lane)}&operator=${encodeURIComponent(operatorName)}&base=${encodeURIComponent(formatCurrency(txn.amount, "OMR"))}&vat=${encodeURIComponent(formatCurrency(txn.taxAmount, "OMR"))}&fee=0.500&total=${encodeURIComponent(formatCurrency(txn.totalAmount + 0.5, "OMR"))}&status=PAID`
                  : "";
                return (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(receiptUrl)}&bgcolor=ffffff&color=000000`}
                    alt="QR Code - Scan to view receipt"
                    className="w-[120px] h-[120px]"
                    width={120}
                    height={120}
                  />
                );
              })()}
            </div>
          </div>
          <div className="text-center text-[9px] text-gray-400 pb-2">امسح الرمز لعرض الإيصال — Scan to view receipt</div>

          {/* Footer */}
          <div className="px-5 py-3 text-center text-[9px] text-gray-400 border-t border-gray-200">
            <div>نظام توصيل للطرق السريعة — Global Toll Management System</div>
            <div className="mt-0.5">هذا الإيصال صادر عن نظام الهيئة الرسمي — This is an official receipt</div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 mt-6 animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <Button variant="outline" className="flex-1 h-12 rounded-xl gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> {t("receipt.print")}
          </Button>
          <Button
            className="flex-1 h-12 rounded-xl gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
            onClick={onReset}
            style={{ background: "linear-gradient(135deg, #2E8B8B 0%, #1F6868 100%)" }}
          >
            <RotateCcw className="h-4 w-4" /> {t("receipt.nextCustomer")}
          </Button>
        </div>
      </div>

      <style jsx>{`
        @keyframes stampDrop { 0% { transform: scale(2.5) rotate(-20deg); opacity: 0; } 60% { transform: scale(0.85) rotate(5deg); opacity: 1; } 100% { transform: scale(1) rotate(-5deg); opacity: 0.85; } }
        @keyframes bounce-in { 0% { transform: scale(0); } 50% { transform: scale(1.15); } 70% { transform: scale(0.95); } 100% { transform: scale(1); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-slow { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.05); } }
        .stamp-approved { animation: stampDrop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; transform-origin: center; }
        .animate-bounce-in { animation: bounce-in 0.6s ease-out forwards; }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; opacity: 0; }
        .animate-slide-up { animation: slide-up 0.6s ease-out forwards; opacity: 0; }
        .animate-pulse-slow { animation: pulse-slow 6s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

function amountInWords(amount: number): string {
  const whole = Math.floor(amount);
  const frac = Math.round((amount - whole) * 1000);
  if (whole === 0 && frac === 0) return "Zero OMR";
  return `${whole} OMR and ${frac} Baiza`;
}
