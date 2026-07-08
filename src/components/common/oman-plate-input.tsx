"use client";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

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
  const cleaned = raw.toUpperCase().replace(/[^0-9A-Z-]/g, "");

  // If no dash yet, only allow digits (max 6)
  if (!cleaned.includes("-")) {
    const digits = cleaned.replace(/[^0-9]/g, "").slice(0, 6);
    if (digits.length === 6) {
      return digits + "-"; // auto-insert dash after 6 digits
    }
    return digits;
  }

  // Has dash — split into digits and letters
  const dashIndex = cleaned.indexOf("-");
  const digits = cleaned.slice(0, dashIndex).replace(/[^0-9]/g, "").slice(0, 6);
  const letters = cleaned.slice(dashIndex + 1).replace(/[^A-Z]/g, "");

  if (!digits) return "";
  if (!letters) return digits + "-";
  return `${digits}-${letters}`;
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
  placeholder = "e.g. 123456-A",
  className,
  autoFocus,
}: OmanPlateInputProps) {
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const digits = (value.match(/^[0-9]+/) || [""])[0];
  const letters = (value.match(/-([A-Z]+)$/) || ["", ""])[1];
  const region = letters ? OMAN_REGIONS.find((r) => r.code === letters[0]) : null;

  const isValid = /^\d{6}-[A-Z]+$/.test(value);

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
    if (["Tab", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Backspace", "Delete"].includes(e.key)) {
      return;
    }
    // Block if at max length
    if (value.length >= 9 && !["Backspace", "Delete"].includes(e.key)) {
      e.preventDefault();
      return;
    }
    // Block letters if no dash yet (still in digit section)
    if (!value.includes("-") && /[A-Za-z]/.test(e.key)) {
      e.preventDefault();
    }
    // Block digits after dash (only letters allowed in region section)
    if (value.includes("-") && value.endsWith("-") && /[0-9]/.test(e.key)) {
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
          maxLength={9}
        />
        {region && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md bg-teal text-white text-[0.65rem] font-semibold">
            {region.name}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[0.65rem] px-1">
        <div className="text-muted-foreground">
          Format: <span className="font-mono">6 digits</span> →{" "}
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
              {digits.length < 6
                ? `Enter ${6 - digits.length} more digit${6 - digits.length === 1 ? "" : "s"}`
                : "Type region letter (A–K)"}
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
