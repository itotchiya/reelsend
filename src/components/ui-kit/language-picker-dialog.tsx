"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Globe, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const languages = [
    { code: "en", name: "English", icon: "/icons/languages/united-kingdom-flag.png" },
    { code: "fr", name: "Français", icon: "/icons/languages/france-flag.png" },
] as const;

interface LanguagePickerDialogProps {
    trigger?: React.ReactNode;
    className?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function LanguagePickerDialog({ trigger, className, open: controlledOpen, onOpenChange }: LanguagePickerDialogProps) {
    const { locale, setLocale, t } = useI18n();
    const [internalOpen, setInternalOpen] = useState(false);

    // Support both controlled and uncontrolled modes
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? (onOpenChange || (() => { })) : setInternalOpen;

    const currentLang = languages.find((l) => l.code === locale) || languages[0];

    const handleSelect = (code: string) => {
        setLocale(code as "en" | "fr");
        setOpen(false);
    };

    const defaultTrigger = (
        <Button variant="secondary" className="h-9 px-3 flex items-center gap-2 cursor-pointer">
            <img src={currentLang.icon} alt={currentLang.name} className="h-4 w-4 object-contain" />
            <span className="text-sm font-medium">{currentLang.name}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
    );

    // If no trigger provided in controlled mode, render without DialogTrigger
    if (isControlled && !trigger) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5" />
                            {(t.settings as any)?.selectLanguage || "Select Language"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-2 py-4">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => handleSelect(lang.code)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left",
                                    "border border-border/50 bg-card",
                                    "hover:bg-accent/50 transition-colors",
                                    locale === lang.code && "ring-2 ring-primary"
                                )}
                            >
                                <img
                                    src={lang.icon}
                                    alt={lang.name}
                                    className="h-6 w-6 object-contain rounded-sm"
                                />
                                <span className="flex-1 font-medium">{lang.name}</span>
                                {locale === lang.code && (
                                    <Check className="h-5 w-5 text-primary" />
                                )}
                            </button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    // Default: uncontrolled mode with DialogTrigger
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild className={className}>
                {trigger || defaultTrigger}
            </DialogTrigger>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        {(t.settings as any)?.selectLanguage || "Select Language"}
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-2 py-4">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleSelect(lang.code)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left",
                                "border border-border/50 bg-card",
                                "hover:bg-accent/50 transition-colors",
                                locale === lang.code && "ring-2 ring-primary"
                            )}
                        >
                            <img
                                src={lang.icon}
                                alt={lang.name}
                                className="h-6 w-6 object-contain rounded-sm"
                            />
                            <span className="flex-1 font-medium">{lang.name}</span>
                            {locale === lang.code && (
                                <Check className="h-5 w-5 text-primary" />
                            )}
                        </button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
