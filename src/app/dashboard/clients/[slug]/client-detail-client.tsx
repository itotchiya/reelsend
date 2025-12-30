"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Mail,
    Users,
    FileText,
    Plus,
    Globe,
    Settings,
    Link as LinkIcon,
    Lock,
    Unlock,
    Loader2,
    Calendar
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { cn } from "@/lib/utils";
import { useBreadcrumbs } from "@/lib/contexts/breadcrumb-context";
import { useEffect } from "react";

interface Audience {
    id: string;
    name: string;
    description: string | null;
    contactCount: number;
    createdAt: string;
}

interface Campaign {
    id: string;
    name: string;
    subject: string;
    status: string;
    createdAt: string;
}

interface Template {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
}

interface Client {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    brandColors: any | null;
    active: boolean;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
    _count: {
        audiences: number;
        campaigns: number;
        templates: number;
        domains: number;
    };
    audiences: Audience[];
    campaigns: Campaign[];
    templates: Template[];
}

interface ClientDetailClientProps {
    client: Client;
    canEdit: boolean;
}

export function ClientDetailClient({ client, canEdit }: ClientDetailClientProps) {
    const { t } = useI18n();

    const [isPublic, setIsPublic] = useState(client.isPublic);
    const [updating, setUpdating] = useState(false);
    const { setOverride, removeOverride } = useBreadcrumbs();

    useEffect(() => {
        setOverride(client.slug, client.name);
        return () => removeOverride(client.slug);
    }, [client.slug, client.name, setOverride, removeOverride]);

    const togglePrivacy = async () => {
        setUpdating(true);
        try {
            const res = await fetch(`/api/clients/${client.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isPublic: !isPublic }),
            });
            if (res.ok) {
                setIsPublic(!isPublic);
                toast.success(`Portal is now ${!isPublic ? "public" : "private"}`);
            }
        } catch (error) {
            toast.error("Failed to update privacy settings");
        } finally {
            setUpdating(false);
        }
    };

    const copyPortalUrl = () => {
        const url = `${window.location.origin}/portal/${client.slug}`;
        navigator.clipboard.writeText(url);
        toast.success("Portal URL copied to clipboard");
    };

    const initials = client.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <>
            <PageHeader title={client.name} showBack>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-foreground/80 hover:text-foreground"
                        onClick={copyPortalUrl}
                        disabled={!isPublic}
                    >
                        <LinkIcon className="h-4 w-4" />
                        {t.clients?.copyPortalLink || "Copy Portal Link"}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn("gap-2", isPublic ? "text-green-500 hover:text-green-600 font-medium" : "text-red-500 hover:text-red-600 font-medium")}
                        onClick={togglePrivacy}
                        disabled={updating}
                    >
                        {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : isPublic ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        {isPublic ? (t.clients?.public || "Public") : (t.clients?.private || "Private")}
                    </Button>
                </div>
            </PageHeader>
            <PageContent>
                <div className="space-y-8">
                    {/* Luma-style Profile Header */}
                    <div className="relative">
                        {/* Dynamic Gradient Cover */}
                        <div
                            className="h-48 md:h-64 rounded-3xl overflow-hidden relative group"
                            style={{
                                background: `linear-gradient(135deg, ${client.brandColors?.primary || '#6366f1'} 0%, ${client.brandColors?.secondary || '#a855f7'} 100%)`
                            }}
                        >
                            <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors" />
                        </div>

                        {/* Logo and Info */}
                        <div className="px-8 -mt-16 relative">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6">
                                <div className="space-y-6">
                                    {/* Logo with thick stroke background */}
                                    <div className="h-32 w-32 md:h-40 md:w-40 rounded-[2.5rem] bg-background p-2 flex items-center justify-center overflow-hidden border-[12px] border-background relative z-20">
                                        {client.logo ? (
                                            <div className="relative w-full h-full flex items-center justify-center">
                                                <img
                                                    src={client.logo}
                                                    alt={client.name}
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                        ) : (
                                            <div className="h-full w-full rounded-[1.5rem] bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center">
                                                <span className="text-4xl font-bold text-indigo-500">{initials}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Text Info below Logo */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-4xl font-extrabold tracking-tight text-foreground">
                                                {client.name}
                                            </h2>
                                            <Badge variant={client.active ? "default" : "secondary"} className="h-6">
                                                {client.active ? (t.clients?.active || "Active") : (t.clients?.inactive || "Inactive")}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-lg">
                                            <p className="text-muted-foreground font-semibold">@{client.slug}</p>
                                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                                <span>{new Date(client.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Primary Action Row */}
                                <div className="flex items-center gap-3 md:mb-2">
                                    <Link href={`/dashboard/clients/${client.slug}/settings`}>
                                        <Button variant="outline" className="rounded-full px-6 gap-2">
                                            <Settings className="h-4 w-4" />
                                            {t.common.settings}
                                        </Button>
                                    </Link>
                                    <Button className="rounded-full px-8 bg-foreground text-background hover:bg-foreground/90 font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                                        Client Details
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="bg-dashboard-surface/50 border-none shadow-none hover:bg-dashboard-surface transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {t.common.campaigns}
                                </CardTitle>
                                <Mail className="h-4 w-4 text-muted-foreground opacity-50" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{client._count.campaigns}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-dashboard-surface/50 border-none shadow-none hover:bg-dashboard-surface transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {t.common.audiences}
                                </CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground opacity-50" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{client._count.audiences}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-dashboard-surface/50 border-none shadow-none hover:bg-dashboard-surface transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {t.common.templates}
                                </CardTitle>
                                <FileText className="h-4 w-4 text-muted-foreground opacity-50" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{client._count.templates}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-dashboard-surface/50 border-none shadow-none hover:bg-dashboard-surface transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {t.common.domains}
                                </CardTitle>
                                <Globe className="h-4 w-4 text-muted-foreground opacity-50" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{client._count.domains}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tabs for related data */}
                    <Tabs defaultValue="campaigns" className="space-y-4">
                        <TabsList className="bg-muted/50 p-1">
                            <TabsTrigger value="campaigns">{t.common.campaigns}</TabsTrigger>
                            <TabsTrigger value="audiences">{t.common.audiences}</TabsTrigger>
                            <TabsTrigger value="templates">{t.common.templates}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="campaigns" className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">{t.clients?.recentCampaigns || "Recent Campaigns"}</h3>
                                <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                                    <Plus className="h-4 w-4" />
                                    {t.clients?.createCampaign || "Create Campaign"}
                                </Button>
                            </div>
                            {client.campaigns.length === 0 ? (
                                <Card className="border-dashed">
                                    <CardContent className="flex flex-col items-center justify-center py-12">
                                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                                            <Mail className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <p className="text-muted-foreground font-medium">
                                            {t.clients?.noCampaigns || "No campaigns yet"}
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-4">
                                    {client.campaigns.map((campaign) => (
                                        <Card key={campaign.id} className="hover:bg-dashboard-surface transition-colors border-none shadow-none bg-dashboard-surface/50">
                                            <CardHeader className="py-4">
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="text-base font-semibold">{campaign.name}</CardTitle>
                                                    <Badge
                                                        variant={
                                                            campaign.status === "SENT" ? "default" :
                                                                campaign.status === "DRAFT" ? "secondary" : "outline"
                                                        }
                                                    >
                                                        {campaign.status}
                                                    </Badge>
                                                </div>
                                                <CardDescription>{campaign.subject}</CardDescription>
                                            </CardHeader>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="audiences" className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">{t.clients?.recentAudiences || "Recent Audiences"}</h3>
                                <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                                    <Plus className="h-4 w-4" />
                                    {t.clients?.createAudience || "Create Audience"}
                                </Button>
                            </div>
                            {client.audiences.length === 0 ? (
                                <Card className="border-dashed">
                                    <CardContent className="flex flex-col items-center justify-center py-12">
                                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                                            <Users className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <p className="text-muted-foreground font-medium">
                                            {t.clients?.noAudiences || "No audiences yet"}
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-4">
                                    {client.audiences.map((audience) => (
                                        <Card key={audience.id} className="hover:bg-dashboard-surface transition-colors border-none shadow-none bg-dashboard-surface/50">
                                            <CardHeader className="py-4">
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="text-base font-semibold">{audience.name}</CardTitle>
                                                    <Badge variant="secondary" className="font-medium">
                                                        {audience.contactCount} contacts
                                                    </Badge>
                                                </div>
                                                {audience.description && (
                                                    <CardDescription>{audience.description}</CardDescription>
                                                )}
                                            </CardHeader>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="templates" className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">{t.clients?.recentTemplates || "Recent Templates"}</h3>
                                <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                                    <Plus className="h-4 w-4" />
                                    {t.clients?.createTemplate || "Create Template"}
                                </Button>
                            </div>
                            {client.templates.length === 0 ? (
                                <Card className="border-dashed">
                                    <CardContent className="flex flex-col items-center justify-center py-12">
                                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                                            <FileText className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <p className="text-muted-foreground font-medium">
                                            {t.clients?.noTemplates || "No templates yet"}
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-4">
                                    {client.templates.map((template) => (
                                        <Card key={template.id} className="hover:bg-dashboard-surface transition-colors border-none shadow-none bg-dashboard-surface/50">
                                            <CardHeader className="py-4">
                                                <CardTitle className="text-base font-semibold">{template.name}</CardTitle>
                                                {template.description && (
                                                    <CardDescription>{template.description}</CardDescription>
                                                )}
                                            </CardHeader>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </PageContent>
        </>
    );
}
