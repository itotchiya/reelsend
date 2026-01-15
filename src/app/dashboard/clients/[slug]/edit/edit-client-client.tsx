"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Save, Upload, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { HexColorPicker } from "react-colorful";
import { getContrastColor } from "@/lib/colors";
import { useBreadcrumbs } from "@/lib/contexts/breadcrumb-context";
import { DashboardBreadcrumb } from "@/components/dashboard/layout";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguagePickerDialog } from "@/components/ui-kit/language-picker-dialog";

type ClientStatus = "active" | "suspended" | "deactivated";

interface Client {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    brandColors: any | null;
    active: boolean;
    status: string;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
    // Keeping SMTP fields optional/unused to match DB type if needed, 
    // but in this view we are ignoring them as per request.
    smtpHost?: string | null;
    smtpPort?: number | null;
    smtpUser?: string | null;
    smtpPassword?: string | null;
    smtpSecure?: boolean;
    smtpVerified?: boolean;
    smtpLastTested?: string | null;
}

interface EditClientClientProps {
    client: Client;
}

export function EditClientClient({ client }: EditClientClientProps) {
    const router = useRouter();
    const { t } = useI18n();
    const [loading, setLoading] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { setOverride, removeOverride } = useBreadcrumbs();

    // Set breadcrumb override so slug shows as client name
    useEffect(() => {
        setOverride(client.slug, client.name);
        return () => removeOverride(client.slug);
    }, [client.slug, client.name, setOverride, removeOverride]);

    const getInitialStatus = (): ClientStatus => {
        return (client.status as ClientStatus) || "active";
    };

    const [formData, setFormData] = useState({
        name: client.name,
        slug: client.slug,
        logo: client.logo || "",
        primaryColor: client.brandColors?.primary || "#4f46e5",
        secondaryColor: client.brandColors?.secondary || "#10b981",
        status: getInitialStatus(),
        isPublic: client.isPublic,
    });

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
        if (!allowedTypes.includes(file.type)) {
            toast.error("Invalid file type. Use PNG, JPG, WebP, GIF, or SVG.");
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error("File too large. Max 10MB.");
            return;
        }

        setUploadingLogo(true);
        try {
            const formDataUpload = new FormData();
            formDataUpload.append("file", file);
            formDataUpload.append("clientId", client.id);

            const res = await fetch("/api/upload/client-logo", {
                method: "POST",
                body: formDataUpload,
            });

            if (res.ok) {
                const { url } = await res.json();
                setFormData((prev) => ({ ...prev, logo: url }));
                toast.success("Logo uploaded successfully");
            } else {
                const error = await res.text();
                toast.error(error || "Failed to upload logo");
            }
        } catch (error) {
            toast.error("Failed to upload logo");
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/clients/${client.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    slug: formData.slug,
                    logo: formData.logo || null,
                    brandColors: {
                        primary: formData.primaryColor,
                        secondary: formData.secondaryColor,
                    },
                    active: formData.status === "active",
                    status: formData.status,
                    isPublic: formData.isPublic,
                }),
            });

            if (res.ok) {
                toast.success("Client updated successfully");
                router.push(`/dashboard/clients/${formData.slug}`);
                router.refresh();
            } else {
                const error = await res.text();
                toast.error(error || "Failed to update client");
            }
        } catch (error) {
            toast.error("Failed to update client");
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "?";
    };

    const getStatusBadge = (status: ClientStatus) => {
        switch (status) {
            case "active":
                return "bg-blue-500/10 text-blue-600 border-blue-500/20";
            case "suspended":
                return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
            case "deactivated":
                return "bg-red-500/10 text-red-600 border-red-500/20";
        }
    };

    // Calculate contrast text color (white or dark) based on background color
    const getContrastTextColor = (hexColor: string): string => {
        return getContrastColor(hexColor);
    };

    return (
        <div className="h-dvh flex flex-col bg-background">
            {/* Simple Header */}
            <header className="shrink-0 flex items-center justify-between px-6 py-4 border-b bg-background">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="-ml-2">
                        <Link href={`/dashboard/clients/${client.slug}`}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <DashboardBreadcrumb />
                </div>
                <div className="flex items-center gap-2">
                    <LanguagePickerDialog />
                    <ThemeToggle />
                </div>
            </header>

            {/* Main Content - Full Page */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto p-6 md:p-12 space-y-8">
                    {/* Header */}
                    <div>
                        <h1 className="text-2xl font-bold">{t.clientDetails?.title || "Client Details"}</h1>
                        <p className="text-muted-foreground mt-1">
                            {t.clientDetails?.editClientDesc || "Manage client details"}
                        </p>
                    </div>

                    {/* Logo Used To Be Here ?? */}

                    {/* Content Forms */}
                    <div className="space-y-8">
                        {/* Logo Upload */}
                        <div className="rounded-xl border border-dashed border-border/60 dark:border-border p-6">
                            <Label className="text-sm font-medium mb-4 block">{t.clientDetails?.logo || "Logo"}</Label>
                            <div className="flex items-start gap-6">
                                <div
                                    className={cn(
                                        "relative h-24 w-24 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors",
                                        formData.logo ? "border-primary/50 bg-primary/5" : "border-muted-foreground/30 hover:border-muted-foreground/50"
                                    )}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {formData.logo ? (
                                        <Avatar className="h-20 w-20 rounded-lg">
                                            <AvatarImage src={formData.logo} className="object-cover" />
                                            <AvatarFallback className="rounded-lg bg-muted">
                                                {getInitials(formData.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                    ) : uploadingLogo ? (
                                        <Spinner className="h-6 w-6" />
                                    ) : (
                                        <span className="text-2xl font-bold text-muted-foreground/50">
                                            {getInitials(formData.name)}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleLogoUpload}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="gap-2"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingLogo}
                                    >
                                        {uploadingLogo ? <Spinner className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                                        {t.clientDetails?.uploadLogo || "Upload Logo"}
                                    </Button>
                                    <p className="text-xs text-muted-foreground">
                                        {t.clientDetails?.logoHelp || "PNG, JPG, WebP, GIF or SVG. Max 10MB."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="rounded-xl border border-dashed border-border/60 dark:border-border p-6 space-y-4">
                            <Label className="text-sm font-medium">{t.clientDetails?.basicInfo || "Basic Information"}</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-xs text-muted-foreground">{t.clientDetails?.name || "Name"}</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="slug" className="text-xs text-muted-foreground">Slug</Label>
                                    <Input
                                        id="slug"
                                        value={formData.slug}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="rounded-xl border border-dashed border-border/60 dark:border-border p-6 space-y-4">
                            <Label className="text-sm font-medium">{t.clientDetails?.status || "Status"}</Label>
                            <div className="flex items-center gap-4">
                                <Select
                                    value={formData.status}
                                    onValueChange={(value: ClientStatus) => setFormData((prev) => ({ ...prev, status: value }))}
                                >
                                    <SelectTrigger className="w-48">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                Active
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="suspended">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                                {t.clientDetails?.suspended || "Suspended"}
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="deactivated">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                                {t.clientDetails?.deactivated || "Deactivated"}
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <Badge variant="outline" className={getStatusBadge(formData.status)}>
                                    {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                                <div>
                                    <p className="text-sm font-medium">{t.clientDetails?.publicPortal || "Public Portal"}</p>
                                    <p className="text-xs text-muted-foreground">{t.clientDetails?.publicPortalDesc || "Allow public access to client portal"}</p>
                                </div>
                                <Switch
                                    checked={formData.isPublic}
                                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isPublic: checked }))}
                                />
                            </div>
                        </div>

                        {/* Brand Colors */}
                        <div className="rounded-xl border border-dashed border-border/60 dark:border-border p-6 space-y-4">
                            <Label className="text-sm font-medium">{t.clientDetails?.brandColors || "Brand Colors"}</Label>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label className="text-xs text-muted-foreground">{t.clientDetails?.primaryColor || "Primary Color"}</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="flex items-center gap-3 w-full p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                                                <div
                                                    className="w-10 h-10 rounded-lg border"
                                                    style={{ backgroundColor: formData.primaryColor }}
                                                />
                                                <span className="font-mono text-sm uppercase">{formData.primaryColor}</span>
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-3" align="start">
                                            <HexColorPicker
                                                color={formData.primaryColor}
                                                onChange={(color) => setFormData((prev) => ({ ...prev, primaryColor: color }))}
                                            />
                                            <Input
                                                value={formData.primaryColor}
                                                onChange={(e) => setFormData((prev) => ({ ...prev, primaryColor: e.target.value }))}
                                                className="mt-3 uppercase font-mono"
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-xs text-muted-foreground">{t.clientDetails?.secondaryColor || "Secondary Color"}</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="flex items-center gap-3 w-full p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                                                <div
                                                    className="w-10 h-10 rounded-lg border"
                                                    style={{ backgroundColor: formData.secondaryColor }}
                                                />
                                                <span className="font-mono text-sm uppercase">{formData.secondaryColor}</span>
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-3" align="start">
                                            <HexColorPicker
                                                color={formData.secondaryColor}
                                                onChange={(color) => setFormData((prev) => ({ ...prev, secondaryColor: color }))}
                                            />
                                            <Input
                                                value={formData.secondaryColor}
                                                onChange={(e) => setFormData((prev) => ({ ...prev, secondaryColor: e.target.value }))}
                                                className="mt-3 uppercase font-mono"
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="mt-6 p-4 rounded-lg border bg-muted/30">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Preview</p>
                                <div className="flex gap-3">
                                    <button
                                        className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
                                        style={{
                                            backgroundColor: formData.primaryColor,
                                            color: getContrastTextColor(formData.primaryColor)
                                        }}
                                    >
                                        {t.clientDetails?.primaryAction || "Primary Action"}
                                    </button>
                                    <button
                                        className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
                                        style={{
                                            backgroundColor: formData.secondaryColor,
                                            color: getContrastTextColor(formData.secondaryColor)
                                        }}
                                    >
                                        {t.clientDetails?.secondaryAction || "Secondary Action"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Sticky Footer */}
            <div className="shrink-0 border-t bg-background p-4 flex justify-end gap-4">
                <Button variant="outline" asChild>
                    <Link href={`/dashboard/clients/${client.slug}`}>
                        {t.common?.cancel || "Cancel"}
                    </Link>
                </Button>
                <Button onClick={handleSubmit} disabled={loading} className="min-w-[120px]">
                    {loading ? (
                        <>
                            <Spinner className="mr-2" />
                            {t.common?.loading || "Saving..."}
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            {t.common?.save || "Save Changes"}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
