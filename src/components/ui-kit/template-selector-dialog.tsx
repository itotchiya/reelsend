"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Search, LayoutTemplate, X } from "lucide-react";
import { TemplateCard, TemplateCardData } from "./template-card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { AIGeneratedBadge } from "@/components/ui-kit/card-badge";

interface TemplateSelectorDialogProps {
    clientId: string | null;
    selectedTemplateId: string | null;
    onTemplateSelect: (templateId: string | null, template?: TemplateCardData) => void;
    className?: string;
    disabled?: boolean;
}

export function TemplateSelectorDialog({
    clientId,
    selectedTemplateId,
    onTemplateSelect,
    className,
    disabled = false,
}: TemplateSelectorDialogProps) {
    const [open, setOpen] = React.useState(false);
    const [templates, setTemplates] = React.useState<TemplateCardData[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const debouncedSearch = useDebounce(search, 300);

    React.useEffect(() => {
        if (clientId) {
            fetchTemplates();
        }
    }, [clientId]);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/templates?clientId=${clientId}`);
            if (res.ok) {
                const data = await res.json();
                setTemplates(data);
            }
        } catch (error) {
            console.error("Failed to fetch templates", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (template: TemplateCardData) => {
        onTemplateSelect(template.id, template);
        setOpen(false);
    };

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div
                    className={cn(
                        "relative flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 cursor-pointer group min-h-[160px]",
                        selectedTemplateId
                            ? "border-0 bg-primary/5 hover:bg-primary/10"
                            : "border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50 p-8",
                        disabled && "opacity-50 cursor-not-allowed hover:border-muted-foreground/20 hover:bg-transparent pointer-events-none",
                        className
                    )}
                    onClick={(e) => {
                        if (disabled) {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                    }}
                >
                    {selectedTemplateId && selectedTemplate ? (
                        <div className="w-full flex flex-col gap-2">
                            <TemplateCard
                                template={selectedTemplate}
                                className="w-full border-solid"
                                selectable
                                labels={{ openEditor: "Change" }}
                            />
                            <div className="flex justify-center">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-2"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onTemplateSelect(null);
                                    }}
                                >
                                    Remove
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className={cn(
                                "h-14 w-14 rounded-full flex items-center justify-center mb-4 transition-colors",
                                "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                            )}>
                                <LayoutTemplate className="h-7 w-7" />
                            </div>
                            <div className="text-center">
                                <h3 className="font-medium text-lg text-foreground">Select Template</h3>
                                <p className="text-sm text-muted-foreground max-w-[250px] mx-auto mt-2">
                                    Choose an email template to start with
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </DialogTrigger>

            {/* Full-screen dialog with responsive padding */}
            <DialogContent
                className="w-[90vw] h-[90vh] max-w-none sm:max-w-none rounded-xl border p-0 gap-0 overflow-hidden flex flex-col data-[state=open]:animate-none"
                showCloseButton={false}
                aria-describedby={undefined}
            >
                {/* Header */}
                <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b bg-background">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-2xl font-bold">
                            Select Template
                        </DialogTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setOpen(false)}
                            className="h-10 w-10 rounded-full"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                    <div className="relative mt-4">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search templates..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 bg-muted/50 h-11"
                        />
                    </div>
                </DialogHeader>

                {/* Content with responsive padding */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Spinner />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredTemplates.length > 0 ? (
                                filteredTemplates.map((template) => (
                                    <TemplateCard
                                        key={template.id}
                                        template={template}
                                        selectable
                                        selected={selectedTemplateId === template.id}
                                        onClick={() => handleSelect(template)}
                                    />
                                ))
                            ) : (
                                <div className="col-span-full py-16 text-center text-muted-foreground italic text-sm">
                                    {search ? "No templates found matching your search." : "No templates found for this client."}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
