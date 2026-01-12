"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Check, Loader2, Cloud, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

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

        if (block?.jsonContent && block.jsonContent.root) {
            const document = block.jsonContent;
            resetDocument(document);
            initializeHistory(document);
            lastSavedDocRef.current = JSON.stringify(document);
            initializedBlockId.current = block.id;
        } else {
            // Initialize with empty layout
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

            {/* Top bar with back button and title */}
            <div className="bg-background border-b px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/dashboard/blocks")}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Library
                    </Button>
                    <div className="h-4 w-[1px] bg-border" />
                    <span className="font-semibold text-sm">{block.name}</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 ${saveStatus === "saving"
                        ? "bg-blue-500/10 text-blue-500"
                        : saveStatus === "saved"
                            ? "bg-green-500/10 text-green-500"
                            : saveStatus === "error"
                                ? "bg-red-500/10 text-red-500"
                                : "bg-muted/50 text-muted-foreground"
                        }`}>
                        {saveStatus === "saving" && <Loader2 className="h-3 w-3 animate-spin" />}
                        {saveStatus === "saved" && <Check className="h-3 w-3" />}
                        {saveStatus === "error" && <Cloud className="h-3 w-3" />}
                        <span>
                            {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : saveStatus === "error" ? "Save failed" : "Auto-save on"}
                        </span>
                    </div>
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
