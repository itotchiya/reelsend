"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Campaign, Client, Template, Audience, Segment, CampaignAnalytics } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Mail, Users, CheckCircle, Send, Eye, MousePointer, AlertTriangle,
    LayoutTemplate, ArrowLeft, Building2, Server, BarChart3, Settings2,
    Clock, Calendar, TrendingUp, XCircle, AlertOctagon, MessageSquareWarning
} from "lucide-react";
import { useBreadcrumbs } from "@/lib/contexts/breadcrumb-context";
import { cn } from "@/lib/utils";
import { StatusBadge, ClientBadgeSolid } from "@/components/ui-kit/card-badge";
import { SegmentCardData } from "@/components/ui-kit/segment-card";
import { SmtpProfile } from "@/components/ui-kit/smtp-profile-card";
import { useI18n } from "@/lib/i18n";
import { DashboardBreadcrumb } from "@/components/dashboard/layout";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguagePickerDialog } from "@/components/ui-kit/language-picker-dialog";

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
    smtpProfile?: SmtpProfile | null;
};

interface CampaignClientProps {
    initialCampaign: CampaignWithRelations;
    templates: Template[];
    audiences: any[];
    smtpProfiles: SmtpProfile[];
}

export function CampaignClient({ initialCampaign, templates, audiences, smtpProfiles }: CampaignClientProps) {
    const campaign = initialCampaign;
    const router = useRouter();
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState("analytics");

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

    // Get selected SMTP profile
    const smtpProfile = smtpProfiles.find(p => p.id === (campaign as any).smtpProfileId);

    // Format date helper
    const formatDate = (date: Date | string | null) => {
        if (!date) return "—";
        return new Date(date).toLocaleString('en-US', {
            weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    // Analytics data with all possible metrics
    const analytics = campaign.analytics;
    const deliveryRate = analytics?.sent ? Math.round((analytics.delivered / analytics.sent) * 100) : 0;
    const openRate = analytics?.delivered ? Math.round((analytics.opened / analytics.delivered) * 100) : 0;
    const clickRate = analytics?.opened ? Math.round((analytics.clicked / analytics.opened) * 100) : 0;
    const bounceRate = analytics?.sent ? Math.round((analytics.bounced / analytics.sent) * 100) : 0;
    const unsubRate = analytics?.delivered ? Math.round((analytics.unsubscribed / analytics.delivered) * 100) : 0;

    return (
        <div className="h-dvh flex flex-col bg-background">
            {/* Header - matching client-detail-client.tsx pattern */}
            <header className="relative shrink-0 flex items-center justify-between px-6 h-16 border-b bg-background">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="-ml-2">
                        <Link href={`/dashboard/clients/${campaign.client.slug}/campaigns`}>
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

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-y-auto">
                <div className="flex-1 p-6 md:p-12">
                    {/* Campaign Header */}
                    <div className="flex items-center gap-4 flex-wrap mb-6">
                        <h1 className="text-2xl font-bold">{campaign.name}</h1>
                        <StatusBadge status={campaign.status.toLowerCase() as any}>
                            {campaign.status}
                        </StatusBadge>
                        <ClientBadgeSolid
                            clientName={campaign.client.name}
                            primaryColor={(campaign.client.brandColors as any)?.primary}
                        />
                    </div>

                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        <TabsList className="grid w-full max-w-md grid-cols-2">
                            <TabsTrigger value="analytics" className="gap-2">
                                <BarChart3 className="h-4 w-4" />
                                Analytics
                            </TabsTrigger>
                            <TabsTrigger value="details" className="gap-2">
                                <Settings2 className="h-4 w-4" />
                                Details
                            </TabsTrigger>
                        </TabsList>

                        {/* Analytics Tab */}
                        <TabsContent value="analytics" className="space-y-8">
                            {analytics ? (
                                <>
                                    {/* Primary KPIs - Large cards */}
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                        <MetricCard
                                            label="Sent"
                                            value={analytics.sent}
                                            icon={Send}
                                            color="blue"
                                            description="Total emails sent"
                                        />
                                        <MetricCard
                                            label="Delivered"
                                            value={analytics.delivered}
                                            rate={deliveryRate}
                                            icon={CheckCircle}
                                            color="green"
                                            description="Successfully delivered"
                                        />
                                        <MetricCard
                                            label="Opened"
                                            value={analytics.opened}
                                            rate={openRate}
                                            icon={Eye}
                                            color="violet"
                                            description="Unique opens"
                                        />
                                        <MetricCard
                                            label="Clicked"
                                            value={analytics.clicked}
                                            rate={clickRate}
                                            icon={MousePointer}
                                            color="indigo"
                                            description="Unique clicks"
                                        />
                                    </div>

                                    {/* Secondary KPIs - Issues & Engagement */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold">Delivery Issues</h3>
                                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                            <MetricCard
                                                label="Bounced"
                                                value={analytics.bounced}
                                                rate={bounceRate}
                                                icon={XCircle}
                                                color="red"
                                                description="Hard & soft bounces"
                                            />
                                            <MetricCard
                                                label="Unsubscribed"
                                                value={analytics.unsubscribed}
                                                rate={unsubRate}
                                                icon={Users}
                                                color="orange"
                                                description="Opted out"
                                            />
                                            <MetricCard
                                                label="Complaints"
                                                value={(analytics as any).complaints || 0}
                                                icon={AlertOctagon}
                                                color="red"
                                                description="Spam reports"
                                            />
                                            <MetricCard
                                                label="Failed"
                                                value={(analytics as any).failed || 0}
                                                icon={AlertTriangle}
                                                color="amber"
                                                description="Delivery failures"
                                            />
                                        </div>
                                    </div>

                                    {/* Webhook Events (Future) */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-base">
                                                <TrendingUp className="h-5 w-5" />
                                                Event Timeline
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-center py-12 text-muted-foreground">
                                                <MessageSquareWarning className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                                <p className="text-sm">Webhook event timeline will be available once configured</p>
                                                <p className="text-xs mt-1 opacity-70">Real-time events: opens, clicks, bounces, complaints</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </>
                            ) : (
                                <Card>
                                    <CardContent className="py-16">
                                        <div className="text-center text-muted-foreground">
                                            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p className="font-medium">No Analytics Data</p>
                                            <p className="text-sm mt-1">Analytics will appear once the campaign is sent</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        {/* Details Tab */}
                        <TabsContent value="details" className="space-y-6">
                            {/* Campaign Overview */}
                            <Card>
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-3">
                                        <Building2 className="h-5 w-5" />
                                        Campaign Overview
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Client</p>
                                            <p className="font-medium">{campaign.client.name}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Created</p>
                                            <p className="font-medium text-sm">{formatDate(campaign.createdAt)}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Sent At</p>
                                            <p className="font-medium text-sm">{formatDate(campaign.sentAt)}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Scheduled At</p>
                                            <p className="font-medium text-sm">{formatDate(campaign.scheduledAt)}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Email Details */}
                            <Card>
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-3">
                                        <Mail className="h-5 w-5" />
                                        Email Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Subject Line</p>
                                            <p className="font-medium">{campaign.subject || "—"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Preview Text</p>
                                            <p className="font-medium text-muted-foreground">{campaign.previewText || "—"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Sender Name</p>
                                            <p className="font-medium">{campaign.fromName || "—"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Sender Email</p>
                                            <p className="font-medium font-mono text-sm">{campaign.fromEmail || "—"}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Configuration Grid */}
                            <div className="grid gap-6 lg:grid-cols-3">
                                {/* Template */}
                                <Card>
                                    <CardHeader className="pb-4">
                                        <CardTitle className="flex items-center gap-3 text-base">
                                            <LayoutTemplate className="h-5 w-5 text-violet-500" />
                                            Template
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {campaign.template ? (
                                            <div className="space-y-3">
                                                <div className="rounded-lg border bg-muted/20 overflow-hidden">
                                                    {campaign.template.htmlContent && (
                                                        <iframe
                                                            srcDoc={campaign.template.htmlContent}
                                                            className="w-full h-[120px] border-0 pointer-events-none"
                                                            style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%' }}
                                                        />
                                                    )}
                                                </div>
                                                <p className="font-semibold text-sm">{campaign.template.name}</p>
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground text-sm italic">No template selected</p>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Audience & Segment */}
                                <Card>
                                    <CardHeader className="pb-4">
                                        <CardTitle className="flex items-center gap-3 text-base">
                                            <Users className="h-5 w-5 text-green-500" />
                                            Audience & Segment
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {campaign.audience ? (
                                            <div className="space-y-3">
                                                <div className="p-3 rounded-lg bg-muted/20 border">
                                                    <p className="font-semibold text-sm">{campaign.audience.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {campaign.audience._count.contacts} contacts
                                                    </p>
                                                </div>
                                                {campaign.segment && (
                                                    <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                                                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Segment</p>
                                                        <p className="font-semibold text-sm">{campaign.segment.name}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground text-sm italic">No audience selected</p>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* SMTP Profile */}
                                <Card>
                                    <CardHeader className="pb-4">
                                        <CardTitle className="flex items-center gap-3 text-base">
                                            <Server className="h-5 w-5 text-blue-500" />
                                            SMTP Profile
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {smtpProfile ? (
                                            <div className="p-3 rounded-lg bg-muted/20 border">
                                                <p className="font-semibold text-sm">{smtpProfile.name}</p>
                                                <p className="text-xs text-muted-foreground font-mono">
                                                    {smtpProfile.host}:{smtpProfile.port}
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground text-sm italic">No SMTP profile selected</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    );
}

// Metric Card Component
interface MetricCardProps {
    label: string;
    value: number;
    rate?: number;
    icon: React.ElementType;
    color: "blue" | "green" | "violet" | "indigo" | "red" | "orange" | "amber";
    description?: string;
}

function MetricCard({ label, value, rate, icon: Icon, color, description }: MetricCardProps) {
    const colorClasses = {
        blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
        green: "bg-green-500/10 text-green-600 dark:text-green-400",
        violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
        indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
        red: "bg-red-500/10 text-red-600 dark:text-red-400",
        orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
        amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    };

    const hoverClasses = {
        blue: "hover:border-blue-500/50",
        green: "hover:border-green-500/50",
        violet: "hover:border-violet-500/50",
        indigo: "hover:border-indigo-500/50",
        red: "hover:border-red-500/50",
        orange: "hover:border-orange-500/50",
        amber: "hover:border-amber-500/50",
    };

    return (
        <div className={cn(
            "relative group rounded-xl border p-5 transition-all duration-200 hover:shadow-md",
            hoverClasses[color]
        )}>
            <div className="flex items-start justify-between mb-3">
                <div className={cn("p-2.5 rounded-lg", colorClasses[color])}>
                    <Icon className="h-5 w-5" />
                </div>
                {rate !== undefined && (
                    <span className="text-sm font-semibold text-muted-foreground">
                        {rate}%
                    </span>
                )}
            </div>
            <div>
                <p className="text-3xl font-bold tracking-tight">{value.toLocaleString()}</p>
                <p className="text-sm font-medium text-muted-foreground mt-1">{label}</p>
                {description && (
                    <p className="text-xs text-muted-foreground/70 mt-0.5">{description}</p>
                )}
            </div>
        </div>
    );
}
