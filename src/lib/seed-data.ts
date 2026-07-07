// =====================================================================
// Global Toll — Seed Data
// Realistic multi-tenant dataset for the enterprise demo.
// =====================================================================
import type {
  AppState,
  AuditLog,
  Challan,
  CorporateAccount,
  Device,
  DiscountPlan,
  Highway,
  Invoice,
  Lane,
  Notification,
  RateCard,
  RateRule,
  Settlement,
  Staff,
  SupportTicket,
  Tag,
  Tenant,
  TollPlaza,
  Transaction,
  User,
  Vehicle,
  VehicleClass,
  Violation,
  Wallet,
  VehicleClassCode,
  PaymentMethod,
} from "./types";

// ---- helpers ----------------------------------------------------------
const now = Date.now();
const iso = (offsetMs: number) => new Date(now + offsetMs).toISOString();
const minutes = (n: number) => n * 60_000;
const hours = (n: number) => n * 60 * 60_000;
const days = (n: number) => n * 24 * 60 * 60_000;

const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const safePick = <T,>(arr: T[], fallback: T): T =>
  arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : fallback;

// ---- tenants ----------------------------------------------------------
const tenants: Tenant[] = [
  {
    id: "tnt-1",
    name: "NHAI Expressways",
    legalName: "National Highways Authority — Expressway Operator",
    taxId: "29AAAAA0000A1Z5",
    countryCode: "IN",
    currency: "INR",
    timezone: "Asia/Kolkata",
    status: "ACTIVE",
    subscriptionTier: "ENTERPRISE",
    createdAt: iso(-days(900)),
  },
  {
    id: "tnt-2",
    name: "Western Tollways Pvt Ltd",
    legalName: "Western Tollways Private Limited",
    taxId: "27AAACW1234B1Z2",
    countryCode: "IN",
    currency: "INR",
    timezone: "Asia/Kolkata",
    status: "ACTIVE",
    subscriptionTier: "GROWTH",
    createdAt: iso(-days(420)),
  },
  {
    id: "tnt-3",
    name: "Coastal Bridge Consortium",
    legalName: "Coastal Bridge Consortium Ltd",
    taxId: "33AAACC9876C1Z9",
    countryCode: "IN",
    currency: "INR",
    timezone: "Asia/Kolkata",
    status: "TRIAL",
    subscriptionTier: "STARTER",
    createdAt: iso(-days(60)),
  },
];

// ---- highways & plazas -----------------------------------------------
const highways: Highway[] = [
  { id: "hw-1", tenantId: "tnt-1", code: "NH-48", name: "Delhi–Mumbai Expressway", lengthKm: 1350, region: "North–West" },
  { id: "hw-2", tenantId: "tnt-1", code: "NH-19", name: "Delhi–Kolkata Highway", lengthKm: 1490, region: "North–East" },
  { id: "hw-3", tenantId: "tnt-1", code: "NH-44", name: "North–South Corridor", lengthKm: 3745, region: "Pan-India" },
  { id: "hw-4", tenantId: "tnt-2", code: "WEH-1", name: "Western Express Highway", lengthKm: 165, region: "West" },
  { id: "hw-5", tenantId: "tnt-3", code: "CB-1", name: "Coastal Bridge Link", lengthKm: 28, region: "South" },
];

const plazas: TollPlaza[] = [
  { id: "plz-1", highwayId: "hw-1", tenantId: "tnt-1", code: "TP-0048", name: "Gurgaon–Rewari Plaza", kmMark: 48, latitude: 28.4595, longitude: 76.6266, direction: "BOTH", status: "OPEN" },
  { id: "plz-2", highwayId: "hw-1", tenantId: "tnt-1", code: "TP-0210", name: "Jaipur Bypass Plaza", kmMark: 210, latitude: 26.9124, longitude: 75.7873, direction: "BOTH", status: "OPEN" },
  { id: "plz-3", highwayId: "hw-1", tenantId: "tnt-1", code: "TP-0580", name: "Udaipur Gateway Plaza", kmMark: 580, latitude: 24.5854, longitude: 73.7125, direction: "BOTH", status: "MAINTENANCE" },
  { id: "plz-4", highwayId: "hw-2", tenantId: "tnt-1", code: "TP-0105", name: "Agra Mathura Plaza", kmMark: 105, latitude: 27.1767, longitude: 78.0081, direction: "BOTH", status: "OPEN" },
  { id: "plz-5", highwayId: "hw-3", tenantId: "tnt-1", code: "TP-2240", name: "Nagpur Junction Plaza", kmMark: 2240, latitude: 21.1458, longitude: 79.0882, direction: "BOTH", status: "OPEN" },
  { id: "plz-6", highwayId: "hw-4", tenantId: "tnt-2", code: "TP-0008", name: "Andheri Creek Plaza", kmMark: 8, latitude: 19.1136, longitude: 72.8697, direction: "BOTH", status: "OPEN" },
  { id: "plz-7", highwayId: "hw-4", tenantId: "tnt-2", code: "TP-0042", name: "Goregaon Hill Plaza", kmMark: 42, latitude: 19.1656, longitude: 72.8493, direction: "BOTH", status: "OPEN" },
  { id: "plz-8", highwayId: "hw-5", tenantId: "tnt-3", code: "TP-0012", name: "Marine Bridge Plaza", kmMark: 12, latitude: 9.9312, longitude: 76.2673, direction: "BOTH", status: "OPEN" },
];

// ---- lanes ------------------------------------------------------------
const laneTypes: Lane["type"][] = ["CASH", "ETC_RFID", "ANPR", "HYBRID", "EXPRESS_HOV"];
const lanes: Lane[] = [];
plazas.forEach((plz) => {
  const laneCount = plz.code === "TP-0048" ? 12 : plz.code === "TP-0210" ? 8 : 6;
  for (let i = 1; i <= laneCount; i++) {
    const dir = i % 2 === 0 ? "REVERSE" : "FORWARD";
    const type = i === 1 || i === laneCount ? "EXPRESS_HOV" : laneTypes[i % laneTypes.length];
    let status: Lane["status"] = "OPEN";
    if (plz.status === "MAINTENANCE" && i > 2) status = "MAINTENANCE";
    else if (Math.random() < 0.05) status = "FAULTED";
    else if (Math.random() < 0.03) status = "CLOSED";
    lanes.push({
      id: `lane-${plz.id}-${i}`,
      plazaId: plz.id,
      number: i,
      type: type === "EXPRESS_HOV" ? "EXPRESS_HOV" : type,
      direction: dir,
      status,
      reason: status === "FAULTED" ? "RFID reader timeout" : status === "CLOSED" ? "Scheduled cleaning" : undefined,
      updatedAt: iso(-rand(0, 60) * 60_000),
    });
  }
});

// ---- devices ----------------------------------------------------------
const deviceTypes: Device["type"][] = [
  "BARRIER", "RFID_READER", "ANPR_CAMERA", "WIM_SENSOR", "LOOP_DETECTOR", "DISPLAY_BOARD", "PRINTER",
];
const vendors = ["SICE", "Kapsch", "Tata Elxsi", "L&T Smart World", "Efftronics"];
const devices: Device[] = [];
lanes.forEach((ln) => {
  deviceTypes.forEach((dtype, idx) => {
    if (idx < 4 || Math.random() < 0.6) {
      const laneFaulty = ln.status === "FAULTED" || ln.status === "MAINTENANCE";
      const deviceStatus: Device["status"] =
        ln.status === "MAINTENANCE" ? "OFFLINE" :
        laneFaulty && dtype === "RFID_READER" ? "ERROR" :
        Math.random() < 0.04 ? "DEGRADED" :
        Math.random() < 0.02 ? "OFFLINE" : "ONLINE";
      devices.push({
        id: `dev-${ln.id}-${dtype}`,
        laneId: ln.id,
        type: dtype,
        serialNo: `${dtype.slice(0, 3)}-${ln.id.slice(-6).toUpperCase()}-${idx}`,
        vendor: pick(vendors),
        status: deviceStatus,
        lastHeartbeat: deviceStatus === "OFFLINE" ? iso(-rand(30, 180) * 60_000) : iso(-rand(0, 90) * 1000),
        errorCode: deviceStatus === "ERROR" ? "E_RFID_TIMEOUT_014" : undefined,
        firmware: `v3.2.${rand(0, 9)}`,
      });
    }
  });
});

// ---- vehicle classes --------------------------------------------------
const vehicleClasses: VehicleClass[] = [
  { code: "TWO_WHEELER", label: "Two-Wheeler", axleCount: 2, description: "Motorcycles, scooters" },
  { code: "CAR", label: "Car / Jeep / Van", axleCount: 2, description: "Light motor vehicles" },
  { code: "LCV", label: "Light Commercial Vehicle", axleCount: 2, description: "Mini trucks, tempos" },
  { code: "BUS", label: "Bus", axleCount: 2, description: "Stage carriers, tourist buses" },
  { code: "HCV", label: "Heavy Commercial Vehicle", axleCount: 3, description: "Trucks, tractors" },
  { code: "MULTI_AXLE", label: "Multi-Axle Vehicle", axleCount: 4, description: "4+ axle trucks" },
  { code: "OVERSIZED", label: "Oversized Load", axleCount: 6, description: "Special permit cargo" },
];

// ---- vehicles & tags --------------------------------------------------
const states = ["MH", "DL", "KA", "TN", "GJ", "RJ", "UP", "WB", "AP", "TS"];
const ownerNames = [
  "Rajesh Kumar", "Priya Sharma", "Amit Patel", "Sneha Reddy", "Vikram Singh",
  "Anjali Gupta", "Rohit Verma", "Deepa Nair", "Suresh Iyer", "Kavita Joshi",
  "Logistics Co Pvt Ltd", "Speed Transport", "Metro Cargo", "Green Fleet Ltd",
  "Sunil Traders",
];

const vehicles: Vehicle[] = [];
const tags: Tag[] = [];
const wallets: Wallet[] = [];

for (let i = 0; i < 220; i++) {
  const cls = pick(vehicleClasses);
  const state = pick(states);
  const plateNum = `${state}-${String.fromCharCode(65 + rand(0, 25))}${String.fromCharCode(65 + rand(0, 25))}-${rand(10, 99)}-${rand(1000, 9999)}`;
  const isBlacklisted = Math.random() < 0.04;
  const vid = `veh-${i + 1}`;
  const tid = `tag-${i + 1}`;
  vehicles.push({
    id: vid,
    tenantId: pick(["tnt-1", "tnt-2"]),
    plateNumber: plateNum,
    vehicleClassCode: cls.code,
    ownerName: pick(ownerNames),
    status: isBlacklisted ? "BLACKLISTED" : "ACTIVE",
    blacklistReason: isBlacklisted ? pick(["Stolen vehicle report", "Chronic toll evader", "Wanted-list match"]) : undefined,
    createdAt: iso(-rand(10, 800) * 24 * 60 * 60_000),
  });
  const tagStatus: Tag["status"] = Math.random() < 0.03 ? "INACTIVE" : Math.random() < 0.01 ? "LOST" : "ACTIVE";
  tags.push({
    id: tid,
    vehicleId: vid,
    rfid: `RFID${String(3421000000000 + i * 137).padStart(13, "0")}`,
    status: tagStatus,
    issuedAt: iso(-rand(10, 800) * 24 * 60 * 60_000),
    replacedAt: tagStatus === "LOST" ? iso(-rand(1, 5) * 24 * 60 * 60_000) : undefined,
  });
  const autoRecharge = Math.random() < 0.35;
  const bal = tagStatus === "ACTIVE" ? rand(50, 3500) : 0;
  wallets.push({
    id: `wlt-${i + 1}`,
    tagId: tid,
    balance: bal,
    currency: "INR",
    autoRecharge,
    rechargeThreshold: autoRecharge ? 150 : undefined,
    rechargeAmount: autoRecharge ? pick([500, 1000, 2000]) : undefined,
    updatedAt: iso(-rand(0, 120) * 60_000),
  });
}

// ---- rate cards & rules ----------------------------------------------
const rateCards: RateCard[] = [];
plazas.forEach((plz) => {
  vehicleClasses.forEach((vc) => {
    const base = vc.code === "TWO_WHEELER" ? 35 : vc.code === "CAR" ? 85 : vc.code === "LCV" ? 140 : vc.code === "BUS" ? 190 : vc.code === "HCV" ? 265 : vc.code === "MULTI_AXLE" ? 410 : 620;
    rateCards.push({
      id: `rc-${plz.id}-${vc.code}`,
      tenantId: plz.tenantId,
      plazaId: plz.id,
      vehicleClassCode: vc.code,
      direction: "BOTH",
      singleJourney: base,
      roundJourney: Math.round(base * 1.6),
      monthlyPass: Math.round(base * 22),
      effectiveFrom: iso(-days(120)),
      version: 3,
      status: "ACTIVE",
      createdBy: "Tenant Admin",
      createdAt: iso(-days(120)),
    });
  });
});

const rateRules: RateRule[] = [
  { id: "rr-1", tenantId: "tnt-1", name: "Peak-hour surge (weekday)", condition: { timeOfDay: "PEAK", dayType: "WEEKDAY" }, action: "MULTIPLIER", value: 1.15, priority: 100, enabled: true },
  { id: "rr-2", tenantId: "tnt-1", name: "Holiday off-peak discount", condition: { timeOfDay: "OFF_PEAK", dayType: "HOLIDAY" }, action: "DISCOUNT", value: 0.10, priority: 80, enabled: true },
  { id: "rr-3", tenantId: "tnt-1", name: "High-congestion dynamic surcharge", condition: { congestionLevel: "HIGH" }, action: "SURCHARGE", value: 25, priority: 150, enabled: true },
  { id: "rr-4", tenantId: "tnt-2", name: "Weekend evening discount", condition: { timeOfDay: "OFF_PEAK", dayType: "WEEKEND" }, action: "DISCOUNT", value: 0.05, priority: 60, enabled: false },
];

const discountPlans: DiscountPlan[] = [
  { id: "dp-1", tenantId: "tnt-1", name: "Frequent User — 10 trips/month", type: "FREQUENT_USER", value: 0.10, valueType: "PERCENTAGE", eligibility: "≥10 single-journey trips in last 30 days" },
  { id: "dp-2", tenantId: "tnt-1", name: "Monthly Pass — Cars", type: "MONTHLY_PASS", value: 1870, valueType: "FLAT", eligibility: "Private car owners, ≤3.5T GVW" },
  { id: "dp-3", tenantId: "tnt-1", name: "Local Resident — 50% off", type: "LOCAL_RESIDENT", value: 0.50, valueType: "PERCENTAGE", eligibility: "Resident within 20km radius of plaza (KYC verified)" },
  { id: "dp-4", tenantId: "tnt-2", name: "Fleet Corporate — Bulk discount", type: "FLEET", value: 0.07, valueType: "PERCENTAGE", eligibility: "Corporate account with ≥25 registered vehicles" },
];

// ---- transactions -----------------------------------------------------
const paymentMethods: PaymentMethod[] = ["WALLET", "WALLET", "WALLET", "UPI", "CARD", "CASH", "FLEET_INVOICE"];
const transactions: Transaction[] = [];
const txnCount = 480;
for (let i = 0; i < txnCount; i++) {
  const plz = safePick(plazas.filter(p => p.status === "OPEN"), plazas[0]);
  const plzLanes = lanes.filter(l => l.plazaId === plz.id && l.status === "OPEN");
  const ln = safePick(plzLanes.length > 0 ? plzLanes : lanes.filter(l => l.plazaId === plz.id), lanes[0]);
  const vc = pick(vehicleClasses);
  const tenantVehicles = vehicles.filter(v => v.tenantId === plz.tenantId);
  const v = safePick(tenantVehicles, vehicles[0]);
  const vTags = tags.filter(t => t.vehicleId === v.id && t.status === "ACTIVE");
  const t = safePick(vTags, tags[0]);
  const w = wallets.find(w => w.tagId === t?.id);
  const rc = rateCards.find(rc => rc.plazaId === plz.id && rc.vehicleClassCode === vc.code);
  const base = rc?.singleJourney ?? 85;
  const tax = Math.round(base * 0.05);
  const total = base + tax;
  const method = pick(paymentMethods);
  const status: Transaction["status"] = Math.random() < 0.04 ? "FAILED" : Math.random() < 0.01 ? "PENDING" : "SUCCESS";
  const failReasons = ["Insufficient wallet balance", "Tag read timeout", "Bank gateway timeout", "Invalid RFID checksum"];
  const capturedAt = iso(-rand(0, 72) * 60 * 60_000 - rand(0, 59) * 60_000);
  transactions.push({
    id: `txn-${String(i + 1).padStart(5, "0")}`,
    tenantId: plz.tenantId,
    plazaId: plz.id,
    laneId: ln.id,
    vehicleId: v.id,
    tagId: t.id,
    walletId: w?.id,
    vehicleClassCode: vc.code,
    plateCaptured: v.plateNumber,
    amount: base,
    taxAmount: tax,
    totalAmount: total,
    paymentMethod: method,
    status,
    failureReason: status === "FAILED" ? pick(failReasons) : undefined,
    idempotencyKey: `idk-${plz.code}-${ln.id}-${Date.parse(capturedAt)}`,
    capturedAt,
    settledAt: status === "SUCCESS" && Date.parse(capturedAt) < now - 24 * 60 * 60_000 ? iso(-rand(1, 12) * 60 * 60_000) : undefined,
  });
}
// sort transactions newest first
transactions.sort((a, b) => Date.parse(b.capturedAt) - Date.parse(a.capturedAt));

// ---- settlements ------------------------------------------------------
const settlements: Settlement[] = [
  { id: "stl-001", tenantId: "tnt-1", batchDate: iso(-days(1)), type: "DAILY_BANK", totalAmount: 1842350, expectedAmount: 1842120, variance: 230, status: "MATCHED", transactionCount: 14230, lockedAt: iso(-hours(2)), lockedBy: "Anjali Gupta (FINANCE)" },
  { id: "stl-002", tenantId: "tnt-1", batchDate: iso(-days(1)), type: "CASH_SHIFT", totalAmount: 284750, expectedAmount: 284750, variance: 0, status: "LOCKED", transactionCount: 1854, lockedAt: iso(-hours(14)), lockedBy: "Plaza Manager — Gurgaon" },
  { id: "stl-003", tenantId: "tnt-1", batchDate: iso(-days(2)), type: "INTEROP_CLEARING", totalAmount: 956200, expectedAmount: 952800, variance: 3400, status: "VARIANCE", transactionCount: 4218 },
  { id: "stl-004", tenantId: "tnt-1", batchDate: iso(0), type: "CASH_SHIFT", totalAmount: 142300, expectedAmount: 142300, variance: 0, status: "OPEN", transactionCount: 942 },
  { id: "stl-005", tenantId: "tnt-2", batchDate: iso(-days(1)), type: "DAILY_BANK", totalAmount: 542180, expectedAmount: 542180, variance: 0, status: "MATCHED", transactionCount: 5840, lockedAt: iso(-hours(4)), lockedBy: "Finance Officer — Western" },
  { id: "stl-006", tenantId: "tnt-2", batchDate: iso(0), type: "CASH_SHIFT", totalAmount: 68400, expectedAmount: 67500, variance: 900, status: "VARIANCE", transactionCount: 412 },
];

// ---- violations & challans -------------------------------------------
const violationTypes: Violation["type"][] = ["UNPAID_PASS", "TAG_MISMATCH", "BLACKLISTED", "WRONG_LANE", "OVERSPEED"];
const violations: Violation[] = [];
const challans: Challan[] = [];
for (let i = 0; i < 32; i++) {
  const plz = pick(plazas);
  const plzLanes = lanes.filter(l => l.plazaId === plz.id);
  const ln = safePick(plzLanes, lanes[0]);
  const v = pick(vehicles);
  const tp = pick(violationTypes);
  const detectedAt = iso(-rand(0, 168) * 60 * 60_000);
  const status: Violation["status"] =
    Math.random() < 0.4 ? "CHALLAN_ISSUED" :
    Math.random() < 0.25 ? "PAID" :
    Math.random() < 0.15 ? "DETECTED" :
    Math.random() < 0.1 ? "APPEALED" :
    Math.random() < 0.05 ? "ESCALATED" : "CLOSED";
  const vid = `vio-${String(i + 1).padStart(3, "0")}`;
  violations.push({
    id: vid,
    tenantId: plz.tenantId,
    vehicleId: v.id,
    plazaId: plz.id,
    laneId: ln.id,
    plateCaptured: v.plateNumber,
    type: tp,
    evidenceUrl: `s3://globaltoll-evidence/${plz.code}/${ln.id}/${vid}.jpg`,
    detectedAt,
    status,
  });
  if (status !== "DETECTED") {
    const amount = tp === "UNPAID_PASS" ? 500 : tp === "BLACKLISTED" ? 2000 : tp === "OVERSPEED" ? 1500 : tp === "TAG_MISMATCH" ? 750 : 300;
    const issueDate = new Date(Date.parse(detectedAt) + 60 * 60_000).toISOString();
    const dueDate = new Date(Date.parse(issueDate) + 15 * 24 * 60 * 60_000).toISOString();
    const challanStatus: Challan["status"] =
      status === "PAID" ? "PAID" :
      status === "ESCALATED" ? "ESCALATED" :
      status === "APPEALED" ? "APPEALED" :
      Date.parse(dueDate) < now ? "OVERDUE" : "ISSUED";
    challans.push({
      id: `chl-${String(i + 1).padStart(3, "0")}`,
      violationId: vid,
      challanNo: `CHL-${plz.code}-${String(1000 + i)}`,
      amount,
      issueDate,
      dueDate,
      status: challanStatus,
      paidDate: challanStatus === "PAID" ? new Date(Date.parse(issueDate) + 2 * 24 * 60 * 60_000).toISOString() : undefined,
      appealReason: challanStatus === "APPEALED" ? "Vehicle sold prior to violation date — RC transfer pending" : undefined,
    });
  }
}

// ---- staff ------------------------------------------------------------
const designations: Staff["designation"][] = ["LANE_OPERATOR", "PLAZA_MANAGER", "FINANCE_OFFICER", "ENFORCEMENT", "SUPPORT", "AUDITOR"];
const staff: Staff[] = [];
const staffFirstNames = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Ananya", "Diya", "Saanvi", "Aanya", "Rohan", "Karan", "Meera", "Pooja", "Nikhil", "Tanvi", "Aakash", "Ritu"];
const staffLastNames = ["Sharma", "Verma", "Patel", "Reddy", "Singh", "Gupta", "Iyer", "Joshi", "Nair", "Kapoor", "Mehta", "Rao"];
for (let i = 0; i < 45; i++) {
  const desig = pick(designations);
  staff.push({
    id: `stf-${i + 1}`,
    tenantId: pick(["tnt-1", "tnt-2"]),
    employeeId: `EMP-${String(1001 + i)}`,
    name: `${pick(staffFirstNames)} ${pick(staffLastNames)}`,
    designation: desig,
    plazaId: pick(plazas).id,
    status: Math.random() < 0.1 ? "ON_LEAVE" : "ACTIVE",
    hireDate: iso(-rand(30, 1500) * 24 * 60 * 60_000),
    metrics: desig === "LANE_OPERATOR" ? {
      txnsPerHour: rand(45, 110),
      errorRate: +(Math.random() * 0.04).toFixed(4),
      cashVariance: +(rand(-200, 200) + Math.random()).toFixed(2),
    } : undefined,
  });
}

// ---- audit logs (hash-chained) ---------------------------------------
const auditLogs: AuditLog[] = [];
let prevHash = "0000000000000000000000000000000000000000000000000000000000000000";
const auditActions: AuditLog["action"][] = ["CREATE", "UPDATE", "DELETE", "APPROVE", "LOGIN", "LOGOUT"];
const auditModules = ["plazas", "vehicles", "pricing", "transactions", "settlement", "violations", "staff", "admin"];
const auditActors = ["Anjali Gupta", "Rohit Verma", "Vikram Singh", "Priya Sharma", "Suresh Iyer"];
for (let i = 0; i < 80; i++) {
  const actor = pick(auditActors);
  const action = pick(auditActions);
  const mod = pick(auditModules);
  const createdAt = iso(-rand(0, 240) * 60 * 60_000);
  const payload = `${actor}|${action}|${mod}|${createdAt}`;
  // simple sha-like hash for demo (not cryptographic — illustrative only)
  let hash = 0;
  const combined = prevHash + payload;
  for (let c = 0; c < combined.length; c++) {
    hash = ((hash << 5) - hash + combined.charCodeAt(c)) | 0;
  }
  const hashHex = (hash >>> 0).toString(16).padStart(8, "0").repeat(8);
  auditLogs.push({
    id: `aud-${i + 1}`,
    tenantId: "tnt-1",
    actorName: actor,
    action,
    module: mod,
    entityId: `${mod.slice(0, 3)}-${rand(100, 999)}`,
    entityType: mod,
    beforeValue: action === "UPDATE" ? `{"status":"OPEN"}` : undefined,
    afterValue: action === "UPDATE" ? `{"status":"APPROVED"}` : action === "CREATE" ? `{"id":"new-entity"}` : undefined,
    ipAddress: `10.0.${rand(0, 4)}.${rand(2, 254)}`,
    hashChain: hashHex,
    createdAt,
  });
  prevHash = hashHex;
}
auditLogs.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

// ---- notifications ----------------------------------------------------
const notifications: Notification[] = [];
const templates = [
  { tpl: "TXN_SUCCESS", ch: "SMS" as const, payload: "₹85 deducted at TP-0048. Balance ₹1240." },
  { tpl: "LOW_BALANCE", ch: "PUSH" as const, payload: "Wallet balance below ₹150. Auto-recharge enabled." },
  { tpl: "CHALLAN_ISSUED", ch: "EMAIL" as const, payload: "E-Challan CHL-TP-0048-1023 issued. ₹500 due by 15 Jul." },
  { tpl: "TAG_EXPIRING", ch: "WHATSAPP" as const, payload: "Your RFID tag expires in 30 days. Renew now." },
  { tpl: "TXN_SUCCESS", ch: "SMS" as const, payload: "₹265 deducted at TP-0210. Balance ₹1840." },
  { tpl: "PLAZA_CLOSED", ch: "EMAIL" as const, payload: "TP-0580 closed for maintenance 04:00–06:00 IST." },
];
for (let i = 0; i < 60; i++) {
  const tpl = pick(templates);
  notifications.push({
    id: `ntf-${i + 1}`,
    tenantId: pick(["tnt-1", "tnt-2"]),
    channel: tpl.ch,
    template: tpl.tpl,
    recipient: `+91${rand(70000, 99999)}${rand(10000, 99999)}`,
    payload: tpl.payload,
    status: Math.random() < 0.85 ? "DELIVERED" : Math.random() < 0.7 ? "SENT" : Math.random() < 0.5 ? "QUEUED" : "FAILED",
    sentAt: iso(-rand(0, 72) * 60 * 60_000),
    createdAt: iso(-rand(0, 72) * 60 * 60_000),
  });
}

// ---- support tickets --------------------------------------------------
const supportTickets: SupportTicket[] = [
  { id: "tkt-001", tenantId: "tnt-1", customerName: "Rajesh Kumar", subject: "Wallet deducted twice for single trip", category: "WALLET", priority: "HIGH", status: "IN_PROGRESS", createdAt: iso(-hours(3)) },
  { id: "tkt-002", tenantId: "tnt-1", customerName: "Priya Sharma", subject: "Tag not detected at TP-0210", category: "TAG", priority: "MEDIUM", status: "OPEN", createdAt: iso(-hours(8)) },
  { id: "tkt-003", tenantId: "tnt-2", customerName: "Amit Patel", subject: "Wrong vehicle class charged", category: "TRIP", priority: "MEDIUM", status: "RESOLVED", createdAt: iso(-days(2)), resolvedAt: iso(-hours(20)) },
  { id: "tkt-004", tenantId: "tnt-1", customerName: "Sneha Reddy", subject: "Challan issued in error — vehicle was sold", category: "CHALLAN", priority: "URGENT", status: "OPEN", createdAt: iso(-hours(1)) },
  { id: "tkt-005", tenantId: "tnt-1", customerName: "Vikram Singh", subject: "Monthly pass not applying", category: "TRIP", priority: "HIGH", status: "OPEN", createdAt: iso(-hours(5)) },
  { id: "tkt-006", tenantId: "tnt-2", customerName: "Logistics Co Pvt Ltd", subject: "Fleet invoice GST mismatch", category: "OTHER", priority: "HIGH", status: "IN_PROGRESS", createdAt: iso(-days(1)) },
];

// ---- corporate accounts & invoices -----------------------------------
const corporateAccounts: CorporateAccount[] = [
  { id: "crp-1", tenantId: "tnt-1", name: "Logistics Co Pvt Ltd", gstin: "29AABCL1234M1Z5", creditLimit: 500000, billingCycle: "MONTHLY", contactEmail: "ap@logisticsco.in", vehicleCount: 84, createdAt: iso(-days(540)) },
  { id: "crp-2", tenantId: "tnt-1", name: "Speed Transport", gstin: "29AAACS5678N1Z2", creditLimit: 250000, billingCycle: "MONTHLY", contactEmail: "fin@speedtransport.in", vehicleCount: 42, createdAt: iso(-days(420)) },
  { id: "crp-3", tenantId: "tnt-1", name: "Metro Cargo", gstin: "29AACCM9012P1Z8", creditLimit: 800000, billingCycle: "WEEKLY", contactEmail: "accounts@metrocargo.in", vehicleCount: 156, createdAt: iso(-days(310)) },
  { id: "crp-4", tenantId: "tnt-2", name: "Green Fleet Ltd", gstin: "27AAACG3456Q1Z1", creditLimit: 350000, billingCycle: "MONTHLY", contactEmail: "ops@greenfleet.in", vehicleCount: 68, createdAt: iso(-days(180)) },
];

const invoices: Invoice[] = [
  { id: "inv-1", corporateAccountId: "crp-1", invoiceNo: "GT-INV-2026-0512", period: "Jun 2026", amount: 342500, taxAmount: 61650, totalAmount: 404150, status: "PAID", issueDate: iso(-days(15)), dueDate: iso(-days(0)) },
  { id: "inv-2", corporateAccountId: "crp-1", invoiceNo: "GT-INV-2026-0567", period: "Jul 2026", amount: 318400, taxAmount: 57312, totalAmount: 375712, status: "ISSUED", issueDate: iso(-days(3)), dueDate: iso(+days(12)) },
  { id: "inv-3", corporateAccountId: "crp-2", invoiceNo: "GT-INV-2026-0534", period: "Jun 2026", amount: 184200, taxAmount: 33156, totalAmount: 217356, status: "OVERDUE", issueDate: iso(-days(35)), dueDate: iso(-days(5)) },
  { id: "inv-4", corporateAccountId: "crp-3", invoiceNo: "GT-INV-2026-W26", period: "W26 2026", amount: 284900, taxAmount: 51282, totalAmount: 336182, status: "PAID", issueDate: iso(-days(7)), dueDate: iso(-days(0)) },
  { id: "inv-5", corporateAccountId: "crp-4", invoiceNo: "GT-INV-2026-0612", period: "Jun 2026", amount: 142800, taxAmount: 25704, totalAmount: 168504, status: "ISSUED", issueDate: iso(-days(2)), dueDate: iso(+days(13)) },
];

// ---- users (one per role + extra tenant admins) ----------------------
const users: User[] = [
  { id: "usr-1", tenantId: "tnt-1", email: "superadmin@globaltoll.io", name: "Platform Owner", role: "SUPER_ADMIN", mfaEnabled: true, lastLoginAt: iso(-hours(2)), status: "ACTIVE" },
  { id: "usr-2", tenantId: "tnt-1", email: "admin@nhai-expressways.in", name: "Anjali Gupta", role: "TENANT_ADMIN", mfaEnabled: true, lastLoginAt: iso(-hours(4)), status: "ACTIVE" },
  { id: "usr-3", tenantId: "tnt-1", email: "plaza.gurgaon@nhai-expressways.in", name: "Rohit Verma", role: "PLAZA_MANAGER", mfaEnabled: true, lastLoginAt: iso(-hours(1)), status: "ACTIVE" },
  { id: "usr-4", tenantId: "tnt-1", email: "lane.gurgaon@nhai-expressways.in", name: "Karan Mehta", role: "LANE_OPERATOR", mfaEnabled: false, lastLoginAt: iso(-minutes(15)), status: "ACTIVE" },
  { id: "usr-5", tenantId: "tnt-1", email: "finance@nhai-expressways.in", name: "Suresh Iyer", role: "FINANCE", mfaEnabled: true, lastLoginAt: iso(-hours(3)), status: "ACTIVE" },
  { id: "usr-6", tenantId: "tnt-1", email: "enforce@nhai-expressways.in", name: "Vikram Singh", role: "ENFORCEMENT", mfaEnabled: true, lastLoginAt: iso(-hours(7)), status: "ACTIVE" },
  { id: "usr-7", tenantId: "tnt-1", email: "support@nhai-expressways.in", name: "Meera Kapoor", role: "SUPPORT", mfaEnabled: false, lastLoginAt: iso(-minutes(45)), status: "ACTIVE" },
  { id: "usr-8", tenantId: "tnt-1", email: "audit@nhai-expressways.in", name: "Nikhil Rao", role: "AUDITOR", mfaEnabled: true, lastLoginAt: iso(-days(1)), status: "ACTIVE" },
  { id: "usr-9", tenantId: "tnt-1", email: "rajesh.kumar@gmail.com", name: "Rajesh Kumar", role: "CUSTOMER", mfaEnabled: false, lastLoginAt: iso(-hours(20)), status: "ACTIVE" },
  { id: "usr-10", tenantId: "tnt-2", email: "admin@westerntollways.in", name: "Pooja Nair", role: "TENANT_ADMIN", mfaEnabled: true, lastLoginAt: iso(-hours(6)), status: "ACTIVE" },
];

// ---- export initial state --------------------------------------------
export const initialState: AppState = {
  currentUser: null,
  currentTenantId: "tnt-1",
  activeModule: "dashboard",
  tenants,
  users,
  highways,
  plazas,
  lanes,
  devices,
  vehicleClasses,
  vehicles,
  tags,
  wallets,
  rateCards,
  rateRules,
  discountPlans,
  transactions,
  settlements,
  violations,
  challans,
  staff,
  auditLogs,
  notifications,
  supportTickets,
  corporateAccounts,
  invoices,
};
