// =====================================================================
// Global Toll — Production Seed Data
// Real client deployment: 1 tenant, 2 users (Admin + Operator),
// minimal plazas/lanes/rate cards, empty transaction ledger.
// =====================================================================
import type {
  AppState,
  AuditLog,
  Device,
  Highway,
  Lane,
  RateCard,
  TollPlaza,
  Transaction,
  User,
  Vehicle,
  VehicleClass,
  Notification,
  Settlement,
  Violation,
  Challan,
  Tag,
  Wallet,
  Staff,
  SupportTicket,
  CorporateAccount,
  Invoice,
  DiscountPlan,
  RateRule,
  Tenant,
  VehicleClassCode,
  Shift,
} from "./types";

const now = Date.now();
const iso = (offsetMs: number) => new Date(now + offsetMs).toISOString();
const days = (n: number) => n * 24 * 60 * 60_000;

// ---- tenant ----------------------------------------------------------
const tenants: Tenant[] = [
  {
    id: "tnt-1",
    name: "Oman Toll Operations",
    legalName: "Oman Toll Operations LLC",
    taxId: "OM-1234567",
    countryCode: "OM",
    currency: "OMR",
    timezone: "Asia/Muscat",
    status: "ACTIVE",
    subscriptionTier: "ENTERPRISE",
    createdAt: iso(-days(120)),
  },
];

// ---- highways & plazas (minimal — Oman context) --------------------
const highways: Highway[] = [
  { id: "hw-1", tenantId: "tnt-1", code: "SQ-MQ", name: "Sohar — Muscat Expressway", lengthKm: 209, region: "Al Batinah / Muscat" },
  { id: "hw-2", tenantId: "tnt-1", code: "MQ-NZ", name: "Muscat — Nizwa Road", lengthKm: 165, region: "Muscat / Al Dakhiliyah" },
];

const plazas: TollPlaza[] = [
  { id: "plz-1", highwayId: "hw-1", tenantId: "tnt-1", code: "TP-001", name: "Sohar Gate Plaza", kmMark: 12, latitude: 24.3476, longitude: 56.7086, direction: "BOTH", status: "OPEN" },
  { id: "plz-2", highwayId: "hw-1", tenantId: "tnt-1", code: "TP-002", name: "Barka Checkpoint Plaza", kmMark: 78, latitude: 23.6848, longitude: 57.8909, direction: "BOTH", status: "OPEN" },
  { id: "plz-3", highwayId: "hw-2", tenantId: "tnt-1", code: "TP-003", name: "Bidbid Junction Plaza", kmMark: 45, latitude: 23.3933, longitude: 58.1053, direction: "BOTH", status: "OPEN" },
];

// ---- lanes (3 plazas × 4 lanes = 12 lanes) -------------------------
const laneTypes: Lane["type"][] = ["CASH", "ETC_RFID", "HYBRID", "EXPRESS_HOV"];
const lanes: Lane[] = [];
plazas.forEach((plz) => {
  for (let i = 1; i <= 4; i++) {
    const dir = i % 2 === 0 ? "REVERSE" : "FORWARD";
    const type = i === 1 ? "ETC_RFID" : i === 2 ? "HYBRID" : i === 3 ? "CASH" : "EXPRESS_HOV";
    lanes.push({
      id: `lane-${plz.id}-${i}`,
      plazaId: plz.id,
      number: i,
      type,
      direction: dir,
      status: "OPEN",
      updatedAt: iso(-60_000),
    });
  }
});

// ---- devices (one RFID reader + one ANPR camera per lane) ----------
const devices: Device[] = [];
lanes.forEach((ln) => {
  (["RFID_READER", "ANPR_CAMERA", "BARRIER"] as const).forEach((dtype, idx) => {
    devices.push({
      id: `dev-${ln.id}-${dtype}`,
      laneId: ln.id,
      type: dtype,
      serialNo: `${dtype.slice(0, 3)}-${ln.id.slice(-6).toUpperCase()}-${idx}`,
      vendor: "Kapsch",
      status: "ONLINE",
      lastHeartbeat: iso(-30_000),
      firmware: `v3.2.${idx}`,
    });
  });
});

// ---- vehicle classes (Oman-standard) -------------------------------
const vehicleClasses: VehicleClass[] = [
  { code: "TWO_WHEELER", label: "Motorcycle / Scooter", axleCount: 2, description: "Private 2-wheeler" },
  { code: "CAR", label: "Private Car / SUV", axleCount: 2, description: "Light motor vehicle ≤ 3.5T" },
  { code: "LCV", label: "Light Commercial Vehicle", axleCount: 2, description: "Pickup / small truck" },
  { code: "BUS", label: "Bus (Stage / Tourist)", axleCount: 2, description: "Public transport carrier" },
  { code: "HCV", label: "Heavy Commercial Vehicle", axleCount: 3, description: "Heavy truck / tractor" },
  { code: "MULTI_AXLE", label: "Multi-Axle Truck", axleCount: 4, description: "4+ axle goods carrier" },
  { code: "OVERSIZED", label: "Oversized Load", axleCount: 6, description: "Special-permit cargo" },
];

// ---- sample vehicles (for operator wallet lookup demo) -------------
// Oman plate format: 1-6 digits, dash, then region letter(s)
// Region codes: A=Muscat, B=Dhofar, C=Musandam, D=Buraimi, E=Dakhiliyah,
//               F=Batinah North, G=Batinah South, H=Sharqiyah North,
//               I=Sharqiyah South, J=Dhahirah, K=Wusta
const samplePlates: Array<[string, VehicleClassCode, string]> = [
  ["12345-A", "CAR", "Mohammed Al Balushi"],
  ["67890-A", "CAR", "Fatima Al Hinai"],
  ["4421-B", "LCV", "Said Al Rahbi"],
  ["987654-C", "HCV", "Ahmed Transport LLC"],
  ["3321-D", "BUS", "Oman National Transport"],
  ["55-A", "TWO_WHEELER", "Khalid Al Maamari"],
  ["7788-E", "CAR", "Nadia Al Lawati"],
  ["442109-F", "MULTI_AXLE", "Sohar Cargo Co"],
];

const vehicles: Vehicle[] = [];
const tags: Tag[] = [];
const wallets: Wallet[] = [];

samplePlates.forEach(([plate, cls, owner], i) => {
  const vid = `veh-${i + 1}`;
  const tid = `tag-${i + 1}`;
  vehicles.push({
    id: vid,
    tenantId: "tnt-1",
    plateNumber: plate,
    vehicleClassCode: cls,
    ownerName: owner,
    status: "ACTIVE",
    createdAt: iso(-days(60 - i)),
  });
  tags.push({
    id: tid,
    vehicleId: vid,
    rfid: `OM${String(7700000000000 + i * 137).padStart(13, "0")}`,
    status: "ACTIVE",
    issuedAt: iso(-days(60 - i)),
  });
  wallets.push({
    id: `wlt-${i + 1}`,
    tagId: tid,
    balance: [25.500, 8.750, 15.000, 2.300, 0.000, 3.250, 12.400, 1.500][i],
    currency: "OMR",
    autoRecharge: i < 4,
    rechargeThreshold: 5.000,
    rechargeAmount: 20.000,
    updatedAt: iso(-days(1)),
  });
});

// ---- rate cards (per plaza × vehicle class, OMR pricing) -----------
const baseRatesByClass: Record<VehicleClassCode, number> = {
  TWO_WHEELER: 0.200,
  CAR: 0.500,
  LCV: 0.800,
  BUS: 1.200,
  HCV: 1.800,
  MULTI_AXLE: 2.800,
  OVERSIZED: 4.000,
};

const rateCards: RateCard[] = [];
plazas.forEach((plz) => {
  vehicleClasses.forEach((vc) => {
    const base = baseRatesByClass[vc.code];
    rateCards.push({
      id: `rc-${plz.id}-${vc.code}`,
      tenantId: "tnt-1",
      plazaId: plz.id,
      vehicleClassCode: vc.code,
      direction: "BOTH",
      singleJourney: base,
      roundJourney: +(base * 1.6).toFixed(3),
      monthlyPass: +(base * 20).toFixed(3),
      effectiveFrom: iso(-days(60)),
      version: 1,
      status: "ACTIVE",
      createdBy: "Admin",
      createdAt: iso(-days(60)),
    });
  });
});

const rateRules: RateRule[] = [];
const discountPlans: DiscountPlan[] = [];

// ---- empty ledger (operator will create transactions) --------------
const transactions: Transaction[] = [];
const settlements: Settlement[] = [];
const violations: Violation[] = [];
const challans: Challan[] = [];

// ---- staff (just the 2 users) ---------------------------------------
const staff: Staff[] = [
  { id: "stf-1", tenantId: "tnt-1", employeeId: "EMP-0001", name: "Admin User", designation: "PLAZA_MANAGER", plazaId: "plz-1", status: "ACTIVE", hireDate: iso(-days(120)) },
  { id: "stf-2", tenantId: "tnt-1", employeeId: "EMP-0002", name: "Lane Operator", designation: "LANE_OPERATOR", plazaId: "plz-1", status: "ACTIVE", hireDate: iso(-days(45)) },
];

// ---- audit log (seeded with one login entry) -----------------------
const auditLogs: AuditLog[] = [
  {
    id: "aud-001",
    tenantId: "tnt-1",
    actorName: "System",
    action: "CREATE",
    module: "admin",
    entityType: "tenant",
    entityId: "tnt-1",
    afterValue: JSON.stringify({ name: "Oman Toll Operations" }),
    ipAddress: "127.0.0.1",
    hashChain: "0".repeat(64),
    createdAt: iso(-days(120)),
  },
];

const notifications: Notification[] = [];
const supportTickets: SupportTicket[] = [];
const corporateAccounts: CorporateAccount[] = [];
const invoices: Invoice[] = [];
const shifts: Shift[] = [];

// ---- 2 users only ---------------------------------------------------
const users: User[] = [
  {
    id: "usr-admin",
    tenantId: "tnt-1",
    email: "admin@omantoll.om",
    name: "Admin User",
    role: "ADMIN",
    mfaEnabled: true,
    lastLoginAt: iso(-3600_000),
    status: "ACTIVE",
  },
  {
    id: "usr-operator",
    tenantId: "tnt-1",
    email: "operator@omantoll.om",
    name: "Lane Operator",
    role: "OPERATOR",
    mfaEnabled: false,
    lastLoginAt: iso(-600_000),
    status: "ACTIVE",
  },
];

export const initialState: AppState = {
  currentUser: null,
  currentTenantId: "tnt-1",
  selectedPlazaId: "",
  openingFloat: 0,
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
  shifts,
  auditLogs,
  notifications,
  supportTickets,
  corporateAccounts,
  invoices,
};
