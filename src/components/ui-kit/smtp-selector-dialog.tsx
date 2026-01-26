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
import { Server, Search, X } from "lucide-react";
import { SmtpProfileCard, SmtpProfile as SmtpProfileType } from "./smtp-profile-card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useDebounce } from "@/hooks/use-debounce";
import { CardBadge } from "@/components/ui-kit/card-badge";
import { Button } from "@/components/ui/button";

// Re-export or use the type from card
// interface SmtpProfile was defined locally but now imported
// Remove local definition if matches
type SmtpProfile = SmtpProfileType;

interface SmtpSelectorDialogProps {
    clientId: string | null;
    selectedProfileId: string | null;
    onProfileSelect: (profileId: string | null, profile?: SmtpProfile) => void;
    className?: string;
    disabled?: boolean;
}

export function SmtpSelectorDialog({
    clientId,
    selectedProfileId,
    onProfileSelect,
    className,
    disabled = false,
}: SmtpSelectorDialogProps) {
    const [open, setOpen] = React.useState(false);
    const [profiles, setProfiles] = React.useState<SmtpProfile[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const debouncedSearch = useDebounce(search, 300);

    React.useEffect(() => {
        if (clientId) {
            fetchProfiles();
        }
    }, [clientId]);

    const fetchProfiles = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/postal/profiles?clientId=${clientId}`);
            if (res.ok) {
                const data = await res.json();
                setProfiles(data.profiles || []);
            }
        } catch (error) {
            console.error("Failed to fetch SMTP profiles", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (profile: SmtpProfile) => {
        onProfileSelect(profile.id, profile);
        setOpen(false);
    };

    const filteredProfiles = profiles.filter(p =>
        p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        p.host.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    const selectedProfile = profiles.find(p => p.id === selectedProfileId);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div
                    className={cn(
                        "relative flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 cursor-pointer group",
                        selectedProfileId
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
                    {(selectedProfileId && selectedProfile) ? (
                        <div className="w-full flex flex-col gap-2">
                            <SmtpProfileCard
                                profile={selectedProfile}
                                className="w-full"
                            // Standard display in trigger
                            />
                            <div className="flex justify-center">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-2"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onProfileSelect(null);
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
                                <Server className="h-6 w-6" />
                            </div>

                            <div className="text-center">
                                <h3 className="font-medium text-foreground">Select SMTP</h3>
                                <p className="text-xs text-muted-foreground max-w-[200px] mt-1">
                                    Choose the mail server profile to send from
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </DialogTrigger>
            <DialogContent
                className="w-[90vw] h-[90vh] max-w-none sm:max-w-none rounded-xl border p-0 gap-0 overflow-hidden flex flex-col data-[state=open]:animate-none"
                showCloseButton={false}
                aria-describedby={undefined}
            >
                <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b bg-background">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-2xl font-bold">
                            Select SMTP Profile
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
                            placeholder="Search profiles..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 bg-muted/50 h-11"
                        />
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Spinner />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredProfiles.length > 0 ? (
                                filteredProfiles.map((profile) => (
                                    <SmtpProfileCard
                                        key={profile.id}
                                        profile={profile}
                                        selectable
                                        selected={selectedProfileId === profile.id}
                                        onClick={() => handleSelect(profile)}
                                        className="h-full"
                                    />
                                ))
                            ) : (
                                <div className="col-span-full py-16 text-center text-muted-foreground italic text-sm">
                                    {search ? "No profiles found matching your search." : "No SMTP profiles found for this client."}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
