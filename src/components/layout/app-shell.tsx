"use client";
import { useStore } from "@/store/app-store";
import { LoginScreen } from "@/components/modules/login";
import { AdminDashboard } from "@/components/modules/admin-dashboard";
import { OperatorConsole } from "@/components/modules/operator-console";

export function AppShell() {
  const currentUser = useStore((s) => s.currentUser);

  if (!currentUser) {
    return <LoginScreen />;
  }

  // Role-based routing — no sidebar, each role gets its own dedicated experience
  if (currentUser.role === "OPERATOR") {
    return <OperatorConsole />;
  }

  // ADMIN (default)
  return <AdminDashboard />;
}
