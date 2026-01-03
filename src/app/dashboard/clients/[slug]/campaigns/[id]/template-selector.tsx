"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Mail, CheckCircle2, LayoutTemplate } from "lucide-react";
import { Template } from "@prisma/client";

interface TemplateSelectorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    templates: Template[];
    selectedId?: string | null;
    onSelect: (template: Template) => void;
}

export function TemplateSelector({ open, onOpenChange, templates, selectedId, onSelect }: TemplateSelectorProps) {
    const [search, setSearch] = useState("");

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[90vw] max-w-5xl h-[80vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 border-b shrink-0">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-2xl">Select a Template</DialogTitle>
                        <div className="relative w-72">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search templates..."
                                className="pl-8"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
                    {filteredTemplates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <LayoutTemplate className="h-16 w-16 text-muted-foreground/30 mb-4" />
                            <h3 className="text-lg font-semibold">No templates found</h3>
                            <p className="text-muted-foreground">Try adjusting your search terms.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filteredTemplates.map((template) => (
                                <div
                                    key={template.id}
                                    className={`
                                        group relative rounded-xl border bg-card overflow-hidden cursor-pointer transition-all hover:shadow-md
                                        ${selectedId === template.id ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'}
                                    `}
                                    onClick={() => {
                                        onSelect(template);
                                        onOpenChange(false);
                                    }}
                                >
                                    {/* Preview Area */}
                                    <div className="relative h-48 bg-muted/30 overflow-hidden">
                                        {template.htmlContent ? (
                                            <iframe
                                                srcDoc={template.htmlContent}
                                                className="w-full h-[400px] border-0 pointer-events-none"
                                                style={{
                                                    transform: 'scale(0.5)',
                                                    transformOrigin: 'top left',
                                                    width: '200%'
                                                }}
                                                tabIndex={-1}
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground/50">
                                                <Mail className="h-8 w-8" />
                                                <span className="text-xs">No Preview</span>
                                            </div>
                                        )}

                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                            {selectedId === template.id && (
                                                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                                                    <Badge className="h-8 px-3 text-sm gap-2">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        Selected
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Info Area */}
                                    <div className="p-4">
                                        <h4 className="font-semibold truncate">{template.name}</h4>
                                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 h-8">
                                            {template.description || "No description provided"}
                                        </p>
                                        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                                            <span>
                                                {new Date(template.updatedAt).toLocaleDateString()}
                                            </span>
                                            {template.htmlContent ? (
                                                <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">Ready</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">Draft</Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
