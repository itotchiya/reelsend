"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Search, Users, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Contact {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    status: string;
}

interface CreateSegmentWizardProps {
    audienceId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function CreateSegmentWizard({
    audienceId,
    open,
    onOpenChange,
    onSuccess,
}: CreateSegmentWizardProps) {
    const { t } = useI18n();

    // Steps: 1 = Basic Info, 2 = Select Contacts
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Step 1: Basic Info
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    // Step 2: Contacts
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [contactsLoading, setContactsLoading] = useState(false);
    const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch contacts when step 2 is active
    const fetchContacts = useCallback(async () => {
        setContactsLoading(true);
        try {
            const res = await fetch(`/api/audiences/${audienceId}/contacts?limit=1000`);
            if (res.ok) {
                const data = await res.json();
                setContacts(data.contacts || []);
            }
        } catch (error) {
            toast.error(t.common?.error || "Failed to load contacts");
        } finally {
            setContactsLoading(false);
        }
    }, [audienceId, t.common?.error]);

    useEffect(() => {
        if (open && step === 2) {
            fetchContacts();
        }
    }, [open, step, fetchContacts]);

    // Reset on open
    useEffect(() => {
        if (open) {
            setStep(1);
            setName("");
            setDescription("");
            setSelectedContactIds(new Set());
            setSearchQuery("");
        }
    }, [open]);

    // Filter contacts by search
    const filteredContacts = contacts.filter((c) =>
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Toggle single contact
    const toggleContact = (id: string) => {
        const newSet = new Set(selectedContactIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedContactIds(newSet);
    };

    // Select all visible contacts
    const selectAll = () => {
        const allIds = filteredContacts.map((c) => c.id);
        setSelectedContactIds(new Set(allIds));
    };

    // Deselect all
    const deselectAll = () => {
        setSelectedContactIds(new Set());
    };

    // Step 1 validation
    const canProceedToStep2 = name.trim().length > 0;

    // Handle step navigation
    const goToStep2 = () => {
        if (!canProceedToStep2) {
            toast.error(t.common?.required || "Name is required");
            return;
        }
        setStep(2);
    };

    const goBackToStep1 = () => {
        setStep(1);
    };

    // Submit
    const handleSubmit = async () => {
        if (selectedContactIds.size === 0) {
            toast.error(t.audiences?.selectAtLeastOne || "Select at least one contact");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/segments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    audienceId,
                    name: name.trim(),
                    description: description.trim() || null,
                    contactIds: Array.from(selectedContactIds),
                }),
            });

            if (res.ok) {
                toast.success(t.common?.success || "Segment created");
                onOpenChange(false);
                onSuccess();
            } else {
                const error = await res.text();
                toast.error(error || t.common?.error || "Failed to create segment");
            }
        } catch (error) {
            toast.error(t.common?.error || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {step === 1 ? (
                            <>{t.audiences?.createSegment || "Create Segment"}</>
                        ) : (
                            <>{t.audiences?.selectContacts || "Select Contacts"}</>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 1
                            ? t.audiences?.segmentBasicInfo || "Enter the segment name and description."
                            : t.audiences?.segmentSelectDesc || "Choose which contacts to include in this segment."}
                    </DialogDescription>
                </DialogHeader>

                {/* Progress Indicator */}
                <div className="flex items-center gap-2 py-2">
                    <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold",
                        step === 1 ? "bg-primary text-primary-foreground" : "bg-primary/20 text-primary"
                    )}>
                        {step > 1 ? <Check className="h-4 w-4" /> : "1"}
                    </div>
                    <div className="flex-1 h-1 bg-muted rounded overflow-hidden">
                        <div className={cn("h-full bg-primary transition-all", step >= 2 ? "w-full" : "w-0")} />
                    </div>
                    <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold",
                        step === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                        2
                    </div>
                </div>

                {/* Step Content */}
                <div className="flex-1 overflow-y-auto py-4">
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">{t.common?.name || "Name"} *</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={t.audiences?.segmentNamePlaceholder || "Enter segment name"}
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">{t.common?.description || "Description"}</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder={t.audiences?.segmentDescPlaceholder || "Brief description (optional)"}
                                    rows={3}
                                    className="resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            {/* Search and Actions */}
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={t.audiences?.searchContacts || "Search contacts..."}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                <Button variant="outline" size="sm" onClick={selectAll}>
                                    {t.audiences?.selectAll || "Select All"}
                                </Button>
                                <Button variant="ghost" size="sm" onClick={deselectAll}>
                                    {t.audiences?.deselectAll || "Clear"}
                                </Button>
                            </div>

                            {/* Selection Summary */}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span>
                                    {selectedContactIds.size} {t.audiences?.selected || "selected"} / {contacts.length} {t.common?.contacts || "contacts"}
                                </span>
                            </div>

                            {/* Contact List */}
                            {contactsLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Spinner className="h-8 w-8" />
                                </div>
                            ) : filteredContacts.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    {t.audiences?.noContactsFound || "No contacts found"}
                                </div>
                            ) : (
                                <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
                                    {filteredContacts.map((contact) => (
                                        <div
                                            key={contact.id}
                                            className={cn(
                                                "flex items-center gap-3 p-3 cursor-pointer transition-colors",
                                                selectedContactIds.has(contact.id) ? "bg-primary/5" : "hover:bg-muted/50"
                                            )}
                                            onClick={() => toggleContact(contact.id)}
                                        >
                                            <Checkbox
                                                checked={selectedContactIds.has(contact.id)}
                                                onCheckedChange={() => toggleContact(contact.id)}
                                            />
                                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                                                {(contact.firstName?.[0] || contact.email[0]).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">
                                                    {contact.firstName || contact.lastName
                                                        ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim()
                                                        : "Anonymous"}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="pt-4 border-t">
                    {step === 1 ? (
                        <>
                            <Button variant="ghost" onClick={() => onOpenChange(false)}>
                                {t.common?.cancel || "Cancel"}
                            </Button>
                            <Button onClick={goToStep2} disabled={!canProceedToStep2} className="gap-2">
                                {t.common?.next || "Next"}
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="ghost" onClick={goBackToStep1} className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                {t.common?.back || "Back"}
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={loading || selectedContactIds.size === 0}
                                className="gap-2"
                            >
                                {loading && <Spinner className="h-4 w-4" />}
                                {t.audiences?.createSegment || "Create Segment"}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
