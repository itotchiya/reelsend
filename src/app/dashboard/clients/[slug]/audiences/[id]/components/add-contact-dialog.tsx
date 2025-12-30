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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

interface AddContactDialogProps {
    audienceId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function AddContactDialog({
    audienceId,
    open,
    onOpenChange,
    onSuccess
}: AddContactDialogProps) {
    const { t } = useI18n();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        firstName: "",
        lastName: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.email) {
            toast.error("Email is required");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/audiences/${audienceId}/contacts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast.success(t.common.success);
                setFormData({ email: "", firstName: "", lastName: "" });
                onSuccess();
                onOpenChange(false);
            } else if (res.status === 409) {
                toast.error(t.common.error);
            } else {
                toast.error(t.common.error);
            }
        } catch (error) {
            toast.error(t.common.error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t.contacts.addTitle}</DialogTitle>
                    <DialogDescription>
                        {t.audiences.details.addContact}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">{t.contacts.email} *</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="example@domain.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">{t.contacts.firstName}</Label>
                            <Input
                                id="firstName"
                                placeholder={t.contacts.firstName}
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">{t.contacts.lastName}</Label>
                            <Input
                                id="lastName"
                                placeholder={t.contacts.lastName}
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            {t.common.cancel}
                        </Button>
                        <Button type="submit" disabled={loading} className="gap-2">
                            {loading && <Spinner className="h-4 w-4" />}
                            {t.contacts.addTitle}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
