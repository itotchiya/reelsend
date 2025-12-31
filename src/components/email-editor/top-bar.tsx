"use client";

import React from "react";
import { useEmailEditorStore } from "@/lib/email-editor/store";
import { Button } from "@/components/ui/button";
import {
    Undo2,
    Redo2,
    Monitor,
    Smartphone,
    Eye,
    Code,
    Save,
    Loader2
} from "lucide-react";
import { PreviewModal } from "./preview-modal";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { exportToHtml } from "@/lib/email-editor/export";

export function TopBar() {
    const { history, future, dispatch, email } = useEmailEditorStore();
    const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);
    const { id } = useParams();

    const handleUndo = () => dispatch({ type: "UNDO" });
    const handleRedo = () => dispatch({ type: "REDO" });

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const html = exportToHtml(email);
            const response = await fetch(`/api/templates/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jsonContent: email,
                    htmlContent: html,
                }),
            });

            if (!response.ok) throw new Error("Failed to save");
            toast.success("Template saved successfully");
        } catch (error) {
            toast.error("Error saving template");
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <div className="h-14 border-b bg-background flex items-center justify-between px-4 sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleUndo}
                        disabled={history.length === 0}
                    >
                        <Undo2 className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleRedo}
                        disabled={future.length === 0}
                    >
                        <Redo2 className="w-4 h-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-4 bg-muted/50 p-1 rounded-md">
                    <Button variant="ghost" size="sm" className="gap-2 bg-background shadow-sm">
                        <Monitor className="w-4 h-4" />
                        <span className="text-xs">Desktop</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2">
                        <Smartphone className="w-4 h-4" />
                        <span className="text-xs">Mobile</span>
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsPreviewOpen(true)}>
                        <Eye className="w-4 h-4" />
                        Preview
                    </Button>
                    <Button size="sm" className="gap-2" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save
                    </Button>
                </div>
            </div>
            <PreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                html={exportToHtml(email)}
            />
        </>
    );
}
