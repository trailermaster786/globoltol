"use client";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// =====================================================================
// OmanPlateInput — auto-formats Oman number plates.
// Format: [1-6 digits] + "-" + [region letters]
// Auto-dash behavior:
//   - As the user types digits, the field shows just the digits.
//   - When they hit 6 digits, the dash auto-appears (anticipating letters).
//   - When they type a letter while digits are present (1-6), dash auto-inserts.
//   - Region letters: A=Muscat, B=Dhofar, C=Musandam, D=Buraimi,
//     E=Dakhiliyah, F=Batinah N, G=Batinah S, H=Sharqiyah N,
//     I=Sharqiyah S, J=Dhahirah, K=Wusta.
// =====================================================================

const OMAN_REGIONS: { code: string; name: string }[] = [
  { code: "A", name: "Muscat" },
  { code: "B", name: "Dhofar" },
  { code: "C", name: "Musandam" },
  { code: "D", name: "Al Buraimi" },
  { code: "E", name: "Al Dakhiliyah" },
  { code: "F", name: "Al Batinah North" },
  { code: "G", name: "Al Batinah South" },
  { code: "H", name: "Ash Sharqiyah North" },
  { code: "I", name: "Ash Sharqiyah South" },
  { code: "J", name: "Al Dhahirah" },
  { code: "K", name: "Al Wusta" },
];

export function formatOmanPlate(raw: string): string {
  // Uppercase, strip anything that's not digit or letter
  const cleaned = raw.toUpperCase().replace(/[^0-9A-Z]/g, "");

  // Split: leading digits + trailing letters
  const digitsMatch = cleaned.match(/^[0-9]+/);
  const lettersMatch = cleaned.match(/[A-Z]+$/);
  const digits = digitsMatch ? digitsMatch[0] : "";
  const letters = lettersMatch ? lettersMatch[0] : "";

  // Cap digits at 6
  const trimmedDigits = digits.slice(0, 6);

  if (!trimmedDigits && letters) {
    // User started with letters (unusual) — just show letters
    return letters;
  }

  if (trimmedDigits && !letters) {
    // Only digits so far. If at max (6), pre-insert the dash so the operator
    // sees the format is ready for the letter section.
    return trimmedDigits.length === 6 ? `${trimmedDigits}-` : trimmedDigits;
  }

  if (trimmedDigits && letters) {
    return `${trimmedDigits}-${letters}`;
  }

  return "";
}

interface OmanPlateInputProps {
  value: string;
  onChange: (formatted: string) => void;
  onValidPlate?: (plate: string, region: string | null) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function OmanPlateInput({
  value,
  onChange,
  onValidPlate,
  placeholder = "e.g. 12345-A",
  className,
  autoFocus,
}: OmanPlateInputProps) {
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse the current value for region lookup
  const digits = (value.match(/^[0-9]+/) || [""])[0];
  const letters = (value.match(/-([A-Z]+)$/) || ["", ""])[1];
  const region = letters ? OMAN_REGIONS.find((r) => r.code === letters[0]) : null;

  const isValid = /^\d{1,6}-[A-Z]+$/.test(value);

  // Notify parent when plate becomes valid
  useEffect(() => {
    if (isValid && onValidPlate) {
      onValidPlate(value, region?.code ?? null);
    }
  }, [isValid, value, region?.code, onValidPlate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatOmanPlate(raw);
    onChange(formatted);
    setTouched(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If user presses a letter key while cursor is in the digit section and
    // there's no dash yet, the formatter handles it automatically.
    // Allow: Tab, arrows, backspace, delete, etc.
    if (["Tab", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Backspace", "Delete"].includes(e.key)) {
      return;
    }
    // If at max length (6 digits + dash + letters), block extra input
    if (value.length >= 10 && !["Backspace", "Delete"].includes(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setTouched(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          inputMode="text"
          className={cn(
            "w-full h-14 px-4 rounded-lg border-2 text-2xl font-mono font-bold tracking-[0.15em] uppercase text-center",
            "focus:outline-none focus:ring-2 focus:ring-teal transition-all",
            isValid
              ? "border-emerald-500 bg-emerald-50/40 text-emerald-700"
              : touched && value.length > 0
                ? "border-amber-400 bg-amber-50/30"
                : "border-input bg-background text-foreground",
            className
          )}
          aria-label="Oman vehicle plate number"
          maxLength={10}
        />
        {/* Region badge */}
        {region && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md bg-teal text-white text-[0.65rem] font-semibold">
            {region.name}
          </div>
        )}
      </div>

      {/* Helper / status text */}
      <div className="flex items-center justify-between text-[0.65rem] px-1">
        <div className="text-muted-foreground">
          Format: <span className="font-mono">1–6 digits</span> →{" "}
          <span className="font-mono">-</span> → <span className="font-mono">region letter</span>
        </div>
        <div>
          {isValid ? (
            <span className="text-emerald-600 font-medium flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Valid plate
            </span>
          ) : value.length > 0 ? (
            <span className="text-amber-600 font-medium">
              {digits.length < 1
                ? "Enter digits first"
                : !value.includes("-")
                  ? "Type region letter (auto-inserts dash)"
                  : "Enter region letter (A–K)"}
            </span>
          ) : (
            <span className="text-muted-foreground">Awaiting input…</span>
          )}
        </div>
      </div>
    </div>
  );
}

export { OMAN_REGIONS };
