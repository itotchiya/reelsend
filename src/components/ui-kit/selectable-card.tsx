"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface SelectableCardProps {
    children: React.ReactNode;
    isSelected: boolean;
    onClick: () => void;
    className?: string;
    showCheckmark?: boolean;
}

export function SelectableCard({
    children,
    isSelected,
    onClick,
    className,
    showCheckmark = true,
}: SelectableCardProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "relative flex flex-col items-start gap-1 p-3 rounded-sm text-left w-full",
                "border border-dashed transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-primary/20",
                isSelected
                    ? "border-solid border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-zinc-500/60 hover:border-solid hover:border-primary/40 hover:bg-accent/30",
                className
            )}
        >
            {showCheckmark && isSelected && (
                <div className="absolute top-3 right-3">
                    <Check className="h-4 w-4 text-primary animate-in fade-in zoom-in duration-200" />
                </div>
            )}
            {children}
        </button>
    );
}

interface SelectableCardHeaderProps {
    icon?: React.ReactNode;
    title: string;
    subtitle?: string;
    badge?: string;
    badgeVariant?: "primary" | "warning";
    className?: string;
}

export function SelectableCardHeader({
    icon,
    title,
    subtitle,
    badge,
    badgeVariant = "primary",
    className,
}: SelectableCardHeaderProps) {
    return (
        <div className={cn("flex items-center gap-2 w-full pr-6", className)}>
            {icon && (
                <span className="text-muted-foreground shrink-0">
                    {icon}
                </span>
            )}
            <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm truncate">
                        {title}
                    </span>
                    {badge && (
                        <span className={cn(
                            "px-1.5 py-0.5 text-[10px] font-bold rounded whitespace-nowrap",
                            badgeVariant === "primary"
                                ? "bg-primary/10 text-primary"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        )}>
                            {badge}
                        </span>
                    )}
                </div>
                {subtitle && (
                    <span className="text-[10px] text-muted-foreground truncate font-medium">
                        {subtitle}
                    </span>
                )}
            </div>
        </div>
    );
}

export function SelectableCardDescription({
    children,
    className
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <p className={cn("text-xs text-muted-foreground mt-0.5 line-clamp-2", className)}>
            {children}
        </p>
    );
}
