// =====================================================================
// Global Toll — Shared TypeScript types
// Mirrors prisma/schema.prisma 1:1 for in-memory demo store.
// =====================================================================

export type RoleName =
  | "SUPER_ADMIN"
  | "TENANT_ADMIN"
  | "PLAZA_MANAGER"
  | "LANE_OPERATOR"
  | "FINANCE"
  | "ENFORCEMENT"
  | "SUPPORT"
  | "AUDITOR"
  | "CUSTOMER";

export type ModuleKey =
  | "dashboard"
  | "plazas"
  | "vehicles"
  | "pricing"
  | "transactions"
  | "settlement"
  | "violations"
  | "customer"
  | "fleet"
  | "staff"
  | "reports"
  | "notifications"
  | "admin"
  | "audit";

export type Permission = "view" | "create" | "edit" | "delete" | "approve";

export type Permissions = Record<ModuleKey, Partial<Record<Permission, boolean>>>;

export interface Role {
  name: RoleName;
  label: string;
  description: string;
  permissions: Permissions;
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: RoleName;
  mfaEnabled: boolean;
  lastLoginAt: string;
  status: "ACTIVE" | "SUSPENDED";
}

export interface Tenant {
  id: string;
  name: string;
  legalName: string;
  taxId: string;
  countryCode: string;
  currency: string;
  timezone: string;
  status: "ACTIVE" | "SUSPENDED" | "TRIAL";
  subscriptionTier: "STARTER" | "GROWTH" | "ENTERPRISE" | "WHITE_LABEL";
  createdAt: string;
}

export interface Highway {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  lengthKm: number;
  region: string;
}

export interface TollPlaza {
  id: string;
  highwayId: string;
  tenantId: string;
  code: string;
  name: string;
  kmMark: number;
  latitude?: number;
  longitude?: number;
  direction: "FORWARD" | "REVERSE" | "BOTH";
  status: "OPEN" | "CLOSED" | "MAINTENANCE";
}

export interface Lane {
  id: string;
  plazaId: string;
  number: number;
  type: "CASH" | "ETC_RFID" | "ANPR" | "HYBRID" | "EXPRESS_HOV";
  direction: "FORWARD" | "REVERSE";
  status: "OPEN" | "CLOSED" | "MAINTENANCE" | "FAULTED";
  reason?: string;
  updatedAt: string;
}

export interface Device {
  id: string;
  laneId: string;
  type:
    | "BARRIER"
    | "RFID_READER"
    | "ANPR_CAMERA"
    | "WIM_SENSOR"
    | "LOOP_DETECTOR"
    | "DISPLAY_BOARD"
    | "PRINTER";
  serialNo: string;
  vendor?: string;
  status: "ONLINE" | "OFFLINE" | "DEGRADED" | "ERROR";
  lastHeartbeat?: string;
  errorCode?: string;
  firmware?: string;
}

export type VehicleClassCode =
  | "TWO_WHEELER"
  | "CAR"
  | "LCV"
  | "HCV"
  | "BUS"
  | "MULTI_AXLE"
  | "OVERSIZED";

export interface VehicleClass {
  code: VehicleClassCode;
  label: string;
  axleCount: number;
  description: string;
}

export interface Vehicle {
  id: string;
  tenantId: string;
  plateNumber: string;
  vehicleClassCode: VehicleClassCode;
  ownerName: string;
  ownerKyc?: string;
  status: "ACTIVE" | "BLACKLISTED" | "SUSPENDED";
  blacklistReason?: string;
  createdAt: string;
}

export interface Tag {
  id: string;
  vehicleId: string;
  rfid: string;
  status: "ACTIVE" | "INACTIVE" | "LOST" | "REPLACED";
  issuedAt: string;
  replacedAt?: string;
}

export interface Wallet {
  id: string;
  tagId: string;
  balance: number;
  currency: string;
  autoRecharge: boolean;
  rechargeThreshold?: number;
  rechargeAmount?: number;
  updatedAt: string;
}

export interface RateCard {
  id: string;
  tenantId: string;
  plazaId?: string;
  vehicleClassCode: VehicleClassCode;
  direction: "FORWARD" | "REVERSE" | "BOTH";
  singleJourney: number;
  roundJourney?: number;
  monthlyPass?: number;
  effectiveFrom: string;
  effectiveTo?: string;
  version: number;
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  createdBy: string;
  createdAt: string;
}

export interface RateRule {
  id: string;
  tenantId: string;
  name: string;
  condition: {
    timeOfDay?: "PEAK" | "OFF_PEAK";
    dayType?: "WEEKDAY" | "WEEKEND" | "HOLIDAY";
    congestionLevel?: "LOW" | "MEDIUM" | "HIGH";
  };
  action: "MULTIPLIER" | "SURCHARGE" | "DISCOUNT";
  value: number;
  priority: number;
  enabled: boolean;
}

export interface DiscountPlan {
  id: string;
  tenantId: string;
  name: string;
  type: "FREQUENT_USER" | "MONTHLY_PASS" | "LOCAL_RESIDENT" | "FLEET";
  value: number;
  valueType: "PERCENTAGE" | "FLAT";
  eligibility?: string;
}

export type PaymentMethod =
  | "WALLET"
  | "UPI"
  | "CARD"
  | "NETBANKING"
  | "CASH"
  | "FLEET_INVOICE";

export interface Transaction {
  id: string;
  tenantId: string;
  plazaId?: string;
  laneId?: string;
  vehicleId?: string;
  tagId?: string;
  walletId?: string;
  vehicleClassCode?: VehicleClassCode;
  plateCaptured?: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  status: "SUCCESS" | "FAILED" | "PENDING" | "REFUNDED";
  failureReason?: string;
  idempotencyKey?: string;
  capturedAt: string;
  settledAt?: string;
  settlementId?: string;
}

export interface Settlement {
  id: string;
  tenantId: string;
  batchDate: string;
  type: "CASH_SHIFT" | "DAILY_BANK" | "INTEROP_CLEARING";
  totalAmount: number;
  expectedAmount: number;
  variance: number;
  status: "OPEN" | "MATCHED" | "VARIANCE" | "LOCKED";
  lockedAt?: string;
  lockedBy?: string;
  transactionCount: number;
}

export interface Violation {
  id: string;
  tenantId: string;
  vehicleId?: string;
  plazaId?: string;
  laneId?: string;
  plateCaptured: string;
  type:
    | "UNPAID_PASS"
    | "TAG_MISMATCH"
    | "BLACKLISTED"
    | "WRONG_LANE"
    | "OVERSPEED";
  evidenceUrl?: string;
  detectedAt: string;
  status:
    | "DETECTED"
    | "CHALLAN_ISSUED"
    | "APPEALED"
    | "PAID"
    | "ESCALATED"
    | "CLOSED";
}

export interface Challan {
  id: string;
  violationId: string;
  challanNo: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: "ISSUED" | "PAID" | "OVERDUE" | "APPEALED" | "ESCALATED";
  paidDate?: string;
  appealReason?: string;
}

export interface Staff {
  id: string;
  tenantId: string;
  userId?: string;
  employeeId: string;
  name: string;
  designation:
    | "LANE_OPERATOR"
    | "PLAZA_MANAGER"
    | "FINANCE_OFFICER"
    | "ENFORCEMENT"
    | "SUPPORT"
    | "AUDITOR";
  plazaId?: string;
  status: "ACTIVE" | "ON_LEAVE" | "INACTIVE";
  hireDate: string;
  metrics?: {
    txnsPerHour: number;
    errorRate: number;
    cashVariance: number;
  };
}

export interface AuditLog {
  id: string;
  tenantId?: string;
  userId?: string;
  actorName: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "APPROVE" | "LOGIN" | "LOGOUT";
  module: string;
  entityId?: string;
  entityType?: string;
  beforeValue?: string;
  afterValue?: string;
  ipAddress?: string;
  hashChain?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  tenantId?: string;
  channel: "SMS" | "EMAIL" | "PUSH" | "WHATSAPP";
  template: string;
  recipient: string;
  payload: string;
  status: "QUEUED" | "SENT" | "DELIVERED" | "FAILED";
  sentAt?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  tenantId: string;
  customerId?: string;
  customerName: string;
  subject: string;
  category: "WALLET" | "TAG" | "TRIP" | "CHALLAN" | "OTHER";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  createdAt: string;
  resolvedAt?: string;
}

export interface CorporateAccount {
  id: string;
  tenantId: string;
  name: string;
  gstin?: string;
  creditLimit: number;
  billingCycle: "WEEKLY" | "MONTHLY" | "QUARTERLY";
  contactEmail?: string;
  vehicleCount: number;
  createdAt: string;
}

export interface Invoice {
  id: string;
  corporateAccountId: string;
  invoiceNo: string;
  period: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  status: "DRAFT" | "ISSUED" | "PAID" | "OVERDUE";
  issueDate: string;
  dueDate: string;
}

export interface AppState {
  // auth
  currentUser: User | null;
  currentTenantId: string;
  // navigation
  activeModule: ModuleKey;
  // data
  tenants: Tenant[];
  users: User[];
  highways: Highway[];
  plazas: TollPlaza[];
  lanes: Lane[];
  devices: Device[];
  vehicleClasses: VehicleClass[];
  vehicles: Vehicle[];
  tags: Tag[];
  wallets: Wallet[];
  rateCards: RateCard[];
  rateRules: RateRule[];
  discountPlans: DiscountPlan[];
  transactions: Transaction[];
  settlements: Settlement[];
  violations: Violation[];
  challans: Challan[];
  staff: Staff[];
  auditLogs: AuditLog[];
  notifications: Notification[];
  supportTickets: SupportTicket[];
  corporateAccounts: CorporateAccount[];
  invoices: Invoice[];
}
