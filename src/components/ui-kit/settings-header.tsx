"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguagePickerDialog } from "@/components/ui-kit/language-picker-dialog";
import { MotionTabs } from "@/components/ui-kit/motion-tabs";
import { useI18n } from "@/lib/i18n";

export function SettingsHeader() {
    const { t } = useI18n();
    const settings = (t as any).settings;

    return (
        <header className="relative flex items-center justify-between px-4 py-4 bg-background">
            <div className="flex-1 flex justify-start">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">
                        {settings?.backToDashboard || "Back to Dashboard"}
                    </span>
                </Link>
            </div>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
                <MotionTabs />
            </div>

            <div className="flex-1 flex justify-end items-center gap-2">
                <LanguagePickerDialog />
                <ThemeToggle />
            </div>
        </header>
    );
}
