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
import { ChevronDown, Users, Search, X } from "lucide-react";
import { AudienceCard, AudienceCardData } from "./audience-card";
import { useI18n } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";

interface AudienceSelectorDialogProps {
    clientId: string | null;
    selectedAudienceId: string | null;
    onAudienceSelect: (audienceId: string | null, audience?: AudienceCardData) => void;
    className?: string;
    disabled?: boolean;
}

export function AudienceSelectorDialog({
    clientId,
    selectedAudienceId,
    onAudienceSelect,
    className,
    disabled = false,
}: AudienceSelectorDialogProps) {
    const { t } = useI18n();
    const [open, setOpen] = React.useState(false);
    const [audiences, setAudiences] = React.useState<AudienceCardData[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const debouncedSearch = useDebounce(search, 300);

    React.useEffect(() => {
        if (clientId) {
            fetchAudiences();
        }
    }, [clientId]);

    const fetchAudiences = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/audiences?clientId=${clientId}`);
            if (res.ok) {
                const data = await res.json();
                setAudiences(data);
            }
        } catch (error) {
            console.error("Failed to fetch audiences", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (audience: AudienceCardData) => {
        onAudienceSelect(audience.id, audience);
        setOpen(false);
    };

    const filteredAudiences = audiences.filter(a =>
        a.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    const selectedAudience = audiences.find(a => a.id === selectedAudienceId);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div
                    className={cn(
                        "relative flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 cursor-pointer group",
                        selectedAudienceId
                            ? "border-0 bg-primary/5 hover:bg-primary/10"
                            : "border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50 p-6",
                        disabled && "opacity-50 cursor-not-allowed hover:border-muted-foreground/20 hover:bg-transparent",
                        className
                    )}
                    onClick={(e) => {
                        if (disabled) {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                    }}
                >
                    {selectedAudienceId && selectedAudience ? (
                        <div className="w-full flex flex-col gap-2">
                            <AudienceCard
                                audience={selectedAudience}
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
                                        onAudienceSelect(null);
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
                                <Users className="h-6 w-6" />
                            </div>

                            <div className="text-center">
                                <h3 className="font-medium text-foreground">Select Audience</h3>
                                <p className="text-xs text-muted-foreground max-w-[200px] mt-1">
                                    Choose the audience group to send this campaign to
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
                            Select Audience
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
                            placeholder="Search audiences..."
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
                            {filteredAudiences.length > 0 ? (
                                filteredAudiences.map((audience) => (
                                    <AudienceCard
                                        key={audience.id}
                                        audience={audience}
                                        onClick={() => handleSelect(audience)}
                                        canEdit={false}
                                        canDelete={false}
                                        selectable={true}
                                        selected={selectedAudienceId === audience.id}
                                        className="cursor-pointer"
                                    />
                                ))
                            ) : (
                                <div className="col-span-full py-16 text-center text-muted-foreground italic text-sm">
                                    {search ? "No audiences found matching your search." : "No audiences found for this client."}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
