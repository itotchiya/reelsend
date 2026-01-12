"use client";

import { cn } from "@/lib/utils";
import { LucideIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * CampaignConfigCard Component
 * 
 * @path src/components/ui-kit/campaign-config-card.tsx
 * 
 * A reusable card component for campaign configuration sections:
 * - SMTP Selection
 * - Template Selection  
 * - Audience/Segment Selection
 * 
 * Features:
 * - Dashed border styling
 * - Icon with colored background
 * - Empty state with action button
 * - Selected state with custom content
 */

export type ConfigCardColor = "blue" | "purple" | "green" | "orange" | "violet";

const colorStyles: Record<ConfigCardColor, {
    iconBg: string;
    iconColor: string;
    border: string;
    borderHover: string;
}> = {
    blue: {
        iconBg: "bg-blue-500/10",
        iconColor: "text-blue-600",
        border: "border-blue-500/30",
        borderHover: "hover:border-blue-500",
    },
    purple: {
        iconBg: "bg-purple-500/10",
        iconColor: "text-purple-600",
        border: "border-purple-500/30",
        borderHover: "hover:border-purple-500",
    },
    green: {
        iconBg: "bg-green-500/10",
        iconColor: "text-green-600",
        border: "border-green-500/30",
        borderHover: "hover:border-green-500",
    },
    orange: {
        iconBg: "bg-orange-500/10",
        iconColor: "text-orange-600",
        border: "border-orange-500/30",
        borderHover: "hover:border-orange-500",
    },
    violet: {
        iconBg: "bg-violet-500/10",
        iconColor: "text-violet-600",
        border: "border-violet-500/30",
        borderHover: "hover:border-violet-500",
    },
};

export interface CampaignConfigCardProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    color?: ConfigCardColor;
    selected?: boolean;
    hasContent?: boolean;
    emptyLabel?: string;
    actionLabel?: string;
    onAction?: () => void;
    children?: React.ReactNode;
    className?: string;
}

export function CampaignConfigCard({
    icon: Icon,
    title,
    description,
    color = "blue",
    selected = false,
    hasContent = false,
    emptyLabel = "Not configured",
    actionLabel = "Select",
    onAction,
    children,
    className,
}: CampaignConfigCardProps) {
    const styles = colorStyles[color];

    return (
        <div
            className={cn(
                "rounded-xl border border-dashed p-5 flex flex-col min-h-[280px] transition-all duration-200",
                hasContent ? styles.border : "border-muted-foreground/30",
                styles.borderHover,
                "hover:border-solid",
                className
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold flex items-center gap-2">
                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", styles.iconBg)}>
                        <Icon className={cn("h-4 w-4", styles.iconColor)} />
                    </div>
                    {title}
                </h4>
                {onAction && (
                    <Button variant="ghost" size="sm" onClick={onAction}>
                        {hasContent ? "Change" : actionLabel}
                    </Button>
                )}
            </div>

            {/* Content */}
            {hasContent ? (
                <div className="flex-1 flex flex-col">
                    {children}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                        <Icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{emptyLabel}</p>
                    {description && (
                        <p className="text-xs text-muted-foreground/70 mb-3">{description}</p>
                    )}
                    {onAction && (
                        <Button size="sm" variant="outline" onClick={onAction} className="gap-1">
                            <Plus className="h-3 w-3" />
                            {actionLabel}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
