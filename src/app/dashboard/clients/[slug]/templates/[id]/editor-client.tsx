"use client";

import { useEffect, useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import THEME from "@/components/email-builder-waypoint/theme";
import App from "@/components/email-builder-waypoint/App";
import { editorStateStore, initializeHistory } from "@/components/email-builder-waypoint/documents/editor/EditorContext";

interface WaypointEditorClientProps {
    template: {
        id: string;
        name: string;
        client?: {
            slug: string;
            name: string;
        } | null;
    };
    savedBlocks: any[];
    clientSlug?: string;
}

export function WaypointEditorClient({ template, savedBlocks, clientSlug }: WaypointEditorClientProps) {
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        // Initialize the editor store with the template's jsonContent
        if ((template as any)?.jsonContent && (template as any).jsonContent.root) {
            const document = (template as any).jsonContent;
            editorStateStore.setState({ document });
            initializeHistory(document);
        } else {
            // If no valid content, you might want to initialize with a default or just ensure state is clean
            // For now, let's assuming existing logic of 'do nothing' or 'default state' is handled elsewhere or not critical if empty.
            // But to be safe against persistence, we should probably reset if it's empty too?
            // Actually currently it only updates if root exists.
            // Let's stick to the current logic but add initializeHistory.
        }
        setInitialized(true);
    }, [template]);

    if (!initialized) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            {/* Minimal Header with Breadcrumbs */}


            {/* Full Page Editor */}
            <div className="flex-1 overflow-hidden">
                <ThemeProvider theme={THEME}>
                    <CssBaseline />
                    <App />
                </ThemeProvider>
            </div>
        </div>
    );
}
