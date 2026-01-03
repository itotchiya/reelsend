"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Users, CheckCircle2 } from "lucide-react";
import { Audience } from "@prisma/client";

// Extended type to include count
type AudienceWithCount = Audience & {
    _count: { contacts: number };
};

interface AudienceSelectorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    audiences: AudienceWithCount[];
    selectedId?: string | null;
    onSelect: (audience: AudienceWithCount) => void;
}

export function AudienceSelector({ open, onOpenChange, audiences, selectedId, onSelect }: AudienceSelectorProps) {
    const [search, setSearch] = useState("");

    const filteredAudiences = audiences.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        (a.description && a.description.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[90vw] max-w-5xl h-[80vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 border-b shrink-0">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-2xl">Select Audience</DialogTitle>
                        <div className="relative w-72">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search audiences..."
                                className="pl-8"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
                    {filteredAudiences.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <Users className="h-16 w-16 text-muted-foreground/30 mb-4" />
                            <h3 className="text-lg font-semibold">No audiences found</h3>
                            <p className="text-muted-foreground">Try creating one first.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {filteredAudiences.map((audience) => (
                                <div
                                    key={audience.id}
                                    className={`
                                        group relative flex flex-col justify-between p-6 rounded-xl border bg-card cursor-pointer transition-all hover:shadow-md
                                        ${selectedId === audience.id ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'}
                                    `}
                                    onClick={() => {
                                        onSelect(audience);
                                        onOpenChange(false);
                                    }}
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                <Users className="h-5 w-5" />
                                            </div>
                                            {selectedId === audience.id && (
                                                <CheckCircle2 className="h-6 w-6 text-primary" />
                                            )}
                                        </div>

                                        <h4 className="font-semibold text-lg mb-2">{audience.name}</h4>
                                        <p className="text-sm text-muted-foreground line-clamp-3 mb-4 min-h-[3rem]">
                                            {audience.description || "No description provided"}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-dashed">
                                        <span className="text-xs text-muted-foreground">Total Contacts</span>
                                        <Badge variant="secondary" className="font-medium">
                                            {audience._count.contacts}
                                        </Badge>
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
