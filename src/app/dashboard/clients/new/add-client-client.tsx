"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import {
    Building2,
    Palette,
    Mail,
    ArrowRight,
    ArrowLeft,
    Check,
    Loader2,
    Globe,
    Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

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

    const nextStep = () => {
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
                router.push(`/dashboard/clients/${client.id}`);
                router.refresh();
            }
        } catch (error) {
            console.error("Failed to create client:", error);
        } finally {
            setLoading(false);
        }
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
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
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
                                        <Label htmlFor="name">Client Name</Label>
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
                                        <Label htmlFor="slug">Slug</Label>
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
                                    <div className="space-y-2">
                                        <Label htmlFor="logo">Logo URL</Label>
                                        <Input
                                            id="logo"
                                            placeholder="https://example.com/logo.png"
                                            value={formData.logo}
                                            onChange={handleInputChange}
                                            name="logo"
                                            className="h-12 bg-background/50"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            A link to the client's logo (PNG or SVG recommended).
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <Label>Primary Color</Label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="color"
                                                    value={formData.primaryColor}
                                                    onChange={handleInputChange}
                                                    name="primaryColor"
                                                    className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-none"
                                                />
                                                <Input
                                                    value={formData.primaryColor}
                                                    onChange={handleInputChange}
                                                    name="primaryColor"
                                                    className="flex-1 uppercase"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <Label>Secondary Color</Label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="color"
                                                    value={formData.secondaryColor}
                                                    onChange={handleInputChange}
                                                    name="secondaryColor"
                                                    className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-none"
                                                />
                                                <Input
                                                    value={formData.secondaryColor}
                                                    onChange={handleInputChange}
                                                    name="secondaryColor"
                                                    className="flex-1 uppercase"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Preview Card */}
                                    <div className="mt-8 p-6 rounded-xl border bg-background/50">
                                        <Label className="text-[10px] uppercase tracking-wider mb-4 block opacity-50">Preview</Label>
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-xl border flex items-center justify-center text-xl font-bold"
                                                style={{ backgroundColor: `${formData.primaryColor}10`, color: formData.primaryColor }}>
                                                {formData.name?.slice(0, 1).toUpperCase() || "A"}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-foreground">{formData.name || "Client Name"}</h4>
                                                <div className="flex gap-2 mt-1">
                                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: formData.primaryColor }} />
                                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: formData.secondaryColor }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div className="space-y-6">
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
                                        disabled={loading || !formData.name || !formData.slug}
                                        className="gap-2 px-8 bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
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
