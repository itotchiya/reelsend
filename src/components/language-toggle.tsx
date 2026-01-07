"use client";

import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Languages, ChevronDown } from "lucide-react";

export function LanguageToggle() {
    const { locale, setLocale } = useI18n();

    const languages = {
        en: { name: "English", icon: "/icons/languages/united-kingdom-flag.png" },
        fr: { name: "Français", icon: "/icons/languages/france-flag.png" },
    };

    const currentLang = languages[locale as keyof typeof languages];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="h-9 px-3 flex items-center gap-2 cursor-pointer">
                    <img src={currentLang.icon} alt={currentLang.name} className="h-4 w-4 object-contain" />
                    <span className="text-sm font-medium">
                        {currentLang.name}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={() => setLocale("en")}
                    className={`flex items-center gap-2 ${locale === "en" ? "bg-accent" : ""}`}
                >
                    <img src={languages.en.icon} alt="English" className="h-4 w-4 object-contain" />
                    English
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setLocale("fr")}
                    className={`flex items-center gap-2 ${locale === "fr" ? "bg-accent" : ""}`}
                >
                    <img src={languages.fr.icon} alt="Français" className="h-4 w-4 object-contain" />
                    Français
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
