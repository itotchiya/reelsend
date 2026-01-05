"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

interface Audience {
    id: string;
    name: string;
    description: string | null;
}

interface EditAudienceDialogProps {
    audience: Audience;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function EditAudienceDialog({
    audience,
    open,
    onOpenChange,
    onSuccess,
}: EditAudienceDialogProps) {
    const { t } = useI18n();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: audience.name,
        description: audience.description || "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error(t.common?.required || "Name is required");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/audiences/${audience.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast.success(t.common?.success || "Saved successfully");
                onOpenChange(false);
                onSuccess();
            } else {
                const error = await res.text();
                toast.error(error || t.common?.error || "Failed to save");
            }
        } catch (error) {
            toast.error(t.common?.error || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    // Reset form when dialog opens
    const handleOpenChange = (open: boolean) => {
        if (open) {
            setFormData({
                name: audience.name,
                description: audience.description || "",
            });
        }
        onOpenChange(open);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t.audiences?.editDetails || "Edit Audience"}</DialogTitle>
                    <DialogDescription>
                        {t.audiences?.editDescription || "Update the audience name and description."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">{t.common?.name || "Name"} *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder={t.audiences?.namePlaceholder || "Enter audience name"}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">{t.common?.description || "Description"}</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder={t.audiences?.descriptionPlaceholder || "Brief description"}
                            rows={3}
                            className="resize-none"
                        />
                    </div>
                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            {t.common?.cancel || "Cancel"}
                        </Button>
                        <Button type="submit" disabled={loading} className="gap-2">
                            {loading && <Spinner className="h-4 w-4" />}
                            {t.common?.save || "Save"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
