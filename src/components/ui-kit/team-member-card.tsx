"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Calendar, Shield, Clock } from "lucide-react";
import { format } from "date-fns";
import { useI18n } from "@/lib/i18n";
import { CardBadge, StatusBadge } from "@/components/ui-kit/card-badge";
import { StandardCardActions } from "@/components/ui-kit/card-actions";

import { getRoleStyle } from "@/lib/dashboard";

/**
 * TeamMemberCard Component
 * 
 * A reusable card for displaying team members.
 * Follows the dashboard's design language with dashed borders and hover effects.
 */

interface Role {
    id: string;
    name: string;
}

interface User {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    status: string;
    roleId: string | null;
    createdAt: string;
    invitationSentAt: string | null;
    joinedAt: string | null;
    role: Role | null;
}

interface TeamMemberCardProps {
    user: User;
    isSelf: boolean;
    onEdit: (user: User) => void;
    onDelete: (user: User) => void;
    className?: string;
}

export function TeamMemberCard({
    user,
    isSelf,
    onEdit,
    onDelete,
    className,
}: TeamMemberCardProps) {
    const { t } = useI18n();
    const roleStyle = getRoleStyle(user.role?.name || "");
    const RoleIcon = roleStyle.icon;

    const initials = user.name
        ? user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : user.email?.slice(0, 2).toUpperCase() || "??";

    const joinedDate = user.joinedAt ? format(new Date(user.joinedAt), "MMM d, yyyy HH:mm") : null;
    const invitationDate = user.invitationSentAt ? format(new Date(user.invitationSentAt), "MMM d, yyyy") : null;

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
            onClick={() => onEdit(user)}
            className={cn(
                "group relative rounded-xl border border-dashed bg-card p-6 overflow-hidden",
                roleBorderColor,
                "hover:border-solid hover:shadow-none transition-all duration-200 cursor-pointer",
                className
            )}
        >
            {/* Actions */}
            {!isSelf && (
                <div className="absolute top-4 right-4 z-20" onClick={(e) => e.stopPropagation()}>
                    <StandardCardActions
                        item={user}
                        onEdit={() => onEdit(user)}
                        onDelete={() => onDelete(user)}
                        canEdit={true}
                        canDelete={true}
                        labels={{
                            edit: (t.team.changeRole as string),
                            delete: (t.team.removeMember as string),
                        }}
                    />
                </div>
            )}

            <div className="flex flex-col items-center text-center">
                {/* Avatar & Status */}
                <div className="relative mb-4">
                    <Avatar className="h-20 w-20 border-2 border-background shadow-none group-hover:scale-105 transition-transform duration-200">
                        <AvatarImage src={user.image || ""} />
                        <AvatarFallback className="text-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 text-indigo-500">
                            {initials}
                        </AvatarFallback>
                    </Avatar>

                    {/* Status Dot */}
                    <div className={cn(
                        "absolute bottom-0 right-0 h-5 w-5 border-2 border-background rounded-full z-10",
                        user.status === "ACTIVE" ? "bg-green-500" : "bg-amber-500"
                    )} title={user.status === "ACTIVE" ? t.team.statusActive : t.team.statusInvited} />
                </div>

                {/* Name & Email */}
                <h3 className="text-lg font-bold truncate w-full px-2 mb-1">
                    {user.name || t.team.unnamedUser} {isSelf && <span className="text-primary font-medium">{t.team.you}</span>}
                </h3>

                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-5 px-4 w-full justify-center">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate max-w-[200px]">{user.email}</span>
                </div>

                {/* Badges Flow */}
                <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                    <CardBadge
                        variant="pill-border"
                        color={roleStyle.color}
                        icon={<RoleIcon className="h-3 w-3" />}
                    >
                        {(t.roles.names as any)?.[user.role?.name || ""] || user.role?.name || t.team.noRole}
                    </CardBadge>

                    {user.status === "INVITED" && (
                        <StatusBadge status="pending">
                            {t.team.pending}
                        </StatusBadge>
                    )}
                </div>

                {/* Dates footer */}
                <div className="mt-auto w-full pt-4 border-t border-dashed border-border/60 flex flex-col items-center gap-1.5 text-[10px] text-muted-foreground/70">
                    {invitationDate && (
                        <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            <span>{t.team.invitationSent} {invitationDate}</span>
                        </div>
                    )}
                    {joinedDate && (
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            <span>{t.team.joined} {joinedDate}</span>
                        </div>
                    )}
                    {!invitationDate && !joinedDate && (
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            <span>{t.team.joined} {format(new Date(user.createdAt), "MMM d, yyyy")}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
