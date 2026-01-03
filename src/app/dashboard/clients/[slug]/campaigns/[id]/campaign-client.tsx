"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Campaign, Client, Template, Audience, CampaignAnalytics } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import {
    Mail, Users, FileText, CheckCircle, AlertCircle, Play, Send,
    Settings, Plus, ExternalLink, Eye, MousePointer, RotateCcw,
    AlertTriangle, LayoutTemplate, Calendar
} from "lucide-react";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { TemplateSelector } from "./template-selector";
import { AudienceSelector } from "./audience-selector";
import { useBreadcrumbs } from "@/lib/contexts/breadcrumb-context";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";

// Types
type CampaignWithRelations = Campaign & {
    client: Client;
    template: Template | null;
    audience: (Audience & { _count: { contacts: number } }) | null;
    analytics: CampaignAnalytics | null;
};

type AudienceWithCount = Audience & {
    _count: { contacts: number };
};

interface CampaignClientProps {
    initialCampaign: CampaignWithRelations;
    templates: Template[];
    audiences: AudienceWithCount[];
}

export function CampaignClient({ initialCampaign, templates, audiences }: CampaignClientProps) {
    const [campaign, setCampaign] = useState(initialCampaign);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Dialog states
    const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
    const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);
    const [isAudienceSelectorOpen, setIsAudienceSelectorOpen] = useState(false);
    const [testDialogOpen, setTestDialogOpen] = useState(false);
    const [startDialogOpen, setStartDialogOpen] = useState(false);

    // Edit forms
    const [settingsForm, setSettingsForm] = useState({
        subject: campaign.subject || "",
        previewText: campaign.previewText || "",
        fromName: campaign.fromName || "",
        fromEmail: campaign.fromEmail || "",
    });
    const [testEmail, setTestEmail] = useState("");
    const [sendingTest, setSendingTest] = useState(false);

    // Breadcrumbs
    const { setOverride, removeOverride } = useBreadcrumbs();
    useEffect(() => {
        setOverride("campaigns", "Campaigns");
        setOverride(campaign.id, campaign.name);
        return () => {
            removeOverride("campaigns");
            removeOverride(campaign.id);
        };
    }, [campaign.id, campaign.name, setOverride, removeOverride]);

    // Handlers
    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch(`/api/campaigns/${campaign.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settingsForm),
            });
            if (!response.ok) throw new Error("Failed to update");
            const updated = await response.json();
            setCampaign({ ...campaign, ...updated });
            toast.success("Settings saved");
            setIsSettingsDialogOpen(false);
            router.refresh();
        } catch (error) {
            toast.error("Failed to save settings");
        } finally {
            setLoading(false);
        }
    };

    const handleTemplateSelect = async (template: Template) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/campaigns/${campaign.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ templateId: template.id }),
            });
            if (!response.ok) throw new Error("Failed to update");
            setCampaign({ ...campaign, template, templateId: template.id });
            toast.success("Template updated");
            router.refresh();
        } catch (error) {
            toast.error("Failed to update template");
        } finally {
            setLoading(false);
        }
    };

    const handleAudienceSelect = async (audience: AudienceWithCount) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/campaigns/${campaign.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ audienceId: audience.id }),
            });
            if (!response.ok) throw new Error("Failed to update");
            setCampaign({ ...campaign, audience, audienceId: audience.id });
            toast.success("Audience updated");
            router.refresh();
        } catch (error) {
            toast.error("Failed to update audience");
        } finally {
            setLoading(false);
        }
    };

    const handleSendTest = async () => {
        if (!testEmail) return;
        setSendingTest(true);
        try {
            const response = await fetch(`/api/campaigns/${campaign.id}/test`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: testEmail }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed");
            toast.success(`Test sent to ${testEmail}`);
            setTestDialogOpen(false);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSendingTest(false);
        }
    };

    const handleStartCampaign = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/campaigns/${campaign.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "SENDING", sentAt: new Date() }),
            });
            if (!response.ok) throw new Error("Failed");
            toast.success("Campaign started!");
            setStartDialogOpen(false);
            router.refresh();
        } catch (error) {
            toast.error("Failed to start campaign");
        } finally {
            setLoading(false);
        }
    };

    // Validation
    const isReadyToTest = Boolean(
        campaign.subject &&
        campaign.fromName &&
        campaign.fromEmail &&
        campaign.template &&
        campaign.client.smtpVerified
    );

    const checkList = [
        { label: "Valid Subject Line", valid: !!campaign.subject },
        { label: "Sender Details", valid: !!campaign.fromName && !!campaign.fromEmail },
        { label: "Template Selected", valid: !!campaign.templateId },
        { label: "Audience Selected", valid: !!campaign.audienceId && (campaign.audience?._count.contacts || 0) > 0 },
        { label: "SMTP Verified", valid: campaign.client.smtpVerified },
    ];
    const isReadyToStart = checkList.every(i => i.valid);

    const initials = campaign.client.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

    // KPI Stats
    const kpiStats = campaign.analytics ? [
        { label: "SENT", value: campaign.analytics.sent, icon: Send, color: "blue" },
        { label: "DELIVERED", value: campaign.analytics.delivered, icon: CheckCircle, color: "green" },
        { label: "OPENED", value: campaign.analytics.opened, icon: Eye, color: "violet", rate: campaign.analytics.delivered > 0 ? Math.round((campaign.analytics.opened / campaign.analytics.delivered) * 100) : 0 },
        { label: "CLICKED", value: campaign.analytics.clicked, icon: MousePointer, color: "indigo", rate: campaign.analytics.opened > 0 ? Math.round((campaign.analytics.clicked / campaign.analytics.opened) * 100) : 0 },
        { label: "BOUNCED", value: campaign.analytics.bounced, icon: AlertTriangle, color: "red" },
        { label: "UNSUBSCRIBED", value: campaign.analytics.unsubscribed, icon: Users, color: "orange" },
    ] : [];

    return (
        <>
            <PageHeader
                title={campaign.name}
                showBack
                onBack={() => router.push(`/dashboard/clients/${campaign.client.slug}/campaigns`)}
            />
            <PageContent>
                <div className="space-y-8">
                    {/* Header with Avatar */}
                    <div className="relative">
                        {/* Gradient Cover */}
                        <div
                            className="h-32 rounded-2xl overflow-hidden"
                            style={{
                                background: `linear-gradient(135deg, ${(campaign.client.brandColors as any)?.primary || '#6366f1'} 0%, ${(campaign.client.brandColors as any)?.secondary || '#a855f7'} 100%)`
                            }}
                        />

                        {/* Avatar */}
                        <div className="px-6 -mt-10 relative">
                            <div className="h-20 w-20 rounded-xl bg-background border-2 border-background flex items-center justify-center overflow-hidden shadow-none">
                                {campaign.client.logo ? (
                                    <img src={campaign.client.logo} alt={campaign.client.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="h-full w-full bg-muted flex items-center justify-center">
                                        <span className="text-xl font-bold text-muted-foreground">{initials}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Campaign Details Section */}
                    <div className="rounded-xl border border-dashed p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <p className="text-lg font-semibold">{campaign.name}</p>

                                {/* Status Badge */}
                                <div className={cn(
                                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors",
                                    campaign.status === "DRAFT" ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" :
                                        campaign.status === "SENDING" ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                                            campaign.status === "COMPLETED" ? "bg-green-500/10 text-green-600 border-green-500/20" :
                                                campaign.status === "FAILED" ? "bg-red-500/10 text-red-600 border-red-500/20" :
                                                    "bg-gray-500/10 text-gray-600 border-gray-500/20"
                                )}>
                                    <span className={cn("h-1.5 w-1.5 rounded-full",
                                        campaign.status === "DRAFT" ? "bg-yellow-500" :
                                            campaign.status === "SENDING" ? "bg-blue-500" :
                                                campaign.status === "COMPLETED" ? "bg-green-500" :
                                                    campaign.status === "FAILED" ? "bg-red-500" : "bg-gray-500"
                                    )} />
                                    <span>{campaign.status}</span>
                                </div>

                                {/* Client Badge */}
                                <Badge variant="outline" className="font-normal">
                                    {campaign.client.name}
                                </Badge>

                                {/* SMTP Badge */}
                                <div className={cn(
                                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                    campaign.client.smtpVerified
                                        ? "bg-green-500/10 text-green-600 border-green-500/20"
                                        : "bg-orange-500/10 text-orange-600 border-orange-500/20"
                                )}>
                                    {campaign.client.smtpVerified ? (
                                        <>
                                            <Mail className="h-3 w-3" />
                                            <span>SMTP Verified</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="h-3 w-3" />
                                            <span>SMTP Required</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <Button
                                size="sm"
                                className="gap-2"
                                onClick={() => {
                                    setSettingsForm({
                                        subject: campaign.subject || "",
                                        previewText: campaign.previewText || "",
                                        fromName: campaign.fromName || "",
                                        fromEmail: campaign.fromEmail || "",
                                    });
                                    setIsSettingsDialogOpen(true);
                                }}
                            >
                                <Settings className="h-4 w-4" />
                                Campaign Details
                            </Button>
                        </div>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Created</p>
                                <p className="font-medium text-muted-foreground">
                                    {new Date(campaign.createdAt).toLocaleString('fr-FR', {
                                        day: '2-digit', month: '2-digit', year: '2-digit',
                                        hour: '2-digit', minute: '2-digit'
                                    })}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Last Updated</p>
                                <p className="font-medium text-muted-foreground">
                                    {new Date(campaign.updatedAt).toLocaleString('fr-FR', {
                                        day: '2-digit', month: '2-digit', year: '2-digit',
                                        hour: '2-digit', minute: '2-digit'
                                    })}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Sent At</p>
                                <p className="font-medium text-muted-foreground">
                                    {campaign.sentAt ? new Date(campaign.sentAt).toLocaleString('fr-FR', {
                                        day: '2-digit', month: '2-digit', year: '2-digit',
                                        hour: '2-digit', minute: '2-digit'
                                    }) : "—"}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Scheduled At</p>
                                <p className="font-medium text-muted-foreground">
                                    {campaign.scheduledAt ? new Date(campaign.scheduledAt).toLocaleString('fr-FR', {
                                        day: '2-digit', month: '2-digit', year: '2-digit',
                                        hour: '2-digit', minute: '2-digit'
                                    }) : "—"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Campaign Configuration Section */}
                    <div className="rounded-xl border border-dashed p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Campaign Configuration</h3>
                            <div className="flex items-center gap-2">
                                <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" disabled={!isReadyToTest}>
                                            <Send className="mr-2 h-4 w-4" />
                                            Send Test
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Send Test Email</DialogTitle>
                                            <DialogDescription>Enter an email address to receive a test.</DialogDescription>
                                        </DialogHeader>
                                        <div className="py-4">
                                            <Label>Email</Label>
                                            <Input
                                                value={testEmail}
                                                onChange={(e) => setTestEmail(e.target.value)}
                                                placeholder="name@example.com"
                                            />
                                        </div>
                                        <DialogFooter>
                                            <Button onClick={handleSendTest} disabled={sendingTest || !testEmail}>
                                                {sendingTest && <Spinner className="mr-2 h-4 w-4" />}
                                                Send Test
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                <Dialog open={startDialogOpen} onOpenChange={setStartDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-green-600 hover:bg-green-700" size="sm" disabled={!isReadyToStart}>
                                            <Play className="mr-2 h-4 w-4" />
                                            Start Campaign
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Review Campaign</DialogTitle>
                                            <DialogDescription>Confirm all requirements before launching.</DialogDescription>
                                        </DialogHeader>
                                        <div className="py-4 space-y-2">
                                            {checkList.map((item, i) => (
                                                <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/50">
                                                    <span className="text-sm font-medium">{item.label}</span>
                                                    {item.valid ? (
                                                        <Badge variant="outline" className="bg-green-500/15 text-green-600 border-green-500/20">
                                                            <CheckCircle className="mr-1 h-3 w-3" /> OK
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="destructive">
                                                            <AlertCircle className="mr-1 h-3 w-3" /> Missing
                                                        </Badge>
                                                    )}
                                                </div>
                                            ))}
                                            {isReadyToStart && (
                                                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-md text-sm text-yellow-600 mt-4">
                                                    <p className="font-semibold">Ready to launch!</p>
                                                    <p>Sending to <strong>{campaign.audience?._count.contacts}</strong> contacts.</p>
                                                </div>
                                            )}
                                        </div>
                                        <DialogFooter>
                                            <Button variant="ghost" onClick={() => setStartDialogOpen(false)}>Cancel</Button>
                                            <Button onClick={handleStartCampaign} disabled={!isReadyToStart || loading} className="bg-green-600 hover:bg-green-700">
                                                {loading && <Spinner className="mr-2 h-4 w-4" />}
                                                Confirm & Send
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>

                        {/* Configuration Grid */}
                        <div className="grid gap-6 lg:grid-cols-3">
                            {/* Settings Card */}
                            <div className="rounded-xl border border-dashed p-5 flex flex-col min-h-[280px]">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-semibold flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Mail className="h-4 w-4 text-primary" />
                                        </div>
                                        Email Settings
                                    </h4>
                                    <Button variant="ghost" size="sm" onClick={() => {
                                        setSettingsForm({
                                            subject: campaign.subject || "",
                                            previewText: campaign.previewText || "",
                                            fromName: campaign.fromName || "",
                                            fromEmail: campaign.fromEmail || "",
                                        });
                                        setIsSettingsDialogOpen(true);
                                    }}>
                                        {campaign.subject ? "Edit" : "Configure"}
                                    </Button>
                                </div>
                                {campaign.subject ? (
                                    <div className="flex-1 space-y-4">
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Subject</p>
                                            <p className="font-medium">{campaign.subject}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Preview Text</p>
                                            <p className="text-sm text-muted-foreground">{campaign.previewText || "No preview text"}</p>
                                        </div>
                                        <Separator className="border-dashed" />
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider">From</p>
                                            <p className="font-medium">{campaign.fromName}</p>
                                            <p className="text-sm text-muted-foreground">{campaign.fromEmail}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                            <Mail className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-2">No settings configured</p>
                                        <Button size="sm" variant="outline" onClick={() => setIsSettingsDialogOpen(true)}>
                                            Configure
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Template Card */}
                            <div className="rounded-xl border border-dashed p-5 flex flex-col min-h-[280px]">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-semibold flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                                            <LayoutTemplate className="h-4 w-4 text-violet-600" />
                                        </div>
                                        Template
                                    </h4>
                                    <Button variant="ghost" size="sm" onClick={() => setIsTemplateSelectorOpen(true)}>
                                        {campaign.template ? "Change" : "Select"}
                                    </Button>
                                </div>
                                {campaign.template ? (
                                    <div className="flex-1 flex flex-col">
                                        <div className="flex-1 rounded-lg border bg-muted/20 overflow-hidden relative">
                                            {campaign.template.htmlContent && (
                                                <iframe
                                                    srcDoc={campaign.template.htmlContent}
                                                    className="w-full h-[200px] border-0 pointer-events-none"
                                                    style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%' }}
                                                />
                                            )}
                                        </div>
                                        <div className="pt-3 border-t border-dashed mt-3">
                                            <p className="font-medium">{campaign.template.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Last updated {new Date(campaign.template.updatedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                            <LayoutTemplate className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-2">No template selected</p>
                                        <Button size="sm" variant="outline" onClick={() => setIsTemplateSelectorOpen(true)}>
                                            Select Template
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Audience Card */}
                            <div className="rounded-xl border border-dashed p-5 flex flex-col min-h-[280px]">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-semibold flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                                            <Users className="h-4 w-4 text-green-600" />
                                        </div>
                                        Audience
                                    </h4>
                                    <Button variant="ghost" size="sm" onClick={() => setIsAudienceSelectorOpen(true)}>
                                        {campaign.audience ? "Change" : "Select"}
                                    </Button>
                                </div>
                                {campaign.audience ? (
                                    <div className="flex-1 flex flex-col">
                                        <div className="flex-1 p-4 rounded-lg bg-muted/20 border border-dashed">
                                            <div className="flex items-start gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                                                    <Users className="h-5 w-5 text-green-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold truncate">{campaign.audience.name}</p>
                                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                                        {campaign.audience.description || "No description"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-3 border-t border-dashed mt-3 flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Contacts</span>
                                            <Badge variant="secondary" className="text-sm font-bold">
                                                {campaign.audience._count.contacts}
                                            </Badge>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                            <Users className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-2">No audience selected</p>
                                        <Button size="sm" variant="outline" onClick={() => setIsAudienceSelectorOpen(true)}>
                                            Select Audience
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* SMTP Warning */}
                        {!campaign.client.smtpVerified && (
                            <div className="flex items-center justify-between p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="h-5 w-5 text-orange-600" />
                                    <div>
                                        <p className="font-medium text-orange-600">SMTP Not Configured</p>
                                        <p className="text-sm text-orange-600/80">Configure email settings for this client to send campaigns.</p>
                                    </div>
                                </div>
                                <Link href={`/dashboard/clients/${campaign.client.slug}/edit`}>
                                    <Button size="sm" variant="outline">
                                        Configure SMTP
                                        <ExternalLink className="ml-2 h-3.5 w-3.5" />
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* KPI Stats Section */}
                    {campaign.analytics && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Campaign Performance</h3>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                                {kpiStats.map((stat) => (
                                    <div
                                        key={stat.label}
                                        className="relative group rounded-xl border border-dashed border-muted-foreground/30 p-4 transition-all duration-300 hover:border-muted-foreground/50 overflow-hidden"
                                    >
                                        <div className={cn(
                                            "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
                                            stat.color === "blue" ? "bg-blue-500/[0.05]" :
                                                stat.color === "green" ? "bg-green-500/[0.05]" :
                                                    stat.color === "violet" ? "bg-violet-500/[0.05]" :
                                                        stat.color === "indigo" ? "bg-indigo-500/[0.05]" :
                                                            stat.color === "red" ? "bg-red-500/[0.05]" : "bg-orange-500/[0.05]"
                                        )} />
                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold text-[10px]">{stat.label}</p>
                                                <stat.icon className="h-4 w-4 text-muted-foreground/50" />
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <p className="text-2xl font-bold">{stat.value}</p>
                                                {stat.rate !== undefined && (
                                                    <span className="text-xs text-muted-foreground">({stat.rate}%)</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </PageContent>

            {/* Settings Dialog */}
            <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Email Settings</DialogTitle>
                        <DialogDescription>Configure subject line and sender details.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveSettings}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Subject Line *</Label>
                                <Input
                                    value={settingsForm.subject}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, subject: e.target.value })}
                                    placeholder="Enter subject line"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Preview Text</Label>
                                <Input
                                    value={settingsForm.previewText}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, previewText: e.target.value })}
                                    placeholder="Text shown after subject"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Sender Name *</Label>
                                    <Input
                                        value={settingsForm.fromName}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, fromName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Sender Email *</Label>
                                    <Input
                                        value={settingsForm.fromEmail}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, fromEmail: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsSettingsDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Spinner className="mr-2 h-4 w-4" />}
                                Save
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Selectors */}
            <TemplateSelector
                open={isTemplateSelectorOpen}
                onOpenChange={setIsTemplateSelectorOpen}
                templates={templates}
                selectedId={campaign.templateId}
                onSelect={handleTemplateSelect}
            />

            <AudienceSelector
                open={isAudienceSelectorOpen}
                onOpenChange={setIsAudienceSelectorOpen}
                audiences={audiences}
                selectedId={campaign.audienceId}
                onSelect={handleAudienceSelect}
            />
        </>
    );
}
