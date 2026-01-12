"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

/**
 * NavigationCard Component
 * 
 * @path src/components/ui-kit/navigation-card.tsx
 * 
 * A clickable card component for navigating to sub-pages.
 * Used for linking to Campaigns, Audiences, Templates sections.
 */

export interface NavigationCardItem {
    id: string;
    name: string;
    href?: string;
}

export interface NavigationCardProps {
    href: string;
    icon: LucideIcon;
    title: string;
    description?: string;
    count?: number;
    countLabel?: string;
    color?: "primary" | "green" | "blue" | "purple" | "orange";
    variant?: "default" | "minimal";
    items?: NavigationCardItem[];
    maxItems?: number;
    emptyLabel?: string;
    supportingText?: string; // Simple text to show instead of badges
    className?: string;
}

const colorVariants = {
    primary: {
        bg: "bg-primary/5 group-hover:bg-primary/10",
        border: "border-primary/30",
        borderHover: "hover:border-primary/60",
        icon: "text-primary",
        iconBg: "bg-primary/10",
        count: "text-primary",
        badgeBg: "bg-primary/10 text-primary",
        separator: "border-primary/20",
    },
    green: {
        bg: "bg-green-500/5 group-hover:bg-green-500/10",
        border: "border-green-500/30",
        borderHover: "hover:border-green-500/60",
        icon: "text-green-500",
        iconBg: "bg-green-500/10",
        count: "text-green-600 dark:text-green-400",
        badgeBg: "bg-green-500/10 text-green-600 dark:text-green-400",
        separator: "border-green-500/20",
    },
    blue: {
        bg: "bg-blue-500/5 group-hover:bg-blue-500/10",
        border: "border-blue-500/30",
        borderHover: "hover:border-blue-500/60",
        icon: "text-blue-500",
        iconBg: "bg-blue-500/10",
        count: "text-blue-600 dark:text-blue-400",
        badgeBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
        separator: "border-blue-500/20",
    },
    purple: {
        bg: "bg-purple-500/5 group-hover:bg-purple-500/10",
        border: "border-purple-500/30",
        borderHover: "hover:border-purple-500/60",
        icon: "text-purple-500",
        iconBg: "bg-purple-500/10",
        count: "text-purple-600 dark:text-purple-400",
        badgeBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
        separator: "border-purple-500/20",
    },
    orange: {
        bg: "bg-orange-500/5 group-hover:bg-orange-500/10",
        border: "border-orange-500/30",
        borderHover: "hover:border-orange-500/60",
        icon: "text-orange-500",
        iconBg: "bg-orange-500/10",
        count: "text-orange-600 dark:text-orange-400",
        badgeBg: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
        separator: "border-orange-500/20",
    },
};

export function NavigationCard({
    href,
    icon: Icon,
    title,
    description,
    count,
    countLabel,
    color = "primary",
    variant = "default",
    items = [],
    maxItems = 3,
    emptyLabel,
    supportingText,
    className,
}: NavigationCardProps) {
    const colors = colorVariants[color];
    const displayItems = items.slice(0, maxItems);
    const remainingCount = items.length > maxItems ? items.length - maxItems : 0;

    if (variant === "minimal") {
        const hasItems = displayItems.length > 0;

        return (
            <Link
                href={href}
                className={cn(
                    "group flex flex-col rounded-xl border border-dashed transition-all duration-200 bg-card overflow-hidden",
                    colors.border,
                    colors.borderHover,
                    "hover:border-solid",
                    className
                )}
            >
                {/* Header Section */}
                <div className="p-5 pb-4">
                    <div className="flex items-start gap-3">
                        <div className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-lg shrink-0",
                            colors.iconBg
                        )}>
                            <Icon className={cn("h-5 w-5", colors.icon)} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <h3 className="font-semibold text-sm truncate">{title}</h3>
                                    {description && (
                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                            {description}
                                        </p>
                                    )}
                                </div>
                                {/* Count Badge in Top Right */}
                                {count !== undefined && (
                                    <span className={cn(
                                        "text-2xl font-bold tabular-nums shrink-0",
                                        colors.count
                                    )}>
                                        {count}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dashed Separator and Item Badges or Supporting Text */}
                <div className={cn(
                    "border-t border-dashed px-5 py-3",
                    colors.separator
                )}>
                    {supportingText ? (
                        <p className="text-xs text-muted-foreground">
                            {supportingText}
                        </p>
                    ) : (
                        <div className="flex flex-wrap gap-1.5">
                            {hasItems ? (
                                <>
                                    {displayItems.map((item) => (
                                        <span
                                            key={item.id}
                                            className={cn(
                                                "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium",
                                                colors.badgeBg
                                            )}
                                        >
                                            {item.name}
                                        </span>
                                    ))}
                                    {remainingCount > 0 && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-muted-foreground">
                                            +{remainingCount}
                                        </span>
                                    )}
                                </>
                            ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-muted-foreground">
                                    {emptyLabel || `No ${title.toLowerCase()}`}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </Link>
        );
    }

    return (
        <Link
            href={href}
            className={cn(
                "group flex flex-col gap-4 p-6 rounded-xl border transition-all duration-200",
                colors.bg,
                colors.border,
                className
            )}
        >
            <div className="flex items-start justify-between">
                <div className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-xl bg-background/50",
                    colors.iconBg
                )}>
                    <Icon className={cn("h-6 w-6", colors.icon)} />
                </div>
                {count !== undefined && (
                    <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold",
                        colors.badgeBg
                    )}>
                        <span>{count}</span>
                        {countLabel && (
                            <span className="text-xs font-normal opacity-70">{countLabel}</span>
                        )}
                    </div>
                )}
            </div>
            <div>
                <h3 className="font-semibold text-foreground group-hover:text-foreground/90 transition-colors">
                    {title}
                </h3>
                {description && (
                    <p className="text-sm text-muted-foreground mt-1">
                        {description}
                    </p>
                )}
            </div>
        </Link>
    );
}
