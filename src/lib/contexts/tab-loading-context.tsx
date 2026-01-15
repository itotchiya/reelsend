"use client";

import React, { createContext, useContext, useState, useTransition } from "react";

interface TabLoadingContextType {
    isLoading: boolean;
    startLoading: (callback: () => void) => void;
}

const TabLoadingContext = createContext<TabLoadingContextType | undefined>(undefined);

export function TabLoadingProvider({ children }: { children: React.ReactNode }) {
    const [isPending, startTransition] = useTransition();

    const startLoading = (callback: () => void) => {
        startTransition(() => {
            callback();
        });
    };

    return (
        <TabLoadingContext.Provider value={{ isLoading: isPending, startLoading }}>
            {children}
        </TabLoadingContext.Provider>
    );
}

export function useTabLoading() {
    const context = useContext(TabLoadingContext);
    if (context === undefined) {
        throw new Error("useTabLoading must be used within a TabLoadingProvider");
    }
    return context;
}
