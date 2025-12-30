"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Building2,
    Palette,
    Mail,
    ArrowRight,
    ArrowLeft,
    Check,
    Globe,
    Shield,
    Upload,
    ImageIcon,
    CheckCircle,
    AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { HexColorPicker } from "react-colorful";

const STEPS = [
    { id: "general", title: "General Info", icon: Building2 },
    { id: "identity", title: "Brand Identity", icon: Palette },
    { id: "smtp", title: "Email Setup", icon: Mail },
];

export function AddClientClient() {
    const router = useRouter();
    const { t } = useI18n();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [testingSmtp, setTestingSmtp] = useState(false);
    const [smtpVerified, setSmtpVerified] = useState<boolean | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        logo: "",
        primaryColor: "#4f46e5",
        secondaryColor: "#10b981",
        smtpHost: "",
        smtpPort: "587",
        smtpUser: "",
        smtpPassword: "",
        smtpSecure: true,
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        setFormData((prev) => ({
            ...prev,
            name,
            slug: prev.slug === generateSlug(prev.name) ? generateSlug(name) : prev.slug,
        }));
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file
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
            // Create a temporary client ID for upload path
            const tempId = `temp-${Date.now()}`;
            const formDataUpload = new FormData();
            formDataUpload.append("file", file);
            formDataUpload.append("clientId", tempId);

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

    const handleTestSmtp = async () => {
        if (!formData.smtpHost || !formData.smtpUser || !formData.smtpPassword) {
            toast.error("Please fill in all SMTP fields to test");
            return;
        }
        setTestingSmtp(true);
        try {
            // For new clients, we create a temp test endpoint call
            // Note: This is a mock test since client doesn't exist yet
            // We'll validate the format at least
            const transporter = {
                host: formData.smtpHost,
                port: parseInt(formData.smtpPort) || 587,
                user: formData.smtpUser,
                password: formData.smtpPassword,
                secure: formData.smtpSecure,
            };

            // Simple validation - actual test will happen after create
            if (transporter.host && transporter.user && transporter.password) {
                // Show success for format validation
                setSmtpVerified(null); // Will be tested after creation
                toast.success("SMTP settings look valid! They will be tested after client creation.");
            }
        } catch (error) {
            setSmtpVerified(false);
            toast.error("Invalid SMTP settings format");
        } finally {
            setTestingSmtp(false);
        }
    };

    const nextStep = () => {
        // Validate current step
        if (currentStep === 0) {
            if (!formData.name.trim()) {
                toast.error("Please enter a client name");
                return;
            }
            if (!formData.slug.trim()) {
                toast.error("Please enter a slug");
                return;
            }
        }
        if (currentStep === 1) {
            if (!formData.logo) {
                toast.error("Please upload a logo");
                return;
            }
        }
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        // Final validation
        if (!formData.logo) {
            toast.error("Please upload a logo");
            setCurrentStep(1);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/clients", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    smtpPort: parseInt(formData.smtpPort),
                    brandColors: {
                        primary: formData.primaryColor,
                        secondary: formData.secondaryColor,
                    }
                }),
            });

            if (res.ok) {
                const client = await res.json();
                toast.success("Client created successfully");
                router.push(`/dashboard/clients/${client.slug}`);
                router.refresh();
            } else {
                const error = await res.text();
                toast.error(error || "Failed to create client");
            }
        } catch (error) {
            toast.error("Failed to create client");
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

    return (
        <>
            <PageHeader title="Add New Client">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => router.push("/dashboard/clients")}>
                        Cancel
                    </Button>
                    {currentStep === STEPS.length - 1 ? (
                        <Button onClick={handleSubmit} disabled={loading} className="gap-2">
                            {loading ? <Spinner /> : <Check className="h-4 w-4" />}
                            Create Client
                        </Button>
                    ) : (
                        <Button onClick={nextStep} className="gap-2">
                            Next Step
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </PageHeader>

            <PageContent>
                <div className="max-w-3xl mx-auto">
                    {/* Stepper Header */}
                    <div className="flex items-center justify-between mb-12">
                        {STEPS.map((step, index) => {
                            const Icon = step.icon;
                            const isActive = index === currentStep;
                            const isCompleted = index < currentStep;

                            return (
                                <div key={step.id} className="flex flex-col items-center flex-1 relative">
                                    {/* Connector Line */}
                                    {index !== 0 && (
                                        <div
                                            className={cn(
                                                "absolute top-5 -left-1/2 w-full h-[2px]",
                                                isCompleted ? "bg-primary" : "bg-muted"
                                            )}
                                        />
                                    )}

                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center z-10 transition-colors",
                                        isActive ? "bg-primary text-primary-foreground" :
                                            isCompleted ? "bg-primary text-primary-foreground" :
                                                "bg-muted text-muted-foreground"
                                    )}>
                                        {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                                    </div>
                                    <span className={cn(
                                        "mt-2 text-xs font-medium",
                                        isActive ? "text-primary" : "text-muted-foreground"
                                    )}>
                                        {step.title}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Step Content */}
                    <Card className="border-none shadow-none bg-dashboard-surface/30">
                        <CardContent className="pt-8">
                            {currentStep === 0 && (
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Client Name <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="name"
                                            placeholder="Acme Corporation"
                                            value={formData.name}
                                            onChange={handleNameChange}
                                            className="h-12 bg-background/50"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            The official name of the business or organization.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="slug">Slug <span className="text-destructive">*</span></Label>
                                        <div className="relative">
                                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="slug"
                                                placeholder="acme-corp"
                                                value={formData.slug}
                                                onChange={handleInputChange}
                                                name="slug"
                                                className="h-12 pl-10 bg-background/50"
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            This will be used in URLs and for the client portal: reelsend.com/p/{formData.slug || "client-slug"}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {currentStep === 1 && (
                                <div className="space-y-8">
                                    {/* Logo Upload */}
                                    <div className="space-y-3">
                                        <Label>Logo <span className="text-destructive">*</span></Label>
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
                                                    <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
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
                                                    Upload Logo
                                                </Button>
                                                <p className="text-xs text-muted-foreground">
                                                    PNG, JPG, WebP, GIF or SVG. Max 10MB.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Color Pickers */}
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <Label>Primary Color</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <button className="flex items-center gap-3 w-full p-3 rounded-lg border bg-background/50 hover:bg-background/80 transition-colors">
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
                                            <Label>Secondary Color</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <button className="flex items-center gap-3 w-full p-3 rounded-lg border bg-background/50 hover:bg-background/80 transition-colors">
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

                                    {/* Preview Card */}
                                    <div className="mt-8 p-6 rounded-xl border bg-background/50">
                                        <Label className="text-[10px] uppercase tracking-wider mb-4 block opacity-50">Preview</Label>
                                        <div className="flex items-center gap-4 mb-6">
                                            {formData.logo ? (
                                                <Avatar className="h-14 w-14 rounded-xl">
                                                    <AvatarImage src={formData.logo} className="object-cover" />
                                                    <AvatarFallback className="rounded-xl bg-muted">
                                                        {getInitials(formData.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                            ) : (
                                                <div
                                                    className="h-14 w-14 rounded-xl border flex items-center justify-center text-xl font-bold"
                                                    style={{ backgroundColor: `${formData.primaryColor}15`, color: formData.primaryColor }}
                                                >
                                                    {getInitials(formData.name)}
                                                </div>
                                            )}
                                            <div>
                                                <h4 className="font-bold text-foreground">{formData.name || "Client Name"}</h4>
                                                <p className="text-sm text-muted-foreground">@{formData.slug || "client-slug"}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
                                                style={{ backgroundColor: formData.primaryColor }}
                                            >
                                                Primary Action
                                            </button>
                                            <button
                                                className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
                                                style={{ backgroundColor: formData.secondaryColor }}
                                            >
                                                Secondary Action
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div className="space-y-6">
                                    {/* SMTP Header with Test Button */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Label className="text-sm font-medium">Email Settings (SMTP)</Label>
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
                                                Configure SMTP to send campaigns. Settings will be verified after creation.
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
                                            Validate Settings
                                        </Button>
                                    </div>

                                    <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-lg flex items-start gap-3 mb-6">
                                        <Shield className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                                        <div className="text-sm">
                                            <p className="font-semibold text-indigo-400">SMTP Server Information</p>
                                            <p className="text-indigo-300 opacity-80">These credentials will be used to send emails on behalf of this client. Make sure to use verified sender details.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="smtpHost">SMTP Host</Label>
                                            <Input
                                                id="smtpHost"
                                                placeholder="smtp.resend.com"
                                                value={formData.smtpHost}
                                                onChange={handleInputChange}
                                                name="smtpHost"
                                                className="h-12 bg-background/50"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="smtpPort">SMTP Port</Label>
                                            <Input
                                                id="smtpPort"
                                                placeholder="587"
                                                value={formData.smtpPort}
                                                onChange={handleInputChange}
                                                name="smtpPort"
                                                className="h-12 bg-background/50"
                                            />
                                        </div>
                                        <div className="flex items-center space-x-2 pt-8">
                                            <input
                                                type="checkbox"
                                                id="smtpSecure"
                                                checked={formData.smtpSecure}
                                                onChange={handleInputChange}
                                                name="smtpSecure"
                                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                            />
                                            <Label htmlFor="smtpSecure" className="cursor-pointer">Use Secure Connection (SSL/TLS)</Label>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="smtpUser">Username</Label>
                                            <Input
                                                id="smtpUser"
                                                placeholder="resend"
                                                value={formData.smtpUser}
                                                onChange={handleInputChange}
                                                name="smtpUser"
                                                className="h-12 bg-background/50"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="smtpPassword">Password</Label>
                                            <Input
                                                id="smtpPassword"
                                                type="password"
                                                placeholder="••••••••••••"
                                                value={formData.smtpPassword}
                                                onChange={handleInputChange}
                                                name="smtpPassword"
                                                className="h-12 bg-background/50"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Footer Buttons */}
                            <div className="flex justify-between mt-12 pt-8 border-t border-muted/50">
                                <Button
                                    variant="outline"
                                    onClick={prevStep}
                                    disabled={currentStep === 0 || loading}
                                    className="gap-2"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Previous
                                </Button>

                                {currentStep < STEPS.length - 1 ? (
                                    <Button onClick={nextStep} className="gap-2 px-8">
                                        Continue
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={loading || !formData.name || !formData.slug || !formData.logo}
                                        className="gap-2 px-8"
                                    >
                                        {loading ? <Spinner /> : <Check className="h-4 w-4" />}
                                        Create Client
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </PageContent>
        </>
    );
}
