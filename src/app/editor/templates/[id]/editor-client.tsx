"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import THEME from "@/components/email-builder-waypoint/theme";
import App from "@/components/email-builder-waypoint/App";
import { editorStateStore, useDocument } from "@/components/email-builder-waypoint/documents/editor/EditorContext";

interface WaypointEditorClientProps {
    template: {
        id: string;
        name: string;
        jsonContent?: any;
        client?: {
            slug: string;
            name: string;
        } | null;
    };
    savedBlocks: any[];
}

export function WaypointEditorClient({ template, savedBlocks }: WaypointEditorClientProps) {
    const router = useRouter();
    const [initialized, setInitialized] = useState(false);
    const [initialDocument, setInitialDocument] = useState<string | null>(null);

    // Get current document from store
    const currentDocument = useDocument();

    // Check if there are unsaved changes
    const hasUnsavedChanges = initialized && initialDocument
        ? JSON.stringify(currentDocument) !== initialDocument
        : false;

    useEffect(() => {
        // Always reset the editor state when template changes
        const EMPTY_EMAIL = {
            root: {
                type: 'EmailLayout',
                data: {
                    backdropColor: '#F5F5F5',
                    canvasColor: '#FFFFFF',
                    textColor: '#262626',
                    fontFamily: 'MODERN_SANS',
                    childrenIds: [],
                },
            },
        };

        const documentContent = (template?.jsonContent && template.jsonContent.root)
            ? template.jsonContent
            : EMPTY_EMAIL;

        editorStateStore.setState({
            document: documentContent,
        });

        // Store initial document for comparison
        setInitialDocument(JSON.stringify(documentContent));
        setInitialized(true);
    }, [template.id]);

    // Update initial document when save is successful
    useEffect(() => {
        const handleSaveSuccess = () => {
            setInitialDocument(JSON.stringify(currentDocument));
        };

        window.addEventListener('template-saved', handleSaveSuccess);
        return () => window.removeEventListener('template-saved', handleSaveSuccess);
    }, [currentDocument]);

    // Warn user before leaving if there are unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    if (!initialized) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <ThemeProvider theme={THEME}>
            <CssBaseline />
            <div className="h-screen overflow-hidden">
                <App />
            </div>
        </ThemeProvider>
    );
}
