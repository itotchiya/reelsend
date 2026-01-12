"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SmtpProfileCard, SmtpProfile } from "@/components/ui-kit/smtp-profile-card";
import { Search, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

/**
 * SmtpSelector Component
 * 
 * A dialog for selecting an SMTP profile for a campaign.
 * Uses SmtpProfileCard for consistent display.
 */

interface SmtpSelectorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    profiles: SmtpProfile[];
    selectedId?: string | null;
    onSelect: (profile: SmtpProfile) => void;
}

export function SmtpSelector({
    open,
    onOpenChange,
    profiles,
    selectedId,
    onSelect,
}: SmtpSelectorProps) {
    const { t } = useI18n();
    const [searchQuery, setSearchQuery] = useState("");

    const filteredProfiles = profiles.filter(profile =>
        profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.host.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelect = (profile: SmtpProfile) => {
        onSelect(profile);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Terminal className="h-5 w-5" />
                        {t.postal?.profiles?.selectProfile || "Select SMTP Profile"}
                    </DialogTitle>
                </DialogHeader>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t.common?.search || "Search profiles..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Profiles Grid */}
                <div className="flex-1 overflow-y-auto py-4">
                    {filteredProfiles.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {filteredProfiles.map((profile) => (
                                <div
                                    key={profile.id}
                                    className={cn(
                                        "cursor-pointer transition-all duration-200 rounded-xl",
                                        selectedId === profile.id && "ring-2 ring-primary"
                                    )}
                                    onClick={() => handleSelect(profile)}
                                >
                                    <SmtpProfileCard
                                        profile={profile}
                                        onActivate={() => handleSelect(profile)}
                                        onDelete={() => { }}
                                        className="hover:border-primary/50"
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Terminal className="h-12 w-12 text-muted-foreground/40 mb-4" />
                            <p className="text-muted-foreground">
                                {searchQuery
                                    ? t.common?.noResults || "No profiles found"
                                    : t.postal?.profiles?.noProfiles || "No SMTP profiles available"}
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
