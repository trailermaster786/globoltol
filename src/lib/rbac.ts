import type { ModuleKey, Permission, Role, RoleName } from "./types";

// =====================================================================
// Global Toll — RBAC Permission Matrix (2-role production model)
// =====================================================================
// ADMIN:    Sees the comprehensive Dashboard with management tabs
//           (Overview, Plazas, Pricing, Vehicles, Audit). Full CRUD.
// OPERATOR: Sees only the Operator Console (5-step transaction entry).
//           Can create transactions; cannot edit master data.
// =====================================================================

const FULL: Partial<Record<Permission, boolean>> = {
  view: true,
  create: true,
  edit: true,
  delete: true,
  approve: true,
};
const VIEW_ONLY: Partial<Record<Permission, boolean>> = { view: true };
const CREATE_ONLY: Partial<Record<Permission, boolean>> = { view: true, create: true };
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
    operator: NONE,
  };
  for (const k of Object.keys(spec) as ModuleKey[]) {
    out[k] = spec[k]!;
  }
  return out;
}

export const ROLES: Record<RoleName, Role> = {
  ADMIN: {
    name: "ADMIN",
    label: "Administrator",
    description:
      "Full management access. Sees the comprehensive dashboard with tabs for plazas, pricing, vehicles, audit, and reports. Can add, edit, and delete master data.",
    permissions: matrix({
      dashboard: FULL,
      plazas: FULL,
      vehicles: FULL,
      pricing: FULL,
      transactions: FULL,
      settlement: FULL,
      violations: FULL,
      staff: FULL,
      reports: FULL,
      notifications: FULL,
      admin: FULL,
      audit: FULL,
      operator: VIEW_ONLY,
      customer: NONE,
      fleet: NONE,
    }),
  },
  OPERATOR: {
    name: "OPERATOR",
    label: "Lane Operator",
    description:
      "Sees only the 5-step transaction entry console. Captures vehicle plates, calculates toll, processes payment, and prints receipts. Cannot edit master data.",
    permissions: matrix({
      operator: FULL,
      transactions: CREATE_ONLY,
      dashboard: NONE,
      plazas: NONE,
      vehicles: VIEW_ONLY,
      pricing: NONE,
      settlement: NONE,
      violations: NONE,
      customer: NONE,
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
