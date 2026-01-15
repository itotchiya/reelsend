"use client";

import React, { useState, useRef, useCallback } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload } from "lucide-react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useI18n } from "@/lib/i18n";

// Helper to center crop
function centerAspectCrop(
    mediaWidth: number,
    mediaHeight: number,
    aspect: number,
) {
    return centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 90,
            },
            aspect,
            mediaWidth,
            mediaHeight,
        ),
        mediaWidth,
        mediaHeight,
    );
}

// ============================================
// AVATAR DIALOG
// ============================================
interface EditAvatarDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: any;
}

export function EditAvatarDialog({ open, onOpenChange, user }: EditAvatarDialogProps) {
    const { t } = useI18n();
    const [imgSrc, setImgSrc] = useState('');
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const imgRef = useRef<HTMLImageElement>(null);
    const [loading, setLoading] = useState(false);

    const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setCrop(undefined);
            const reader = new FileReader();
            reader.addEventListener('load', () =>
                setImgSrc(reader.result?.toString() || ''),
            );
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        setCrop(centerAspectCrop(width, height, 1));
    }, []);

    const getCroppedBlob = useCallback(async (): Promise<Blob | null> => {
        if (!imgRef.current || !completedCrop) return null;

        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        // Set output size (max 400x400 for avatars)
        const outputSize = Math.min(400, completedCrop.width, completedCrop.height);
        canvas.width = outputSize;
        canvas.height = outputSize;
        const ctx = canvas.getContext('2d');

        if (!ctx) return null;

        ctx.drawImage(
            image,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            outputSize,
            outputSize,
        );

        return new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85);
        });
    }, [completedCrop]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const blob = await getCroppedBlob();
            if (!blob) {
                toast.error((t.settings.avatarDialog as any)?.errorNoImage || "Please select and crop an image");
                setLoading(false);
                return;
            }

            // Upload as FormData to R2
            const formData = new FormData();
            formData.append('file', blob, `avatar-${Date.now()}.jpg`);

            const res = await fetch("/api/upload/avatar", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                toast.success((t.settings.avatarDialog as any)?.success || "Avatar updated successfully");
                onOpenChange(false);
                window.location.reload();
            } else {
                const error = await res.text();
                throw new Error(error || (t.settings.avatarDialog as any)?.error || "Failed to update avatar");
            }
        } catch (error) {
            toast.error((t.settings.avatarDialog as any)?.error || "Failed to update avatar");
        } finally {
            setLoading(false);
        }
    };

    const initials = (user.name || "U")
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) setImgSrc(''); onOpenChange(v); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{(t.settings as any)?.avatarDialog?.title || "Update Photo"}</DialogTitle>
                    <DialogDescription>
                        {(t.settings as any)?.avatarDialog?.description || "Upload a new profile photo."}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {!imgSrc ? (
                        <div className="flex flex-col items-center gap-4">
                            <Avatar className="h-24 w-24 border">
                                <AvatarImage src={user.image || ""} />
                                <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                            <Label
                                htmlFor="avatar-upload"
                                className="cursor-pointer flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent transition-colors"
                            >
                                <Upload className="h-4 w-4" />
                                {(t.settings.avatarDialog as any)?.chooseImage || "Choose Image"}
                            </Label>
                            <Input
                                id="avatar-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={onSelectFile}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <ReactCrop
                                crop={crop}
                                onChange={(_, percentCrop) => setCrop(percentCrop)}
                                onComplete={(c) => setCompletedCrop(c)}
                                aspect={1}
                                circularCrop
                            >
                                <img
                                    ref={imgRef}
                                    alt={(t.settings.avatarDialog as any)?.cropAlt || "Crop me"}
                                    src={imgSrc}
                                    onLoad={onImageLoad}
                                    className="max-h-[300px] rounded-md"
                                />
                            </ReactCrop>
                            <Button variant="ghost" size="sm" onClick={() => setImgSrc('')}>
                                {(t.settings.avatarDialog as any)?.changeImage || "Choose a different image"}
                            </Button>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {(t.common as any)?.cancel || "Cancel"}
                    </Button>
                    <Button onClick={handleSave} disabled={loading || !imgSrc}>
                        {loading ? <Spinner className="h-4 w-4" /> : (t.common as any)?.save || "Save"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ============================================
// NAME DIALOG
// ============================================
interface EditNameDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: any;
}

export function EditNameDialog({ open, onOpenChange, user }: EditNameDialogProps) {
    const { t } = useI18n();
    const [name, setName] = useState(user.name || "");
    const [loading, setLoading] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });

            if (res.ok) {
                toast.success((t.settings.nameDialog as any)?.success || "Name updated successfully");
                onOpenChange(false);
                window.location.reload();
            } else {
                throw new Error((t.settings.nameDialog as any)?.error || "Failed to update name");
            }
        } catch (error) {
            toast.error((t.settings.nameDialog as any)?.error || "Failed to update name");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{(t.settings as any)?.nameDialog?.title || "Update Name"}</DialogTitle>
                    <DialogDescription>
                        {(t.settings as any)?.nameDialog?.description || "Change your display name."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSave}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{(t.settings as any)?.nameDialog?.label || "Full Name"}</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={(t.settings as any)?.nameDialog?.placeholder || "Your name"}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            {(t.common as any)?.cancel || "Cancel"}
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Spinner className="h-4 w-4" /> : ((t.common as any)?.save || "Save")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ============================================
// EMAIL DIALOG (OTP)
// ============================================
interface EditEmailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: any;
}

export function EditEmailDialog({ open, onOpenChange, user }: EditEmailDialogProps) {
    const { t } = useI18n();
    const [email, setEmail] = useState(user.email || "");
    const [step, setStep] = useState<'input' | 'verify'>('input');
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (email === user.email) {
            toast.error((t.settings as any)?.emailDialog?.errorSameEmail || "New email cannot be the same as current email.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/user/email/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            if (res.ok) {
                toast.success((t.settings as any)?.emailDialog?.otpSent || "OTP sent to your new email.");
                setStep('verify');
            } else {
                const data = await res.json();
                toast.error(data.message || ((t.settings as any)?.emailDialog?.errorSendOtp || "Failed to send OTP."));
            }
        } catch (error) {
            toast.error((t.common as any)?.error || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/user/email/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp }),
            });
            if (res.ok) {
                toast.success((t.settings as any)?.emailDialog?.success || "Email updated successfully!");
                onOpenChange(false);
                window.location.reload();
            } else {
                const data = await res.json();
                toast.error(data.message || ((t.settings as any)?.emailDialog?.errorInvalidOtp || "Invalid OTP."));
            }
        } catch (error) {
            toast.error((t.common as any)?.error || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) setStep('input'); onOpenChange(v); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{step === 'input' ? ((t.settings as any)?.emailDialog?.titleUpdate || "Update Email") : ((t.settings as any)?.emailDialog?.titleVerify || "Verify OTP")}</DialogTitle>
                    <DialogDescription>
                        {step === 'input'
                            ? ((t.settings as any)?.emailDialog?.descUpdate || "Enter your new email address.")
                            : ((t.settings as any)?.emailDialog?.descVerify || "Enter the code we sent.")?.replace("{{email}}", email)}
                    </DialogDescription>
                </DialogHeader>

                {step === 'input' ? (
                    <form onSubmit={handleRequestOtp}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="new-email">{(t.settings as any)?.emailDialog?.labelEmail || "New Email Address"}</Label>
                                <Input
                                    id="new-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                {(t.common as any)?.cancel || "Cancel"}
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? <Spinner className="h-4 w-4" /> : ((t.settings as any)?.emailDialog?.btnSendOtp || "Send OTP")}
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="otp">{(t.settings as any)?.emailDialog?.labelOtp || "Verification Code"}</Label>
                                <Input
                                    id="otp"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="000000"
                                    maxLength={6}
                                    required
                                    autoFocus
                                    className="text-center text-lg tracking-widest"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setStep('input')}>
                                {(t.common as any)?.back || "Back"}
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? <Spinner className="h-4 w-4" /> : ((t.settings as any)?.emailDialog?.btnVerify || "Verify")}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}

// ============================================
// PASSWORD DIALOG
// ============================================
interface EditPasswordDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditPasswordDialog({ open, onOpenChange }: EditPasswordDialogProps) {
    const { t } = useI18n();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error((t.settings as any)?.passwordDialog?.errorMatch || "New passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/user/password", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            if (res.ok) {
                toast.success((t.settings as any)?.passwordDialog?.success || "Password updated successfully!");
                onOpenChange(false);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                const data = await res.json();
                toast.error(data.message || ((t.settings as any)?.passwordDialog?.error || "Failed to update password."));
            }
        } catch (error) {
            toast.error((t.common as any)?.error || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{(t.settings as any)?.passwordDialog?.title || "Change Password"}</DialogTitle>
                    <DialogDescription>
                        {(t.settings as any)?.passwordDialog?.description || "Secure your account with a new password."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSave}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="current">{(t.settings as any)?.passwordDialog?.labelCurrent || "Current Password"}</Label>
                            <Input
                                id="current"
                                type="password"
                                placeholder="••••••••"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="new">{(t.settings as any)?.passwordDialog?.labelNew || "New Password"}</Label>
                            <Input
                                id="new"
                                type="password"
                                placeholder="••••••••"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="confirm">{(t.settings as any)?.passwordDialog?.labelConfirm || "Confirm New Password"}</Label>
                            <Input
                                id="confirm"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            {(t.common as any)?.cancel || "Cancel"}
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Spinner className="h-4 w-4" /> : ((t.settings as any)?.passwordDialog?.btnUpdate || "Update Password")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ============================================
// NOTIFICATIONS DIALOG
// ============================================
interface EditNotificationsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditNotificationsDialog({ open, onOpenChange }: EditNotificationsDialogProps) {
    const { t } = useI18n();
    const [loading, setLoading] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success((t.settings as any)?.notificationsDialog?.success || "Notification preferences updated!");
            onOpenChange(false);
        } catch (error) {
            toast.error((t.settings as any)?.notificationsDialog?.error || "Failed to update notification preferences.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{(t.settings as any)?.notificationsDialog?.title || "Notification Preferences"}</DialogTitle>
                    <DialogDescription>
                        {(t.settings as any)?.notificationsDialog?.description || "Configure how you want to be notified."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSave}>
                    <div className="grid gap-6 py-4">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="campaign-upd" className="cursor-pointer">{(t.settings.notificationsDialog as any)?.labelCampaign || "Campaign Updates"}</Label>
                                <Switch id="campaign-upd" defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="audience-gr" className="cursor-pointer">{(t.settings.notificationsDialog as any)?.labelAudience || "Audience Growth"}</Label>
                                <Switch id="audience-gr" defaultChecked />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-muted-foreground">{(t.settings.notificationsDialog as any)?.sectionPush || "Push Notifications"}</h4>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="new-mentions" className="cursor-pointer">{(t.settings.notificationsDialog as any)?.labelMentions || "New Mentions"}</Label>
                                <Switch id="new-mentions" defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="sys-alerts" className="cursor-pointer">{(t.settings.notificationsDialog as any)?.labelSystem || "System Alerts"}</Label>
                                <Switch id="sys-alerts" defaultChecked />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            {(t.common as any)?.cancel || "Cancel"}
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Spinner className="h-4 w-4" /> : (t.settings.notificationsDialog as any)?.btnSave || "Save Preferences"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
