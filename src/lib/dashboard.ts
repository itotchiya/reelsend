import { Shield, ShieldCheck, Palette, Megaphone, User, type LucideIcon } from "lucide-react";

export interface RoleStyle {
    icon: LucideIcon;
    color: "gray" | "blue" | "pink" | "orange" | "green" | "purple" | "cyan" | "red";
}

export const ROLE_STYLES: Record<string, RoleStyle> = {
    SUPER_ADMIN: {
        icon: ShieldCheck,
        color: "gray",
    },
    ADMIN: {
        icon: Shield,
        color: "blue",
    },
    DESIGNER: {
        icon: Palette,
        color: "pink",
    },
    MARKETER: {
        icon: Megaphone,
        color: "orange",
    },
    CLIENT: {
        icon: User,
        color: "green",
    },
};

export function getRoleStyle(roleName: string): RoleStyle {
    return ROLE_STYLES[roleName] || { icon: Shield, color: "purple" };
}
