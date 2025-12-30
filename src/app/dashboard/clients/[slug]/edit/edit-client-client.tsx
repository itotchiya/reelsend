"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { Save, Upload, ArrowLeft, Mail, Eye, EyeOff, CheckCircle, AlertCircle, Trash2, Copy, History, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { HexColorPicker } from "react-colorful";
import { useBreadcrumbs } from "@/lib/contexts/breadcrumb-context";

type ClientStatus = "active" | "suspended" | "deactivated";

interface SmtpTestLog {
    id: string;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpSecure: boolean;
    success: boolean;
    errorMessage: string | null;
    testedAt: string;
}

interface Client {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    brandColors: any | null;
    active: boolean;
    status: string;
    isPublic: boolean;
    smtpHost: string | null;
    smtpPort: number | null;
    smtpUser: string | null;
    smtpPassword: string | null;
    smtpSecure: boolean;
    smtpVerified: boolean;
    smtpLastTested: string | null;
    smtpTestLogs?: SmtpTestLog[];
    createdAt: Date;
    updatedAt: Date;
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
    const [showPassword, setShowPassword] = useState(false);
    const [showSavedPassword, setShowSavedPassword] = useState(false);
    const [testingSmtp, setTestingSmtp] = useState(false);
    const [smtpVerified, setSmtpVerified] = useState<boolean | null>(client.smtpVerified);
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
        smtpHost: client.smtpHost || "",
        smtpPort: client.smtpPort || 587,
        smtpUser: client.smtpUser || "",
        smtpPassword: client.smtpPassword || "",
        smtpSecure: client.smtpSecure ?? true,
    });

    const handleTestSmtp = async () => {
        setTestingSmtp(true);
        try {
            const res = await fetch(`/api/clients/${client.id}/smtp-test`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    smtpHost: formData.smtpHost,
                    smtpPort: formData.smtpPort,
                    smtpUser: formData.smtpUser,
                    smtpPassword: formData.smtpPassword,
                    smtpSecure: formData.smtpSecure,
                }),
            });
            if (res.ok) {
                setSmtpVerified(true);
                toast.success("SMTP connection successful!");
                router.refresh();
            } else {
                setSmtpVerified(false);
                const error = await res.text();
                toast.error(error || "SMTP connection failed");
                router.refresh();
            }
        } catch (error) {
            toast.error("Failed to test SMTP connection");
        } finally {
            setTestingSmtp(false);
        }
    };

    const handleClearSmtp = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/clients/${client.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    smtpHost: null,
                    smtpPort: null,
                    smtpUser: null,
                    smtpPassword: null,
                    smtpSecure: true,
                    smtpVerified: false,
                }),
            });
            if (res.ok) {
                setFormData((prev) => ({
                    ...prev,
                    smtpHost: "",
                    smtpPort: 587,
                    smtpUser: "",
                    smtpPassword: "",
                    smtpSecure: true,
                }));
                setSmtpVerified(null);
                toast.success("SMTP configuration cleared");
                router.refresh();
            } else {
                toast.error("Failed to clear SMTP configuration");
            }
        } catch (error) {
            toast.error("Failed to clear SMTP configuration");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

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
                    smtpHost: formData.smtpHost || null,
                    smtpPort: formData.smtpPort || null,
                    smtpUser: formData.smtpUser || null,
                    smtpPassword: formData.smtpPassword || null,
                    smtpSecure: formData.smtpSecure,
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
        // Remove # if present
        const hex = hexColor.replace('#', '');

        // Parse RGB values
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        // Calculate relative luminance using WCAG formula
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        // Return white for dark backgrounds, dark for light backgrounds
        return luminance > 0.5 ? '#1a1a1a' : '#ffffff';
    };

    return (
        <>
            <PageHeader title={t.clientDetails?.title || "Client Details"} showBack />

            <PageContent>
                <Tabs defaultValue="info" className="w-full">
                    <TabsList className="w-full max-w-4xl mx-auto mb-6 grid grid-cols-2">
                        <TabsTrigger value="info">{t.clientDetails?.clientInfo || "Client Info"}</TabsTrigger>
                        <TabsTrigger value="smtp">{t.clientDetails?.emailSettings || "Email Settings"}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="info">
                        <div className="max-w-4xl mx-auto space-y-8">
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
                    </TabsContent>

                    <TabsContent value="smtp">
                        <div className="max-w-4xl mx-auto space-y-8">
                            {/* Email / SMTP Settings */}
                            <div className="rounded-xl border border-dashed border-border/60 dark:border-border p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Label className="text-sm font-medium">{t.clientDetails?.smtpSettings || "Email Settings (SMTP)"}</Label>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "gap-1",
                                                    smtpVerified === true
                                                        ? "bg-green-500/10 text-green-600 border-green-500/20"
                                                        : smtpVerified === false
                                                            ? "bg-red-500/10 text-red-600 border-red-500/20"
                                                            : "bg-muted text-muted-foreground border-muted-foreground/20"
                                                )}
                                            >
                                                {smtpVerified === true ? (
                                                    <>
                                                        <CheckCircle className="h-3 w-3" />
                                                        Verified
                                                    </>
                                                ) : smtpVerified === false ? (
                                                    <>
                                                        <AlertCircle className="h-3 w-3" />
                                                        Failed
                                                    </>
                                                ) : (
                                                    <>
                                                        <AlertCircle className="h-3 w-3" />
                                                        Not Tested
                                                    </>
                                                )}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Configure SMTP to send campaigns from this client's email.
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                        onClick={handleTestSmtp}
                                        disabled={testingSmtp || !formData.smtpHost}
                                    >
                                        {testingSmtp ? <Spinner className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                                        {t.clientDetails?.testConnection || "Test Connection"}
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">{t.clientDetails?.smtpHost || "SMTP Host"}</Label>
                                        <Input
                                            placeholder="smtp.gmail.com"
                                            value={formData.smtpHost}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, smtpHost: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">{t.clientDetails?.port || "Port"}</Label>
                                        <Input
                                            type="number"
                                            placeholder="587"
                                            value={formData.smtpPort}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, smtpPort: parseInt(e.target.value) || 587 }))}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">{t.clientDetails?.username || "Username / Email"}</Label>
                                        <Input
                                            placeholder="user@example.com"
                                            value={formData.smtpUser}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, smtpUser: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">{t.clientDetails?.password || "Password / App Password"}</Label>
                                        <div className="relative">
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                value={formData.smtpPassword}
                                                onChange={(e) => setFormData((prev) => ({ ...prev, smtpPassword: e.target.value }))}
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                    <Switch
                                        checked={formData.smtpSecure}
                                        onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, smtpSecure: checked }))}
                                    />
                                    <Label className="text-sm">{t.clientDetails?.useTls || "Use TLS/SSL (Recommended)"}</Label>
                                </div>

                                {/* Saved SMTP Configuration */}
                                {client.smtpHost && (
                                    <div className="mt-6 rounded-lg border bg-muted/30 overflow-hidden">
                                        <div className="flex items-center justify-between p-4 border-b">
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Saved Configuration</p>
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "gap-1 text-[10px]",
                                                        client.smtpVerified
                                                            ? "bg-green-500/10 text-green-600 border-green-500/20"
                                                            : "bg-orange-500/10 text-orange-600 border-orange-500/20"
                                                    )}
                                                >
                                                    {client.smtpVerified ? (
                                                        <>
                                                            <CheckCircle className="h-3 w-3" />
                                                            Verified
                                                        </>
                                                    ) : (
                                                        <>
                                                            <AlertCircle className="h-3 w-3" />
                                                            Unverified
                                                        </>
                                                    )}
                                                </Badge>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="gap-2 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                                onClick={handleClearSmtp}
                                                disabled={loading}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Delete
                                            </Button>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-muted/50">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Host</th>
                                                        <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Port</th>
                                                        <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Username</th>
                                                        <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Password</th>
                                                        <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Secure</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr className="border-t border-muted/50">
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono text-sm">{client.smtpHost}</span>
                                                                <button
                                                                    type="button"
                                                                    className="text-muted-foreground hover:text-foreground"
                                                                    onClick={() => copyToClipboard(client.smtpHost || "", "Host")}
                                                                >
                                                                    <Copy className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 font-mono text-sm">{client.smtpPort}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono text-sm truncate max-w-[150px]">{client.smtpUser}</span>
                                                                <button
                                                                    type="button"
                                                                    className="text-muted-foreground hover:text-foreground"
                                                                    onClick={() => copyToClipboard(client.smtpUser || "", "Username")}
                                                                >
                                                                    <Copy className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono text-sm">
                                                                    {showSavedPassword ? client.smtpPassword : "••••••••••"}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    className="text-muted-foreground hover:text-foreground"
                                                                    onClick={() => setShowSavedPassword(!showSavedPassword)}
                                                                >
                                                                    {showSavedPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="text-muted-foreground hover:text-foreground"
                                                                    onClick={() => copyToClipboard(client.smtpPassword || "", "Password")}
                                                                >
                                                                    <Copy className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Badge variant="outline" className={cn(
                                                                "text-[10px]",
                                                                client.smtpSecure ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-orange-500/10 text-orange-600 border-orange-500/20"
                                                            )}>
                                                                {client.smtpSecure ? "Yes" : "No"}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                        {client.smtpLastTested && (
                                            <p className="text-xs text-muted-foreground px-4 py-3 border-t border-muted/50">
                                                Last tested: {new Date(client.smtpLastTested).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* SMTP Test History */}
                                {client.smtpTestLogs && client.smtpTestLogs.length > 0 && (
                                    <div className="mt-6 rounded-lg border bg-muted/30 overflow-hidden">
                                        <div className="flex items-center gap-2 p-4 border-b">
                                            <History className="h-4 w-4 text-muted-foreground" />
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Test History</p>
                                            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold bg-muted-foreground/10 text-muted-foreground border-none">
                                                {client.smtpTestLogs.length}
                                            </Badge>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader className="bg-muted/50">
                                                    <TableRow className="hover:bg-transparent">
                                                        <TableHead className="uppercase text-[10px] font-bold tracking-wider py-2">Date</TableHead>
                                                        <TableHead className="uppercase text-[10px] font-bold tracking-wider py-2">Host</TableHead>
                                                        <TableHead className="uppercase text-[10px] font-bold tracking-wider py-2">Port</TableHead>
                                                        <TableHead className="uppercase text-[10px] font-bold tracking-wider py-2">User</TableHead>
                                                        <TableHead className="uppercase text-[10px] font-bold tracking-wider py-2">Secure</TableHead>
                                                        <TableHead className="uppercase text-[10px] font-bold tracking-wider py-2">Result</TableHead>
                                                        <TableHead className="uppercase text-[10px] font-bold tracking-wider py-2">Error</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {client.smtpTestLogs.map((log) => (
                                                        <TableRow key={log.id}>
                                                            <TableCell className="py-2 text-xs text-muted-foreground">
                                                                {new Date(log.testedAt).toLocaleString(undefined, {
                                                                    dateStyle: "short",
                                                                    timeStyle: "short",
                                                                })}
                                                            </TableCell>
                                                            <TableCell className="py-2 font-mono text-xs">{log.smtpHost}</TableCell>
                                                            <TableCell className="py-2 font-mono text-xs">{log.smtpPort}</TableCell>
                                                            <TableCell className="py-2 font-mono text-xs truncate max-w-[120px]">{log.smtpUser}</TableCell>
                                                            <TableCell className="py-2">
                                                                <Badge variant="outline" className={cn(
                                                                    "text-[10px]",
                                                                    log.smtpSecure ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-orange-500/10 text-orange-600 border-orange-500/20"
                                                                )}>
                                                                    {log.smtpSecure ? "Yes" : "No"}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="py-2">
                                                                {log.success ? (
                                                                    <div className="flex items-center gap-1 text-green-600">
                                                                        <CheckCircle className="h-3.5 w-3.5" />
                                                                        <span className="text-xs font-medium">Success</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-1 text-red-600">
                                                                        <XCircle className="h-3.5 w-3.5" />
                                                                        <span className="text-xs font-medium">Failed</span>
                                                                    </div>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="py-2 text-xs text-muted-foreground truncate max-w-[180px]">
                                                                {log.errorMessage || "—"}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Save Button at bottom */}
                <div className="max-w-4xl mx-auto mt-8 pt-6 border-t">
                    <Button onClick={handleSubmit} disabled={loading} className="w-full gap-2">
                        {loading ? <Spinner /> : <Save className="h-4 w-4" />}
                        {t.clientDetails?.saveChanges || "Save Changes"}
                    </Button>
                </div>
            </PageContent>
        </>
    );
}
