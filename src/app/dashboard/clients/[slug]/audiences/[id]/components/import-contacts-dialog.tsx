"use client";

import { useState, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { FileText, Upload, X } from "lucide-react";

interface ImportContactsDialogProps {
    audienceId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function ImportContactsDialog({
    audienceId,
    open,
    onOpenChange,
    onSuccess
}: ImportContactsDialogProps) {
    const { t } = useI18n();
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
                toast.error(t.common.error);
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleImport = async () => {
        if (!file) return;

        setImporting(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch(`/api/audiences/${audienceId}/import`, {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                const result = await res.json();
                toast.success(t.contacts.success);
                setFile(null);
                onSuccess();
                onOpenChange(false);
            } else {
                const error = await res.text();
                toast.error(error || t.contacts.error);
            }
        } catch (error) {
            toast.error(t.common.error);
        } finally {
            setImporting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t.contacts.importTitle}</DialogTitle>
                    <DialogDescription>
                        {t.contacts.importDesc}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6">
                    {file ? (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 border-dashed">
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                <FileText className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground"
                                onClick={() => setFile(null)}
                                disabled={importing}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <div
                            className="flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer group"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-colors">
                                <Upload className="h-6 w-6 text-muted-foreground group-hover:text-blue-500" />
                            </div>
                            <p className="text-sm font-medium">{t.contacts.uploadHint}</p>
                            <p className="text-xs text-muted-foreground mt-1">{t.contacts.selectFile}</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={importing}
                    >
                        {t.common.cancel}
                    </Button>
                    <Button
                        disabled={!file || importing}
                        onClick={handleImport}
                        className="gap-2"
                    >
                        {importing && <Spinner className="h-4 w-4" />}
                        {t.contacts.startImport}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
