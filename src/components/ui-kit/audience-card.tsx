"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Users, MoreHorizontal, ArrowRight, BarChart3, Check } from "lucide-react";
import { ClientBadge, ClientBadgeSolid, CampaignBadge, NotUsedBadge, CountBadge } from "./card-badge";
import { StandardCardActions } from "./card-actions";
import { getContrastColor } from "@/lib/colors";
import { useI18n } from "@/lib/i18n";

/**
 * AudienceCard Component
 * 
 * @path src/components/ui-kit/audience-card.tsx
 * 
 * A reusable card component for displaying audiences with:
 * - Avatar with client brand colors
 * - Audience name, description, and client badge
 * - Campaign usage badge (clickable)
 * - Stats: contacts, segments
 * - Red dashed border if NOT used in any campaign (solid on hover)
 */

export interface AudienceCampaign {
    id: string;
    name: string;
}

export interface AudienceCardData {
    id: string;
    name: string;
    description: string | null;
    client: {
        id: string;
        name: string;
        slug: string;
        logo: string | null;
        brandColors?: { primary?: string; secondary?: string } | null;
    };
    campaigns?: AudienceCampaign[];
    _count: {
        contacts: number;
        segments: number;
    };
}

export interface AudienceCardProps {
    audience: AudienceCardData;
    onView?: (audience: AudienceCardData) => void;
    onClick?: (audience: AudienceCardData) => void;
    onEdit?: (audience: AudienceCardData) => void;
    onDelete?: (audience: AudienceCardData) => void;
    onCampaignClick?: (campaignId: string) => void;
    canEdit?: boolean;
    canDelete?: boolean;
    selectable?: boolean;
    selected?: boolean;
    labels?: {
        viewAudience?: string;
        edit?: string;
        delete?: string;
        contacts?: string;
        segments?: string;
        notUsed?: string;
        usedIn?: string;
    };
    className?: string; // Added className prop
}

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export function AudienceCard({
    audience,
    onView,
    onClick,
    onEdit,
    onDelete,
    onCampaignClick,
    canEdit = true,
    canDelete = true,
    selectable = false,
    selected = false,
    labels: customLabels,
    className,
}: AudienceCardProps) {
    const { t } = useI18n();

    const defaultLabels = {
        viewAudience: t.cards?.common?.view || "View Audience",
        edit: t.cards?.common?.edit || "Edit",
        delete: t.cards?.common?.delete || "Delete",
        contacts: t.cards?.audience?.contacts || "Contacts",
        segments: t.cards?.audience?.segments || "Segments",
        notUsed: t.cards?.audience?.notUsed || "Not Used",
        usedIn: t.cards?.audience?.usedIn || "Used in",
    };

    const labels = { ...defaultLabels, ...customLabels };
    const router = useRouter();

    const campaignCount = audience.campaigns?.length || 0;
    const isUsedInCampaign = campaignCount > 0;

    // Red dashed border if NOT used in campaign - solid on hover
    const hasWarningBorder = !isUsedInCampaign;

    const primaryColor = audience.client.brandColors?.primary;
    const borderClasses = cn(
        "border-dashed",
        hasWarningBorder
            ? "border-orange-500/60 hover:border-solid hover:border-orange-500"
            : !primaryColor
                ? "border-zinc-500/60 hover:border-solid hover:border-zinc-500"
                : "hover:border-solid"
    );

    const handleCampaignClick = (e: React.MouseEvent, campaignId: string) => {
        e.stopPropagation();

        if (selectable) {
            return;
        }

        if (onCampaignClick) {
            onCampaignClick(campaignId);
        } else {
            router.push(`/dashboard/campaigns/${campaignId}`);
        }
    };

    return (
        <div
            className={cn(
                "group rounded-xl border bg-card text-card-foreground transition-all duration-200",
                borderClasses,
                "relative overflow-hidden",
                "p-4 cursor-pointer h-full flex flex-col", // Preserve original padding, cursor, height, flex-col
                selected && "ring-2 ring-primary border-primary border-solid",
                // selectable && "hover:ring-2 hover:ring-primary/50", // Removed per user request
                className // Apply className
            )}
            style={!hasWarningBorder && primaryColor ? {
                borderColor: `${primaryColor}99` // 60% opacity
            } : undefined}
            onMouseEnter={(e) => {
                if (!hasWarningBorder && primaryColor) {
                    e.currentTarget.style.borderColor = primaryColor;
                }
            }}
            onMouseLeave={(e) => {
                if (!hasWarningBorder && primaryColor) {
                    e.currentTarget.style.borderColor = `${primaryColor}99`;
                }
            }}
            onClick={() => {
                if (onClick) {
                    onClick(audience);
                } else if (onView) {
                    onView(audience);
                }
            }}
        >
            {selectable && selected && (
                <div className="absolute top-3 right-3 z-10 bg-primary text-primary-foreground rounded-full p-1 shadow-md animate-in fade-in zoom-in duration-200">
                    <Check className="h-3.5 w-3.5" />
                </div>
            )}
            {/* Header with Avatar and Info */}
            <div className="flex items-start gap-3">
                {/* Avatar with client brand colors */}
                <Avatar className="h-12 w-12 rounded-xl shrink-0 border">
                    <AvatarImage src={audience.client.logo || ""} className="object-cover" />
                    <AvatarFallback
                        className="rounded-xl text-sm font-bold"
                        style={{
                            backgroundColor: audience.client.brandColors?.primary || '#e4e4e7',
                            color: audience.client.brandColors?.primary
                                ? getContrastColor(audience.client.brandColors.primary)
                                : '#71717a'
                        }}
                    >
                        {getInitials(audience.client.name)}
                    </AvatarFallback>
                </Avatar>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h3 className="font-semibold text-sm truncate">{audience.name}</h3>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {audience.description || "No description"}
                            </p>
                        </div>

                        {/* More Options Dropdown */}
                        <StandardCardActions
                            item={audience}
                            onView={onView}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            canEdit={canEdit}
                            canDelete={canDelete}
                            labels={{
                                view: labels.viewAudience,
                                edit: labels.edit,
                                delete: labels.delete,
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Badges Section - grows to push stats to bottom */}
            <div className="flex flex-wrap gap-1.5 mt-3 flex-1 content-start">
                {/* Client Badge */}
                {/* Client Badge - disable link if selectable */}
                {selectable ? (
                    <div onClick={(e) => e.stopPropagation()}>
                        <ClientBadgeSolid
                            clientName={audience.client.name}
                            primaryColor={audience.client.brandColors?.primary}
                        />
                    </div>
                ) : (
                    <Link
                        href={`/dashboard/clients/${audience.client.slug}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ClientBadgeSolid
                            clientName={audience.client.name}
                            primaryColor={audience.client.brandColors?.primary}
                            className="hover:opacity-80 transition-opacity cursor-pointer"
                        />
                    </Link>
                )}

                {/* Campaign Usage Badge */}
                {isUsedInCampaign ? (
                    audience.campaigns!.slice(0, 2).map((campaign) => (
                        <CampaignBadge
                            key={campaign.id}
                            campaignName={campaign.name}
                            onClick={(e) => handleCampaignClick(e, campaign.id)}
                        />
                    ))
                ) : (
                    <NotUsedBadge
                        label={labels.notUsed}
                    />
                )}

                {/* Show count if more than 2 campaigns */}
                {campaignCount > 2 && (
                    <CountBadge count={campaignCount - 2} />
                )}
            </div>

            {/* Stats Section - sticky to bottom */}
            <div className="pt-3 mt-3 border-t border-dashed border-border/60">
                <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="flex flex-col items-center">
                        <span className="font-semibold text-foreground text-base">
                            {audience._count.contacts.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60">
                            {labels.contacts}
                        </span>
                    </div>
                    <div className="flex flex-col items-center border-l border-dashed border-border/60">
                        <span className="font-semibold text-foreground text-base">
                            {audience._count.segments}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60">
                            {labels.segments}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
