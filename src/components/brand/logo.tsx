import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  variant?: "light" | "dark";
  className?: string;
}

/**
 * Global Toll logo — stylized toll gate/archway (two pillars + rounded arch)
 * merging into a curving road/highway sweeping outward and upward. Inside the
 * arch: a rising bar/line growth chart with a stacked coin icon (revenue,
 * growth, financial throughput).
 *
 * Colors per brand spec:
 *  - Teal #2E8B8B (arch top / accent)
 *  - Navy #2C3E50 (pillars, road base, wordmark)
 *  - Slate Blue-Grey #5C7A8A (secondary shading)
 *  - Gold #E0A030 (coin stack, growth arrow)
 */
export function GlobalTollLogo({
  size = 40,
  showWordmark = true,
  variant = "light",
  className,
}: LogoProps) {
  const wordmarkColor = variant === "light" ? "#2C3E50" : "#ECEFF2";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Global Toll logo"
        role="img"
      >
        {/* Left pillar */}
        <rect x="8" y="22" width="5" height="34" rx="1.5" fill="#2C3E50" />
        {/* Right pillar */}
        <rect x="51" y="22" width="5" height="34" rx="1.5" fill="#2C3E50" />
        {/* Slate-blue secondary shading on pillars */}
        <rect x="11" y="22" width="2" height="34" fill="#5C7A8A" opacity="0.6" />
        <rect x="54" y="22" width="2" height="34" fill="#5C7A8A" opacity="0.6" />

        {/* Rounded arch (teal) */}
        <path
          d="M 11 24 C 11 12, 53 12, 53 24"
          stroke="#2E8B8B"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        {/* Inner arch accent */}
        <path
          d="M 16 22 C 16 16, 48 16, 48 22"
          stroke="#4FA9A9"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />

        {/* Rising bar growth chart (gold) inside arch */}
        <rect x="22" y="22" width="3.5" height="6" rx="0.5" fill="#E0A030" />
        <rect x="28" y="19" width="3.5" height="9" rx="0.5" fill="#E0A030" />
        <rect x="34" y="16" width="3.5" height="12" rx="0.5" fill="#E0A030" />
        {/* Growth line */}
        <path
          d="M 21 22 L 28 19 L 35 15 L 42 11"
          stroke="#E0A030"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Growth arrow head */}
        <path
          d="M 39 11 L 42 11 L 42 14"
          stroke="#E0A030"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Stacked coins at top-right of arch */}
        <circle cx="46" cy="14" r="2.2" fill="#E0A030" />
        <circle cx="46" cy="11" r="2.2" fill="#F0BC5C" />

        {/* Curving road sweeping outward and upward (navy) */}
        <path
          d="M 13 56 C 24 54, 34 48, 44 38 C 50 32, 56 28, 62 22"
          stroke="#2C3E50"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        {/* Road center dashes (teal) */}
        <path
          d="M 18 54.5 L 24 53 M 28 50.5 L 34 47 M 38 43 L 44 38 M 48 34 L 54 29"
          stroke="#2E8B8B"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        {/* Road secondary lane (slate-blue) */}
        <path
          d="M 13 59 C 24 57, 34 51, 44 41 C 50 35, 56 31, 62 25"
          stroke="#5C7A8A"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.45"
        />
      </svg>

      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span
            className="font-bold text-[0.95rem] tracking-[0.18em] uppercase"
            style={{ color: wordmarkColor, fontFamily: "Inter, system-ui, sans-serif" }}
          >
            Global Toll
          </span>
          <span
            className="text-[0.55rem] tracking-[0.3em] uppercase mt-0.5"
            style={{ color: variant === "light" ? "#5C7A8A" : "#8AA3B3" }}
          >
            Toll Tax Management
          </span>
        </div>
      )}
    </div>
  );
}
