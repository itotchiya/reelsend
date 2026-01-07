"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Search, Users, ArrowLeft, ArrowRight, Check, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Contact {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    country: string | null;
    city: string | null;
    street: string | null;
    birthday: string | null;
    gender: string | null;
    maritalStatus: string | null;
    status: string;
    metadata: Record<string, any> | null;
}

interface Audience {
    id: string;
    name: string;
    client: {
        id: string;
        name: string;
        slug: string;
    };
}

interface CreateSegmentClientProps {
    audience: Audience;
    contacts: Contact[];
}

const getGenderOptions = (t: any) => [
    { value: "MALE", label: t.contacts?.genders?.MALE || "Male" },
    { value: "FEMALE", label: t.contacts?.genders?.FEMALE || "Female" },
    { value: "OTHER", label: t.contacts?.genders?.OTHER || "Other" },
];

const getMaritalOptions = (t: any) => [
    { value: "SINGLE", label: t.contacts?.maritalStatuses?.SINGLE || "Single" },
    { value: "MARRIED", label: t.contacts?.maritalStatuses?.MARRIED || "Married" },
    { value: "DIVORCED", label: t.contacts?.maritalStatuses?.DIVORCED || "Divorced" },
    { value: "WIDOWED", label: t.contacts?.maritalStatuses?.WIDOWED || "Widowed" },
    { value: "SEPARATED", label: t.contacts?.maritalStatuses?.SEPARATED || "Separated" },
];

export function CreateSegmentClient({ audience, contacts }: CreateSegmentClientProps) {
    const router = useRouter();
    const { t } = useI18n();

    // Steps
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Step 1: Basic Info
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    // Step 2: Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCountry, setFilterCountry] = useState("__all__");
    const [filterGender, setFilterGender] = useState("__all__");
    const [filterMaritalStatus, setFilterMaritalStatus] = useState("__all__");
    const [filterAgeMin, setFilterAgeMin] = useState("");
    const [filterAgeMax, setFilterAgeMax] = useState("");
    const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());

    const segmentsUrl = `/dashboard/clients/${audience.client.slug}/audiences/${audience.id}/segments`;

    // Get unique countries from contacts
    const uniqueCountries = useMemo(() => {
        const countries = new Set<string>();
        contacts.forEach(c => {
            if (c.country) countries.add(c.country);
        });
        return Array.from(countries).sort();
    }, [contacts]);

    // Calculate age from birthday
    const calculateAge = (birthday: string | null): number | null => {
        if (!birthday) return null;
        const birthDate = new Date(birthday);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    // Filter contacts
    const filteredContacts = useMemo(() => {
        return contacts.filter((c) => {
            // Search filter
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const matches = c.email.toLowerCase().includes(q) ||
                    c.firstName?.toLowerCase().includes(q) ||
                    c.lastName?.toLowerCase().includes(q) ||
                    c.phone?.toLowerCase().includes(q);
                if (!matches) return false;
            }

            // Country filter
            if (filterCountry !== "__all__" && c.country !== filterCountry) return false;

            // Gender filter
            if (filterGender !== "__all__" && c.gender !== filterGender) return false;

            // Marital status filter
            if (filterMaritalStatus !== "__all__" && c.maritalStatus !== filterMaritalStatus) return false;

            // Age filter
            if (filterAgeMin || filterAgeMax) {
                const age = calculateAge(c.birthday);
                if (age === null) return false;
                if (filterAgeMin && age < parseInt(filterAgeMin)) return false;
                if (filterAgeMax && age > parseInt(filterAgeMax)) return false;
            }

            return true;
        });
    }, [contacts, searchQuery, filterCountry, filterGender, filterMaritalStatus, filterAgeMin, filterAgeMax]);

    // Check if filters are active
    const hasActiveFilters = filterCountry !== "__all__" || filterGender !== "__all__" || filterMaritalStatus !== "__all__" || filterAgeMin || filterAgeMax;

    // Clear all filters
    const clearFilters = () => {
        setFilterCountry("__all__");
        setFilterGender("__all__");
        setFilterMaritalStatus("__all__");
        setFilterAgeMin("");
        setFilterAgeMax("");
    };

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

    // Select all filtered contacts
    const selectAllFiltered = () => {
        const allIds = filteredContacts.map((c) => c.id);
        setSelectedContactIds(new Set(allIds));
    };

    // Deselect all
    const deselectAll = () => {
        setSelectedContactIds(new Set());
    };

    // Step 1 validation
    const canProceedToStep2 = name.trim().length > 0;

    const goToStep2 = () => {
        if (!canProceedToStep2) {
            toast.error(t.common?.required || "Name is required");
            return;
        }
        setStep(2);
    };

    const goBackToStep1 = () => setStep(1);

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
                    audienceId: audience.id,
                    name: name.trim(),
                    description: description.trim() || null,
                    contactIds: Array.from(selectedContactIds),
                }),
            });

            if (res.ok) {
                toast.success(t.common?.success || "Segment created successfully");
                router.push(segmentsUrl);
                router.refresh();
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
        <>
            <PageHeader
                title={step === 1 ? (t.audiences?.createSegment || "Create Segment") : (t.audiences?.selectContacts || "Select Contacts")}
                showBack
                onBack={() => step === 1 ? router.push(segmentsUrl) : goBackToStep1()}
            />

            <PageContent>
                <div className="max-w-4xl mx-auto">
                    {/* Progress Steps */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-colors",
                                step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            )}>
                                {step > 1 ? <Check className="h-5 w-5" /> : "1"}
                            </div>
                            <span className={cn("font-medium", step >= 1 ? "text-foreground" : "text-muted-foreground")}>
                                {t.common?.info || "Basic Info"}
                            </span>
                        </div>
                        <div className="flex-1 h-1 bg-muted rounded overflow-hidden">
                            <div className={cn("h-full bg-primary transition-all duration-300", step >= 2 ? "w-full" : "w-0")} />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-colors",
                                step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            )}>
                                2
                            </div>
                            <span className={cn("font-medium", step >= 2 ? "text-foreground" : "text-muted-foreground")}>
                                {t.audiences?.selectContacts || "Select Contacts"}
                            </span>
                        </div>
                    </div>

                    {/* Step 1: Basic Info */}
                    {step === 1 && (
                        <div className="space-y-6 bg-card rounded-xl border p-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">{t.common?.name || "Segment Name"} *</Label>
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
                                    rows={4}
                                    className="resize-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button variant="ghost" onClick={() => router.push(segmentsUrl)}>
                                    {t.common?.cancel || "Cancel"}
                                </Button>
                                <Button onClick={goToStep2} disabled={!canProceedToStep2} className="gap-2">
                                    {t.common?.next || "Next"}
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Filter & Select Contacts */}
                    {step === 2 && (
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            {/* Filters Panel */}
                            <div className="lg:col-span-1 space-y-4">
                                <div className="bg-card rounded-xl border p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm font-semibold">
                                            <Filter className="h-4 w-4" />
                                            {t.common?.filters || "Filters"}
                                        </div>
                                        {hasActiveFilters && (
                                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearFilters}>
                                                {t.audiences?.deselectAll || "Clear"}
                                            </Button>
                                        )}
                                    </div>

                                    {/* Country Filter */}
                                    <div className="space-y-2">
                                        <Label className="text-xs">{t.contacts?.country || "Country"}</Label>
                                        <Select value={filterCountry} onValueChange={setFilterCountry}>
                                            <SelectTrigger className="w-full h-9">
                                                <SelectValue placeholder={t.contacts?.allCountries || "All countries"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__all__">{t.contacts?.allCountries || "All countries"}</SelectItem>
                                                {uniqueCountries.map((c) => (
                                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Gender Filter */}
                                    <div className="space-y-2">
                                        <Label className="text-xs">{t.contacts?.gender || "Gender"}</Label>
                                        <Select value={filterGender} onValueChange={setFilterGender}>
                                            <SelectTrigger className="w-full h-9">
                                                <SelectValue placeholder={t.contacts?.allGenders || "All genders"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__all__">{t.contacts?.allGenders || "All genders"}</SelectItem>
                                                {getGenderOptions(t).map((g) => (
                                                    <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Marital Status Filter */}
                                    <div className="space-y-2">
                                        <Label className="text-xs">{t.contacts?.maritalStatus || "Marital Status"}</Label>
                                        <Select value={filterMaritalStatus} onValueChange={setFilterMaritalStatus}>
                                            <SelectTrigger className="w-full h-9">
                                                <SelectValue placeholder={t.contacts?.allStatuses || "All statuses"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__all__">{t.contacts?.allStatuses || "All statuses"}</SelectItem>
                                                {getMaritalOptions(t).map((s) => (
                                                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Age Range Filter */}
                                    <div className="space-y-2">
                                        <Label className="text-xs">{t.contacts?.ageRange || "Age Range"}</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="number"
                                                placeholder={t.common?.min || "Min"}
                                                value={filterAgeMin}
                                                onChange={(e) => setFilterAgeMin(e.target.value)}
                                                className="h-9"
                                            />
                                            <Input
                                                type="number"
                                                placeholder={t.common?.max || "Max"}
                                                value={filterAgeMax}
                                                onChange={(e) => setFilterAgeMax(e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Active Filters */}
                                {hasActiveFilters && (
                                    <div className="flex flex-wrap gap-1">
                                        {filterCountry !== "__all__" && (
                                            <Badge variant="secondary" className="text-xs gap-1">
                                                {filterCountry}
                                                <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterCountry("__all__")} />
                                            </Badge>
                                        )}
                                        {filterGender !== "__all__" && (
                                            <Badge variant="secondary" className="text-xs gap-1">
                                                {getGenderOptions(t).find(g => g.value === filterGender)?.label}
                                                <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterGender("__all__")} />
                                            </Badge>
                                        )}
                                        {filterMaritalStatus !== "__all__" && (
                                            <Badge variant="secondary" className="text-xs gap-1">
                                                {getMaritalOptions(t).find(s => s.value === filterMaritalStatus)?.label}
                                                <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterMaritalStatus("__all__")} />
                                            </Badge>
                                        )}
                                        {(filterAgeMin || filterAgeMax) && (
                                            <Badge variant="secondary" className="text-xs gap-1">
                                                Age: {filterAgeMin || "0"} - {filterAgeMax || "∞"}
                                                <X className="h-3 w-3 cursor-pointer" onClick={() => { setFilterAgeMin(""); setFilterAgeMax(""); }} />
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Contacts List */}
                            <div className="lg:col-span-3 space-y-4">
                                {/* Search and Actions */}
                                <div className="flex items-center gap-3">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder={t.audiences?.searchContacts || "Search contacts..."}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                    <Button variant="outline" size="sm" onClick={selectAllFiltered}>
                                        {t.audiences?.selectAll || "Select All"} ({filteredContacts.length})
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={deselectAll}>
                                        {t.audiences?.deselectAll || "Clear"}
                                    </Button>
                                </div>

                                {/* Selection Summary */}
                                <div className="flex items-center gap-2 text-sm">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">{selectedContactIds.size} {t.audiences?.selected || "selected"}</span>
                                    <span className="text-muted-foreground">
                                        / {filteredContacts.length} {t.common?.filtered || "filtered"} / {contacts.length} {t.common?.total || "total"}
                                    </span>
                                </div>

                                {/* Contact List */}
                                <div className="bg-card rounded-xl border divide-y max-h-[450px] overflow-y-auto">
                                    {filteredContacts.length === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground">
                                            {t.audiences?.noContactsFound || "No contacts match filter criteria"}
                                        </div>
                                    ) : (
                                        filteredContacts.map((contact) => {
                                            const age = calculateAge(contact.birthday);
                                            return (
                                                <div
                                                    key={contact.id}
                                                    className={cn(
                                                        "flex items-center gap-3 p-4 cursor-pointer transition-colors",
                                                        selectedContactIds.has(contact.id) ? "bg-primary/5" : "hover:bg-muted/50"
                                                    )}
                                                    onClick={() => toggleContact(contact.id)}
                                                >
                                                    <Checkbox
                                                        checked={selectedContactIds.has(contact.id)}
                                                        onCheckedChange={() => toggleContact(contact.id)}
                                                    />
                                                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-bold shrink-0">
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
                                                    <div className="flex flex-wrap gap-1">
                                                        {contact.country && (
                                                            <Badge variant="outline" className="text-[10px]">{contact.country}</Badge>
                                                        )}
                                                        {age !== null && (
                                                            <Badge variant="outline" className="text-[10px]">{age}y</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex justify-between gap-3 pt-4">
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
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </PageContent>
        </>
    );
}
