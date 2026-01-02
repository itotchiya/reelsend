"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, ExternalLink, Mail, Copy, History, AlertCircle } from "lucide-react";

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
};

// Helper function to get contrasting text color based on background
function getContrastColor(hexColor: string): string {
    // Remove # if present
    const hex = hexColor.replace('#', '');

    // Parse RGB values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return black or white based on luminance
    return luminance > 0.5 ? '#000000' : '#ffffff';
}

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
            className={`group rounded-xl border bg-card overflow-hidden transition-colors ${!template.htmlContent
                ? 'border-dashed border-amber-500'
                : 'border-border hover:border-primary/50'
                }`}
        >
            {/* Email Preview Area */}
            <div
                className="relative h-56 bg-muted/30 overflow-hidden cursor-pointer"
                onClick={() => onOpen?.(template)}
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
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onOpen?.(template)}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                {labels.openEditor}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit?.(template)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                {labels.editDetails}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleDuplicate} disabled={isDuplicating}>
                                <Copy className="h-4 w-4 mr-2" />
                                {labels.duplicate}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onViewActivity?.(template)}>
                                <History className="h-4 w-4 mr-2" />
                                {labels.viewActivity}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onDelete?.(template)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {labels.delete}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Badges Section - Responsive wrap, show ALL badges */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {/* Client Badge - Filled with primary color */}
                    {template.client ? (
                        <Link href={`/dashboard/clients/${template.client.slug}`}>
                            <span
                                className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium transition-opacity hover:opacity-80 cursor-pointer"
                                style={{
                                    backgroundColor: template.client.primaryColor || '#6366f1',
                                    color: getContrastColor(template.client.primaryColor || '#6366f1'),
                                }}
                            >
                                {template.client.name}
                            </span>
                        </Link>
                    ) : (
                        <span className="inline-flex items-center rounded-md bg-gray-400/10 px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 ring-1 ring-inset ring-gray-400/20">
                            {labels.unassigned}
                        </span>
                    )}

                    {/* Not Edited Badge - Only show if no content */}
                    {!template.htmlContent && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-400/10 px-2 py-1 text-xs font-medium text-amber-600 dark:text-amber-400 ring-1 ring-inset ring-amber-400/20">
                            <AlertCircle className="h-3 w-3" />
                            {labels.notYetEdited}
                        </span>
                    )}

                    {/* ALL Campaign Badges - Clickable */}
                    {template.campaigns.map((campaign) => (
                        <Link key={campaign.id} href={`/dashboard/campaigns/${campaign.id}`}>
                            <span className="inline-flex items-center rounded-md bg-green-400/10 px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400 ring-1 ring-inset ring-green-400/20 hover:bg-green-400/20 transition-colors cursor-pointer">
                                {campaign.name}
                            </span>
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
