"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Shield, ShieldCheck, Users, KeyRound, Lock } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { CardBadge } from "@/components/ui-kit/card-badge";
import { getRoleStyle } from "@/lib/dashboard";

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
}

interface RoleCardProps {
    role: Role;
    onClick: () => void;
    className?: string;
}

export function RoleCard({
    role,
    onClick,
    className,
}: RoleCardProps) {
    const { t } = useI18n();
    const isSuperAdmin = role.name === "SUPER_ADMIN";
    const roleStyle = getRoleStyle(role.name);
    const RoleIcon = roleStyle.icon;

    const roleBorderColor = {
        gray: "border-zinc-500/60 hover:border-zinc-500",
        blue: "border-blue-500/60 hover:border-blue-500",
        pink: "border-pink-500/60 hover:border-pink-500",
        orange: "border-orange-500/60 hover:border-orange-500",
        green: "border-green-500/60 hover:border-green-500",
        purple: "border-purple-500/60 hover:border-purple-500",
        cyan: "border-cyan-500/60 hover:border-cyan-500",
        red: "border-red-500/60 hover:border-red-500",
    }[roleStyle.color] || "border-border/60 hover:border-primary/50";

    return (
        <div
            onClick={!isSuperAdmin ? onClick : undefined}
            className={cn(
                "group relative rounded-xl border border-dashed bg-card p-6 overflow-hidden flex flex-col h-full",
                roleBorderColor,
                isSuperAdmin
                    ? "opacity-80 cursor-not-allowed"
                    : "hover:border-solid hover:shadow-sm transition-all duration-200 cursor-pointer",
                className
            )}
        >
            {/* Lock Indicator only for Super Admin */}
            {isSuperAdmin && (
                <div className="absolute top-4 right-4 text-muted-foreground/60">
                    <Lock className="h-4 w-4" />
                </div>
            )}

            <div className="flex flex-col items-center text-center flex-1">
                {/* Icon Header */}
                <div className={cn(
                    "flex h-16 w-16 items-center justify-center rounded-full border mb-5 transition-transform duration-200 group-hover:scale-105",
                    isSuperAdmin
                        ? "bg-neutral-500/10 border-neutral-500/30"
                        : roleStyle.color === "blue" ? "bg-blue-500/10 border-blue-500/30" :
                            roleStyle.color === "pink" ? "bg-pink-500/10 border-pink-500/30" :
                                roleStyle.color === "orange" ? "bg-orange-500/10 border-orange-500/30" :
                                    roleStyle.color === "green" ? "bg-green-500/10 border-green-500/30" :
                                        "bg-primary/5 border-primary/20"
                )}>
                    <RoleIcon className={cn(
                        "h-8 w-8",
                        isSuperAdmin ? "text-neutral-500" :
                            roleStyle.color === "blue" ? "text-blue-500" :
                                roleStyle.color === "pink" ? "text-pink-500" :
                                    roleStyle.color === "orange" ? "text-orange-500" :
                                        roleStyle.color === "green" ? "text-green-500" :
                                            "text-primary"
                    )} />
                </div>

                {/* Role Info */}
                <h3 className="text-xl font-bold mb-1">
                    {(t.roles.names as any)?.[role.name] || role.name}
                </h3>

                <div className="mb-4">
                    {isSuperAdmin ? (
                        <CardBadge variant="pill-border" color="gray" size="sm">
                            {t.roles.systemRole}
                        </CardBadge>
                    ) : (
                        <CardBadge variant="pill-border" color={roleStyle.color} size="sm">
                            {t.roles.customRole}
                        </CardBadge>
                    )}
                </div>

                <p className="text-sm text-muted-foreground mb-6 line-clamp-2 px-2">
                    {(t.roles.descriptions as any)?.[role.name] || role.description || t.roles.noDescription}
                </p>

                {/* Stats */}
                <div className="mt-auto w-full pt-5 border-t border-dashed border-border/60 flex items-center justify-center gap-3">
                    <CardBadge variant="flat" color="gray" size="sm" icon={<Users className="h-3 w-3" />}>
                        {role.userCount} {t.roles.usersCount}
                    </CardBadge>

                    <CardBadge variant="flat" color="purple" size="sm" icon={<KeyRound className="h-3 w-3" />}>
                        {isSuperAdmin ? t.roles.allPermissions : role.permissions.length} {t.roles.permissions}
                    </CardBadge>
                </div>

                {/* Interactive Hint */}
                <div className="mt-4 text-xs font-medium transition-colors group-hover:text-primary">
                    {isSuperAdmin ? (
                        <span className="text-muted-foreground/60">{t.roles.cannotBeModified}</span>
                    ) : (
                        <span className="text-muted-foreground group-hover:text-primary">{t.roles.editPermissions}</span>
                    )}
                </div>
            </div>
        </div>
    );
}
