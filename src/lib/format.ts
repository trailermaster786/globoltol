// Global Toll — formatting & display helpers

export function formatCurrency(
  amount: number,
  currency: string = "INR",
  options: { compact?: boolean } = {}
): string {
  const { compact } = options;
  if (currency === "INR") {
    if (compact) {
      if (Math.abs(amount) >= 1_00_00_000)
        return `₹${(amount / 1_00_00_000).toFixed(2)}Cr`;
      if (Math.abs(amount) >= 1_00_000)
        return `₹${(amount / 1_00_000).toFixed(2)}L`;
      if (Math.abs(amount) >= 1_000)
        return `₹${(amount / 1_000).toFixed(1)}K`;
      return `₹${amount.toFixed(0)}`;
    }
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(n: number, compact = false): string {
  return new Intl.NumberFormat("en-IN", {
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(n);
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function classNames(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}
