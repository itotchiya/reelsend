"use client";

import React from "react";
import { EmailEditorProvider } from "@/lib/email-editor/store";
import { Sidebar } from "@/components/email-editor/sidebar";
import { EmailEditorEngine } from "@/components/email-editor/engine";
import { SettingsPanel } from "@/components/email-editor/settings-panel";
import { TopBar } from "@/components/email-editor/top-bar";

interface EmailEditorClientProps {
    template: any;
    savedBlocks?: any[];
}

export function EmailEditorClient({ template, savedBlocks = [] }: EmailEditorClientProps) {
    return (
        <EmailEditorProvider>
            <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
                <TopBar />
                <div className="flex flex-1 overflow-hidden">
                    <Sidebar />
                    <EmailEditorEngine />
                    <SettingsPanel />
                </div>
            </div>
        </EmailEditorProvider>
    );
}
