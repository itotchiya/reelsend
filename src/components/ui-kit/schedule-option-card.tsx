"use client";

import { CheckCircle, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScheduleOptionCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
    selected: boolean;
    onClick: () => void;
    className?: string;
}

/**
 * A selectable option card for schedule selection (immediate vs scheduled).
 * Shows an icon, title, description, and selected checkmark.
 */
export function ScheduleOptionCard({
    icon: Icon,
    title,
    description,
    selected,
    onClick,
    className
}: ScheduleOptionCardProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer group",
                selected
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50",
                className
            )}
        >
            <div
                className={cn(
                    "h-14 w-14 rounded-full flex items-center justify-center mb-4 transition-colors",
                    selected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                )}
            >
                <Icon className="h-7 w-7" />
            </div>
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground mt-2 text-center">{description}</p>
            {selected && (
                <div className="absolute top-4 right-4">
                    <CheckCircle className="h-5 w-5 text-primary" />
                </div>
            )}
        </button>
    );
}
