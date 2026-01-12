"use client";

import { useState, useRef, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Upload, X, ArrowRight, ArrowLeft, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Standard fields that can be mapped from CSV
const getStandardFields = (t: any) => [
    { key: "email", label: t.contacts?.email || "Email", required: true },
    { key: "firstName", label: t.contacts?.firstName || "First Name", required: false },
    { key: "lastName", label: t.contacts?.lastName || "Last Name", required: false },
    { key: "phone", label: t.contacts?.phone || "Phone", required: false },
    { key: "country", label: t.contacts?.country || "Country", required: false },
    { key: "city", label: t.contacts?.city || "City", required: false },
    { key: "street", label: t.contacts?.street || "Street Address", required: false },
    { key: "birthday", label: t.contacts?.birthday || "Birthday", required: false },
    { key: "gender", label: t.contacts?.gender || "Gender", required: false },
    { key: "maritalStatus", label: t.contacts?.maritalStatus || "Marital Status", required: false },
];

interface ImportContactsDialogProps {
    audienceId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

type Step = "upload" | "mapping" | "preview";

interface ParsedCSV {
    headers: string[];
    rows: string[][];
}

export function ImportContactsDialog({
    audienceId,
    open,
    onOpenChange,
    onSuccess
}: ImportContactsDialogProps) {
    const { t } = useI18n();
    const [step, setStep] = useState<Step>("upload");
    const [file, setFile] = useState<File | null>(null);
    const [parsedCSV, setParsedCSV] = useState<ParsedCSV | null>(null);
    const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Parse CSV file
    const parseCSV = (content: string): ParsedCSV => {
        const lines = content.split(/\r?\n/).filter(line => line.trim());
        const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
        const rows = lines.slice(1).map(line => {
            const values: string[] = [];
            let current = "";
            let inQuotes = false;
            for (const char of line) {
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === "," && !inQuotes) {
                    values.push(current.trim());
                    current = "";
                } else {
                    current += char;
                }
            }
            values.push(current.trim());
            return values;
        });
        return { headers, rows };
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
                toast.error(t.contacts?.selectCSV || "Please select a CSV file");
                return;
            }
            setFile(selectedFile);

            // Parse CSV
            const content = await selectedFile.text();
            const parsed = parseCSV(content);
            setParsedCSV(parsed);

            // Auto-map columns based on header names
            const autoMapping: Record<string, string> = {};
            const standardFields = getStandardFields(t);
            parsed.headers.forEach(header => {
                const normalizedHeader = header.toLowerCase().replace(/[_\s-]/g, "");
                const matchedField = standardFields.find(f =>
                    f.key.toLowerCase() === normalizedHeader ||
                    f.label.toLowerCase().replace(/\s/g, "") === normalizedHeader
                );
                if (matchedField) {
                    autoMapping[header] = matchedField.key;
                }
            });
            setColumnMapping(autoMapping);
            setStep("mapping");
        }
    };

    // Get unmapped columns (will be stored as metadata)
    const unmappedColumns = useMemo(() => {
        if (!parsedCSV) return [];
        return parsedCSV.headers.filter(h => !columnMapping[h]);
    }, [parsedCSV, columnMapping]);

    // Check if email is mapped
    const isEmailMapped = Object.values(columnMapping).includes("email");

    // Preview data
    const previewData = useMemo(() => {
        if (!parsedCSV) return [];
        return parsedCSV.rows.slice(0, 5).map(row => {
            const contact: Record<string, any> = {};
            const metadata: Record<string, string> = {};

            parsedCSV.headers.forEach((header, idx) => {
                const value = row[idx] || "";
                const mappedField = columnMapping[header];
                if (mappedField) {
                    contact[mappedField] = value;
                } else if (value) {
                    metadata[header] = value;
                }
            });

            if (Object.keys(metadata).length > 0) {
                contact.metadata = metadata;
            }
            return contact;
        });
    }, [parsedCSV, columnMapping]);

    const handleImport = async () => {
        if (!file || !isEmailMapped) return;

        setImporting(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("mapping", JSON.stringify(columnMapping));

            const res = await fetch(`/api/audiences/${audienceId}/import`, {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                const result = await res.json();
                toast.success(t.contacts?.importSuccess?.replace("{{count}}", String(result.imported)) || `Imported ${result.imported} contacts`);
                resetState();
                onSuccess();
                onOpenChange(false);
            } else {
                const error = await res.text();
                toast.error(error || t.contacts?.importFailed || "Import failed");
            }
        } catch (error) {
            toast.error(t.common?.error || "An error occurred");
        } finally {
            setImporting(false);
        }
    };

    const resetState = () => {
        setStep("upload");
        setFile(null);
        setParsedCSV(null);
        setColumnMapping({});
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            resetState();
        }
        onOpenChange(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="!w-[calc(100vw-2rem)] !max-w-2xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="shrink-0 p-4 sm:p-6 pb-4 border-b">
                    <DialogTitle>
                        {step === "upload" && (t.contacts?.importTitle || "Import Contacts")}
                        {step === "mapping" && (t.contacts?.mapColumns || "Map Columns")}
                        {step === "preview" && (t.contacts?.previewImport || "Preview Import")}
                    </DialogTitle>
                    <DialogDescription>
                        {step === "upload" && (t.contacts?.uploadCSVDescription || "Upload a CSV file with contact data")}
                        {step === "mapping" && (t.contacts?.mapCSVDescription || "Map CSV columns to contact fields")}
                        {step === "preview" && (t.contacts?.reviewImportDescription || "Review how contacts will be imported")}
                    </DialogDescription>
                </DialogHeader>

                {/* Scrollable content area */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
                    {/* Step 1: Upload */}
                    {step === "upload" && (
                        <div className="py-6">
                            <div
                                className="flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                                </div>
                                <p className="text-sm font-medium">{t.contacts?.clickToUpload || "Click to upload CSV"}</p>
                                <p className="text-xs text-muted-foreground mt-1">{t.contacts?.orDragAndDrop || "or drag and drop"}</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Column Mapping */}
                    {step === "mapping" && parsedCSV && (
                        <div className="space-y-4">
                            {/* File info */}
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{file?.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {parsedCSV.rows.length} rows, {parsedCSV.headers.length} columns
                                    </p>
                                </div>
                            </div>

                            {/* Email required warning */}
                            {!isEmailMapped && (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-600">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <span className="text-sm">{t.contacts?.emailColumnRequired || "Email column is required"}</span>
                                </div>
                            )}

                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    {t.contacts?.mapColumns || "Map Columns"}
                                </p>
                                {parsedCSV.headers.map((header) => (
                                    <div key={header} className="flex flex-col gap-2 p-3 rounded-lg bg-muted/30">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium">{header}</p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {t.contacts?.sample || "Sample"}: {parsedCSV.rows[0]?.[parsedCSV.headers.indexOf(header)] || "—"}
                                            </p>
                                        </div>
                                        <Select
                                            value={columnMapping[header] || ""}
                                            onValueChange={(value) => {
                                                const newMapping = { ...columnMapping };
                                                if (value === "__skip__") {
                                                    delete newMapping[header];
                                                } else {
                                                    // Remove previous mapping of this field
                                                    Object.keys(newMapping).forEach(k => {
                                                        if (newMapping[k] === value) delete newMapping[k];
                                                    });
                                                    newMapping[header] = value;
                                                }
                                                setColumnMapping(newMapping);
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder={t.contacts?.selectField || "Select field"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__skip__">
                                                    <span className="text-muted-foreground">{t.contacts?.customFieldMetadata || "→ Custom Field"}</span>
                                                </SelectItem>
                                                {getStandardFields(t).map((f) => (
                                                    <SelectItem key={f.key} value={f.key}>
                                                        {f.label} {f.required && "*"}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))}
                            </div>

                            {/* Unmapped columns info */}
                            {unmappedColumns.length > 0 && (
                                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                    <p className="text-xs font-semibold text-blue-600 mb-2">
                                        {t.contacts?.unmappedStoredAsMetadata || "Unmapped columns → stored as custom fields"}:
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {unmappedColumns.map(col => (
                                            <Badge key={col} variant="secondary" className="text-xs">
                                                {col}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Preview */}
                    {step === "preview" && (
                        <div className="space-y-4">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {t.contacts?.previewFirstRows || "Preview (first 5 rows)"}
                            </p>
                            <div className="space-y-2">
                                {previewData.map((contact, idx) => (
                                    <div key={idx} className="p-3 rounded-lg border bg-card text-sm">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <span className="font-semibold">{contact.email}</span>
                                            {contact.firstName && <span className="text-muted-foreground">• {contact.firstName} {contact.lastName}</span>}
                                        </div>
                                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                            {contact.phone && <span>📞 {contact.phone}</span>}
                                            {contact.country && <span>🌍 {contact.country}</span>}
                                            {contact.metadata && (
                                                <span className="text-blue-600">
                                                    +{Object.keys(contact.metadata).length} custom fields
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {t.contacts?.totalWillBeImported?.replace("{{count}}", String(parsedCSV?.rows.length || 0)) || `Total: ${parsedCSV?.rows.length || 0} contacts will be imported`}
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="shrink-0 p-4 sm:p-6 pt-4 border-t flex-row justify-end gap-2">
                    {step === "upload" && (
                        <Button variant="ghost" onClick={() => handleOpenChange(false)}>
                            {t.common?.cancel || "Cancel"}
                        </Button>
                    )}
                    {step === "mapping" && (
                        <>
                            <Button variant="ghost" onClick={() => setStep("upload")}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                {t.common?.back || "Back"}
                            </Button>
                            <Button onClick={() => setStep("preview")} disabled={!isEmailMapped}>
                                {t.common?.next || "Next"}
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </>
                    )}
                    {step === "preview" && (
                        <>
                            <Button variant="ghost" onClick={() => setStep("mapping")} disabled={importing}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                {t.common?.back || "Back"}
                            </Button>
                            <Button onClick={handleImport} disabled={importing} className="gap-2">
                                {importing && <Spinner className="h-4 w-4" />}
                                <Check className="h-4 w-4" />
                                {t.contacts?.importCountContacts?.replace("{{count}}", String(parsedCSV?.rows.length || 0)) || `Import ${parsedCSV?.rows.length || 0} Contacts`}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
