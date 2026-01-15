"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Users, KeyRound, Lock, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { CardBadge } from "@/components/ui-kit/card-badge";
import { getRoleStyle } from "@/lib/dashboard";
import { getRoleIconByName } from "@/components/ui-kit/icon-picker";
import { getColorNameByHex } from "@/components/ui-kit/color-picker";

/**
 * RoleCard Component
 * 
 * A reusable card for displaying user roles and their stats.
 * Follows the dashboard's design language with dashed borders and hover effects.
 */

interface Role {
    id: string;
    name: string;
    description: string | null;
    isSystem: boolean;
    userCount: number;
    permissions: string[];
    icon?: string | null;
    color?: string | null;
}

interface RoleCardProps {
    role: Role;
    onClick: () => void;
    onDelete?: () => void;
    canDelete?: boolean;
    className?: string;
}

export function RoleCard({
    role,
    onClick,
    onDelete,
    canDelete = false,
    className,
}: RoleCardProps) {
    const { t } = useI18n();
    const isSuperAdmin = role.name === "SUPER_ADMIN";
    const roleStyle = getRoleStyle(role.name);

    // Use custom icon/color if available, otherwise fall back to role style
    const hasCustomStyle = role.icon || role.color;
    const RoleIcon = role.icon ? getRoleIconByName(role.icon) : roleStyle.icon;
    const customColor = role.color || undefined;
    const colorName = customColor ? getColorNameByHex(customColor) : roleStyle.color;

    const roleBorderColor = {
        gray: "border-zinc-500/60 hover:border-zinc-500",
        blue: "border-blue-500/60 hover:border-blue-500",
        pink: "border-pink-500/60 hover:border-pink-500",
        orange: "border-orange-500/60 hover:border-orange-500",
        green: "border-green-500/60 hover:border-green-500",
        purple: "border-purple-500/60 hover:border-purple-500",
        cyan: "border-cyan-500/60 hover:border-cyan-500",
        red: "border-red-500/60 hover:border-red-500",
        yellow: "border-yellow-500/60 hover:border-yellow-500",
    }[colorName] || "border-border/60 hover:border-primary/50";

    return (
        <div
            onClick={!isSuperAdmin ? onClick : undefined}
            className={cn(
                "group relative flex flex-col rounded-xl border bg-card overflow-hidden h-full transition-all duration-200",
                roleBorderColor,
                "border-dashed hover:border-solid", // Keep base style but allow solid on hover
                isSuperAdmin ? "opacity-80 cursor-not-allowed" : "cursor-pointer",
                className
            )}
        >
            {/* Lock Indicator only for Super Admin */}
            {isSuperAdmin && (
                <div className="absolute top-3 right-3 text-muted-foreground/40 z-10">
                    <Lock className="h-3.5 w-3.5" />
                </div>
            )}

            {/* Delete Button for deletable roles */}
            {canDelete && onDelete && !isSuperAdmin && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 z-10"
                    title="Delete role"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            )}

            {/* Main Content */}
            <div className="flex flex-col items-center text-center p-5 pt-8 flex-1">
                {/* Icon Header */}
                <div
                    className={cn(
                        "flex h-14 w-14 items-center justify-center rounded-full border mb-4 transition-transform duration-200 group-hover:scale-105",
                        isSuperAdmin
                            ? "bg-neutral-500/10 border-neutral-500/30"
                            : customColor
                                ? "" // Will use inline styles
                                : (
                                    colorName === "blue" ? "bg-blue-500/10 border-blue-500/30" :
                                        colorName === "pink" ? "bg-pink-500/10 border-pink-500/30" :
                                            colorName === "orange" ? "bg-orange-500/10 border-orange-500/30" :
                                                colorName === "green" ? "bg-green-500/10 border-green-500/30" :
                                                    colorName === "purple" ? "bg-purple-500/10 border-purple-500/30" :
                                                        colorName === "cyan" ? "bg-cyan-500/10 border-cyan-500/30" :
                                                            colorName === "red" ? "bg-red-500/10 border-red-500/30" :
                                                                colorName === "yellow" ? "bg-yellow-500/10 border-yellow-500/30" :
                                                                    "bg-primary/5 border-primary/20"
                                )
                    )}
                    style={customColor ? {
                        backgroundColor: `${customColor}15`,
                        borderColor: `${customColor}40`,
                    } : undefined}
                >
                    <RoleIcon
                        className={cn(
                            "h-6 w-6",
                            !customColor && !isSuperAdmin && (
                                colorName === "blue" ? "text-blue-500" :
                                    colorName === "pink" ? "text-pink-500" :
                                        colorName === "orange" ? "text-orange-500" :
                                            colorName === "green" ? "text-green-500" :
                                                colorName === "purple" ? "text-purple-500" :
                                                    colorName === "cyan" ? "text-cyan-500" :
                                                        colorName === "red" ? "text-red-500" :
                                                            colorName === "yellow" ? "text-yellow-500" :
                                                                "text-primary"
                            ),
                            isSuperAdmin && "text-neutral-500"
                        )}
                        style={customColor ? { color: customColor } : undefined}
                    />
                </div>

                {/* Role Info */}
                <h3 className="text-lg font-bold mb-2">
                    {(t.roles.names as any)?.[role.name] || role.name}
                </h3>

                <div className="mb-6">
                    {isSuperAdmin ? (
                        <CardBadge variant="pill-border" color="gray" size="sm">
                            {t.roles.systemRole}
                        </CardBadge>
                    ) : (
                        <CardBadge variant="pill-border" color={colorName === "yellow" ? "orange" : colorName} size="sm">
                            {t.roles.customRole}
                        </CardBadge>
                    )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-center gap-3 w-full">
                    <CardBadge variant="flat" color="gray" size="sm" icon={<Users className="h-3.5 w-3.5" />}>
                        {role.userCount}
                    </CardBadge>

                    <CardBadge variant="flat" color="purple" size="sm" icon={<KeyRound className="h-3.5 w-3.5" />}>
                        {isSuperAdmin ? t.roles.allPermissions : role.permissions.length}
                    </CardBadge>
                </div>
            </div>

            {/* Footer Action */}
            <div className={cn(
                "mt-auto border-t py-2.5 flex items-center justify-center text-xs font-medium transition-colors duration-200",
                isSuperAdmin
                    ? "bg-muted/30 text-muted-foreground/60 border-border/50"
                    : "bg-muted/5 text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary border-border/50 cursor-pointer"
            )}>
                {isSuperAdmin ? (
                    <span>{t.roles.cannotBeModified}</span>
                ) : (
                    <span className="flex items-center gap-1.5">
                        {t.roles.editPermissions}
                    </span>
                )}
            </div>
        </div>
    );
}
