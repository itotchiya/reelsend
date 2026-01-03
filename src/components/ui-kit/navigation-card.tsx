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

export interface NavigationCardProps {
    href: string;
    icon: LucideIcon;
    title: string;
    description?: string;
    count?: number;
    countLabel?: string;
    color?: "primary" | "green" | "blue" | "purple" | "orange";
    className?: string;
}

const colorVariants = {
    primary: {
        bg: "bg-primary/5 hover:bg-primary/10",
        border: "border-primary/20 hover:border-primary/40",
        icon: "text-primary",
        count: "bg-primary/10 text-primary",
    },
    green: {
        bg: "bg-green-500/5 hover:bg-green-500/10",
        border: "border-green-500/20 hover:border-green-500/40",
        icon: "text-green-500",
        count: "bg-green-500/10 text-green-600 dark:text-green-400",
    },
    blue: {
        bg: "bg-blue-500/5 hover:bg-blue-500/10",
        border: "border-blue-500/20 hover:border-blue-500/40",
        icon: "text-blue-500",
        count: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    purple: {
        bg: "bg-purple-500/5 hover:bg-purple-500/10",
        border: "border-purple-500/20 hover:border-purple-500/40",
        icon: "text-purple-500",
        count: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    },
    orange: {
        bg: "bg-orange-500/5 hover:bg-orange-500/10",
        border: "border-orange-500/20 hover:border-orange-500/40",
        icon: "text-orange-500",
        count: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
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
    className,
}: NavigationCardProps) {
    const colors = colorVariants[color];

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
                    "flex items-center justify-center w-12 h-12 rounded-xl",
                    colors.count
                )}>
                    <Icon className={cn("h-6 w-6", colors.icon)} />
                </div>
                {count !== undefined && (
                    <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold",
                        colors.count
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
