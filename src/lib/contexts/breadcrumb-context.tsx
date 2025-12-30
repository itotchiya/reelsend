"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface BreadcrumbContextType {
    overrides: Record<string, string>;
    setOverride: (segment: string, label: string) => void;
    removeOverride: (segment: string) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
    const [overrides, setOverrides] = useState<Record<string, string>>({});

    const setOverride = useCallback((segment: string, label: string) => {
        setOverrides((prev) => ({ ...prev, [segment]: label }));
    }, []);

    const removeOverride = useCallback((segment: string) => {
        setOverrides((prev) => {
            const next = { ...prev };
            delete next[segment];
            return next;
        });
    }, []);

    return (
        <BreadcrumbContext.Provider value={{ overrides, setOverride, removeOverride }}>
            {children}
        </BreadcrumbContext.Provider>
    );
}

export function useBreadcrumbs() {
    const context = useContext(BreadcrumbContext);
    if (!context) {
        throw new Error("useBreadcrumbs must be used within a BreadcrumbProvider");
    }
    return context;
}
