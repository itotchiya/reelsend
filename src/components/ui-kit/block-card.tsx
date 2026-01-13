"use client";

import { useState } from "react";
import { ExternalLink, LayoutGrid, AlertCircle, Globe } from "lucide-react";
import { CardActions, type CardAction } from "./card-actions";
import { CardBadge, ClientBadgeSolid } from "./card-badge";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { renderToStaticMarkup } from "@usewaypoint/email-builder";

/**
 * BlockCard Component
 *
 * @path src/components/ui-kit/block-card.tsx
 *
 * A reusable card component for displaying saved email blocks.
 * Features:
 * - HTML preview via iframe (rendered from jsonContent)
 * - Hover overlay with action button
 * - Category badge
 * - Client badge with brand color OR "Global" badge
 * - Compact metadata section
 * - Dropdown menu with actions
 */

export interface BlockCardClient {
    id: string;
    name: string;
    slug: string;
    primaryColor?: string | null;
}

export interface BlockCardData {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    jsonContent: any;
    thumbnail: string | null;
    client: BlockCardClient | null;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface BlockCardProps {
    block: BlockCardData;
    onOpen?: (block: BlockCardData) => void;
    onEdit?: (block: BlockCardData) => void;
    onDuplicate?: (block: BlockCardData) => void;
    onDelete?: (block: BlockCardData) => void;
}

const categoryColors: Record<string, string> = {
    headers: "purple",
    footers: "blue",
    cta: "orange",
    content: "green",
    images: "pink",
    social: "cyan",
};

export function BlockCard({
    block,
    onOpen,
    onEdit,
    onDuplicate,
    onDelete,
}: BlockCardProps) {
    const { t } = useI18n();
    const [isDuplicating, setIsDuplicating] = useState(false);

    const labels = {
        openEditor: t.blocks?.openEditor || "Open Editor",
        editDetails: t.blocks?.editDetails || "Edit Details",
        duplicate: t.cards?.common?.duplicate || "Duplicate",
        delete: t.cards?.common?.delete || "Delete",
        noPreview: t.blocks?.noPreview || "No preview available",
        noDescription: t.cards?.common?.noDescription || "No description",
        global: t.blocks?.globalBlock || "Global",
    };

    const handleDuplicate = async () => {
        if (onDuplicate) {
            setIsDuplicating(true);
            try {
                await onDuplicate(block);
            } finally {
                setIsDuplicating(false);
            }
        }
    };

    const formatDate = (date: Date | string) => {
        const d = new Date(date);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // Try to render HTML from jsonContent for preview
    let htmlContent: string | null = null;
    try {
        if (block.jsonContent && block.jsonContent.root) {
            htmlContent = renderToStaticMarkup(block.jsonContent, { rootBlockId: 'root' });
        }
    } catch (e) {
        // Fallback if rendering fails
        htmlContent = null;
    }

    const primaryColor = block.client?.primaryColor;
    const categoryColor = categoryColors[block.category?.toLowerCase() || ""] || "gray";

    const borderClasses = cn(
        "border-dashed",
        !htmlContent
            ? "border-orange-500/60 hover:border-solid hover:border-orange-500"
            : !primaryColor
                ? "border-zinc-500/60 hover:border-solid hover:border-zinc-500"
                : "hover:border-solid"
    );

    return (
        <div
            className={cn(
                "group rounded-xl border bg-card overflow-hidden transition-all duration-200 cursor-pointer",
                borderClasses
            )}
            style={htmlContent && primaryColor ? {
                borderColor: `${primaryColor}99`
            } : undefined}
            onMouseEnter={(e) => {
                if (htmlContent && primaryColor) {
                    e.currentTarget.style.borderColor = primaryColor;
                }
            }}
            onMouseLeave={(e) => {
                if (htmlContent && primaryColor) {
                    e.currentTarget.style.borderColor = `${primaryColor}99`;
                }
            }}
        >
            {/* Block Preview Area */}
            <div
                className="relative h-40 bg-muted/30 overflow-hidden cursor-pointer"
                onClick={(e) => {
                    e.stopPropagation();
                    onOpen?.(block);
                }}
            >
                {htmlContent ? (
                    <div className="absolute inset-0 overflow-hidden">
                        <iframe
                            srcDoc={htmlContent}
                            className="w-full h-[320px] border-0 pointer-events-none"
                            title={`Preview of ${block.name}`}
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
                ) : block.thumbnail ? (
                    <div className="absolute inset-0">
                        <img
                            src={block.thumbnail}
                            alt={block.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-amber-50/30 dark:bg-amber-950/10">
                        <LayoutGrid className="h-10 w-10 text-muted-foreground/40" />
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
                        <h3 className="font-semibold text-sm truncate">{block.name}</h3>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {block.description || labels.noDescription}
                        </p>
                    </div>

                    {/* More Options Dropdown */}
                    <CardActions
                        actions={[
                            {
                                type: "openEditor",
                                label: labels.openEditor,
                                onClick: () => onOpen?.(block),
                            },
                            {
                                type: "edit",
                                label: labels.editDetails,
                                onClick: () => onEdit?.(block),
                            },
                            {
                                type: "duplicate",
                                label: labels.duplicate,
                                onClick: handleDuplicate,
                                disabled: isDuplicating,
                            },
                            {
                                type: "delete",
                                label: labels.delete,
                                onClick: () => onDelete?.(block),
                                danger: true,
                                separatorBefore: true,
                            },
                        ] as CardAction[]}
                    />
                </div>

                {/* Badges Section */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {/* Category Badge */}
                    {block.category && (
                        <CardBadge variant="flat" color={categoryColor as any}>
                            {block.category.charAt(0).toUpperCase() + block.category.slice(1)}
                        </CardBadge>
                    )}

                    {/* Client Badge or Global Badge */}
                    {block.client ? (
                        <ClientBadgeSolid
                            clientName={block.client.name}
                            primaryColor={primaryColor}
                        />
                    ) : (
                        <CardBadge variant="border" color="blue">
                            <Globe className="h-3 w-3 mr-1" />
                            {labels.global}
                        </CardBadge>
                    )}

                    {/* Type Badge */}
                    <CardBadge variant="flat" color="purple">
                        Block Component
                    </CardBadge>
                </div>

                {/* Metadata Footer */}
                <div className="pt-3 border-t border-dashed text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                        <span>Updated {formatDate(block.updatedAt)}</span>
                        <span>Created {formatDate(block.createdAt)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
