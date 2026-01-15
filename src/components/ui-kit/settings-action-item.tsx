"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export type ActionItemPosition = "first" | "middle" | "last" | "only";
export type ActionType = "chevron" | "change" | "toggle" | React.ReactNode;

interface SettingsActionItemProps {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    action: ActionType;
    onClick?: () => void;
    actionLabel?: string;
    toggled?: boolean;
    onToggle?: (checked: boolean) => void;
    position?: ActionItemPosition;
    className?: string;
}

/**
 * Get border radius classes based on position in the stack
 */
function getRadiusClasses(position: ActionItemPosition): string {
    switch (position) {
        case "first":
            return "rounded-t-[20px] rounded-b-[4px]";
        case "last":
            return "rounded-t-[4px] rounded-b-[20px]";
        case "middle":
            return "rounded-[4px]";
        case "only":
        default:
            return "rounded-[20px]";
    }
}

export function SettingsActionItem({
    icon,
    title,
    subtitle,
    action,
    actionLabel,
    onClick,
    toggled = false,
    onToggle,
    position = "only",
    className,
}: SettingsActionItemProps) {
    const isToggle = action === "toggle";
    const isClickable = !isToggle && onClick;

    const handleClick = () => {
        if (isClickable) {
            onClick();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (isClickable && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onClick();
        }
    };

    const radiusClasses = getRadiusClasses(position);

    // Render the right-side action
    const renderAction = () => {
        if (action === "chevron") {
            return <ChevronRight className="h-5 w-5 text-muted-foreground" />;
        }
        if (action === "change") {
            return (
                <span className="text-sm font-medium text-muted-foreground">
                    {actionLabel || "Change"}
                </span>
            );
        }
        if (action === "toggle") {
            return (
                <Switch
                    checked={toggled}
                    onCheckedChange={onToggle}
                    onClick={(e) => e.stopPropagation()}
                />
            );
        }
        // Custom React element
        return action;
    };

    return (
        <div
            role={isClickable ? "button" : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            className={cn(
                "relative flex items-center gap-4 px-4 py-4",
                "bg-card",
                radiusClasses,
                // Overlay for interaction states
                "before:absolute before:inset-0 before:rounded-[inherit] before:pointer-events-none",
                "before:bg-[#121212] dark:before:bg-white",
                "before:opacity-[0.04]",
                isClickable && [
                    "cursor-pointer",
                    "hover:before:opacity-[0.06]",
                    "active:before:opacity-[0.06]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                ],
                "transition-all duration-150",
                className
            )}
        >
            {/* Left Icon */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground">
                {icon}
            </div>

            {/* Title & Subtitle */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                    {title}
                </p>
                {subtitle && (
                    <p className="text-sm text-muted-foreground truncate">
                        {subtitle}
                    </p>
                )}
            </div>

            {/* Right Action */}
            <div className="flex-shrink-0">{renderAction()}</div>
        </div>
    );
}
