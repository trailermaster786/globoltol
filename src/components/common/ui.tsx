"use client";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("p-6 space-y-6 max-w-[1600px] mx-auto", className)}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  deltaPositive = true,
  icon: Icon,
  variant = "default",
  sub,
}: {
  label: string;
  value: string | number;
  delta?: string;
  deltaPositive?: boolean;
  icon?: LucideIcon;
  variant?: "default" | "revenue" | "warning";
  sub?: string;
}) {
  const accent =
    variant === "revenue"
      ? "border-l-4 border-l-[var(--color-gold)] revenue-glow"
      : variant === "warning"
        ? "border-l-4 border-l-destructive"
        : "border-l-4 border-l-[var(--color-teal)]";
  return (
    <Card className={`p-5 ${accent}`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        {Icon && (
          <div
            className={cn(
              "h-8 w-8 rounded-md grid place-items-center",
              variant === "revenue"
                ? "bg-[var(--color-accent)] text-[var(--color-gold-dark)]"
                : "bg-[var(--color-teal)]/10 text-teal"
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-foreground tracking-tight">
        {value}
      </div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      {delta && (
        <div
          className={cn(
            "flex items-center gap-1 mt-2 text-xs font-medium",
            deltaPositive ? "text-emerald-600" : "text-destructive"
          )}
        >
          {deltaPositive ? (
            <ArrowUpRight className="h-3.5 w-3.5" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5" />
          )}
          {delta}
        </div>
      )}
    </Card>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("p-5", className)}>
      {(title || action) && (
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && (
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            )}
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </Card>
  );
}

export function StatusDot({
  status,
}: {
  status: "OPEN" | "CLOSED" | "MAINTENANCE" | "FAULTED" | "ONLINE" | "OFFLINE" | "DEGRADED" | "ERROR" | "ACTIVE" | "BLACKLISTED" | "SUSPENDED" | "SUCCESS" | "FAILED" | "PENDING" | "REFUNDED" | string;
}) {
  const colorMap: Record<string, string> = {
    OPEN: "bg-emerald-500",
    ONLINE: "bg-emerald-500",
    ACTIVE: "bg-emerald-500",
    SUCCESS: "bg-emerald-500",
    MATCHED: "bg-emerald-500",
    PAID: "bg-emerald-500",
    LOCKED: "bg-emerald-500",
    CLOSED: "bg-zinc-400",
    OFFLINE: "bg-zinc-400",
    INACTIVE: "bg-zinc-400",
    RESOLVED: "bg-emerald-500",
    DRAFT: "bg-zinc-400",
    DETECTED: "bg-amber-500",
    PENDING: "bg-amber-500",
    QUEUED: "bg-amber-500",
    ISSUED: "bg-blue-500",
    SENT: "bg-blue-500",
    CHALLAN_ISSUED: "bg-blue-500",
    IN_PROGRESS: "bg-blue-500",
    MAINTENANCE: "bg-amber-500",
    DEGRADED: "bg-amber-500",
    TRIAL: "bg-amber-500",
    ON_LEAVE: "bg-amber-500",
    OVERDUE: "bg-red-500",
    FAULTED: "bg-red-500",
    ERROR: "bg-red-500",
    FAILED: "bg-red-500",
    VARIANCE: "bg-red-500",
    BLACKLISTED: "bg-red-500",
    SUSPENDED: "bg-red-500",
    SUSPENDED_TENANT: "bg-red-500",
    ESCALATED: "bg-red-500",
    APPEALED: "bg-purple-500",
    DELIVERED: "bg-emerald-500",
  };
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          colorMap[status] ?? "bg-zinc-400",
          status === "ONLINE" || status === "OPEN" ? "animate-pulse" : ""
        )}
      />
    </span>
  );
}

export function EmptyState({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      {Icon && <Icon className="h-8 w-8 text-muted-foreground mb-2" />}
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">{description}</p>
      )}
    </div>
  );
}
