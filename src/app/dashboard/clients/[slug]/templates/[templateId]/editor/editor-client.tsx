"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { ArrowLeft, ChevronRight } from "lucide-react";

import THEME from "@/components/email-builder-waypoint/theme";
import App from "@/components/email-builder-waypoint/App";
import { editorStateStore } from "@/components/email-builder-waypoint/documents/editor/EditorContext";
import { Button } from "@/components/ui/button";

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
    const router = useRouter();
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        // Initialize the editor store with the template's jsonContent
        if ((template as any)?.jsonContent && (template as any).jsonContent.root) {
            editorStateStore.setState({
                document: (template as any).jsonContent,
            });
        }
        setInitialized(true);
    }, [template]);

    const handleBack = () => {
        if (clientSlug || template.client?.slug) {
            router.push(`/dashboard/clients/${clientSlug || template.client?.slug}`);
        } else {
            router.push("/dashboard/templates");
        }
    };

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
            <header className="h-12 border-b flex items-center px-4 bg-background shrink-0 z-50">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    className="mr-3"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>

                {/* Breadcrumbs */}
                <nav className="flex items-center text-sm text-muted-foreground">
                    <Link href="/dashboard" className="hover:text-foreground transition-colors">
                        Dashboard
                    </Link>
                    <ChevronRight className="h-4 w-4 mx-1" />
                    {clientSlug || template.client?.slug ? (
                        <>
                            <Link href={`/dashboard/clients/${clientSlug || template.client?.slug}`} className="hover:text-foreground transition-colors">
                                {template.client?.name || "Client"}
                            </Link>
                            <ChevronRight className="h-4 w-4 mx-1" />
                        </>
                    ) : (
                        <>
                            <Link href="/dashboard/templates" className="hover:text-foreground transition-colors">
                                Templates
                            </Link>
                            <ChevronRight className="h-4 w-4 mx-1" />
                        </>
                    )}
                    <span className="text-foreground font-medium">{template.name}</span>
                    <ChevronRight className="h-4 w-4 mx-1" />
                    <span className="text-foreground font-medium">Editor</span>
                </nav>
            </header>

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
