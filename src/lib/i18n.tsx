"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import en from "@/locales/en.json";
import fr from "@/locales/fr.json";

type Locale = "en" | "fr";
type Translations = typeof en;

interface I18nContextType {
    locale: Locale;
    t: Translations;
    setLocale: (locale: Locale) => void;
}

const translations: Record<Locale, Translations> = { en, fr };

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>("en");

    useEffect(() => {
        // Load saved locale from localStorage
        const savedLocale = localStorage.getItem("locale") as Locale | null;
        if (savedLocale && (savedLocale === "en" || savedLocale === "fr")) {
            setLocaleState(savedLocale);
        }
    }, []);

    const setLocale = (newLocale: Locale) => {
        setLocaleState(newLocale);
        localStorage.setItem("locale", newLocale);
    };

    const value: I18nContextType = {
        locale,
        t: translations[locale],
        setLocale,
    };

    return (
        <I18nContext.Provider value={value}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (context === undefined) {
        throw new Error("useI18n must be used within an I18nProvider");
    }
    return context;
}

// Helper for non-component usage
export function getTranslations(locale: Locale = "en") {
    return translations[locale];
}
