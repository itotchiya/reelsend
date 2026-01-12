"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ChevronDown } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { SelectableCard, SelectableCardHeader, SelectableCardDescription } from "./selectable-card";

// Style definitions
export interface EmailStyle {
    id: string;
}

export const EMAIL_STYLES: EmailStyle[] = [
    { id: "default" },
    { id: "marketing" },
    { id: "minimal" },
    { id: "branded" },
];

// Skeleton preview components for each style - Using design system colors
function DefaultStylePreview() {
    return (
        <div className="w-full h-44 p-4 bg-slate-500/5 dark:bg-slate-500/10 rounded-none border border-dashed border-slate-400/40 dark:border-slate-500/30 mb-2 overflow-hidden flex flex-col">
            {/* Logo */}
            <div className="h-3 w-16 bg-slate-400/30 dark:bg-slate-500/40 rounded mb-4 mx-auto animate-pulse" />
            {/* Text lines */}
            <div className="space-y-2.5 px-3 flex-1">
                <div className="h-2 w-full bg-slate-400/20 dark:bg-slate-500/30 rounded animate-pulse" />
                <div className="h-2 w-11/12 bg-slate-400/20 dark:bg-slate-500/30 rounded animate-pulse" />
                <div className="h-2 w-full bg-slate-400/20 dark:bg-slate-500/30 rounded animate-pulse" />
                <div className="h-2 w-4/5 bg-slate-400/20 dark:bg-slate-500/30 rounded animate-pulse" />
                <div className="h-2 w-3/5 bg-slate-400/20 dark:bg-slate-500/30 rounded animate-pulse" />
            </div>
            {/* CTA Button */}
            <div className="h-5 w-16 bg-slate-400/40 dark:bg-slate-500/50 rounded mt-4 mx-auto animate-pulse" />
        </div>
    );
}

function MarketingStylePreview() {
    return (
        <div className="w-full h-44 p-4 bg-orange-500/5 dark:bg-orange-500/10 rounded-none border border-dashed border-orange-400/40 dark:border-orange-500/30 mb-2 overflow-hidden flex flex-col">
            {/* Hero banner */}
            <div className="h-6 w-full bg-orange-400/25 dark:bg-orange-500/35 rounded mb-3 animate-pulse" />
            {/* Subtitle */}
            <div className="h-2 w-24 bg-orange-400/20 dark:bg-orange-500/30 rounded mx-auto mb-4 animate-pulse" />
            {/* Product cards */}
            <div className="flex gap-3 px-2 mb-4 flex-1">
                <div className="flex-1 bg-orange-400/20 dark:bg-orange-500/30 rounded animate-pulse" />
                <div className="flex-1 bg-orange-400/20 dark:bg-orange-500/30 rounded animate-pulse" />
            </div>
            {/* CTA Button */}
            <div className="h-5 w-24 bg-orange-400/40 dark:bg-orange-500/50 rounded mx-auto animate-pulse" />
        </div>
    );
}

function MinimalStylePreview() {
    return (
        <div className="w-full h-44 p-4 bg-cyan-500/5 dark:bg-cyan-500/10 rounded-none border border-dashed border-cyan-400/40 dark:border-cyan-500/30 mb-2 overflow-hidden flex flex-col">
            {/* Text-only layout */}
            <div className="space-y-3 px-3 flex-1">
                <div className="h-2 w-full bg-cyan-400/20 dark:bg-cyan-500/30 rounded animate-pulse" />
                <div className="h-2 w-full bg-cyan-400/20 dark:bg-cyan-500/30 rounded animate-pulse" />
                <div className="h-2 w-11/12 bg-cyan-400/20 dark:bg-cyan-500/30 rounded animate-pulse" />
                <div className="h-2 w-full bg-cyan-400/20 dark:bg-cyan-500/30 rounded animate-pulse" />
                <div className="h-2 w-4/5 bg-cyan-400/20 dark:bg-cyan-500/30 rounded animate-pulse" />
                <div className="h-2 w-2/3 bg-cyan-400/20 dark:bg-cyan-500/30 rounded animate-pulse" />
            </div>
            {/* Simple text link */}
            <div className="h-2 w-14 bg-cyan-400/40 dark:bg-cyan-500/50 rounded mt-4 animate-pulse" />
        </div>
    );
}

function BrandedStylePreview() {
    return (
        <div className="w-full h-44 bg-pink-500/5 dark:bg-pink-500/10 rounded-none border border-dashed border-pink-400/40 dark:border-pink-500/30 mb-2 overflow-hidden flex flex-col">
            {/* Brand header bar */}
            <div className="h-5 w-full bg-pink-400/30 dark:bg-pink-500/40 animate-pulse" />
            {/* Content area */}
            <div className="p-4 space-y-4 flex-1 flex flex-col">
                {/* Logo placeholder */}
                <div className="h-3 w-12 bg-pink-400/40 dark:bg-pink-500/50 rounded mx-auto animate-pulse" />
                {/* Two-column layout */}
                <div className="flex gap-4 px-2 flex-1">
                    <div className="flex-1 bg-pink-400/20 dark:bg-pink-500/30 rounded animate-pulse" />
                    <div className="flex-1 bg-pink-400/20 dark:bg-pink-500/30 rounded animate-pulse" />
                </div>
            </div>
            {/* Brand footer bar */}
            <div className="h-4 w-full bg-pink-400/20 dark:bg-pink-500/30 animate-pulse" />
        </div>
    );
}

// Map style IDs to their preview components
const STYLE_PREVIEWS: Record<string, React.FC> = {
    default: DefaultStylePreview,
    marketing: MarketingStylePreview,
    minimal: MinimalStylePreview,
    branded: BrandedStylePreview,
};

interface StyleSelectorDialogProps {
    selectedStyle: string;
    onStyleSelect: (styleId: string) => void;
    className?: string;
}

export function StyleSelectorDialog({
    selectedStyle,
    onStyleSelect,
    className,
}: StyleSelectorDialogProps) {
    const { t } = useI18n();
    const [open, setOpen] = React.useState(false);

    const handleStyleSelect = (styleId: string) => {
        onStyleSelect(styleId);
        setOpen(false);
    };

    // Get the display name of the selected style
    const getStyleTitle = (id: string) => (t.promptBuilder?.styles as any)?.[id] || id;
    const getStyleSubtitle = (id: string) => (t.promptBuilder?.styles as any)?.[id + "Subtitle"] || "";
    const getStyleDesc = (id: string) => (t.promptBuilder?.styles as any)?.[id + "Desc"] || "";

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm",
                        "h-9 whitespace-nowrap transition-[color,box-shadow] outline-none",
                        "border-input bg-transparent",
                        "hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        "dark:bg-input/30 dark:hover:bg-input/50",
                        className
                    )}
                >
                    <span className="font-medium truncate">{getStyleTitle(selectedStyle)}</span>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4">
                    <DialogTitle className="text-xl">
                        {t.promptBuilder?.selectStyle || "Select Email Style"}
                    </DialogTitle>
                </DialogHeader>

                <div className="px-6 pb-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {EMAIL_STYLES.map((style) => {
                            const isSelected = selectedStyle === style.id;
                            const PreviewComponent = STYLE_PREVIEWS[style.id];

                            return (
                                <SelectableCard
                                    key={style.id}
                                    isSelected={isSelected}
                                    onClick={() => handleStyleSelect(style.id)}
                                >
                                    {/* Style Preview */}
                                    <PreviewComponent />

                                    <SelectableCardHeader
                                        title={getStyleTitle(style.id)}
                                        subtitle={getStyleSubtitle(style.id)}
                                    />
                                    <SelectableCardDescription>
                                        {getStyleDesc(style.id)}
                                    </SelectableCardDescription>
                                </SelectableCard>
                            );
                        })}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Default style
export const DEFAULT_STYLE = "default";
