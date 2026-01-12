"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

/**
 * EditProfileNameDialog
 * 
 * A reusable dialog for editing an SMTP profile name.
 * Used in postal-config page and SMTP sub-page.
 */

interface EditProfileNameDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    profileId: string | null;
    currentName: string;
    onSuccess?: () => void;
}

export function EditProfileNameDialog({
    open,
    onOpenChange,
    profileId,
    currentName,
    onSuccess,
}: EditProfileNameDialogProps) {
    const { t } = useI18n();
    const [name, setName] = useState(currentName);
    const [isSaving, setIsSaving] = useState(false);

    // Reset name when dialog opens with new profile
    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen) {
            setName(currentName);
        }
        onOpenChange(isOpen);
    };

    const handleSave = async () => {
        if (!profileId || !name.trim()) return;

        setIsSaving(true);
        try {
            const response = await fetch(`/api/postal/profiles/${profileId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim() }),
            });

            if (response.ok) {
                toast.success(t.clients?.profileUpdated || "Profile name updated");
                onOpenChange(false);
                onSuccess?.();
            } else {
                const data = await response.json();
                toast.error(data.error || t.clients?.profileUpdateFailed || "Failed to update profile name");
            }
        } catch (error: any) {
            toast.error(error.message || t.clients?.profileUpdateFailed || "Failed to update profile name");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t.clients?.editProfileName || "Edit Profile Name"}</DialogTitle>
                    <DialogDescription>
                        {t.clients?.editProfileNameDesc || "Enter a new name for this SMTP profile."}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label>{t.clients?.profileName || "Profile Name"}</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t.clients?.profileName || "Enter profile name"}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && name.trim()) {
                                    handleSave();
                                }
                            }}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {t.common?.cancel || "Cancel"}
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || !name.trim()}
                    >
                        {isSaving ? (t.common?.loading || "Loading...") : (t.common?.save || "Save")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/**
 * DeleteProfileDialog
 * 
 * A reusable dialog for deleting an SMTP profile with name confirmation.
 * Used in postal-config page and SMTP sub-page.
 */

interface DeleteProfileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    profileId: string | null;
    profileName: string;
    onSuccess?: () => void;
}

export function DeleteProfileDialog({
    open,
    onOpenChange,
    profileId,
    profileName,
    onSuccess,
}: DeleteProfileDialogProps) {
    const { t } = useI18n();
    const [confirmInput, setConfirmInput] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    // Reset input when dialog opens
    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            setConfirmInput("");
        }
        onOpenChange(isOpen);
    };

    const handleDelete = async () => {
        if (!profileId || confirmInput !== profileName) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/postal/profiles/${profileId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                toast.success(t.clients?.profileDeleted || "Profile deleted");
                onOpenChange(false);
                onSuccess?.();
            } else {
                const data = await response.json();
                toast.error(data.error || t.clients?.profileDeleteFailed || "Failed to delete profile");
            }
        } catch (error: any) {
            toast.error(error.message || t.clients?.profileDeleteFailed || "Failed to delete profile");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-destructive">
                        {t.common?.delete || "Delete"} "{profileName}"?
                    </DialogTitle>
                    <DialogDescription>
                        {t.clients?.deleteProfileWarning || "This action cannot be undone. This SMTP profile will be permanently removed."}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label>{t.clients?.typeNameToConfirm || "Type the profile name to confirm:"}</Label>
                        <Input
                            value={confirmInput}
                            onChange={(e) => setConfirmInput(e.target.value)}
                            placeholder={profileName}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && confirmInput === profileName) {
                                    handleDelete();
                                }
                            }}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {t.common?.cancel || "Cancel"}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting || confirmInput !== profileName}
                    >
                        {isDeleting ? (t.common?.loading || "Loading...") : (t.common?.delete || "Delete")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
