"use client";
import { create } from "zustand";
import type {
  AppState,
  AuditLog,
  ModuleKey,
  Notification,
  Settlement,
  Staff,
  Tenant,
  Transaction,
  Violation,
  Challan,
  Shift,
  TollPlaza,
  RateCard,
} from "@/lib/types";
import { initialState } from "@/lib/seed-data";

// LocalStorage persistence helpers
const STORAGE_KEY = "global-toll-store";
function loadPersisted(): Partial<AppState> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}
function savePersisted(state: AppState) {
  if (typeof window === "undefined") return;
  try {
    const toSave = {
      transactions: state.transactions,
      shifts: state.shifts,
      staff: state.staff,
      auditLogs: state.auditLogs,
      plazas: state.plazas,
      rateCards: state.rateCards,
      vehicleClasses: state.vehicleClasses,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {}
}

interface StoreActions {
  login: (userId: string) => void;
  logout: () => void;
  switchTenant: (tenantId: string) => void;
  setActiveModule: (m: ModuleKey) => void;
  setSelectedPlaza: (plazaId: string) => void;
  setOpeningFloat: (amount: number) => void;
  addPlaza: (data: Partial<Tenant> & { name: string }) => void;
  updatePlaza: (id: string, data: Partial<TollPlaza>) => void;
  addTransaction: (txn: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addShift: (shift: Shift) => void;
  endShift: (id: string) => void;
  addStaff: (data: { name: string; designation: Staff["designation"]; plazaId?: string }) => void;
  updateStaff: (id: string, data: Partial<Staff>) => void;
  deleteStaff: (id: string) => void;
  addVehicleClass: (data: { code: string; label: string; description: string; axleCount: number }) => void;
  updateVehicleClass: (code: string, data: { label: string; description: string; axleCount: number }) => void;
  deleteRateCard: (id: string) => void;
  updateRateCard: (id: string, data: Partial<RateCard>) => void;
  lockSettlement: (id: string, actor: string) => void;
  issueChallan: (violationId: string, amount: number) => void;
  payChallan: (challanId: string) => void;
  pushAudit: (entry: Omit<AuditLog, "id" | "createdAt" | "hashChain">) => void;
  pushNotification: (n: Omit<Notification, "id" | "createdAt">) => void;
  reset: () => void;
  setView: (v: string) => void;
}

type Store = AppState & StoreActions;

let auditHashChain = "0".repeat(64);
function nextHash(prev: string, payload: string) {
  let h = 0;
  const c = prev + payload;
  for (let i = 0; i < c.length; i++) h = ((h << 5) - h + c.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16).padStart(8, "0").repeat(8);
}

const persisted = loadPersisted();
const startState = persisted ? { ...initialState, ...persisted } : initialState;

export const useStore = create<Store>((set, get) => ({
  ...startState,

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
    savePersisted(get());
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
    savePersisted(get());
  },

  switchTenant: (tenantId) => set({ currentTenantId: tenantId }),

  setSelectedPlaza: (plazaId) => set({ selectedPlazaId: plazaId }),

  setOpeningFloat: (amount) => set({ openingFloat: amount }),

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

  updatePlaza: (id, data) => {
    set((s) => ({
      plazas: s.plazas.map((p) => p.id === id ? { ...p, ...data } : p),
    }));
    savePersisted(get());
    get().pushAudit({
      tenantId: get().currentTenantId,
      actorName: get().currentUser?.name ?? "System",
      action: "UPDATE",
      module: "admin",
      entityType: "plaza",
      entityId: id,
      afterValue: JSON.stringify(data),
      ipAddress: "10.0.1.42",
    });
  },

  addTransaction: (txn) => {
    set((s) => ({ transactions: [txn, ...s.transactions] }));
    savePersisted(get());
  },

  deleteTransaction: (id) => {
    set((s) => ({ transactions: s.transactions.filter((tx) => tx.id !== id) }));
    savePersisted(get());
    get().pushAudit({
      tenantId: get().currentTenantId,
      actorName: get().currentUser?.name ?? "System",
      action: "DELETE",
      module: "transactions",
      entityType: "transaction",
      entityId: id,
      ipAddress: "10.0.1.42",
    });
  },

  addShift: (shift) => {
    set((s) => ({ shifts: [shift, ...s.shifts] }));
    savePersisted(get());
    get().pushAudit({
      tenantId: get().currentTenantId,
      actorName: get().currentUser?.name ?? "System",
      action: "CREATE",
      module: "shifts",
      entityType: "shift",
      entityId: shift.id,
      afterValue: JSON.stringify({ operator: shift.operatorName, plaza: shift.plazaName }),
      ipAddress: "10.0.1.42",
    });
  },

  endShift: (id) => {
    set((s) => ({
      shifts: s.shifts.map((sh) => sh.id === id ? { ...sh, status: "CLOSED", endedAt: new Date().toISOString() } : sh),
    }));
    savePersisted(get());
    get().pushAudit({
      tenantId: get().currentTenantId,
      actorName: get().currentUser?.name ?? "System",
      action: "UPDATE",
      module: "shifts",
      entityType: "shift",
      entityId: id,
      ipAddress: "10.0.1.42",
    });
  },

  addStaff: (data) => {
    const newStaff: Staff = {
      id: `stf-${Date.now()}`,
      tenantId: get().currentTenantId,
      employeeId: `EMP-${String(get().staff.length + 1).padStart(4, "0")}`,
      name: data.name,
      designation: data.designation,
      plazaId: data.plazaId,
      status: "ACTIVE",
      hireDate: new Date().toISOString(),
    };
    set((s) => ({ staff: [...s.staff, newStaff] }));
    savePersisted(get());
    get().pushAudit({
      tenantId: get().currentTenantId,
      actorName: get().currentUser?.name ?? "System",
      action: "CREATE",
      module: "staff",
      entityType: "staff",
      entityId: newStaff.id,
      afterValue: JSON.stringify({ name: data.name, designation: data.designation }),
      ipAddress: "10.0.1.42",
    });
  },

  updateStaff: (id, data) => {
    set((s) => ({
      staff: s.staff.map((st) => st.id === id ? { ...st, ...data } : st),
    }));
    savePersisted(get());
    get().pushAudit({
      tenantId: get().currentTenantId,
      actorName: get().currentUser?.name ?? "System",
      action: "UPDATE",
      module: "staff",
      entityType: "staff",
      entityId: id,
      afterValue: JSON.stringify(data),
      ipAddress: "10.0.1.42",
    });
  },

  deleteStaff: (id) => {
    set((s) => ({ staff: s.staff.filter((st) => st.id !== id) }));
    savePersisted(get());
    get().pushAudit({
      tenantId: get().currentTenantId,
      actorName: get().currentUser?.name ?? "System",
      action: "DELETE",
      module: "staff",
      entityType: "staff",
      entityId: id,
      ipAddress: "10.0.1.42",
    });
  },

  addVehicleClass: (data) => {
    const newClass = { code: data.code, label: data.label, description: data.description, axleCount: data.axleCount };
    set((s) => ({ vehicleClasses: [...s.vehicleClasses, newClass] }));
    savePersisted(get());
    get().pushAudit({
      tenantId: get().currentTenantId,
      actorName: get().currentUser?.name ?? "System",
      action: "CREATE",
      module: "vehicles",
      entityType: "vehicleClass",
      entityId: data.code,
      afterValue: JSON.stringify(data),
      ipAddress: "10.0.1.42",
    });
  },

  updateVehicleClass: (code, data) => {
    set((s) => ({
      vehicleClasses: s.vehicleClasses.map((vc) => vc.code === code ? { ...vc, ...data } : vc),
    }));
    savePersisted(get());
    get().pushAudit({
      tenantId: get().currentTenantId,
      actorName: get().currentUser?.name ?? "System",
      action: "UPDATE",
      module: "vehicles",
      entityType: "vehicleClass",
      entityId: code,
      afterValue: JSON.stringify(data),
      ipAddress: "10.0.1.42",
    });
  },

  deleteRateCard: (id) => {
    set((s) => ({ rateCards: s.rateCards.filter((rc) => rc.id !== id) }));
    savePersisted(get());
    get().pushAudit({
      tenantId: get().currentTenantId,
      actorName: get().currentUser?.name ?? "System",
      action: "DELETE",
      module: "rates",
      entityType: "rateCard",
      entityId: id,
      ipAddress: "10.0.1.42",
    });
  },

  updateRateCard: (id, data) => {
    set((s) => ({
      rateCards: s.rateCards.map((rc) => rc.id === id ? { ...rc, ...data } : rc),
    }));
    savePersisted(get());
    get().pushAudit({
      tenantId: get().currentTenantId,
      actorName: get().currentUser?.name ?? "System",
      action: "UPDATE",
      module: "rates",
      entityType: "rateCard",
      entityId: id,
      afterValue: JSON.stringify(data),
      ipAddress: "10.0.1.42",
    });
  },

  setView: () => {},

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
    ADMIN: "Administrator",
    OPERATOR: "Lane Operator",
  };
  return map[r] ?? r;
}
