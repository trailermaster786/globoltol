"use client";
import { create } from "zustand";
import type {
  AppState,
  AuditLog,
  ModuleKey,
  Notification,
  Settlement,
  Tenant,
  Transaction,
  Violation,
  Challan,
} from "@/lib/types";
import { initialState } from "@/lib/seed-data";

interface StoreActions {
  login: (userId: string) => void;
  logout: () => void;
  switchTenant: (tenantId: string) => void;
  setActiveModule: (m: ModuleKey) => void;
  addPlaza: (data: Partial<Tenant> & { name: string }) => void;
  addTransaction: (txn: Transaction) => void;
  lockSettlement: (id: string, actor: string) => void;
  issueChallan: (violationId: string, amount: number) => void;
  payChallan: (challanId: string) => void;
  pushAudit: (entry: Omit<AuditLog, "id" | "createdAt" | "hashChain">) => void;
  pushNotification: (n: Omit<Notification, "id" | "createdAt">) => void;
  reset: () => void;
}

type Store = AppState & StoreActions;

let auditHashChain = "0".repeat(64);
function nextHash(prev: string, payload: string) {
  let h = 0;
  const c = prev + payload;
  for (let i = 0; i < c.length; i++) h = ((h << 5) - h + c.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16).padStart(8, "0").repeat(8);
}

export const useStore = create<Store>((set, get) => ({
  ...initialState,

  login: (userId) => {
    const u = get().users.find((x) => x.id === userId);
    if (!u) return;
    const entry: Omit<AuditLog, "id" | "createdAt" | "hashChain"> = {
      tenantId: u.tenantId,
      userId: u.id,
      actorName: u.name,
      action: "LOGIN",
      module: "admin",
      ipAddress: "10.0.1.42",
    };
    get().pushAudit(entry);
    set({ currentUser: u, currentTenantId: u.tenantId, activeModule: "dashboard" });
  },

  logout: () => {
    const u = get().currentUser;
    if (u) {
      get().pushAudit({
        tenantId: u.tenantId,
        userId: u.id,
        actorName: u.name,
        action: "LOGOUT",
        module: "admin",
        ipAddress: "10.0.1.42",
      });
    }
    set({ currentUser: null, activeModule: "dashboard" });
  },

  switchTenant: (tenantId) => set({ currentTenantId: tenantId }),

  setActiveModule: (m) => set({ activeModule: m }),

  addPlaza: (data) => {
    const newTenant: Tenant = {
      id: `tnt-${Date.now()}`,
      name: data.name,
      legalName: data.legalName ?? data.name,
      taxId: data.taxId ?? "",
      countryCode: "IN",
      currency: "INR",
      timezone: "Asia/Kolkata",
      status: "ACTIVE",
      subscriptionTier: data.subscriptionTier ?? "STARTER",
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ tenants: [...s.tenants, newTenant] }));
    get().pushAudit({
      tenantId: get().currentTenantId,
      actorName: get().currentUser?.name ?? "System",
      action: "CREATE",
      module: "admin",
      entityType: "tenant",
      entityId: newTenant.id,
      afterValue: JSON.stringify({ name: data.name }),
      ipAddress: "10.0.1.42",
    });
  },

  addTransaction: (txn) =>
    set((s) => ({ transactions: [txn, ...s.transactions] })),

  lockSettlement: (id, actor) =>
    set((s) => ({
      settlements: s.settlements.map((st) =>
        st.id === id
          ? {
              ...st,
              status: "LOCKED",
              lockedAt: new Date().toISOString(),
              lockedBy: actor,
            }
          : st
      ),
    })),

  issueChallan: (violationId, amount) => {
    const v = get().violations.find((x) => x.id === violationId);
    if (!v) return;
    const newChallan: Challan = {
      id: `chl-${Date.now()}`,
      violationId,
      challanNo: `CHL-${v.plazaId ?? "TP"}-${Math.floor(Math.random() * 9000) + 1000}`,
      amount,
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60_000).toISOString(),
      status: "ISSUED",
    };
    set((s) => ({
      challans: [newChallan, ...s.challans],
      violations: s.violations.map((x) =>
        x.id === violationId ? { ...x, status: "CHALLAN_ISSUED" } : x
      ),
    }));
    get().pushAudit({
      tenantId: v.tenantId,
      actorName: get().currentUser?.name ?? "Enforcement",
      action: "CREATE",
      module: "violations",
      entityType: "challan",
      entityId: newChallan.id,
      afterValue: JSON.stringify({ amount }),
      ipAddress: "10.0.1.42",
    });
  },

  payChallan: (challanId) =>
    set((s) => ({
      challans: s.challans.map((c) =>
        c.id === challanId
          ? { ...c, status: "PAID", paidDate: new Date().toISOString() }
          : c
      ),
    })),

  pushAudit: (entry) =>
    set((s) => {
      const createdAt = new Date().toISOString();
      const payload = `${entry.actorName}|${entry.action}|${entry.module}|${createdAt}`;
      const hash = nextHash(auditHashChain, payload);
      auditHashChain = hash;
      const log: AuditLog = {
        id: `aud-${Date.now()}`,
        createdAt,
        hashChain: hash,
        ...entry,
      };
      return { auditLogs: [log, ...s.auditLogs].slice(0, 500) };
    }),

  pushNotification: (n) =>
    set((s) => ({
      notifications: [
        { id: `ntf-${Date.now()}`, createdAt: new Date().toISOString(), ...n },
        ...s.notifications,
      ].slice(0, 500),
    })),

  reset: () => set({ ...initialState, currentUser: null }),
}));

export const useCurrentUser = () => useStore((s) => s.currentUser);
export const useActiveTenant = () =>
  useStore((s) => s.tenants.find((t) => t.id === s.currentTenantId));

export function roleLabel(r: string): string {
  const map: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    TENANT_ADMIN: "Tenant Admin",
    PLAZA_MANAGER: "Plaza Manager",
    LANE_OPERATOR: "Lane Operator",
    FINANCE: "Finance Officer",
    ENFORCEMENT: "Enforcement",
    SUPPORT: "Support Agent",
    AUDITOR: "Auditor",
    CUSTOMER: "Customer",
  };
  return map[r] ?? r;
}
