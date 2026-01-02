"use client";

import Link from "next/link";
import { Clock, CheckCircle, AlertCircle, Send, Ban, Mail } from "lucide-react";
import { CardActions, type CardAction } from "./card-actions";
import {
    ClientBadgeSolid,
    StatusBadge,
    SmtpBadge,
    TemplateBadge,
    AudienceBadge,
    CardBadge
} from "./card-badge";
import { cn } from "@/lib/utils";

/**
 * CampaignCard Component
 * 
 * @path src/components/ui-kit/campaign-card.tsx
 * 
 * A reusable card component for displaying email campaigns with:
 * - Brand-aware client badge
 * - Status badges (Draft, Sending, etc.)
 * - SMTP verification status
 * - Clickable Template and Audience badges
 * - Metadata (created/started info)
 * - Standardized action menu
 */

export type CampaignStatus = "DRAFT" | "SCHEDULED" | "SENDING" | "COMPLETED" | "FAILED" | "CANCELLED";

export interface CampaignCardData {
    id: string;
    name: string;
    subject: string | null;
    status: CampaignStatus;
    createdAt: Date | string;
    sentAt: Date | string | null;
    createdBy?: {
        id: string;
        name: string | null;
    } | null;
    startedBy?: {
        id: string;
        name: string | null;
    } | null;
    client: {
        id: string;
        name: string;
        slug: string;
        brandColors?: any;
        smtpVerified: boolean;
    };
    template?: {
        id: string;
        name: string;
    } | null;
    audience?: {
        id: string;
        name: string;
    } | null;
    analytics?: {
        sent: number;
        opened: number;
        clicked: number;
    } | null;
}

export interface CampaignCardProps {
    campaign: CampaignCardData;
    onView?: (campaign: CampaignCardData) => void;
    onEdit?: (campaign: CampaignCardData) => void;
    onDelete?: (campaign: CampaignCardData) => void;
    onDuplicate?: (campaign: CampaignCardData) => void;
    onSendTest?: (campaign: CampaignCardData) => void;
    labels?: {
        view?: string;
        edit?: string;
        delete?: string;
        duplicate?: string;
        sendTest?: string;
        noSubject?: string;
        noTemplate?: string;
        noAudience?: string;
        created?: string;
        started?: string;
    };
}

const defaultLabels = {
    view: "View",
    edit: "Edit Details",
    delete: "Delete",
    duplicate: "Duplicate",
    sendTest: "Send Test",
    noSubject: "No subject",
    noTemplate: "No template assigned",
    noAudience: "No audience assigned",
    created: "Created",
    createdBy: "By",
    started: "Started",
    startedBy: "By",
};

export function CampaignCard({
    campaign,
    onView,
    onEdit,
    onDelete,
    onDuplicate,
    onSendTest,
    labels: customLabels,
}: CampaignCardProps) {
    const labels = { ...defaultLabels, ...customLabels };

    const statusConfig: Record<CampaignStatus, {
        label: string;
        color: "orange" | "blue" | "green" | "red" | "gray";
        icon: any;
    }> = {
        DRAFT: { label: "Draft", color: "orange", icon: Clock },
        SCHEDULED: { label: "Scheduled", color: "blue", icon: Clock },
        SENDING: { label: "Sending", color: "blue", icon: Send },
        COMPLETED: { label: "Completed", color: "green", icon: CheckCircle },
        FAILED: { label: "Failed", color: "red", icon: AlertCircle },
        CANCELLED: { label: "Cancelled", color: "gray", icon: Ban },
    };

    const currentStatus = statusConfig[campaign.status];
    const isDraft = campaign.status === "DRAFT";

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div
            className={cn(
                "group rounded-xl border bg-card overflow-hidden transition-all duration-200 flex flex-col",
                isDraft
                    ? "border-dashed border-amber-500/60 hover:border-solid hover:border-amber-500"
                    : "border-border hover:border-primary/50"
            )}
        >
            <div className="p-4 flex flex-col h-full">
                {/* Header Section */}
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm truncate">{campaign.name}</h3>
                            <CardBadge
                                variant="border"
                                color={currentStatus.color}
                                className="text-[10px] px-1.5 py-0"
                            >
                                <currentStatus.icon className="h-2.5 w-2.5 mr-1" />
                                {currentStatus.label}
                            </CardBadge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                            {campaign.subject || labels.noSubject}
                        </p>
                    </div>

                    <CardActions
                        actions={[
                            {
                                type: "view",
                                label: labels.view,
                                onClick: () => onView?.(campaign),
                            },
                            {
                                type: "edit",
                                label: labels.edit,
                                onClick: () => onEdit?.(campaign),
                            },
                            {
                                type: "duplicate",
                                label: labels.duplicate,
                                onClick: () => onDuplicate?.(campaign),
                            },
                            {
                                type: "sendTest",
                                label: labels.sendTest,
                                onClick: () => onSendTest?.(campaign),
                            },
                            {
                                type: "delete",
                                label: labels.delete,
                                onClick: () => onDelete?.(campaign),
                                danger: true,
                                separatorBefore: true,
                            },
                        ] as CardAction[]}
                    />
                </div>

                {/* Badges Section */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {/* Client Badge */}
                    <Link href={`/dashboard/clients/${campaign.client.slug}`}>
                        <ClientBadgeSolid
                            clientName={campaign.client.name}
                            primaryColor={campaign.client.brandColors?.primary}
                            className="hover:opacity-80 transition-opacity cursor-pointer"
                        />
                    </Link>

                    {/* SMTP Status */}
                    <SmtpBadge
                        verified={campaign.client.smtpVerified}
                        className="cursor-default"
                    />

                    {/* Template Badge */}
                    {campaign.template ? (
                        <Link href={`/dashboard/templates/${campaign.template.id}/editor`}>
                            <TemplateBadge
                                templateName={campaign.template.name}
                                className="hover:opacity-80 transition-opacity cursor-pointer text-blue-600 dark:text-blue-400"
                            />
                        </Link>
                    ) : (
                        <CardBadge variant="border" color="gray" className="opacity-60 italic">
                            {labels.noTemplate}
                        </CardBadge>
                    )}

                    {/* Audience Badge */}
                    {campaign.audience ? (
                        <Link href={`/dashboard/audiences/${campaign.audience.id}`}>
                            <AudienceBadge
                                audienceName={campaign.audience.name}
                                className="hover:opacity-80 transition-opacity cursor-pointer text-purple-600 dark:text-purple-400"
                            />
                        </Link>
                    ) : (
                        <CardBadge variant="border" color="gray" className="opacity-60 italic">
                            {labels.noAudience}
                        </CardBadge>
                    )}
                </div>

                {/* Analytics Snapshot (if available and not draft) */}
                {campaign.analytics && !isDraft && (
                    <div className="grid grid-cols-3 gap-2 py-3 border-t border-dashed mb-3">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Sent</span>
                            <span className="text-sm font-semibold">{campaign.analytics.sent}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Open Rate</span>
                            <span className="text-sm font-semibold">
                                {campaign.analytics.sent > 0
                                    ? Math.round((campaign.analytics.opened / campaign.analytics.sent) * 100)
                                    : 0}%
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Click Rate</span>
                            <span className="text-sm font-semibold">
                                {campaign.analytics.sent > 0
                                    ? Math.round((campaign.analytics.clicked / campaign.analytics.sent) * 100)
                                    : 0}%
                            </span>
                        </div>
                    </div>
                )}

                {/* Metadata Section */}
                <div className="mt-auto pt-3 border-t border-dashed text-xs text-muted-foreground space-y-2">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <span className="text-foreground/50">{labels.created}</span>
                            <span>{formatDate(campaign.createdAt)}</span>
                        </div>
                        {campaign.createdBy && (
                            <div className="flex items-center justify-between opacity-80 pl-2 border-l border-muted-foreground/30">
                                <span className="text-foreground/50 text-[10px]">{labels.createdBy}</span>
                                <span className="text-[10px]">{campaign.createdBy.name || "System"}</span>
                            </div>
                        )}
                    </div>

                    {campaign.sentAt && (
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <span className="text-foreground/50">{labels.started}</span>
                                <span>{formatDate(campaign.sentAt)}</span>
                            </div>
                            {campaign.startedBy && (
                                <div className="flex items-center justify-between opacity-80 pl-2 border-l border-muted-foreground/30">
                                    <span className="text-foreground/50 text-[10px]">{labels.startedBy}</span>
                                    <span className="text-[10px]">{campaign.startedBy.name || "System"}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
