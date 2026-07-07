import type { ModuleKey } from "@/lib/types";
import {
  LayoutDashboard, Building2, Car, Tag, IndianRupee, ArrowLeftRight,
  Wallet, ShieldAlert, Users, Truck, UserCog, FileBarChart,
  Bell, Settings, ShieldCheck, type LucideIcon,
} from "lucide-react";

export interface NavItem {
  key: ModuleKey;
  label: string;
  icon: LucideIcon;
  description: string;
  group: "operations" | "financials" | "enforcement" | "experience" | "admin";
}

export const NAV_GROUPS: { group: string; label: string }[] = [
  { group: "operations", label: "Operations" },
  { group: "financials", label: "Financials" },
  { group: "enforcement", label: "Enforcement" },
  { group: "experience", label: "Customer Experience" },
  { group: "admin", label: "System" },
];

export const NAV_ITEMS: NavItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Executive overview, KPIs, real-time traffic",
    group: "operations",
  },
  {
    key: "plazas",
    label: "Plazas & Lanes",
    icon: Building2,
    description: "Highways, toll plazas, lanes, devices",
    group: "operations",
  },
  {
    key: "vehicles",
    label: "Vehicles & Tags",
    icon: Car,
    description: "Vehicle registry, RFID tag lifecycle, blacklist",
    group: "operations",
  },
  {
    key: "pricing",
    label: "Pricing & Rates",
    icon: Tag,
    description: "Rate cards, dynamic pricing, discounts, exemptions",
    group: "operations",
  },
  {
    key: "transactions",
    label: "Transactions",
    icon: ArrowLeftRight,
    description: "Real-time feed, payment processing, failed-txn handling",
    group: "financials",
  },
  {
    key: "settlement",
    label: "Settlement",
    icon: Wallet,
    description: "Cash recon, interop clearing, EOD close, disputes",
    group: "financials",
  },
  {
    key: "violations",
    label: "Violations & E-Challan",
    icon: ShieldAlert,
    description: "Auto-detection, evidence packages, challan issuance",
    group: "enforcement",
  },
  {
    key: "customer",
    label: "Customer Portal",
    icon: Users,
    description: "Wallet, trips, support tickets",
    group: "experience",
  },
  {
    key: "fleet",
    label: "Fleet & Corporate",
    icon: Truck,
    description: "Corporate accounts, fleet billing, invoices",
    group: "experience",
  },
  {
    key: "staff",
    label: "Staff & HR",
    icon: UserCog,
    description: "Staff records, shifts, performance metrics",
    group: "admin",
  },
  {
    key: "reports",
    label: "Reports & Compliance",
    icon: FileBarChart,
    description: "Standard reports, custom builder, regulatory exports",
    group: "admin",
  },
  {
    key: "notifications",
    label: "Notifications",
    icon: Bell,
    description: "Templated SMS/email/push/WhatsApp, broadcast",
    group: "admin",
  },
  {
    key: "admin",
    label: "System Admin",
    icon: Settings,
    description: "Tenants, feature flags, theming, integrations",
    group: "admin",
  },
  {
    key: "audit",
    label: "Security & Audit",
    icon: ShieldCheck,
    description: "Immutable audit log, RBAC, MFA, security events",
    group: "admin",
  },
];

export const MODULE_TITLES: Record<ModuleKey, { title: string; subtitle: string }> = {
  dashboard: { title: "Executive Dashboard", subtitle: "Real-time revenue, traffic, and anomaly monitoring" },
  plazas: { title: "Toll Plaza & Lane Management", subtitle: "Highways, plazas, lanes, and device configuration" },
  vehicles: { title: "Vehicle & Tag Management", subtitle: "Registry, RFID lifecycle, blacklist, classification" },
  pricing: { title: "Pricing & Toll Rate Engine", subtitle: "Rate cards, dynamic rules, discounts, exemptions" },
  transactions: { title: "Transaction & Payment Processing", subtitle: "Real-time capture, payment methods, reconciliation" },
  settlement: { title: "Settlement & Reconciliation", subtitle: "Cash recon, interop clearing, EOD lock, disputes" },
  violations: { title: "Violation & E-Challan Enforcement", subtitle: "Auto-detection, evidence, issuance, public payment" },
  customer: { title: "Customer Portal", subtitle: "Wallet, trip history, support tickets" },
  fleet: { title: "Fleet & Corporate Accounts", subtitle: "Centralized billing, fleet dashboard, GST invoices" },
  staff: { title: "Staff & HR", subtitle: "Records, shifts, performance metrics" },
  reports: { title: "Reports & Compliance", subtitle: "Standard library, custom builder, regulatory exports" },
  notifications: { title: "Notifications & Communication", subtitle: "Multi-channel templated messaging, broadcast" },
  admin: { title: "System Administration", subtitle: "Tenants, feature flags, theming, integrations" },
  audit: { title: "Security & Audit", subtitle: "Immutable hash-chained log, RBAC, MFA, security events" },
};
