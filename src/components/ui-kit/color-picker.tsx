"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

// Preset color palette for roles
export const ROLE_COLORS = [
    { name: "gray", hex: "#6B7280", label: "Neutral" },
    { name: "blue", hex: "#3B82F6", label: "Blue" },
    { name: "cyan", hex: "#06B6D4", label: "Cyan" },
    { name: "green", hex: "#10B981", label: "Green" },
    { name: "yellow", hex: "#F59E0B", label: "Amber" },
    { name: "orange", hex: "#F97316", label: "Orange" },
    { name: "red", hex: "#EF4444", label: "Red" },
    { name: "pink", hex: "#EC4899", label: "Pink" },
    { name: "purple", hex: "#8B5CF6", label: "Purple" },
] as const;

export type RoleColorName = typeof ROLE_COLORS[number]["name"];

interface ColorPickerProps {
    value?: string;
    onChange: (colorHex: string) => void;
    className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
    return (
        <div className={cn("flex flex-wrap gap-3", className)}>
            {ROLE_COLORS.map(({ name, hex, label }) => (
                <button
                    key={name}
                    type="button"
                    onClick={() => onChange(hex)}
                    className={cn(
                        "relative w-10 h-10 rounded-full transition-all duration-200",
                        value === hex
                            ? "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110"
                            : "hover:scale-105 hover:ring-2 hover:ring-offset-1 hover:ring-border/50"
                    )}
                    style={{ backgroundColor: hex }}
                    title={label}
                >
                    {value === hex && (
                        <Check className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow-none" />
                    )}
                </button>
            ))}
        </div>
    );
}

// Helper function to get color name by hex
export function getColorNameByHex(hex: string): RoleColorName {
    const found = ROLE_COLORS.find((c) => c.hex === hex);
    return found?.name || "gray";
}
