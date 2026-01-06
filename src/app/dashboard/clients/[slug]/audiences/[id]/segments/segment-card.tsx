"use client";

import { CardBadge } from "@/components/ui-kit/card-badge";
import { CardActions, CardAction } from "@/components/ui-kit/card-actions";
import { Users, Calendar } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface Segment {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    createdBy: {
        id: string;
        name: string | null;
        email: string;
    } | null;
    campaigns: { id: string; name: string }[];
    _count: {
        contacts: number;
    };
}

interface SegmentCardProps {
    segment: Segment;
    clientSlug: string;
    onEdit: () => void;
    onDelete: () => void;
}

export function SegmentCard({ segment, clientSlug, onEdit, onDelete }: SegmentCardProps) {
    const { t } = useI18n();

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="group rounded-xl border border-border bg-card overflow-hidden transition-all duration-200 hover:border-primary/50">
            {/* Card Header */}
            <div className="p-4">
                {/* Title Row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{segment.name}</h3>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {segment.description || t.cards?.common?.noDescription || "No description"}
                        </p>
                    </div>
                    <CardActions
                        actions={[
                            {
                                type: "edit",
                                label: t.cards?.common?.edit || "Edit",
                                onClick: onEdit,
                            },
                            {
                                type: "delete",
                                label: t.cards?.common?.delete || "Delete",
                                onClick: onDelete,
                                danger: true,
                                separatorBefore: true,
                            },
                        ] as CardAction[]}
                    />
                </div>

                {/* Contact Count */}
                <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/10 text-blue-600">
                        <Users className="h-3.5 w-3.5" />
                        <span className="text-xs font-semibold">
                            {segment._count.contacts} {t.cards?.audience?.contacts || "contacts"}
                        </span>
                    </div>
                </div>

                {/* Badges - Campaigns */}
                {segment.campaigns.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {segment.campaigns.slice(0, 3).map((campaign) => (
                            <CardBadge key={campaign.id} variant="border" color="green" className="text-[10px]">
                                {campaign.name}
                            </CardBadge>
                        ))}
                        {segment.campaigns.length > 3 && (
                            <CardBadge variant="border" color="gray" className="text-[10px]">
                                +{segment.campaigns.length - 3} {t.common?.more || ""}
                            </CardBadge>
                        )}
                    </div>
                )}
            </div>

            {/* Metadata Footer */}
            <div className="px-4 py-3 border-t border-dashed text-xs text-muted-foreground bg-muted/20">
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
