"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AudienceCard, AudienceCardData } from "@/components/ui-kit/audience-card";
import { SegmentCard, SegmentCardData } from "@/components/ui-kit/segment-card";
import { Search, Users, ArrowLeft, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

/**
 * AudienceSegmentSelector Component
 * 
 * Two-step selection dialog:
 * 1. First step: Select an audience
 * 2. Second step: Select a segment from that audience
 */

export interface AudienceWithSegments extends AudienceCardData {
    segments: SegmentCardData[];
}

interface AudienceSegmentSelectorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    audiences: AudienceWithSegments[];
    selectedAudienceId?: string | null;
    selectedSegmentId?: string | null;
    onSelect: (audience: AudienceWithSegments, segment: SegmentCardData) => void;
}

type Step = "audience" | "segment";

export function AudienceSegmentSelector({
    open,
    onOpenChange,
    audiences,
    selectedAudienceId,
    selectedSegmentId,
    onSelect,
}: AudienceSegmentSelectorProps) {
    const { t } = useI18n();
    const [step, setStep] = useState<Step>("audience");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedAudience, setSelectedAudience] = useState<AudienceWithSegments | null>(null);

    // Reset on close
    useEffect(() => {
        if (!open) {
            setStep("audience");
            setSearchQuery("");
            setSelectedAudience(null);
        }
    }, [open]);

    // Pre-select audience if selectedAudienceId is provided
    useEffect(() => {
        if (open && selectedAudienceId) {
            const audience = audiences.find(a => a.id === selectedAudienceId);
            if (audience) {
                setSelectedAudience(audience);
                setStep("segment");
            }
        }
    }, [open, selectedAudienceId, audiences]);

    const filteredAudiences = audiences.filter(a =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.description && a.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredSegments = selectedAudience?.segments.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
    ) || [];

    const handleAudienceSelect = (audience: AudienceWithSegments) => {
        setSelectedAudience(audience);
        setSearchQuery("");
        setStep("segment");
    };

    const handleSegmentSelect = (segment: SegmentCardData) => {
        if (selectedAudience) {
            onSelect(selectedAudience, segment);
            onOpenChange(false);
        }
    };

    const handleBack = () => {
        setStep("audience");
        setSearchQuery("");
        setSelectedAudience(null);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 border-b shrink-0">
                    <div className="flex items-center gap-4">
                        {step === "segment" && (
                            <Button variant="ghost" size="icon" onClick={handleBack}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        )}
                        <div className="flex-1">
                            <DialogTitle className="text-xl">
                                {step === "audience"
                                    ? (t.audiences?.selectAudience || "Select Audience")
                                    : (t.audiences?.selectSegment || "Select Segment")
                                }
                            </DialogTitle>
                            {step === "segment" && selectedAudience && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    {selectedAudience.name}
                                </p>
                            )}
                        </div>
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={step === "audience"
                                    ? (t.common?.search || "Search audiences...")
                                    : (t.common?.search || "Search segments...")
                                }
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
                    {step === "audience" ? (
                        // Step 1: Audience Selection
                        filteredAudiences.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                <Users className="h-16 w-16 text-muted-foreground/30 mb-4" />
                                <h3 className="text-lg font-semibold">
                                    {searchQuery
                                        ? (t.common?.noResults || "No audiences found")
                                        : (t.audiences?.noAudiences || "No audiences available")
                                    }
                                </h3>
                            </div>
                        ) : (
                            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                {filteredAudiences.map((audience) => (
                                    <div
                                        key={audience.id}
                                        onClick={() => handleAudienceSelect(audience)}
                                        className={cn(
                                            "cursor-pointer transition-all rounded-xl",
                                            selectedAudienceId === audience.id && "ring-2 ring-primary"
                                        )}
                                    >
                                        <AudienceCard
                                            audience={audience}
                                            onView={() => handleAudienceSelect(audience)}
                                            canEdit={false}
                                            canDelete={false}
                                        />
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        // Step 2: Segment Selection
                        filteredSegments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                <LayoutGrid className="h-16 w-16 text-muted-foreground/30 mb-4" />
                                <h3 className="text-lg font-semibold">
                                    {searchQuery
                                        ? (t.common?.noResults || "No segments found")
                                        : (t.audiences?.noSegments || "No segments in this audience")
                                    }
                                </h3>
                                <p className="text-muted-foreground mt-2">
                                    {t.audiences?.createSegmentFirst || "Create a segment first to target specific contacts."}
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                {filteredSegments.map((segment) => (
                                    <SegmentCard
                                        key={segment.id}
                                        segment={segment}
                                        onClick={() => handleSegmentSelect(segment)}
                                        selected={selectedSegmentId === segment.id}
                                        selectable
                                        canEdit={false}
                                        canDelete={false}
                                    />
                                ))}
                            </div>
                        )
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
