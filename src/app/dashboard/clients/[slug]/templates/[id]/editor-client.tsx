"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Check, Loader2, Cloud } from "lucide-react";

import { renderToStaticMarkup } from "@usewaypoint/email-builder";
import THEME from "@/components/email-builder-waypoint/theme";
import App from "@/components/email-builder-waypoint/App";
import { editorStateStore, initializeHistory, markAsSaved, setClientId } from "@/components/email-builder-waypoint/documents/editor/EditorContext";

interface WaypointEditorClientProps {
    template: {
        id: string;
        name: string;
        jsonContent?: any;
        clientId?: string | null;
        client?: {
            id: string;
            slug: string;
            name: string;
        } | null;
    };
    savedBlocks: any[];
    clientSlug?: string;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function WaypointEditorClient({ template, savedBlocks, clientSlug }: WaypointEditorClientProps) {
    const [initialized, setInitialized] = useState(false);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastSavedDocRef = useRef<string | null>(null);
    const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-save function
    const saveToServer = useCallback(async (document: any) => {
        if (!template.id) return;

        const docString = JSON.stringify(document);

        // Skip if no changes from last save
        if (docString === lastSavedDocRef.current) {
            return;
        }

        setSaveStatus("saving");

        try {
            // Generate HTML for preview
            const htmlContent = renderToStaticMarkup(document, { rootBlockId: 'root' });

            const response = await fetch(`/api/templates/${template.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jsonContent: document,
                    htmlContent
                }),
            });

            if (response.ok) {
                lastSavedDocRef.current = docString;
                markAsSaved();
                setSaveStatus("saved");

                // Reset to idle after 2 seconds
                if (statusTimeoutRef.current) {
                    clearTimeout(statusTimeoutRef.current);
                }
                statusTimeoutRef.current = setTimeout(() => {
                    setSaveStatus("idle");
                }, 2000);
            } else {
                setSaveStatus("error");
            }
        } catch (error) {
            console.error("[AUTO_SAVE] Error:", error);
            setSaveStatus("error");
        }
    }, [template.id]);

    // Subscribe to document changes and auto-save with debounce
    useEffect(() => {
        if (!initialized) return;

        const unsubscribe = editorStateStore.subscribe((state, prevState) => {
            // Only save if document actually changed
            if (state.document !== prevState.document) {
                // Clear existing timeout
                if (saveTimeoutRef.current) {
                    clearTimeout(saveTimeoutRef.current);
                }

                // Debounce: wait 1.5 seconds after last change before saving
                saveTimeoutRef.current = setTimeout(() => {
                    saveToServer(state.document);
                }, 1500);
            }
        });

        return () => {
            unsubscribe();
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            if (statusTimeoutRef.current) {
                clearTimeout(statusTimeoutRef.current);
            }
        };
    }, [initialized, saveToServer]);

    const initializedTemplateId = useRef<string | null>(null);

    // Initialize editor
    useEffect(() => {
        // Set client context for Block Library
        setClientId(template.clientId || template.client?.id || null);

        // Mark that we're in an editor session (used by list pages to know when to refresh)
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('editor-session-active', 'true');
        }

        // If we already initialized this template, DON'T reset the document/history
        // This prevents auto-save revalidations from wiping undo history
        if (initializedTemplateId.current === template.id) {
            return;
        }

        if (template?.jsonContent && template.jsonContent.root) {
            const document = template.jsonContent;
            editorStateStore.setState({ document });
            initializeHistory(document);
            lastSavedDocRef.current = JSON.stringify(document);
            initializedTemplateId.current = template.id;
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
            {/* Auto-save status indicator */}
            <div className="absolute top-3 right-3 z-50">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-300 ${saveStatus === "saving"
                    ? "bg-blue-500/10 text-blue-500"
                    : saveStatus === "saved"
                        ? "bg-green-500/10 text-green-500"
                        : saveStatus === "error"
                            ? "bg-red-500/10 text-red-500"
                            : "bg-muted/50 text-muted-foreground"
                    }`}>
                    {saveStatus === "saving" && (
                        <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Saving...</span>
                        </>
                    )}
                    {saveStatus === "saved" && (
                        <>
                            <Check className="h-3 w-3" />
                            <span>Saved</span>
                        </>
                    )}
                    {saveStatus === "error" && (
                        <>
                            <Cloud className="h-3 w-3" />
                            <span>Save failed</span>
                        </>
                    )}
                    {saveStatus === "idle" && (
                        <>
                            <Cloud className="h-3 w-3" />
                            <span>Auto-save on</span>
                        </>
                    )}
                </div>
            </div>

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

