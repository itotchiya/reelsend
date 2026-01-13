"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Check, Loader2, Cloud } from "lucide-react";

import { renderToStaticMarkup } from "@usewaypoint/email-builder";
import THEME from "@/components/email-builder-waypoint/theme";
import App from "@/components/email-builder-waypoint/App";
import { editorStateStore, initializeHistory, markAsSaved, setClientId, resetDocument } from "@/components/email-builder-waypoint/documents/editor/EditorContext";

interface BlockEditorClientProps {
    block: {
        id: string;
        name: string;
        description: string | null;
        category: string | null;
        jsonContent?: any;
        clientId?: string | null;
        client?: {
            id: string;
            slug: string;
            name: string;
            primaryColor?: string | null;
        } | null;
    };
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function BlockEditorClient({ block }: BlockEditorClientProps) {
    const router = useRouter();
    const [initialized, setInitialized] = useState(false);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastSavedDocRef = useRef<string | null>(null);
    const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-save function
    const saveToServer = useCallback(async (document: any) => {
        if (!block.id) return;

        const docString = JSON.stringify(document);

        // Skip if no changes from last save
        if (docString === lastSavedDocRef.current) {
            return;
        }

        setSaveStatus("saving");

        try {
            // Generate HTML for thumbnail/preview
            const htmlContent = renderToStaticMarkup(document, { rootBlockId: 'root' });

            const response = await fetch(`/api/blocks/${block.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jsonContent: document,
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
    }, [block.id]);

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

    const initializedBlockId = useRef<string | null>(null);

    // Initialize editor
    useEffect(() => {
        // Set client context for Block Library
        setClientId(block.clientId || block.client?.id || null);

        // Mark that we're in an editor session
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('editor-session-active', 'true');
        }

        // If we already initialized this block, DON'T reset the document/history
        if (initializedBlockId.current === block.id) {
            return;
        }

        if (block?.jsonContent && block.jsonContent.root && Object.keys(block.jsonContent).length > 1) {
            const document = block.jsonContent;
            resetDocument(document);
            initializeHistory(document);
            lastSavedDocRef.current = JSON.stringify(document);
            initializedBlockId.current = block.id;
        } else if (block?.jsonContent && (block.jsonContent.type || block.jsonContent.data)) {
            // It's a raw block! Wrap it.
            const wrapped = {
                root: {
                    type: "EmailLayout",
                    data: {
                        backdropColor: "#F5F5F5",
                        canvasColor: "#FFFFFF",
                        textColor: "#262626",
                        fontFamily: "MODERN_SANS",
                        childrenIds: ["main-block"],
                    },
                },
                "main-block": block.jsonContent
            };
            resetDocument(wrapped as any);
            initializeHistory(wrapped as any);
            lastSavedDocRef.current = JSON.stringify(wrapped);
            initializedBlockId.current = block.id;
        } else {
            // Initialize with empty layout only if it's truly a new/corrupt block
            const emptyDocument = {
                root: {
                    type: "EmailLayout",
                    data: {
                        backdropColor: "#F5F5F5",
                        canvasColor: "#FFFFFF",
                        textColor: "#262626",
                        fontFamily: "MODERN_SANS",
                        childrenIds: [],
                    },
                },
            };
            resetDocument(emptyDocument as any);
            initializeHistory(emptyDocument as any);
            lastSavedDocRef.current = JSON.stringify(emptyDocument);
            initializedBlockId.current = block.id;
        }
        setInitialized(true);
    }, [block.id, block.jsonContent]);

    if (!initialized) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            {/* Auto-save status is handled within the editor's SaveButton or we can show a subtle one if needed */}
            {/* But for now, we remove the absolute positioned one to avoid clutter */}

            {/* Auto-save status is handled within the editor's SaveButton or we can show a subtle one if needed */}


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
