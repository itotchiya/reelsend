"use client";

import { cn } from "@/lib/utils";
import { Users, Calendar, Check } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { CardBadge, CampaignBadge, NotUsedBadge, CountBadge } from "./card-badge";
import { StandardCardActions } from "./card-actions";

/**
 * SegmentCard Component
 * 
 * @path src/components/ui-kit/segment-card.tsx
 * 
 * A reusable card component for displaying segments with:
 * - Segment name and description
 * - Contact count badge
 * - Campaign usage badges
 * - Orange dashed border if NOT used in any campaign (solid on hover)
 * - Consistent styling with other ui-kit cards
 */

export interface SegmentCampaign {
    id: string;
    name: string;
}

export interface SegmentCardData {
    id: string;
    name: string;
    description: string | null;
    createdAt: string | Date;
    createdBy: {
        id: string;
        name: string | null;
        email: string;
    } | null;
    campaigns?: SegmentCampaign[];
    _count: {
        contacts: number;
    };
}

export interface SegmentCardProps {
    segment: SegmentCardData;
    onView?: (segment: SegmentCardData) => void;
    onClick?: (segment: SegmentCardData) => void;
    onEdit?: (segment: SegmentCardData) => void;
    onDelete?: (segment: SegmentCardData) => void;
    canEdit?: boolean;
    canDelete?: boolean;
    selected?: boolean;
    selectable?: boolean;
    labels?: {
        viewSegment?: string;
        edit?: string;
        delete?: string;
        contacts?: string;
        notUsed?: string;
    };
    className?: string;
}

export function SegmentCard({
    segment,
    onView,
    onClick,
    onEdit,
    onDelete,
    canEdit = true,
    canDelete = true,
    selected = false,
    selectable = false,
    labels: customLabels,
    className,
}: SegmentCardProps) {
    const { t } = useI18n();

    const defaultLabels = {
        viewSegment: t.cards?.common?.view || "View Segment",
        edit: t.cards?.common?.edit || "Edit",
        delete: t.cards?.common?.delete || "Delete",
        contacts: t.cards?.audience?.contacts || "Contacts",
        notUsed: t.cards?.audience?.notUsed || "Not Used",
    };

    const labels = { ...defaultLabels, ...customLabels };

    const campaignCount = segment.campaigns?.length || 0;
    const isUsedInCampaign = campaignCount > 0;

    // Orange dashed border if NOT used in campaign - solid on hover
    const hasWarningBorder = !isUsedInCampaign;

    const borderClasses = cn(
        "border-dashed",
        hasWarningBorder
            ? "border-orange-500/60 hover:border-solid hover:border-orange-500"
            : "border-purple-500/60 hover:border-solid hover:border-purple-500"
    );

    const formatDate = (dateStr: string | Date) => {
        const date = new Date(dateStr);
        return `${date.toLocaleDateString('fr-FR')} - ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
    };

    const handleClick = () => {
        if (onClick) {
            onClick(segment);
        } else if (onView) {
            onView(segment);
        }
    };

    return (
        <div
            className={cn(
                "group rounded-xl border bg-card text-card-foreground transition-all duration-200",
                borderClasses,
                "relative overflow-hidden",
                selected && "ring-2 ring-primary border-primary border-solid",
                // selectable && "hover:ring-2 hover:ring-primary/50", // Removed per user request
                className
            )}
            onClick={handleClick}
        >
            {selectable && selected && (
                <div className="absolute top-3 right-3 z-10 bg-primary text-primary-foreground rounded-full p-1 shadow-md animate-in fade-in zoom-in duration-200">
                    <Check className="h-3.5 w-3.5" />
                </div>
            )}
            {/* Card Header */}
            <div className="p-4 flex-1 flex flex-col">
                {/* Title Row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{segment.name}</h3>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {segment.description || t.cards?.common?.noDescription || "No description"}
                        </p>
                    </div>

                    {(onEdit || onDelete) && (
                        <StandardCardActions
                            item={segment}
                            onView={onView}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            canEdit={canEdit}
                            canDelete={canDelete}
                            labels={{
                                view: labels.viewSegment,
                                edit: labels.edit,
                                delete: labels.delete,
                            }}
                        />
                    )}
                </div>

                {/* Contact Count Badge */}
                <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/10 text-blue-600">
                        <Users className="h-3.5 w-3.5" />
                        <span className="text-xs font-semibold">
                            {segment._count.contacts} {labels.contacts}
                        </span>
                    </div>
                </div>

                {/* Badges Section - Campaign Usage */}
                <div className="flex flex-wrap gap-1.5 flex-1 content-start">
                    {isUsedInCampaign ? (
                        <>
                            {segment.campaigns!.slice(0, 2).map((campaign) => (
                                <CampaignBadge
                                    key={campaign.id}
                                    campaignName={campaign.name}
                                />
                            ))}
                            {campaignCount > 2 && (
                                <CountBadge count={campaignCount - 2} />
                            )}
                        </>
                    ) : (
                        <NotUsedBadge label={labels.notUsed} />
                    )}
                </div>
            </div>

            {/* Metadata Footer */}
            <div className="px-4 py-3 border-t border-dashed border-border/60 text-xs text-muted-foreground bg-muted/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(segment.createdAt)}</span>
                    </div>
                    <span>
                        {segment.createdBy?.name || segment.createdBy?.email || "—"}
                    </span>
                </div>
            </div>
        </div>
    );
}
