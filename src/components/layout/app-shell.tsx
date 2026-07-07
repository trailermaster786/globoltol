"use client";
import { useStore } from "@/store/app-store";
import { can } from "@/lib/rbac";
import type { ModuleKey } from "@/lib/types";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { LoginScreen } from "@/components/modules/login";
import { DashboardModule } from "@/components/modules/dashboard";
import { PlazasModule } from "@/components/modules/plazas";
import { VehiclesModule } from "@/components/modules/vehicles";
import { PricingModule } from "@/components/modules/pricing";
import { TransactionsModule } from "@/components/modules/transactions";
import { SettlementModule } from "@/components/modules/settlement";
import { ViolationsModule } from "@/components/modules/violations";
import { CustomerModule } from "@/components/modules/customer";
import { FleetModule } from "@/components/modules/fleet";
import { StaffModule } from "@/components/modules/staff";
import { ReportsModule } from "@/components/modules/reports";
import { NotificationsModule } from "@/components/modules/notifications";
import { AdminModule } from "@/components/modules/admin";
import { AuditModule } from "@/components/modules/audit";
import { ShieldAlert } from "lucide-react";

const MODULE_COMPONENTS: Record<ModuleKey, React.ComponentType> = {
  dashboard: DashboardModule,
  plazas: PlazasModule,
  vehicles: VehiclesModule,
  pricing: PricingModule,
  transactions: TransactionsModule,
  settlement: SettlementModule,
  violations: ViolationsModule,
  customer: CustomerModule,
  fleet: FleetModule,
  staff: StaffModule,
  reports: ReportsModule,
  notifications: NotificationsModule,
  admin: AdminModule,
  audit: AuditModule,
};

export function AppShell() {
  const currentUser = useStore((s) => s.currentUser);
  const activeModule = useStore((s) => s.activeModule);
  const setActiveModule = useStore((s) => s.setActiveModule);

  if (!currentUser) {
    return <LoginScreen />;
  }

  // If user lacks view permission, pick the first module they CAN view
  if (!can(currentUser.role, activeModule, "view")) {
    const firstAllowed = (Object.keys(MODULE_COMPONENTS) as ModuleKey[]).find(
      (k) => can(currentUser.role, k, "view")
    );
    if (firstAllowed) {
      setTimeout(() => setActiveModule(firstAllowed), 0);
    }
  }

  const ModuleComponent = MODULE_COMPONENTS[activeModule];
  const hasAccess = can(currentUser.role, activeModule, "view");

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-x-hidden bg-canvas">
          {hasAccess ? (
            <ModuleComponent />
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 px-6 text-center">
              <ShieldAlert className="h-10 w-10 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Access Restricted</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                Your role ({currentUser.role.replace(/_/g, " ").toLowerCase()}) does not
                have view permission for this module. Contact your tenant administrator if
                you believe this is an error.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
