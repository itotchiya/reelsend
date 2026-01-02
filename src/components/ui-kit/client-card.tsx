"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import { CardBadge, SmtpBadge } from "./card-badge";
import { StandardCardActions } from "./card-actions";

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
                "group rounded-xl border bg-card overflow-hidden transition-colors cursor-pointer",
                hasWarningBorder
                    ? "border-dashed border-red-500 hover:border-solid hover:border-primary/50"
                    : "border-border hover:border-primary/50"
            )}
            onClick={() => onView?.(client)}
        >
            {/* Header Area with Avatar - Gradient using primary and secondary brand colors */}
            <div
                className="relative h-32 overflow-hidden flex items-center justify-center"
                style={{
                    background: client.brandColors?.primary && client.brandColors?.secondary
                        ? `linear-gradient(135deg, ${client.brandColors.primary} 0%, ${client.brandColors.secondary} 100%)`
                        : client.brandColors?.primary
                            ? client.brandColors.primary
                            : '#f4f4f5'
                }}
            >
                <Avatar className="h-20 w-20 rounded-2xl border-2 border-background">
                    <AvatarImage src={client.logo || ""} className="object-cover" />
                    <AvatarFallback
                        className="rounded-2xl text-2xl font-bold"
                        style={{
                            backgroundColor: client.brandColors?.primary || '#e4e4e7',
                            color: client.brandColors?.primary ? '#ffffff' : '#71717a'
                        }}
                    >
                        {getInitials(client.name)}
                    </AvatarFallback>
                </Avatar>
            </div>

            {/* Card Footer */}
            <div className="p-4">
                {/* Title Row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
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

                {/* Badges Section */}
                <div className="flex flex-wrap gap-1.5 mb-3">
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

                {/* Stats Section - No icons */}
                <div className="pt-3 border-t border-dashed text-xs text-muted-foreground">
                    <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col items-center">
                            <span className="font-semibold text-foreground text-base">
                                {client._count.campaigns}
                            </span>
                            <span className="text-[10px] text-muted-foreground/60">
                                {labels.campaigns}
                            </span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="font-semibold text-foreground text-base">
                                {client._count.audiences}
                            </span>
                            <span className="text-[10px] text-muted-foreground/60">
                                {labels.audiences}
                            </span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="font-semibold text-foreground text-base">
                                {client._count.templates}
                            </span>
                            <span className="text-[10px] text-muted-foreground/60">
                                {labels.templates}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
