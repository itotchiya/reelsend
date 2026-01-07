"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { NotificationsToggle } from "@/components/notifications-toggle";
import { cn } from "@/lib/utils";

interface HeaderActionsProps {
    className?: string;
}

export function HeaderActions({ className }: HeaderActionsProps) {
    return (
        <div className={cn("flex items-center gap-1 sm:gap-2", className)}>
            <div className="cursor-pointer hover:opacity-80 transition-opacity">
                <NotificationsToggle />
            </div>
            <div className="cursor-pointer hover:opacity-80 transition-opacity">
                <LanguageToggle />
            </div>
            <div className="cursor-pointer hover:opacity-80 transition-opacity">
                <ThemeToggle />
            </div>
        </div>
    );
}
