"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    ImageIcon,
    Upload,
    Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { HexColorPicker } from "react-colorful";
import { getContrastColor } from "@/lib/colors";
import { ProcessWizardLayout } from "@/components/ui-kit/process-wizard-layout";

export function AddClientClient() {
    const router = useRouter();
    const { t } = useI18n();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Steps definition
    const steps = [
        "General Info",
        "Brand Identity"
    ];

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        logo: "",
        primaryColor: "#4f46e5",
        secondaryColor: "#10b981",
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

    const canProceed = () => {
        if (currentStep === 0) {
            return !!(formData.name.trim() && formData.slug.trim());
        }
        if (currentStep === 1) {
            return !!formData.logo; // Require logo? User code said "Please upload a logo"
        }
        return true;
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleSubmit();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/clients", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
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

    const getStepDetails = () => {
        switch (currentStep) {
            case 0:
                return {
                    title: "Client Details",
                    description: "Enter the general information for the new client."
                };
            case 1:
                return {
                    title: "Brand Identity",
                    description: "Upload logo and choose brand colors."
                };
            default:
                return {};
        }
    };

    const { title, description } = getStepDetails();

    return (
        <ProcessWizardLayout
            steps={steps}
            currentStep={currentStep}
            title={title || ""}
            description={description}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onStepClick={(step) => {
                if (step < currentStep) setCurrentStep(step);
            }}
            cancelHref="/dashboard/clients"
            isSubmitting={loading}
            canProceed={canProceed()}
            finishLabel="Create Client"
        >
            {currentStep === 0 && (
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Client Name <span className="text-destructive">*</span></Label>
                        <Input
                            id="name"
                            placeholder="Acme Corporation"
                            value={formData.name}
                            onChange={handleNameChange}
                            className="h-12 text-lg"
                            autoFocus
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
                                className="h-12 pl-10"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            This will be used in URLs and for the client portal: reelsend.com/p/{formData.slug || "client-slug"}
                        </p>
                    </div>
                </div>
            )}

            {currentStep === 1 && (
                <div className="space-y-10">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <Label>Primary Color</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button className="flex items-center gap-3 w-full p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors">
                                        <div
                                            className="w-10 h-10 rounded-lg border shadow-none"
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
                                    <button className="flex items-center gap-3 w-full p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors">
                                        <div
                                            className="w-10 h-10 rounded-lg border shadow-none"
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
                    <div className="mt-8 p-6 rounded-xl border bg-muted/30">
                        <Label className="text-[10px] uppercase tracking-wider mb-4 block opacity-50">Preview</Label>
                        <div className="bg-background rounded-xl p-4 shadow-none border">
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
                                    className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
                                    style={{
                                        backgroundColor: formData.primaryColor,
                                        color: getContrastColor(formData.primaryColor)
                                    }}
                                >
                                    Primary Action
                                </button>
                                <button
                                    className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
                                    style={{
                                        backgroundColor: formData.secondaryColor,
                                        color: getContrastColor(formData.secondaryColor)
                                    }}
                                >
                                    Secondary Action
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </ProcessWizardLayout>
    );
}

