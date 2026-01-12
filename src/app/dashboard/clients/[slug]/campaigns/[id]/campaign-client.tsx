"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Campaign, Client, Template, Audience, Segment, CampaignAnalytics } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import {
    Mail, Users, CheckCircle, AlertCircle, Play, Send,
    Settings, Eye, MousePointer, AlertTriangle, LayoutTemplate,
    Calendar, Terminal
} from "lucide-react";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { TemplateSelector } from "./template-selector";
import { SmtpSelector } from "./smtp-selector";
import { AudienceSegmentSelector, AudienceWithSegments } from "./audience-segment-selector";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useBreadcrumbs } from "@/lib/contexts/breadcrumb-context";
import { cn } from "@/lib/utils";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { CampaignConfigCard } from "@/components/ui-kit/campaign-config-card";
import { StatusBadge, ClientBadgeSolid, SmtpBadge, TemplateBadge, AudienceBadge } from "@/components/ui-kit/card-badge";
import { SmtpProfile } from "@/components/ui-kit/smtp-profile-card";
import { SegmentCardData } from "@/components/ui-kit/segment-card";
import { useI18n } from "@/lib/i18n";

// Types
type CampaignWithRelations = Campaign & {
    client: Client;
    template: Template | null;
    audience: (Audience & {
        _count: { contacts: number };
        segments?: SegmentCardData[];
    }) | null;
    segment?: Segment | null;
    analytics: CampaignAnalytics | null;
};

interface CampaignClientProps {
    initialCampaign: CampaignWithRelations;
    templates: Template[];
    audiences: AudienceWithSegments[];
    smtpProfiles: SmtpProfile[];
}

export function CampaignClient({ initialCampaign, templates, audiences, smtpProfiles }: CampaignClientProps) {
    const [campaign, setCampaign] = useState(initialCampaign);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { t } = useI18n();

    // Dialog states
    const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
    const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);
    const [isSmtpSelectorOpen, setIsSmtpSelectorOpen] = useState(false);
    const [isAudienceSelectorOpen, setIsAudienceSelectorOpen] = useState(false);
    const [testDialogOpen, setTestDialogOpen] = useState(false);
    const [startDialogOpen, setStartDialogOpen] = useState(false);

    // Selected SMTP profile (stored locally, update campaign on selection)
    const [selectedSmtp, setSelectedSmtp] = useState<SmtpProfile | null>(null);
    const [selectedSegment, setSelectedSegment] = useState<SegmentCardData | null>(null);

    // Edit forms
    const [settingsForm, setSettingsForm] = useState({
        subject: campaign.subject || "",
        previewText: campaign.previewText || "",
        fromName: campaign.fromName || "",
        fromEmail: campaign.fromEmail || "",
    });
    const [testEmail, setTestEmail] = useState("");
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
    const [audienceContacts, setAudienceContacts] = useState<any[]>([]);
    const [loadingContacts, setLoadingContacts] = useState(false);
    const [sendingTest, setSendingTest] = useState(false);

    // Breadcrumbs
    const { setOverride, removeOverride } = useBreadcrumbs();
    useEffect(() => {
        setOverride("campaigns", t.common?.campaigns || "Campaigns");
        setOverride(campaign.id, campaign.name);
        return () => {
            removeOverride("campaigns");
            removeOverride(campaign.id);
        };
    }, [campaign.id, campaign.name, setOverride, removeOverride, t.common?.campaigns]);

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
            toast.success(t.common?.success || "Settings saved");
            setIsSettingsDialogOpen(false);
            router.refresh();
        } catch (error) {
            toast.error(t.common?.error || "Failed to save settings");
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
            toast.success(t.common?.success || "Template updated");
            router.refresh();
        } catch (error) {
            toast.error(t.common?.error || "Failed to update template");
        } finally {
            setLoading(false);
        }
    };

    const handleSmtpSelect = async (profile: SmtpProfile) => {
        setSelectedSmtp(profile);
        // TODO: Save smtpProfileId to campaign when API supports it
        toast.success(`SMTP profile "${profile.name}" selected`);
    };

    const handleAudienceSegmentSelect = async (audience: AudienceWithSegments, segment: SegmentCardData) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/campaigns/${campaign.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    audienceId: audience.id,
                    segmentId: segment.id,
                }),
            });
            if (!response.ok) throw new Error("Failed to update");
            setCampaign({
                ...campaign,
                audience: { ...audience, _count: audience._count } as any,
                audienceId: audience.id,
                segment: segment as any,
            });
            setSelectedSegment(segment);
            toast.success(t.common?.success || "Audience & segment updated");
            router.refresh();
        } catch (error) {
            toast.error(t.common?.error || "Failed to update");
        } finally {
            setLoading(false);
        }
    };

    const fetchAudienceContacts = async () => {
        if (!campaign.audienceId) return;
        setLoadingContacts(true);
        try {
            const response = await fetch(`/api/audiences/${campaign.audienceId}/contacts`);
            if (response.ok) {
                const data = await response.json();
                setAudienceContacts(data.contacts || []);
            }
        } catch (error) {
            console.error("Failed to fetch audience contacts", error);
        } finally {
            setLoadingContacts(false);
        }
    };

    useEffect(() => {
        if (testDialogOpen && campaign.audienceId) {
            fetchAudienceContacts();
        }
    }, [testDialogOpen, campaign.audienceId]);

    const handleSendTest = async () => {
        if (!testEmail && !selectedContactId) return;
        setSendingTest(true);
        try {
            const response = await fetch(`/api/campaigns/${campaign.id}/test`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: testEmail,
                    contactId: selectedContactId
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed");
            toast.success(`Test email sent!`);
            setTestDialogOpen(false);
            setTestEmail("");
            setSelectedContactId(null);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSendingTest(false);
        }
    };

    const handleStartCampaign = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/campaigns/${campaign.id}/send`, {
                method: "POST",
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to start campaign");

            toast.success("Campaign broadcasting started!");
            setStartDialogOpen(false);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Validation
    const isReadyToTest = Boolean(
        campaign.subject &&
        campaign.fromName &&
        campaign.fromEmail &&
        campaign.template
    );

    const checkList = [
        { label: "Valid Subject Line", valid: !!campaign.subject },
        { label: "Sender Details", valid: !!campaign.fromName && !!campaign.fromEmail },
        { label: "Template Selected", valid: !!campaign.templateId },
        { label: "Segment Selected", valid: !!selectedSegment || !!(campaign as any).segmentId },
    ];
    const isReadyToStart = checkList.every(i => i.valid);

    // KPI Stats
    const kpiStats = campaign.analytics ? [
        { label: "SENT", value: campaign.analytics.sent, icon: Send, color: "blue" },
        { label: "DELIVERED", value: campaign.analytics.delivered, icon: CheckCircle, color: "green" },
        { label: "OPENED", value: campaign.analytics.opened, icon: Eye, color: "violet", rate: campaign.analytics.delivered > 0 ? Math.round((campaign.analytics.opened / campaign.analytics.delivered) * 100) : 0 },
        { label: "CLICKED", value: campaign.analytics.clicked, icon: MousePointer, color: "indigo", rate: campaign.analytics.opened > 0 ? Math.round((campaign.analytics.clicked / campaign.analytics.opened) * 100) : 0 },
        { label: "BOUNCED", value: campaign.analytics.bounced, icon: AlertTriangle, color: "red" },
        { label: "UNSUBSCRIBED", value: campaign.analytics.unsubscribed, icon: Users, color: "orange" },
    ] : [];

    const formatDate = (date: Date | string | null) => {
        if (!date) return "—";
        return new Date(date).toLocaleString('fr-FR', {
            day: '2-digit', month: '2-digit', year: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <>
            <PageHeader
                title={campaign.name}
                showBack
                onBack={() => router.push(`/dashboard/clients/${campaign.client.slug}/campaigns`)}
            />
            <PageContent>
                <div className="space-y-6">
                    {/* Campaign Details Section */}
                    <div className="rounded-xl border border-dashed p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3 flex-wrap">
                                <p className="text-lg font-semibold">{campaign.name}</p>

                                {/* Status Badge */}
                                <StatusBadge status={campaign.status.toLowerCase() as any}>
                                    {campaign.status}
                                </StatusBadge>

                                {/* Client Badge */}
                                <ClientBadgeSolid
                                    clientName={campaign.client.name}
                                    primaryColor={(campaign.client.brandColors as any)?.primary}
                                />
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
                                <p className="font-medium text-muted-foreground">{formatDate(campaign.createdAt)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Last Updated</p>
                                <p className="font-medium text-muted-foreground">{formatDate(campaign.updatedAt)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Sent At</p>
                                <p className="font-medium text-muted-foreground">{formatDate(campaign.sentAt)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Scheduled At</p>
                                <p className="font-medium text-muted-foreground">{formatDate(campaign.scheduledAt)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Email Settings Row */}
                    <div className="rounded-xl border border-dashed p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6 flex-wrap flex-1">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Email Settings</span>
                                </div>

                                {campaign.subject ? (
                                    <div className="flex items-center gap-6 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Subject: </span>
                                            <span className="font-medium">{campaign.subject}</span>
                                        </div>
                                        <Separator orientation="vertical" className="h-4" />
                                        <div>
                                            <span className="text-muted-foreground">From: </span>
                                            <span className="font-medium">{campaign.fromName}</span>
                                        </div>
                                        {campaign.previewText && (
                                            <>
                                                <Separator orientation="vertical" className="h-4" />
                                                <div className="text-muted-foreground truncate max-w-[200px]">
                                                    {campaign.previewText}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-sm text-muted-foreground">Not configured</span>
                                )}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
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
                                {campaign.subject ? "Edit" : "Configure"}
                            </Button>
                        </div>
                    </div>

                    {/* Campaign Configuration Cards */}
                    <div className="space-y-4">
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
                                            <DialogDescription>
                                                Select a contact from your audience to test personalization, or enter a manual email.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="py-4 space-y-4">
                                            <div className="space-y-2">
                                                <Label>Select Contact (for personalization)</Label>
                                                <Select
                                                    value={selectedContactId || "manual"}
                                                    onValueChange={(val) => {
                                                        if (val === "manual") {
                                                            setSelectedContactId(null);
                                                        } else {
                                                            setSelectedContactId(val);
                                                            setTestEmail("");
                                                        }
                                                    }}
                                                    disabled={loadingContacts}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={loadingContacts ? "Loading contacts..." : "Choose a contact"} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="manual">Manual Email Input</SelectItem>
                                                        {audienceContacts.map((contact) => (
                                                            <SelectItem key={contact.id} value={contact.id}>
                                                                {contact.firstName} {contact.lastName} ({contact.email})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {!selectedContactId && (
                                                <div className="space-y-2">
                                                    <Label>Manual Email</Label>
                                                    <Input
                                                        value={testEmail}
                                                        onChange={(e) => setTestEmail(e.target.value)}
                                                        placeholder="name@example.com"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <DialogFooter>
                                            <Button variant="ghost" onClick={() => setTestDialogOpen(false)}>Cancel</Button>
                                            <Button
                                                onClick={handleSendTest}
                                                disabled={sendingTest || (!testEmail && !selectedContactId)}
                                            >
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
                                                        <span className="flex items-center gap-1 text-xs text-green-600">
                                                            <CheckCircle className="h-3 w-3" /> OK
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-xs text-red-600">
                                                            <AlertCircle className="h-3 w-3" /> Missing
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                            {isReadyToStart && (
                                                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-md text-sm text-yellow-600 mt-4">
                                                    <p className="font-semibold">Ready to launch!</p>
                                                    <p>Sending to <strong>{selectedSegment?._count.contacts || 0}</strong> contacts in segment.</p>
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
                        <div className="grid gap-4 lg:grid-cols-3">
                            {/* SMTP Card */}
                            <CampaignConfigCard
                                icon={Terminal}
                                title="SMTP Profile"
                                color="blue"
                                hasContent={!!selectedSmtp}
                                emptyLabel="No SMTP selected"
                                actionLabel="Select SMTP"
                                onAction={() => setIsSmtpSelectorOpen(true)}
                            >
                                {selectedSmtp && (
                                    <div className="space-y-3">
                                        <div className="p-3 rounded-lg bg-muted/30 border border-dashed">
                                            <p className="font-semibold text-sm">{selectedSmtp.name}</p>
                                            <p className="text-xs text-muted-foreground">{selectedSmtp.host}:{selectedSmtp.port}</p>
                                        </div>
                                        <SmtpBadge verified={true} profileName={selectedSmtp.name} />
                                    </div>
                                )}
                            </CampaignConfigCard>

                            {/* Template Card */}
                            <CampaignConfigCard
                                icon={LayoutTemplate}
                                title="Template"
                                color="violet"
                                hasContent={!!campaign.template}
                                emptyLabel="No template selected"
                                actionLabel="Select Template"
                                onAction={() => setIsTemplateSelectorOpen(true)}
                            >
                                {campaign.template && (
                                    <div className="flex-1 flex flex-col">
                                        <div className="flex-1 rounded-lg border bg-muted/20 overflow-hidden relative">
                                            {campaign.template.htmlContent && (
                                                <iframe
                                                    srcDoc={campaign.template.htmlContent}
                                                    className="w-full h-[150px] border-0 pointer-events-none"
                                                    style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%' }}
                                                />
                                            )}
                                        </div>
                                        <div className="pt-3 border-t border-dashed mt-3">
                                            <p className="font-medium text-sm">{campaign.template.name}</p>
                                            <TemplateBadge templateName={campaign.template.name} className="mt-2" />
                                        </div>
                                    </div>
                                )}
                            </CampaignConfigCard>

                            {/* Audience/Segment Card */}
                            <CampaignConfigCard
                                icon={Users}
                                title="Audience & Segment"
                                color="green"
                                hasContent={!!selectedSegment || !!campaign.audience}
                                emptyLabel="No segment selected"
                                actionLabel="Select Segment"
                                onAction={() => setIsAudienceSelectorOpen(true)}
                            >
                                {(selectedSegment || campaign.audience) && (
                                    <div className="flex-1 flex flex-col">
                                        <div className="flex-1 p-3 rounded-lg bg-muted/20 border border-dashed">
                                            <div className="flex items-start gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                                                    <Users className="h-5 w-5 text-green-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-sm truncate">
                                                        {selectedSegment?.name || campaign.audience?.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {campaign.audience?.name && selectedSegment ? `From: ${campaign.audience.name}` : ""}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-3 border-t border-dashed mt-3 flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Contacts</span>
                                            <span className="text-sm font-bold">
                                                {selectedSegment?._count.contacts || campaign.audience?._count.contacts || 0}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </CampaignConfigCard>
                        </div>
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

            <SmtpSelector
                open={isSmtpSelectorOpen}
                onOpenChange={setIsSmtpSelectorOpen}
                profiles={smtpProfiles}
                selectedId={selectedSmtp?.id}
                onSelect={handleSmtpSelect}
            />

            <AudienceSegmentSelector
                open={isAudienceSelectorOpen}
                onOpenChange={setIsAudienceSelectorOpen}
                audiences={audiences}
                selectedAudienceId={campaign.audienceId}
                selectedSegmentId={selectedSegment?.id || (campaign as any).segmentId}
                onSelect={handleAudienceSegmentSelect}
            />
        </>
    );
}
