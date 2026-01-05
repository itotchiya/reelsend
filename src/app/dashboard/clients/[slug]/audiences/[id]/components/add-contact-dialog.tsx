"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { ScrollArea } from "@/components/ui/scroll-area";

const COUNTRIES = [
    "France", "United States", "United Kingdom", "Germany", "Spain", "Italy",
    "Canada", "Australia", "Belgium", "Netherlands", "Switzerland", "Morocco",
    "Algeria", "Tunisia", "Senegal", "Côte d'Ivoire", "Other"
];

const getGenders = (t: any) => [
    { value: "MALE", label: t.contacts?.genders?.MALE || "Male" },
    { value: "FEMALE", label: t.contacts?.genders?.FEMALE || "Female" },
    { value: "OTHER", label: t.contacts?.genders?.OTHER || "Other" },
    { value: "PREFER_NOT_TO_SAY", label: t.contacts?.genders?.PREFER_NOT_TO_SAY || "Prefer not to say" },
];

const getMaritalStatuses = (t: any) => [
    { value: "SINGLE", label: t.contacts?.maritalStatuses?.SINGLE || "Single" },
    { value: "MARRIED", label: t.contacts?.maritalStatuses?.MARRIED || "Married" },
    { value: "DIVORCED", label: t.contacts?.maritalStatuses?.DIVORCED || "Divorced" },
    { value: "WIDOWED", label: t.contacts?.maritalStatuses?.WIDOWED || "Widowed" },
    { value: "SEPARATED", label: t.contacts?.maritalStatuses?.SEPARATED || "Separated" },
    { value: "OTHER", label: t.contacts?.maritalStatuses?.OTHER || "Other" },
];

interface AddContactDialogProps {
    audienceId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

const initialFormData = {
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    country: "",
    city: "",
    street: "",
    birthday: "",
    gender: "",
    maritalStatus: "",
};

export function AddContactDialog({
    audienceId,
    open,
    onOpenChange,
    onSuccess
}: AddContactDialogProps) {
    const { t } = useI18n();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState(initialFormData);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.email) {
            toast.error(t.contacts?.emailRequired || "Email is required");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                birthday: formData.birthday ? new Date(formData.birthday).toISOString() : null,
                gender: formData.gender || null,
                maritalStatus: formData.maritalStatus || null,
            };

            const res = await fetch(`/api/audiences/${audienceId}/contacts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                toast.success(t.contacts?.addSuccess || "Contact added");
                setFormData(initialFormData);
                onSuccess();
                onOpenChange(false);
            } else if (res.status === 409) {
                toast.error(t.contacts?.alreadyExists || "Contact already exists");
            } else {
                toast.error(t.common?.error || "Failed to add contact");
            }
        } catch (error) {
            toast.error(t.common?.error || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setFormData(initialFormData);
        }
        onOpenChange(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{t.contacts?.addTitle || "Add Contact"}</DialogTitle>
                    <DialogDescription>
                        {t.audiences?.details?.addContact || "Add a new contact to this audience"}
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 pr-4">
                    <form id="add-contact-form" onSubmit={handleSubmit} className="space-y-4 py-4">
                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">{t.contacts?.email || "Email"} *</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="example@domain.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>

                        {/* Name Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">{t.contacts?.firstName || "First Name"}</Label>
                                <Input
                                    id="firstName"
                                    placeholder="John"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">{t.contacts?.lastName || "Last Name"}</Label>
                                <Input
                                    id="lastName"
                                    placeholder="Doe"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <Label htmlFor="phone">{t.contacts?.phone || "Phone"}</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="+33 6 12 34 56 78"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>

                        {/* Birthday & Gender */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="birthday">{t.contacts?.birthday || "Birthday"}</Label>
                                <Input
                                    id="birthday"
                                    type="date"
                                    value={formData.birthday}
                                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t.contacts?.gender || "Gender"}</Label>
                                <Select
                                    value={formData.gender}
                                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t.contacts?.selectField || "Select gender"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {getGenders(t).map((g) => (
                                            <SelectItem key={g.value} value={g.value}>
                                                {g.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Marital Status */}
                        <div className="space-y-2">
                            <Label>{t.contacts?.maritalStatus || "Marital Status"}</Label>
                            <Select
                                value={formData.maritalStatus}
                                onValueChange={(value) => setFormData({ ...formData, maritalStatus: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t.contacts?.selectField || "Select status"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {getMaritalStatuses(t).map((s) => (
                                        <SelectItem key={s.value} value={s.value}>
                                            {s.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Country & City */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t.contacts?.country || "Country"}</Label>
                                <Select
                                    value={formData.country}
                                    onValueChange={(value) => setFormData({ ...formData, country: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t.contacts?.selectField || "Select country"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {COUNTRIES.map((c) => (
                                            <SelectItem key={c} value={c}>
                                                {c}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="city">{t.contacts?.city || "City"}</Label>
                                <Input
                                    id="city"
                                    placeholder="Paris"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Street */}
                        <div className="space-y-2">
                            <Label htmlFor="street">{t.contacts?.street || "Street Address"}</Label>
                            <Input
                                id="street"
                                placeholder="123 Main Street"
                                value={formData.street}
                                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                            />
                        </div>
                    </form>
                </ScrollArea>
                <DialogFooter className="pt-4 border-t">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => handleOpenChange(false)}
                        disabled={loading}
                    >
                        {t.common?.cancel || "Cancel"}
                    </Button>
                    <Button type="submit" form="add-contact-form" disabled={loading} className="gap-2">
                        {loading && <Spinner className="h-4 w-4" />}
                        {t.contacts?.addTitle || "Add Contact"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
