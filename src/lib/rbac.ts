import type { ModuleKey, Permission, Role, RoleName } from "./types";

// =====================================================================
// Global Toll — RBAC Permission Matrix
// Granular per-module, per-action permissions for each enterprise role.
// =====================================================================

const FULL: Partial<Record<Permission, boolean>> = {
  view: true,
  create: true,
  edit: true,
  delete: true,
  approve: true,
};
const VIEW_ONLY: Partial<Record<Permission, boolean>> = { view: true };
const VIEW_EDIT: Partial<Record<Permission, boolean>> = {
  view: true,
  edit: true,
};
const VIEW_EDIT_APPROVE: Partial<Record<Permission, boolean>> = {
  view: true,
  edit: true,
  approve: true,
};
const NONE: Partial<Record<Permission, boolean>> = {};

function matrix(spec: Partial<Record<ModuleKey, Partial<Record<Permission, boolean>>>>) {
  const out: Record<ModuleKey, Partial<Record<Permission, boolean>>> = {
    dashboard: NONE,
    plazas: NONE,
    vehicles: NONE,
    pricing: NONE,
    transactions: NONE,
    settlement: NONE,
    violations: NONE,
    customer: NONE,
    fleet: NONE,
    staff: NONE,
    reports: NONE,
    notifications: NONE,
    admin: NONE,
    audit: NONE,
  };
  for (const k of Object.keys(spec) as ModuleKey[]) {
    out[k] = spec[k]!;
  }
  return out;
}

export const ROLES: Record<RoleName, Role> = {
  SUPER_ADMIN: {
    name: "SUPER_ADMIN",
    label: "Super Admin",
    description:
      "Platform owner. Manages tenants, global config, and tenant billing. Full access across every module and tenant.",
    permissions: matrix({
      dashboard: FULL,
      plazas: FULL,
      vehicles: FULL,
      pricing: FULL,
      transactions: FULL,
      settlement: FULL,
      violations: FULL,
      customer: FULL,
      fleet: FULL,
      staff: FULL,
      reports: FULL,
      notifications: FULL,
      admin: FULL,
      audit: FULL,
    }),
  },
  TENANT_ADMIN: {
    name: "TENANT_ADMIN",
    label: "Tenant / Company Admin",
    description:
      "Toll operator company administrator. Manages their highways, plazas, staff, pricing, and reports.",
    permissions: matrix({
      dashboard: FULL,
      plazas: FULL,
      vehicles: FULL,
      pricing: FULL,
      transactions: FULL,
      settlement: FULL,
      violations: FULL,
      customer: FULL,
      fleet: FULL,
      staff: FULL,
      reports: FULL,
      notifications: FULL,
      admin: VIEW_EDIT,
      audit: FULL,
    }),
  },
  PLAZA_MANAGER: {
    name: "PLAZA_MANAGER",
    label: "Plaza Manager",
    description:
      "Manages a specific toll plaza: lanes, staff shifts, local pricing exceptions, and incident handling.",
    permissions: matrix({
      dashboard: FULL,
      plazas: VIEW_EDIT,
      vehicles: VIEW_EDIT,
      pricing: VIEW_EDIT,
      transactions: VIEW_EDIT,
      settlement: VIEW_EDIT_APPROVE,
      violations: VIEW_EDIT_APPROVE,
      customer: VIEW_ONLY,
      fleet: VIEW_ONLY,
      staff: VIEW_EDIT,
      reports: FULL,
      notifications: VIEW_EDIT,
      admin: NONE,
      audit: VIEW_ONLY,
    }),
  },
  LANE_OPERATOR: {
    name: "LANE_OPERATOR",
    label: "Lane Operator",
    description:
      "Cash lane staff console. Manual entry, receipt printing, shift cash reconciliation.",
    permissions: matrix({
      dashboard: VIEW_ONLY,
      plazas: VIEW_ONLY,
      vehicles: VIEW_ONLY,
      pricing: VIEW_ONLY,
      transactions: FULL,
      settlement: VIEW_EDIT,
      violations: VIEW_ONLY,
      customer: NONE,
      fleet: NONE,
      staff: NONE,
      reports: VIEW_ONLY,
      notifications: NONE,
      admin: NONE,
      audit: NONE,
    }),
  },
  FINANCE: {
    name: "FINANCE",
    label: "Finance / Accounts Officer",
    description:
      "Settlement, reconciliation, refunds, dispute resolution, financial reporting, tax/GST reporting.",
    permissions: matrix({
      dashboard: FULL,
      plazas: VIEW_ONLY,
      vehicles: VIEW_ONLY,
      pricing: VIEW_EDIT_APPROVE,
      transactions: FULL,
      settlement: FULL,
      violations: VIEW_ONLY,
      customer: VIEW_ONLY,
      fleet: FULL,
      staff: VIEW_ONLY,
      reports: FULL,
      notifications: VIEW_EDIT,
      admin: NONE,
      audit: FULL,
    }),
  },
  ENFORCEMENT: {
    name: "ENFORCEMENT",
    label: "Enforcement Officer",
    description:
      "Violation review, e-challan issuance, blacklist management.",
    permissions: matrix({
      dashboard: VIEW_ONLY,
      plazas: VIEW_ONLY,
      vehicles: VIEW_EDIT,
      pricing: NONE,
      transactions: VIEW_ONLY,
      settlement: NONE,
      violations: FULL,
      customer: VIEW_ONLY,
      fleet: NONE,
      staff: NONE,
      reports: VIEW_ONLY,
      notifications: VIEW_EDIT,
      admin: NONE,
      audit: VIEW_ONLY,
    }),
  },
  SUPPORT: {
    name: "SUPPORT",
    label: "Customer Support Agent",
    description:
      "View (not edit) customer accounts. Wallet issues, ticket handling, refund requests with approval workflow.",
    permissions: matrix({
      dashboard: VIEW_ONLY,
      plazas: VIEW_ONLY,
      vehicles: VIEW_EDIT,
      pricing: NONE,
      transactions: VIEW_EDIT,
      settlement: NONE,
      violations: VIEW_ONLY,
      customer: FULL,
      fleet: VIEW_ONLY,
      staff: NONE,
      reports: VIEW_ONLY,
      notifications: VIEW_EDIT,
      admin: NONE,
      audit: VIEW_ONLY,
    }),
  },
  AUDITOR: {
    name: "AUDITOR",
    label: "Auditor (Read-Only)",
    description:
      "Full read access to logs, transactions, and reports for compliance audits. No write access anywhere.",
    permissions: matrix({
      dashboard: VIEW_ONLY,
      plazas: VIEW_ONLY,
      vehicles: VIEW_ONLY,
      pricing: VIEW_ONLY,
      transactions: VIEW_ONLY,
      settlement: VIEW_ONLY,
      violations: VIEW_ONLY,
      customer: VIEW_ONLY,
      fleet: VIEW_ONLY,
      staff: VIEW_ONLY,
      reports: VIEW_ONLY,
      notifications: VIEW_ONLY,
      admin: VIEW_ONLY,
      audit: FULL,
    }),
  },
  CUSTOMER: {
    name: "CUSTOMER",
    label: "Customer / End-User",
    description:
      "Self-service portal: wallet, tag management, vehicle registration, trip history, invoices, support tickets.",
    permissions: matrix({
      dashboard: VIEW_ONLY,
      plazas: NONE,
      vehicles: VIEW_EDIT,
      pricing: VIEW_ONLY,
      transactions: VIEW_ONLY,
      settlement: NONE,
      violations: VIEW_ONLY,
      customer: FULL,
      fleet: NONE,
      staff: NONE,
      reports: NONE,
      notifications: NONE,
      admin: NONE,
      audit: NONE,
    }),
  },
};

export function can(
  role: RoleName | undefined,
  module: ModuleKey,
  action: Permission
): boolean {
  if (!role) return false;
  return ROLES[role].permissions[module]?.[action] === true;
}

export function canViewAny(role: RoleName): ModuleKey[] {
  if (!role) return [];
  const perms = ROLES[role].permissions;
  return (Object.keys(perms) as ModuleKey[]).filter((m) => perms[m]?.view);
}
