"use client";

import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pencil, X, Calendar, MapPin, Phone, User, Heart } from "lucide-react";

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
    createdAt: string;
    updatedAt: string;
}

interface ContactDetailDialogProps {
    contact: Contact | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function ContactDetailDialog({
    contact,
    open,
    onOpenChange,
    onSuccess
}: ContactDetailDialogProps) {
    const { t } = useI18n();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
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
    });

    // Sync form data when contact changes
    useEffect(() => {
        if (contact) {
            setFormData({
                email: contact.email || "",
                firstName: contact.firstName || "",
                lastName: contact.lastName || "",
                phone: contact.phone || "",
                country: contact.country || "",
                city: contact.city || "",
                street: contact.street || "",
                birthday: contact.birthday ? contact.birthday.split("T")[0] : "",
                gender: contact.gender || "",
                maritalStatus: contact.maritalStatus || "",
            });
            setIsEditing(false);
        }
    }, [contact]);

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

    const handleSave = async () => {
        if (!contact) return;

        setLoading(true);
        try {
            const payload = {
                ...formData,
                birthday: formData.birthday ? new Date(formData.birthday).toISOString() : null,
                gender: formData.gender || null,
                maritalStatus: formData.maritalStatus || null,
            };

            const res = await fetch(`/api/contacts/${contact.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                toast.success(t.contacts?.updateSuccess || "Contact updated");
                setIsEditing(false);
                onSuccess();
            } else {
                const error = await res.text();
                toast.error(error || t.common?.error || "Failed to update");
            }
        } catch (error) {
            toast.error(t.common?.error || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const getGenderLabel = (value: string | null) => {
        return getGenders(t).find((g) => g.value === value)?.label || value || "—";
    };

    const getMaritalLabel = (value: string | null) => {
        return getMaritalStatuses(t).find((s) => s.value === value)?.label || value || "—";
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString("fr-FR", {
            day: "2-digit", month: "2-digit", year: "2-digit",
            hour: "2-digit", minute: "2-digit"
        });
    };

    if (!contact) return null;

    const age = calculateAge(contact.birthday);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="flex items-center gap-2">
                                {contact.firstName || contact.lastName
                                    ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim()
                                    : contact.email}
                            </DialogTitle>
                            <DialogDescription>{contact.email}</DialogDescription>
                        </div>
                        {!isEditing && (
                            <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsEditing(true)}>
                                <Pencil className="h-3 w-3" />
                                {t.common?.edit || "Edit"}
                            </Button>
                        )}
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 pr-4">
                    {isEditing ? (
                        /* Edit Mode */
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{t.contacts?.firstName || "First Name"}</Label>
                                    <Input
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t.contacts?.lastName || "Last Name"}</Label>
                                    <Input
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>{t.contacts?.email || "Email"}</Label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>{t.contacts?.phone || "Phone"}</Label>
                                <Input
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{t.contacts?.birthday || "Birthday"}</Label>
                                    <Input
                                        type="date"
                                        value={formData.birthday}
                                        onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t.contacts?.gender || "Gender"}</Label>
                                    <Select
                                        value={formData.gender}
                                        onValueChange={(v) => setFormData({ ...formData, gender: v })}
                                    >
                                        <SelectTrigger><SelectValue placeholder={t.contacts?.selectField || "Select"} /></SelectTrigger>
                                        <SelectContent>
                                            {getGenders(t).map((g) => (
                                                <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>{t.contacts?.maritalStatus || "Marital Status"}</Label>
                                <Select
                                    value={formData.maritalStatus}
                                    onValueChange={(v) => setFormData({ ...formData, maritalStatus: v })}
                                >
                                    <SelectTrigger><SelectValue placeholder={t.contacts?.selectField || "Select"} /></SelectTrigger>
                                    <SelectContent>
                                        {getMaritalStatuses(t).map((s) => (
                                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{t.contacts?.country || "Country"}</Label>
                                    <Select
                                        value={formData.country}
                                        onValueChange={(v) => setFormData({ ...formData, country: v })}
                                    >
                                        <SelectTrigger><SelectValue placeholder={t.contacts?.selectField || "Select"} /></SelectTrigger>
                                        <SelectContent>
                                            {COUNTRIES.map((c) => (
                                                <SelectItem key={c} value={c}>{c}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>{t.contacts?.city || "City"}</Label>
                                    <Input
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>{t.contacts?.street || "Street Address"}</Label>
                                <Input
                                    value={formData.street}
                                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                                />
                            </div>
                        </div>
                    ) : (
                        /* View Mode */
                        <div className="space-y-6 py-4">
                            {/* Status Badge */}
                            <div className="flex items-center gap-2">
                                <Badge variant={contact.status === "ACTIVE" ? "default" : "secondary"}>
                                    {contact.status}
                                </Badge>
                                {age !== null && (
                                    <Badge variant="outline">{t.common?.yearsOld?.replace("{{count}}", String(age)) || `${age} years old`}</Badge>
                                )}
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-3">
                                {contact.phone && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span>{contact.phone}</span>
                                    </div>
                                )}
                                {contact.birthday && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span>
                                            {new Date(contact.birthday).toLocaleDateString("fr-FR")}
                                            {age !== null && ` (${age} ans)`}
                                        </span>
                                    </div>
                                )}
                                {contact.gender && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span>{getGenderLabel(contact.gender)}</span>
                                    </div>
                                )}
                                {contact.maritalStatus && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Heart className="h-4 w-4 text-muted-foreground" />
                                        <span>{getMaritalLabel(contact.maritalStatus)}</span>
                                    </div>
                                )}
                                {(contact.street || contact.city || contact.country) && (
                                    <div className="flex items-start gap-3 text-sm">
                                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <div>
                                            {contact.street && <div>{contact.street}</div>}
                                            {(contact.city || contact.country) && (
                                                <div className="text-muted-foreground">
                                                    {[contact.city, contact.country].filter(Boolean).join(", ")}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Custom Metadata */}
                            {contact.metadata && Object.keys(contact.metadata).length > 0 && (
                                <div className="pt-4 border-t">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                        {t.contacts?.customFields || "Custom Fields"}
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {Object.entries(contact.metadata).map(([key, value]) => (
                                            <div key={key} className="text-sm">
                                                <span className="text-muted-foreground">{key}: </span>
                                                <span className="font-medium">{String(value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Timestamps */}
                            <div className="pt-4 border-t text-xs text-muted-foreground">
                                <p>{t.contacts?.created || "Created"}: {formatDate(contact.createdAt)}</p>
                                <p>{t.contacts?.updated || "Updated"}: {formatDate(contact.updatedAt)}</p>
                            </div>
                        </div>
                    )}
                </ScrollArea>

                {isEditing && (
                    <DialogFooter className="pt-4 border-t">
                        <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={loading}>
                            {t.common?.cancel || "Cancel"}
                        </Button>
                        <Button onClick={handleSave} disabled={loading} className="gap-2">
                            {loading && <Spinner className="h-4 w-4" />}
                            {t.common?.save || "Save Changes"}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
