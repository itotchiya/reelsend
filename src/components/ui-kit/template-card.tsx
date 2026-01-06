"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Mail, AlertCircle } from "lucide-react";
import { CardActions, type CardAction } from "./card-actions";
import { ClientBadgeSolid, CampaignBadge, NotUsedBadge, CardBadge, AIGeneratedBadge, UnassignedDashedBadge } from "./card-badge";
import { cn } from "@/lib/utils";

/**
 * TemplateCard Component
 * 
 * @path src/components/ui-kit/template-card.tsx
 * 
 * A reusable card component for displaying email templates with:
 * - HTML preview via iframe
 * - Hover overlay with action button
 * - Responsive badges section (client with brand color, campaigns, status)
 * - Compact metadata section (created/edited info)
 * - Dropdown menu with actions
 */

export interface TemplateCardClient {
    id: string;
    name: string;
    slug: string;
    primaryColor?: string | null;
}

export interface TemplateCardCampaign {
    id: string;
    name: string;
}

export interface TemplateCardUser {
    id: string;
    name: string | null;
}

export interface TemplateCardData {
    id: string;
    name: string;
    description: string | null;
    htmlContent: string | null;
    client: TemplateCardClient | null;
    campaigns: TemplateCardCampaign[];
    createdBy: TemplateCardUser | null;
    updatedBy: TemplateCardUser | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    isAIGenerated?: boolean;
}

export interface TemplateCardProps {
    template: TemplateCardData;
    onOpen?: (template: TemplateCardData) => void;
    onEdit?: (template: TemplateCardData) => void;
    onDuplicate?: (template: TemplateCardData) => void;
    onDelete?: (template: TemplateCardData) => void;
    onViewActivity?: (template: TemplateCardData) => void;
    labels?: {
        openEditor?: string;
        editDetails?: string;
        duplicate?: string;
        viewActivity?: string;
        delete?: string;
        noPreview?: string;
        noDescription?: string;
        notYetEdited?: string;
        unassigned?: string;
        createdBy?: string;
        editedBy?: string;
        aiGenerated?: string;
        notAssigned?: string;
    };
}

const defaultLabels = {
    openEditor: "Open Editor",
    editDetails: "Edit Details",
    duplicate: "Duplicate",
    viewActivity: "View Activity",
    delete: "Delete",
    noPreview: "No preview available",
    noDescription: "No description",
    notYetEdited: "Not yet edited",
    unassigned: "Unassigned",
    createdBy: "Created by",
    editedBy: "Edited by",
    aiGenerated: "AI Generated",
    notAssigned: "Not Assigned",
};



export function TemplateCard({
    template,
    onOpen,
    onEdit,
    onDuplicate,
    onDelete,
    onViewActivity,
    labels: customLabels,
}: TemplateCardProps) {
    const labels = { ...defaultLabels, ...customLabels };
    const [isDuplicating, setIsDuplicating] = useState(false);

    const handleDuplicate = async () => {
        if (onDuplicate) {
            setIsDuplicating(true);
            try {
                await onDuplicate(template);
            } finally {
                setIsDuplicating(false);
            }
        }
    };

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
                "group rounded-xl border bg-card overflow-hidden transition-all duration-200",
                !template.htmlContent
                    ? "border-dashed border-orange-500/60 hover:border-solid hover:border-orange-500"
                    : "border-border hover:border-primary/50"
            )}
        >
            {/* Email Preview Area */}
            <div
                className="relative h-56 bg-muted/30 overflow-hidden cursor-pointer"
                onClick={(e) => {
                    e.stopPropagation();
                    onOpen?.(template);
                }}
            >
                {template.htmlContent ? (
                    <div className="absolute inset-0 overflow-hidden">
                        <iframe
                            srcDoc={template.htmlContent}
                            className="w-full h-[450px] border-0 pointer-events-none"
                            title={`Preview of ${template.name}`}
                            sandbox="allow-same-origin"
                            scrolling="no"
                            style={{
                                transform: 'scale(0.5)',
                                transformOrigin: 'top left',
                                width: '200%',
                                overflow: 'hidden'
                            }}
                        />
                    </div>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-amber-50/30 dark:bg-amber-950/10">
                        <Mail className="h-10 w-10 text-muted-foreground/40" />
                        <span className="text-xs text-muted-foreground">{labels.noPreview}</span>
                    </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-900 bg-white hover:bg-gray-100 transition-colors cursor-pointer">
                        <ExternalLink className="h-4 w-4" />
                        {labels.openEditor}
                    </button>
                </div>
            </div>

            {/* Card Footer */}
            <div className="p-4">
                {/* Title Row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{template.name}</h3>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {template.description || labels.noDescription}
                        </p>
                    </div>

                    {/* More Options Dropdown */}
                    <CardActions
                        actions={[
                            {
                                type: "openEditor",
                                label: labels.openEditor,
                                onClick: () => onOpen?.(template),
                            },
                            {
                                type: "edit",
                                label: labels.editDetails,
                                onClick: () => onEdit?.(template),
                            },
                            {
                                type: "duplicate",
                                label: labels.duplicate,
                                onClick: handleDuplicate,
                                disabled: isDuplicating,
                            },
                            {
                                type: "viewActivity",
                                label: labels.viewActivity,
                                onClick: () => onViewActivity?.(template),
                            },
                            {
                                type: "delete",
                                label: labels.delete,
                                onClick: () => onDelete?.(template),
                                danger: true,
                                separatorBefore: true,
                            },
                        ] as CardAction[]}
                    />
                </div>

                {/* Badges Section - Responsive wrap, show ALL badges */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {/* AI Generated Badge */}
                    {template.isAIGenerated && (
                        <AIGeneratedBadge label={labels.aiGenerated} />
                    )}

                    {/* Client Badge - Filled with primary color, or Not Assigned */}
                    {template.client ? (
                        <Link
                            href={`/dashboard/clients/${template.client.slug}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ClientBadgeSolid
                                clientName={template.client.name}
                                primaryColor={template.client.primaryColor}
                                className="hover:opacity-80 transition-opacity cursor-pointer"
                            />
                        </Link>
                    ) : (
                        <UnassignedDashedBadge label={labels.notAssigned} />
                    )}

                    {/* Not Edited Badge - Only show if no content */}
                    {!template.htmlContent && (
                        <NotUsedBadge
                            label={labels.notYetEdited}
                            badgeIcon={<AlertCircle className="h-3 w-3" />}
                        />
                    )}

                    {/* ALL Campaign Badges - Clickable */}
                    {template.campaigns.map((campaign) => (
                        <Link
                            key={campaign.id}
                            href={`/dashboard/campaigns/${campaign.id}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <CampaignBadge
                                campaignName={campaign.name}
                            />
                        </Link>
                    ))}
                </div>

                {/* Metadata Section */}
                <div className="pt-3 border-t border-dashed text-xs text-muted-foreground">
                    {/* Created info */}
                    <div className="flex items-center justify-between">
                        <span className="text-foreground/50">{labels.createdBy}</span>
                        <span>
                            {template.createdBy?.name || "—"} · {formatDate(template.createdAt)}
                        </span>
                    </div>
                    {/* Divider */}
                    <div className="border-t border-dashed my-2" />
                    {/* Edited info */}
                    <div className="flex items-center justify-between">
                        <span className="text-foreground/50">{labels.editedBy}</span>
                        <span>
                            {template.updatedBy?.name || "—"} · {formatDate(template.updatedAt)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
