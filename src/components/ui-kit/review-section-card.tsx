"use client";

import { Button } from "@/components/ui/button";
import { Edit2, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewSectionCardProps {
    icon: LucideIcon;
    title: string;
    onEdit?: () => void;
    children: React.ReactNode;
    className?: string;
}

/**
 * A card for displaying a section in a wizard review step.
 * Shows an icon, title, optional edit button, and content.
 */
export function ReviewSectionCard({
    icon: Icon,
    title,
    onEdit,
    children,
    className
}: ReviewSectionCardProps) {
    return (
        <div className={cn("rounded-xl border bg-card p-4 space-y-3", className)}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold text-sm">{title}</h3>
                </div>
                {onEdit && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onEdit}
                        className="h-7 w-7 p-0"
                    >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span className="sr-only">Edit</span>
                    </Button>
                )}
            </div>
            {children}
        </div>
    );
}
