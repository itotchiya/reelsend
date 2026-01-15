"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
    Shield,
    ShieldCheck,
    User,
    Users,
    Crown,
    Star,
    Heart,
    Settings,
    Eye,
    Edit,
    Palette,
    Megaphone,
    Building,
    Briefcase,
    Layers,
    Grid,
    UserCog,
    Mail,
    BarChart3,
    FileText,
    Globe,
    Lock,
    Key,
    Zap,
    Target,
    Award,
    Bookmark,
    Flag,
    Bell,
    Rocket,
    Sparkles,
    Fingerprint,
} from "lucide-react";

// Curated list of icons suitable for roles
export const ROLE_ICONS = [
    { name: "Shield", icon: Shield },
    { name: "ShieldCheck", icon: ShieldCheck },
    { name: "User", icon: User },
    { name: "Users", icon: Users },
    { name: "Crown", icon: Crown },
    { name: "Star", icon: Star },
    { name: "Heart", icon: Heart },
    { name: "Settings", icon: Settings },
    { name: "Eye", icon: Eye },
    { name: "Edit", icon: Edit },
    { name: "Palette", icon: Palette },
    { name: "Megaphone", icon: Megaphone },
    { name: "Building", icon: Building },
    { name: "Briefcase", icon: Briefcase },
    { name: "Layers", icon: Layers },
    { name: "Grid", icon: Grid },
    { name: "UserCog", icon: UserCog },
    { name: "Mail", icon: Mail },
    { name: "BarChart3", icon: BarChart3 },
    { name: "FileText", icon: FileText },
    { name: "Globe", icon: Globe },
    { name: "Lock", icon: Lock },
    { name: "Key", icon: Key },
    { name: "Zap", icon: Zap },
    { name: "Target", icon: Target },
    { name: "Award", icon: Award },
    { name: "Bookmark", icon: Bookmark },
    { name: "Flag", icon: Flag },
    { name: "Bell", icon: Bell },
    { name: "Rocket", icon: Rocket },
    { name: "Sparkles", icon: Sparkles },
    { name: "Fingerprint", icon: Fingerprint },
] as const;

export type RoleIconName = typeof ROLE_ICONS[number]["name"];

interface IconPickerProps {
    value?: string;
    onChange: (iconName: string) => void;
    color?: string;
    className?: string;
}

export function IconPicker({ value, onChange, color = "#6B7280", className }: IconPickerProps) {
    return (
        <div className={cn("grid grid-cols-6 sm:grid-cols-8 gap-3", className)}>
            {ROLE_ICONS.map(({ name, icon: Icon }) => (
                <button
                    key={name}
                    type="button"
                    onClick={() => onChange(name)}
                    className={cn(
                        "flex items-center justify-center p-4 rounded-2xl border transition-all duration-200",
                        value === name
                            ? "border-transparent"
                            : "border-border/40 hover:border-border/80 hover:bg-muted/30"
                    )}
                    style={{
                        backgroundColor: value === name ? `${color}15` : undefined,
                        boxShadow: value === name ? `0 0 0 2px ${color}` : undefined,
                    }}
                >
                    <Icon
                        className="h-5 w-5"
                        style={{ color: value === name ? color : undefined }}
                    />
                </button>
            ))}
        </div>
    );
}

// Helper function to get icon component by name
export function getRoleIconByName(name: string) {
    const found = ROLE_ICONS.find((i) => i.name === name);
    return found?.icon || Shield;
}
