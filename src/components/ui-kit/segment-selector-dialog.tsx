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
import { Filter, Search, PieChart, Users, X } from "lucide-react";
import { SegmentCard, SegmentCardData } from "./segment-card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";

interface SegmentSelectorDialogProps {
    audienceId: string | null;
    selectedSegmentId: string | null;
    onSegmentSelect: (segmentId: string | null, segment?: SegmentCardData) => void;
    className?: string;
    disabled?: boolean;
}

export function SegmentSelectorDialog({
    audienceId,
    selectedSegmentId,
    onSegmentSelect,
    className,
    disabled = false,
}: SegmentSelectorDialogProps) {
    const [open, setOpen] = React.useState(false);
    const [segments, setSegments] = React.useState<SegmentCardData[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const debouncedSearch = useDebounce(search, 300);

    React.useEffect(() => {
        if (audienceId) {
            fetchSegments();
        }
    }, [audienceId]);

    const fetchSegments = async () => {
        if (!audienceId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/audiences/${audienceId}/segments`);
            if (res.ok) {
                const data = await res.json();
                setSegments(data);
            }
        } catch (error) {
            console.error("Failed to fetch segments", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (segmentId: string | null, segment?: SegmentCardData) => {
        onSegmentSelect(segmentId, segment);
        setOpen(false);
    };

    const filteredSegments = segments.filter(s =>
        s.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    const selectedSegment = segments.find(s => s.id === selectedSegmentId);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div
                    className={cn(
                        "relative flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 cursor-pointer group",
                        selectedSegmentId
                            ? "border-0 bg-primary/5 hover:bg-primary/10"
                            : "border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50 p-6",
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
                    {(selectedSegmentId && selectedSegment) ? (
                        <div className="w-full flex flex-col gap-2">
                            <SegmentCard
                                segment={selectedSegment}
                                canEdit={false}
                                canDelete={false}
                                selectable={true}
                                className="w-full"
                            />
                            <div className="flex justify-center">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-2"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleSelect(null);
                                    }}
                                >
                                    Remove
                                </Button>
                            </div>
                        </div>
                    ) : selectedSegmentId === "all" ? (
                        <div className="w-full flex flex-col gap-2">
                            <div className="w-full cursor-pointer rounded-xl border bg-card p-4 ring-2 ring-primary border-primary bg-primary/5 transition-all flex flex-col items-center justify-center min-h-[160px]" role="button">
                                <div className="h-12 w-12 rounded-full flex items-center justify-center mb-3 bg-primary/20 text-primary">
                                    <Users className="h-6 w-6" />
                                </div>
                                <h3 className="font-semibold text-sm">All Contacts</h3>
                                <p className="text-xs text-muted-foreground mt-1">Send to everyone</p>
                            </div>
                            <div className="flex justify-center">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-2"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleSelect(null);
                                    }}
                                >
                                    Remove
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className={cn(
                                "h-12 w-12 rounded-full flex items-center justify-center mb-3 transition-colors",
                                "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                            )}>
                                {/* Use Users icon if no segment, or Filter if disabled? */}
                                <PieChart className="h-6 w-6" />
                            </div>

                            <div className="text-center">
                                <h3 className="font-medium text-foreground">Select Segment</h3>
                                <p className="text-xs text-muted-foreground max-w-[200px] mt-1">
                                    {disabled ? "Please select an audience first" : "Optional: Filter by segment"}
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
                        <DialogTitle className="text-xl font-bold">
                            Select Segment
                        </DialogTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setOpen(false)}
                            className="h-8 w-8 rounded-full"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="relative mt-4">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search segments..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 bg-muted/50 h-10"
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
                            {/* "All Contacts" Option - Special Card */}
                            <div
                                className={cn(
                                    "rounded-xl border bg-card p-4 transition-all duration-200 cursor-pointer h-full flex flex-col items-center justify-center min-h-[160px]",
                                    selectedSegmentId === "all"
                                        ? "ring-2 ring-primary border-primary bg-primary/5"
                                        : "border-dashed border-muted-foreground/30 hover:ring-2 hover:ring-primary/50 hover:border-primary/50"
                                )}
                                onClick={() => handleSelect("all")}
                            >
                                <div className={cn(
                                    "h-12 w-12 rounded-full flex items-center justify-center mb-3",
                                    selectedSegmentId === "all" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                                )}>
                                    <Users className="h-6 w-6" />
                                </div>
                                <h3 className="font-semibold text-sm">All Contacts</h3>
                                <p className="text-xs text-muted-foreground mt-1">Send to everyone</p>
                            </div>

                            {filteredSegments.length > 0 && filteredSegments.map((segment) => (
                                <SegmentCard
                                    key={segment.id}
                                    segment={segment}
                                    onClick={() => handleSelect(segment.id, segment)}
                                    canEdit={false}
                                    canDelete={false}
                                    selectable={true}
                                    selected={selectedSegmentId === segment.id}
                                    className="cursor-pointer"
                                />
                            ))}

                            {filteredSegments.length === 0 && !search && (
                                <div className="col-span-full py-12 text-center text-muted-foreground italic text-sm">
                                    No custom segments found for this audience.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
