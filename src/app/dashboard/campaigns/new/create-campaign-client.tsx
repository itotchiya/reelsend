
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProcessWizardLayout } from "@/components/ui-kit/process-wizard-layout";
import { ClientSelectorDialog } from "@/components/ui-kit/client-selector-dialog";
import { AudienceSelectorDialog } from "@/components/ui-kit/audience-selector-dialog";
import { SegmentSelectorDialog } from "@/components/ui-kit/segment-selector-dialog";
import { TemplateSelectorDialog } from "@/components/ui-kit/template-selector-dialog";
import { SmtpSelectorDialog } from "@/components/ui-kit/smtp-selector-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    Building2,
    Users,
    PieChart,
    Mail,
    Calendar as CalendarIcon,
    Clock,
    Zap,
    CheckCircle,
    AlertTriangle,
    X,
    LayoutTemplate, // New import for review step
    Send, // New import for review step
    Edit2, // New import for review step
    FileText // For review step overview section
} from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// New imports for review cards and types
import { AudienceCard, AudienceCardData } from "@/components/ui-kit/audience-card";
import { SegmentCard, SegmentCardData } from "@/components/ui-kit/segment-card";
import { TemplateCard, TemplateCardData } from "@/components/ui-kit/template-card";
import { SmtpProfileCard, SmtpProfile } from "@/components/ui-kit/smtp-profile-card";

// Reusable wizard components
import { WizardStepHeader } from "@/components/ui-kit/wizard-step-header";
import { ReviewSectionCard } from "@/components/ui-kit/review-section-card";
import { ScheduleOptionCard } from "@/components/ui-kit/schedule-option-card";


interface Client {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
}

export function CreateCampaignClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const STEP_NAMES = ["basics", "recipients", "template", "smtp", "setup", "schedule", "review"];

    const getStepIndex = (name: string | null) => {
        if (!name) return 0;
        const index = STEP_NAMES.indexOf(name);
        return index >= 0 ? index : 0;
    };

    // Draft State
    const [draftId, setDraftId] = useState<string | null>(searchParams.get("id"));
    const [currentStep, setCurrentStep] = useState(getStepIndex(searchParams.get("step")));

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showCloseDialog, setShowCloseDialog] = useState(false);
    const [launchCountdown, setLaunchCountdown] = useState(10);
    const [clients, setClients] = useState<Client[]>([]);

    // Wizard Steps
    const steps = [
        "Basic Info",
        "Recipients",
        "Template",
        "SMTP",
        "Setup",
        "Schedule",
        "Review"
    ];

    // Form Data State
    const [formData, setFormData] = useState({
        // Step 1: Basic Info
        name: "",
        description: "",
        clientId: null as string | null,
        clientName: "",

        // Step 2: Recipients
        audienceId: null as string | null,
        audienceName: "",
        segmentId: null as string | null,
        segmentName: "",

        // Step 3: Template
        templateId: null as string | null,
        templateName: "",

        // Step 4: SMTP
        smtpProfileId: null as string | null,
        smtpProfileName: "",
        smtpDefaultFromEmail: "",

        // Step 5: Email Setup
        subject: "",
        previewText: "",
        senderName: "",
        replyTo: "",

        // Step 6: Schedule
        scheduleType: "immediate" as "immediate" | "scheduled",
        scheduledDate: "" as string,
        scheduledTime: "09:00",

        // Objects for review display
        selectedAudience: undefined as AudienceCardData | undefined,
        selectedSegment: undefined as SegmentCardData | undefined,
        selectedTemplate: undefined as TemplateCardData | undefined,
        selectedSmtpProfile: undefined as SmtpProfile | undefined,
    });

    // Fetch clients on mount
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const res = await fetch("/api/clients");
                if (res.ok) {
                    const data = await res.json();
                    setClients(data);
                }
            } catch (error) {
                console.error("Failed to fetch clients", error);
            }
        };
        fetchClients();
    }, []);

    // Load Draft Data
    useEffect(() => {
        if (!draftId) return;

        const loadDraft = async () => {
            try {
                const res = await fetch(`/api/campaigns/${draftId}`);
                if (!res.ok) throw new Error("Failed to load draft");
                const campaign = await res.json();

                // Hydrate form data
                setFormData(prev => ({
                    ...prev,
                    name: campaign.name || "",
                    description: campaign.description || "",
                    clientId: campaign.clientId,
                    clientName: campaign.client?.name || "",

                    audienceId: campaign.audienceId,
                    audienceName: campaign.audience?.name || "",
                    segmentId: campaign.segmentId,
                    segmentName: campaign.segment?.name || "", // You might need to fetch segment name if not in campaign include

                    templateId: campaign.templateId,
                    templateName: campaign.template?.name || "",

                    smtpProfileId: campaign.smtpProfileId,
                    // If smtpProfile is not included in standard GET, you might miss the name initially
                    // but standard GET usually includes main relations. We verify API route.
                    // The API route at [id]/route.ts doesn't include smtpProfile by default, so name might be missing.
                    // For now, we trust IDs. 

                    smtpProfileName: campaign.smtpProfile?.name || "",
                    smtpDefaultFromEmail: campaign.smtpProfile?.defaultFromEmail || "",

                    subject: campaign.subject || "",
                    previewText: campaign.previewText || "",
                    senderName: campaign.fromName || "",
                    replyTo: campaign.fromEmail || "", // Assuming fromEmail is used as replyTo or stored similarly

                    scheduleType: campaign.scheduledAt ? "scheduled" : "immediate",
                    scheduledDate: campaign.scheduledAt ? new Date(campaign.scheduledAt).toISOString().split('T')[0] : "",
                    scheduledTime: campaign.scheduledAt
                        ? new Date(campaign.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
                        : "09:00",
                    // Hydrate objects for review
                    selectedAudience: campaign.audience ? {
                        id: campaign.audience.id,
                        name: campaign.audience.name,
                        description: campaign.audience.description,
                        client: {
                            id: campaign.client?.id || "",
                            name: campaign.client?.name || "",
                            slug: campaign.client?.slug || "",
                            logo: campaign.client?.logo || null
                        },
                        _count: { contacts: campaign.audience._count?.contacts || 0, segments: campaign.audience._count?.segments || 0 }
                    } : undefined,
                    selectedSegment: campaign.segment ? {
                        id: campaign.segment.id,
                        name: campaign.segment.name,
                        description: campaign.segment.description,
                        audience: { name: campaign.audience?.name || "" },
                        createdAt: campaign.segment.createdAt || new Date().toISOString(),
                        createdBy: campaign.segment.createdBy || null,
                        _count: { contacts: campaign.segment._count?.contacts || 0 }
                    } : undefined,
                    selectedTemplate: campaign.template ? {
                        id: campaign.template.id,
                        name: campaign.template.name,
                        description: campaign.template.description,
                        htmlContent: campaign.template.htmlContent || null,
                        client: campaign.template.client || null,
                        campaigns: campaign.template.campaigns || [],
                        createdBy: campaign.template.createdBy || null,
                        updatedBy: campaign.template.updatedBy || null,
                        createdAt: campaign.template.createdAt || new Date().toISOString(),
                        updatedAt: campaign.template.updatedAt || new Date().toISOString(),
                        isAIGenerated: campaign.template.isAIGenerated || false,
                    } : undefined,
                    selectedSmtpProfile: campaign.smtpProfile || undefined,
                }));
            } catch (error) {
                console.error("Error loading draft:", error);
                toast.error("Failed to load draft");
            }
        };

        loadDraft();
    }, [draftId]);

    // Launch countdown timer
    useEffect(() => {
        if (showConfirmDialog) {
            setLaunchCountdown(10);
            const interval = setInterval(() => {
                setLaunchCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [showConfirmDialog]);

    // Autosave Helper
    const updateDraft = async (data: Partial<any>) => {
        if (!draftId) return;
        setIsSaving(true);
        try {
            await fetch(`/api/campaigns/${draftId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
        } catch (error) {
            console.error("Auto-save error:", error);
        } finally {
            setIsSaving(false);
        }
    };

    // Step Validation
    const canProceed = () => {
        switch (currentStep) {
            case 0: // Basic Info
                return formData.name.trim() !== "" && formData.clientId !== null;
            case 1: // Recipients
                return formData.audienceId !== null && formData.segmentId !== null;
            case 2: // Template
                return formData.templateId !== null;
            case 3: // SMTP
                return formData.smtpProfileId !== null;
            case 4: // Email Setup
                return formData.subject.trim() !== "";
            case 5: // Schedule
                if (formData.scheduleType === "scheduled") {
                    return formData.scheduledDate !== "";
                }
                return true;
            case 6: // Review
                return true;
            default:
                return false;
        }
    };

    const handleNext = async () => {
        // Step 1: Create Draft if not exists
        if (currentStep === 0) {
            if (!draftId) {
                setIsSubmitting(true);
                try {
                    const res = await fetch("/api/campaigns", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            name: formData.name,
                            description: formData.description,
                            clientId: formData.clientId,
                            status: "DRAFT"
                        }),
                    });

                    if (res.ok) {
                        const campaign = await res.json();
                        setDraftId(campaign.id);
                        // Update URL
                        const url = new URL(window.location.href);
                        url.searchParams.set("id", campaign.id);
                        url.searchParams.set("step", STEP_NAMES[1]); // Move to next step
                        window.history.pushState({}, "", url.toString());

                        // Update current step in DB
                        await updateDraft({ currentStep: STEP_NAMES[1] });

                        setCurrentStep(currentStep + 1);
                    } else {
                        toast.error("Failed to create draft");
                    }
                } catch (error) {
                    toast.error("Failed to create draft");
                } finally {
                    setIsSubmitting(false);
                }
                return;
            } else {
                // Update existing
                await updateDraft({ name: formData.name, description: formData.description, clientId: formData.clientId });
            }
        }

        // Intermediate Steps Autosave
        if (currentStep === 1) { // Recipients
            await updateDraft({ audienceId: formData.audienceId, segmentId: formData.segmentId === "all" ? null : formData.segmentId });
        }
        if (currentStep === 2) { // Template
            await updateDraft({ templateId: formData.templateId });
        }
        if (currentStep === 3) { // SMTP
            await updateDraft({ smtpProfileId: formData.smtpProfileId });
        }
        if (currentStep === 4) { // Setup
            await updateDraft({
                subject: formData.subject,
                previewText: formData.previewText,
                fromName: formData.senderName,
                fromEmail: formData.replyTo
            });
        }
        if (currentStep === 5) { // Schedule
            const scheduledAt = formData.scheduleType === "scheduled" && formData.scheduledDate
                ? new Date(
                    // ... date parsing logic ...
                    new Date(formData.scheduledDate).getFullYear(),
                    new Date(formData.scheduledDate).getMonth(),
                    new Date(formData.scheduledDate).getDate(),
                    parseInt(formData.scheduledTime.split(":")[0]),
                    parseInt(formData.scheduledTime.split(":")[1])
                ).toISOString()
                : null;

            // Only save scheduledAt - status remains DRAFT until launch
            await updateDraft({
                scheduledAt
            });
        }

        if (currentStep === steps.length - 1) {
            // Final step - show confirmation dialog
            setShowConfirmDialog(true);
        } else if (currentStep < steps.length - 1) {
            const nextStep = currentStep + 1;
            setCurrentStep(nextStep);

            // Update URL Step
            const url = new URL(window.location.href);
            url.searchParams.set("step", STEP_NAMES[nextStep]);
            window.history.pushState({}, "", url.toString());

            // Save step to DB
            await updateDraft({ currentStep: STEP_NAMES[nextStep] });
        }
    };

    const handlePrevious = async () => {
        if (currentStep > 0) {
            const prevStep = currentStep - 1;
            setCurrentStep(prevStep);

            // Update URL Step
            const url = new URL(window.location.href);
            url.searchParams.set("step", STEP_NAMES[prevStep]);
            window.history.pushState({}, "", url.toString());

            // Save step to DB
            await updateDraft({ currentStep: STEP_NAMES[prevStep] });
        }
    };

    const handleClientSelect = (clientId: string | null) => {
        const client = clients.find(c => c.id === clientId);
        setFormData(prev => ({
            ...prev,
            clientId,
            clientName: client?.name || "",
            // Reset dependent selections
            audienceId: null,
            audienceName: "",
            segmentId: null,
            segmentName: "",
            templateId: null,
            templateName: "",
            smtpProfileId: null,
            smtpProfileName: "",
            smtpDefaultFromEmail: "",
            selectedAudience: undefined,
            selectedSegment: undefined,
            selectedTemplate: undefined,
            selectedSmtpProfile: undefined,
        }));
    };

    const handleLaunchCampaign = async () => {
        if (!draftId) return;
        setIsSubmitting(true);
        try {
            // Final update before launch
            const scheduledAt = formData.scheduleType === "scheduled" && formData.scheduledDate
                ? new Date(
                    new Date(formData.scheduledDate).getFullYear(),
                    new Date(formData.scheduledDate).getMonth(),
                    new Date(formData.scheduledDate).getDate(),
                    parseInt(formData.scheduledTime.split(":")[0]),
                    parseInt(formData.scheduledTime.split(":")[1])
                ).toISOString()
                : null;

            // 1. Update Campaign Status/Schedule
            await fetch(`/api/campaigns/${draftId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: formData.scheduleType === "immediate" ? "SENDING" : "SCHEDULED",
                    scheduledAt
                })
            });

            // 2. If Immediate, Trigger Send
            if (formData.scheduleType === "immediate") {
                toast.loading("Sending campaign...");
                const sendRes = await fetch(`/api/campaigns/${draftId}/send`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" }
                });

                if (sendRes.ok) {
                    const result = await sendRes.json();
                    toast.dismiss();
                    toast.success(`Launched! ${result.sent} emails sent.`);
                    router.push("/dashboard/campaigns");
                } else {
                    const error = await sendRes.json();
                    toast.dismiss();
                    toast.error(error.error || "Failed to dispatch campaign");
                    // Don't redirect if failed, let user retry? Or redirect to details?
                    // Usually better to stay or go to details
                }
            } else {
                toast.success("Campaign scheduled successfully!");
                router.push("/dashboard/campaigns");
            }

            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to launch campaign");
        } finally {
            setIsSubmitting(false);
            setShowConfirmDialog(false);
        }
    };

    const handleDiscard = async () => {
        if (draftId) {
            try {
                await fetch(`/api/campaigns/${draftId}`, { method: "DELETE" });
                toast.success("Draft discarded");
            } catch (e) {
                console.error("Delete draft error", e);
            }
        }
        router.push("/dashboard/campaigns");
    };

    // Step Content Components
    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return renderBasicInfoStep();
            case 1:
                return renderRecipientsStep();
            case 2:
                return renderTemplateStep();
            case 3:
                return renderSmtpStep();
            case 4:
                return renderSetupStep();
            case 5:
                return renderScheduleStep();
            case 6:
                return renderReviewStep();
            default:
                return null;
        }
    };

    // Step 1: Basic Info
    const renderBasicInfoStep = () => (
        <div className="max-w-[480px] mx-auto space-y-8">
            <WizardStepHeader
                title="Campaign Details"
                description="Give your campaign a name and select the client"
            />

            <div className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="name">Campaign Name <span className="text-destructive">*</span></Label>
                    <Input
                        id="name"
                        placeholder="e.g., Summer Sale Newsletter"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="text-lg"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        placeholder="Optional description for internal reference..."
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Client <span className="text-destructive">*</span></Label>
                    <ClientSelectorDialog
                        clients={clients}
                        selectedClientId={formData.clientId}
                        onClientSelect={handleClientSelect}
                    />
                </div>
            </div>
        </div>
    );

    // Step 2: Recipients
    const renderRecipientsStep = () => (
        <div className="max-w-[480px] mx-auto space-y-8">
            <WizardStepHeader
                title="Choose Recipients"
                description="Select the audience and optional segment for this campaign"
            />

            <div className="flex flex-col gap-6">
                <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Audience <span className="text-destructive">*</span>
                    </Label>
                    <AudienceSelectorDialog
                        clientId={formData.clientId}
                        selectedAudienceId={formData.audienceId}
                        onAudienceSelect={(audienceId, audience) => {
                            setFormData(prev => ({
                                ...prev,
                                audienceId,
                                audienceName: audience?.name || "",
                                selectedAudience: audience,
                                // Reset dependent selections
                                segmentId: null,
                                segmentName: "",
                                selectedSegment: undefined,
                            }));
                        }}
                        disabled={!formData.clientId}
                    />
                </div>

                <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                        <PieChart className="h-4 w-4" />
                        Segment <span className="text-destructive">*</span>
                    </Label>
                    <SegmentSelectorDialog
                        audienceId={formData.audienceId}
                        selectedSegmentId={formData.segmentId}
                        onSegmentSelect={(segmentId, segment) => {
                            setFormData(prev => ({
                                ...prev,
                                segmentId,
                                segmentName: segment?.name || (segmentId === "all" ? "All Contacts" : ""),
                                selectedSegment: segment,
                            }));
                        }}
                        disabled={!formData.audienceId}
                    />
                </div>
            </div>
        </div>
    );

    // Step 3: Template
    const renderTemplateStep = () => (
        <div className="max-w-[480px] mx-auto space-y-8">
            <WizardStepHeader
                title="Select Template"
                description="Choose the email template for this campaign"
            />

            <TemplateSelectorDialog
                clientId={formData.clientId}
                selectedTemplateId={formData.templateId}
                onTemplateSelect={(templateId, template) => {
                    setFormData(prev => ({
                        ...prev,
                        templateId,
                        templateName: template?.name || "",
                        selectedTemplate: template,
                    }));
                }}
                disabled={!formData.clientId}
            />
        </div>
    );

    // Step 4: SMTP
    const renderSmtpStep = () => (
        <div className="max-w-[480px] mx-auto space-y-8">
            <WizardStepHeader
                title="Select SMTP Profile"
                description="Choose which mail server to send from"
            />

            <SmtpSelectorDialog
                clientId={formData.clientId}
                selectedProfileId={formData.smtpProfileId}
                onProfileSelect={(profileId, profile) => {
                    setFormData(prev => ({
                        ...prev,
                        smtpProfileId: profileId,
                        smtpProfileName: profile?.name || "",
                        smtpDefaultFromEmail: profile?.defaultFromEmail || "",
                        selectedSmtpProfile: profile,
                    }));
                }}
                disabled={!formData.clientId}
                className="max-w-lg mx-auto"
            />
        </div>
    );

    // Step 5: Email Setup
    const renderSetupStep = () => (
        <div className="max-w-[480px] mx-auto space-y-8">
            <WizardStepHeader
                title="Email Setup"
                description="Configure your email subject and sender details"
            />

            <div className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="subject">Subject Line <span className="text-destructive">*</span></Label>
                    <Input
                        id="subject"
                        placeholder="e.g., Don't miss our summer sale!"
                        value={formData.subject}
                        onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="previewText">Preview Text</Label>
                    <Input
                        id="previewText"
                        placeholder="Text shown in inbox preview..."
                        value={formData.previewText}
                        onChange={(e) => setFormData(prev => ({ ...prev, previewText: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">This appears after the subject in most email clients</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="senderName">Sender Name</Label>
                        <Input
                            id="senderName"
                            placeholder="e.g., John from Acme"
                            value={formData.senderName}
                            onChange={(e) => setFormData(prev => ({ ...prev, senderName: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="replyTo">Reply-To Email</Label>
                        <Input
                            id="replyTo"
                            type="email"
                            placeholder="e.g., support@example.com"
                            value={formData.replyTo}
                            onChange={(e) => setFormData(prev => ({ ...prev, replyTo: e.target.value }))}
                        />
                    </div>
                </div>

                {formData.smtpDefaultFromEmail && (
                    <div className="p-4 bg-muted/50 rounded-lg border border-dashed">
                        <p className="text-sm text-muted-foreground">
                            <Mail className="inline h-4 w-4 mr-2" />
                            Sending from: <span className="font-medium text-foreground">{formData.smtpDefaultFromEmail}</span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );

    // Step 6: Schedule
    const renderScheduleStep = () => (
        <div className="max-w-[480px] mx-auto space-y-8">
            <WizardStepHeader
                title="Schedule Campaign"
                description="Choose when to send your campaign"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ScheduleOptionCard
                    icon={Zap}
                    title="Send Immediately"
                    description="Start sending as soon as you launch"
                    selected={formData.scheduleType === "immediate"}
                    onClick={() => setFormData(prev => ({ ...prev, scheduleType: "immediate", scheduledDate: "" }))}
                />

                <ScheduleOptionCard
                    icon={CalendarIcon}
                    title="Schedule for Later"
                    description="Pick a specific date and time"
                    selected={formData.scheduleType === "scheduled"}
                    onClick={() => setFormData(prev => ({ ...prev, scheduleType: "scheduled" }))}
                />
            </div>

            {/* Date/Time Picker */}
            {formData.scheduleType === "scheduled" && (
                <div className="mt-6 flex flex-col md:flex-row gap-6 items-start animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="space-y-2 w-full md:flex-1">
                        <Label htmlFor="scheduleDate">Date</Label>
                        <Input
                            id="scheduleDate"
                            type="date"
                            value={formData.scheduledDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2 w-full md:flex-1">
                        <Label htmlFor="time">Time</Label>
                        <Input
                            id="time"
                            type="time"
                            value={formData.scheduledTime}
                            onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                            className="w-full"
                        />
                    </div>
                </div>
            )}
        </div>
    );

    // Step 7: Review
    const renderReviewStep = () => (
        <div className="max-w-[480px] mx-auto space-y-4">
            <WizardStepHeader
                title="Review & Launch"
                description="Double-check your campaign before launching"
                className="mb-6"
            />

            {/* Basic Info */}
            <ReviewSectionCard icon={FileText} title="Basic Info" onEdit={() => setCurrentStep(0)}>
                <div className="space-y-1">
                    <div className="text-sm font-medium">{formData.name || "Untitled Campaign"}</div>
                    <div className="text-xs text-muted-foreground">{formData.description || "No description"}</div>
                    <div className="text-xs text-muted-foreground">Client: {formData.clientName || "Not selected"}</div>
                </div>
            </ReviewSectionCard>

            {/* Recipients */}
            <ReviewSectionCard icon={Users} title="Recipients" onEdit={() => setCurrentStep(1)}>
                <div className="space-y-3">
                    {formData.selectedAudience ? (
                        <AudienceCard audience={formData.selectedAudience} selectable={false} className="cursor-default pointer-events-none" />
                    ) : (
                        <div className="text-sm text-muted-foreground italic">No audience selected</div>
                    )}
                    {formData.selectedSegment ? (
                        <SegmentCard segment={formData.selectedSegment} selectable={false} className="cursor-default pointer-events-none" />
                    ) : (
                        <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">All Contacts (No Segment)</div>
                    )}
                </div>
            </ReviewSectionCard>

            {/* Template */}
            <ReviewSectionCard icon={LayoutTemplate} title="Template" onEdit={() => setCurrentStep(2)}>
                {formData.selectedTemplate ? (
                    <TemplateCard template={formData.selectedTemplate} selectable={false} className="cursor-default pointer-events-none" />
                ) : (
                    <div className="text-sm text-muted-foreground italic">No template selected</div>
                )}
            </ReviewSectionCard>

            {/* SMTP Profile */}
            <ReviewSectionCard icon={Send} title="SMTP Profile" onEdit={() => setCurrentStep(3)}>
                {formData.selectedSmtpProfile ? (
                    <SmtpProfileCard profile={formData.selectedSmtpProfile} selectable={false} className="cursor-default pointer-events-none" />
                ) : (
                    <div className="text-sm text-muted-foreground italic">Default System Mailer</div>
                )}
            </ReviewSectionCard>

            {/* Email Setup */}
            <ReviewSectionCard icon={Mail} title="Email Setup" onEdit={() => setCurrentStep(4)}>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subject</span>
                        <span className="font-medium truncate max-w-[200px]">{formData.subject || "Not set"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Sender</span>
                        <span className="font-medium">{formData.senderName || "Not set"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Reply-To</span>
                        <span className="font-medium truncate max-w-[200px]">{formData.replyTo || "Not set"}</span>
                    </div>
                </div>
            </ReviewSectionCard>

            {/* Schedule */}
            <ReviewSectionCard icon={CalendarIcon} title="Schedule" onEdit={() => setCurrentStep(5)}>
                <div>
                    {formData.scheduleType === "immediate" ? (
                        <div className="flex items-center gap-2 text-primary bg-primary/10 w-fit px-3 py-1.5 rounded-full text-sm">
                            <Zap className="h-4 w-4" />
                            <span className="font-medium">Sending Immediately</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <CalendarIcon className="h-4 w-4" />
                            <span className="font-medium">
                                {formData.scheduledDate
                                    ? `${new Date(formData.scheduledDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${formData.scheduledTime}`
                                    : "Not scheduled"}
                            </span>
                        </div>
                    )}
                </div>
            </ReviewSectionCard>
        </div>
    );

    return (
        <>
            <ProcessWizardLayout
                steps={steps}
                currentStep={currentStep}
                title={undefined}
                description={undefined}
                onNext={handleNext}
                onPrevious={handlePrevious}
                onCancel={() => setShowCloseDialog(true)}
                cancelHref="#" // Handled by onCancel
                isSubmitting={isSubmitting || isSaving}
                canProceed={canProceed()}
                finishLabel="Launch Campaign"
            >
                <div className="py-8 px-6 relative">
                    {/* Auto-save indicator */}
                    {/* Saving indicator removed */}
                    {renderStepContent()}
                </div>
            </ProcessWizardLayout>

            {/* Launch Confirmation Dialog */}
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Launch Campaign?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {formData.scheduleType === "immediate"
                                ? "This campaign will start sending immediately. Once launched, this action cannot be undone."
                                : `This campaign will be scheduled for ${formData.scheduledDate ? new Date(formData.scheduledDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ""} at ${formData.scheduledTime}. You can cancel the scheduled campaign before it starts.`
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleLaunchCampaign}
                            disabled={isSubmitting || launchCountdown > 0}
                            className="gap-2"
                        >
                            {isSubmitting ? (
                                "Launching..."
                            ) : launchCountdown > 0 ? (
                                <>
                                    <span className="tabular-nums">{launchCountdown}s</span>
                                    Wait to {formData.scheduleType === "immediate" ? "Launch" : "Schedule"}
                                </>
                            ) : (
                                <>
                                    <Zap className="h-4 w-4" />
                                    {formData.scheduleType === "immediate" ? "Launch Now" : "Schedule Campaign"}
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Close/Save Draft Dialog */}
            <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Save as Draft?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have unsaved changes. Do you want to save this campaign as a draft or discard it?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleDiscard} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            Discard & Delete
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={() => router.push("/dashboard/campaigns")}>
                            Save & Exit
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
