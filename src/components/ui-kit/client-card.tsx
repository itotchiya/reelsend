"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import { CardBadge, SmtpBadge } from "./card-badge";
import { StandardCardActions } from "./card-actions";
import { getContrastColor } from "@/lib/colors";

/**
 * ClientCard Component
 * 
 * @path src/components/ui-kit/client-card.tsx
 * 
 * A reusable card component for displaying clients with:
 * - Avatar/logo preview with hover overlay
 * - Status badges (active/suspended/deactivated, public/private, SMTP)
 * - Stats section (campaigns, audiences, templates counts)
 * - Dropdown menu with actions
 * - Red dashed border for non-verified SMTP
 */

export interface ClientCardData {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    brandColors?: { primary?: string; secondary?: string } | null;
    active: boolean;
    status: string;
    isPublic: boolean;
    smtpVerified: boolean;
    _count: {
        audiences: number;
        campaigns: number;
        templates: number;
    };
}

export interface ClientCardProps {
    client: ClientCardData;
    onView?: (client: ClientCardData) => void;
    onEdit?: (client: ClientCardData) => void;
    onDelete?: (client: ClientCardData) => void;
    canEdit?: boolean;
    canDelete?: boolean;
    labels?: {
        viewClient?: string;
        edit?: string;
        delete?: string;
        active?: string;
        suspended?: string;
        deactivated?: string;
        public?: string;
        private?: string;
        smtpVerified?: string;
        smtpNotVerified?: string;
        campaigns?: string;
        audiences?: string;
        templates?: string;
    };
}

const defaultLabels = {
    viewClient: "View Client",
    edit: "Edit",
    delete: "Delete",
    active: "Active",
    suspended: "Suspended",
    deactivated: "Deactivated",
    public: "Public",
    private: "Private",
    smtpVerified: "SMTP Verified",
    smtpNotVerified: "SMTP Required",
    campaigns: "Campaigns",
    audiences: "Audiences",
    templates: "Templates",
};

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

function getStatusConfig(status: string, active: boolean) {
    const normalizedStatus = status?.toLowerCase() || (active ? "active" : "deactivated");

    switch (normalizedStatus) {
        case "active":
            return {
                label: "active",
                bgClass: "bg-blue-500/10",
                textClass: "text-blue-600",
                borderClass: "border-blue-500/20",
                dotClass: "bg-blue-500",
            };
        case "suspended":
            return {
                label: "suspended",
                bgClass: "bg-yellow-500/10",
                textClass: "text-yellow-600",
                borderClass: "border-yellow-500/20",
                dotClass: "bg-yellow-500",
            };
        default:
            return {
                label: "deactivated",
                bgClass: "bg-red-500/10",
                textClass: "text-red-600",
                borderClass: "border-red-500/20",
                dotClass: "bg-red-500",
            };
    }
}

export function ClientCard({
    client,
    onView,
    onEdit,
    onDelete,
    canEdit = true,
    canDelete = true,
    labels: customLabels,
}: ClientCardProps) {
    const labels = { ...defaultLabels, ...customLabels };
    const statusConfig = getStatusConfig(client.status, client.active);

    // Red dashed border only for non-verified SMTP
    const hasWarningBorder = !client.smtpVerified;

    return (
        <div
            className={cn(
                "group rounded-xl border bg-card p-4 transition-all duration-200 cursor-pointer h-full flex flex-col",
                hasWarningBorder
                    ? "border-dashed border-red-500/60 hover:border-solid hover:border-red-500"
                    : "border-border hover:border-primary/50"
            )}
            onClick={() => onView?.(client)}
        >
            {/* Header with Avatar and Info (matches AudienceCard layout) */}
            <div className="flex items-start gap-4">
                {/* Avatar with client brand colors */}
                <Avatar className="h-12 w-12 rounded-xl shrink-0 border">
                    <AvatarImage src={client.logo || ""} className="object-cover" />
                    <AvatarFallback
                        className="rounded-xl text-sm font-bold"
                        style={{
                            backgroundColor: client.brandColors?.primary || '#e4e4e7',
                            color: client.brandColors?.primary
                                ? getContrastColor(client.brandColors.primary)
                                : '#71717a'
                        }}
                    >
                        {getInitials(client.name)}
                    </AvatarFallback>
                </Avatar>

                {/* Info Container */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h3 className="font-semibold text-sm truncate">{client.name}</h3>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                                @{client.slug}
                            </p>
                        </div>

                        {/* More Options Dropdown */}
                        <StandardCardActions
                            item={client}
                            onView={onView}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            canEdit={canEdit}
                            canDelete={canDelete}
                            labels={{
                                view: labels.viewClient,
                                edit: labels.edit,
                                delete: labels.delete,
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Badges Section - Grows to push stats to bottom */}
            <div className="flex flex-wrap gap-1.5 mt-4 flex-1 content-start">
                {/* Status Badge */}
                <CardBadge
                    variant="border"
                    color={statusConfig.label === "active" ? "green" : statusConfig.label === "suspended" ? "orange" : "red"}
                    showDot
                >
                    {labels[statusConfig.label as keyof typeof labels] || statusConfig.label}
                </CardBadge>

                {/* Public/Private Badge */}
                <CardBadge
                    variant="border"
                    color={client.isPublic ? "purple" : "gray"}
                    icon={client.isPublic ? <Unlock className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
                >
                    {client.isPublic ? labels.public : labels.private}
                </CardBadge>

                {/* SMTP Status Badge */}
                <SmtpBadge
                    verified={client.smtpVerified}
                    verifiedLabel={labels.smtpVerified}
                    unverifiedLabel={labels.smtpNotVerified}
                />
            </div>

            {/* Stats Section - Sticky to bottom */}
            <div className="pt-3 mt-4 border-t border-dashed">
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="flex flex-col items-center">
                        <span className="font-semibold text-foreground text-base">
                            {client._count.campaigns.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                            {labels.campaigns}
                        </span>
                    </div>
                    <div className="flex flex-col items-center border-x border-dashed">
                        <span className="font-semibold text-foreground text-base">
                            {client._count.audiences.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                            {labels.audiences}
                        </span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="font-semibold text-foreground text-base">
                            {client._count.templates.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                            {labels.templates}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
