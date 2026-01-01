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
    Calendar,
    AlertCircle,
    ChevronRight,
    CheckCircle,
    XCircle,
    History,
} from "lucide-react";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { cn } from "@/lib/utils";
import { useBreadcrumbs } from "@/lib/contexts/breadcrumb-context";
import { useEffect } from "react";
import { ButtonGroup } from "@/components/ui/button-group";
import { Spinner } from "@/components/ui/spinner";
import { CreateAudienceDialog } from "@/components/dashboard/create-audience-dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

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
    status?: string;
    active: boolean;
    isPublic: boolean;
    smtpVerified: boolean;
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
    smtpTestLogs?: SmtpTestLog[];
}

interface ClientDetailClientProps {
    client: Client;
    canEdit: boolean;
}

export function ClientDetailClient({ client, canEdit }: ClientDetailClientProps) {
    const { t } = useI18n();

    const searchParams = useSearchParams();
    const router = useRouter();
    const activeTab = searchParams?.get("tab") || "campaigns";

    const [isPublic, setIsPublic] = useState(client.isPublic);
    const [updating, setUpdating] = useState(false);
    const [isCreateAudienceOpen, setIsCreateAudienceOpen] = useState(false);
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
            <PageHeader
                title={client.name}
                showBack
                onBack={() => router.push("/dashboard/clients")}
            >
                <ButtonGroup>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-foreground/80 hover:text-foreground"
                        onClick={copyPortalUrl}
                        disabled={!isPublic}
                    >
                        <LinkIcon className="h-4 w-4" />
                        {t.clients?.copyPortalLink || "Copy Portal Link"}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn("gap-2", isPublic ? "text-green-500 hover:text-green-600 font-medium" : "text-red-500 hover:text-red-600 font-medium")}
                        onClick={togglePrivacy}
                        disabled={updating}
                    >
                        {updating ? <Spinner /> : isPublic ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        {isPublic ? (t.clients?.public || "Public") : (t.clients?.private || "Private")}
                    </Button>
                </ButtonGroup>
            </PageHeader>
            <PageContent>
                <div className="space-y-8">
                    {/* Header with Avatar Only */}
                    <div className="relative">
                        {/* Gradient Cover */}
                        <div
                            className="h-32 rounded-2xl overflow-hidden"
                            style={{
                                background: `linear-gradient(135deg, ${client.brandColors?.primary || '#6366f1'} 0%, ${client.brandColors?.secondary || '#a855f7'} 100%)`
                            }}
                        />

                        {/* Avatar positioned at bottom of cover */}
                        <div className="px-6 -mt-10 relative">
                            <div className="h-20 w-20 rounded-xl bg-background border-2 border-background flex items-center justify-center overflow-hidden shadow-none">
                                {client.logo ? (
                                    <img
                                        src={client.logo}
                                        alt={client.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="h-full w-full bg-muted flex items-center justify-center">
                                        <span className="text-xl font-bold text-muted-foreground">{initials}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Client Details Section */}
                    <div className="rounded-xl border border-dashed p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <p className="text-lg font-semibold">{client.name}</p>
                                <div className={cn(
                                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors",
                                    (client.status?.toLowerCase() === "active" || (!client.status && client.active))
                                        ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                        : client.status?.toLowerCase() === "suspended"
                                            ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                                            : "bg-red-500/10 text-red-600 border-red-500/20"
                                )}>
                                    <span className={cn("h-1.5 w-1.5 rounded-full",
                                        (client.status?.toLowerCase() === "active" || (!client.status && client.active)) ? "bg-blue-500" :
                                            client.status?.toLowerCase() === "suspended" ? "bg-yellow-500" : "bg-red-500"
                                    )} />
                                    <span className="capitalize">{client.status || (client.active ? (t.clients?.active || "active") : (t.clients?.inactive || "inactive"))}</span>
                                </div>

                                <div className={cn(
                                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors",
                                    client.smtpVerified
                                        ? "bg-green-500/10 text-green-600 border-green-500/20"
                                        : "bg-orange-500/10 text-orange-600 border-orange-500/20"
                                )}>
                                    {client.smtpVerified ? (
                                        <>
                                            <Mail className="h-3 w-3" />
                                            <span>{t.clients.smtpVerified}</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="h-3 w-3" />
                                            <span>{t.clients.smtpFixRequired}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <Link href={`/dashboard/clients/${client.slug}/edit`}>
                                <Button size="sm" className="gap-2">
                                    <Settings className="h-4 w-4" />
                                    {t.clients.editClient}
                                </Button>
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">{t.clients.slug}</p>
                                <p className="font-medium text-muted-foreground">@{client.slug}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">{t.clients.created}</p>
                                <p className="font-medium text-muted-foreground">
                                    {new Date(client.createdAt).toLocaleDateString(undefined, {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">{t.clients.lastUpdated}</p>
                                <p className="font-medium text-muted-foreground">
                                    {new Date(client.updatedAt).toLocaleDateString(undefined, {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards with dashed border */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            { label: t.common.campaigns, count: client._count.campaigns, icon: Mail, color: "indigo" },
                            { label: t.common.audiences, count: client._count.audiences, icon: Users, color: "violet" },
                            { label: t.common.templates, count: client._count.templates, icon: FileText, color: "blue" },
                            { label: t.common.domains, count: client._count.domains, icon: Globe, color: "emerald" }
                        ].map((stat) => (
                            <div
                                key={stat.label}
                                className="relative group rounded-xl border border-dashed border-muted-foreground/30 p-4 transition-all duration-300 hover:border-muted-foreground/50 overflow-hidden"
                            >
                                <div className={cn(
                                    "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
                                    stat.color === "indigo" ? "bg-indigo-500/[0.05]" :
                                        stat.color === "violet" ? "bg-violet-500/[0.05]" :
                                            stat.color === "blue" ? "bg-blue-500/[0.05]" : "bg-emerald-500/[0.05]"
                                )} />
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold text-[10px]">{stat.label}</p>
                                        <stat.icon className="h-4 w-4 text-muted-foreground/50" />
                                    </div>
                                    <p className="text-2xl font-bold">{stat.count}</p>
                                </div>
                            </div>
                        ))}
                    </div>


                    {/* Tabs for related data */}
                    <Tabs
                        defaultValue={activeTab}
                        value={activeTab}
                        onValueChange={(value) => {
                            const params = new URLSearchParams(searchParams?.toString());
                            params.set("tab", value);
                            router.replace(`?${params.toString()}`, { scroll: false });
                        }}
                    >
                        <TabsList className="bg-muted/30 p-1">
                            <TabsTrigger value="campaigns" className="gap-2">
                                {t.common.campaigns}
                                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold bg-muted-foreground/10 text-muted-foreground border-none">
                                    {client._count.campaigns}
                                </Badge>
                            </TabsTrigger>
                            <TabsTrigger value="audiences" className="gap-2">
                                {t.common.audiences}
                                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold bg-muted-foreground/10 text-muted-foreground border-none">
                                    {client._count.audiences}
                                </Badge>
                            </TabsTrigger>
                            <TabsTrigger value="templates" className="gap-2">
                                {t.common.templates}
                                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold bg-muted-foreground/10 text-muted-foreground border-none">
                                    {client._count.templates}
                                </Badge>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="campaigns" className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">{t.clients.recentCampaigns}</h3>
                                <Button size="sm" className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    {t.clients.createCampaign}
                                </Button>
                            </div>
                            {client.campaigns.length === 0 ? (
                                <Card className="border-dashed">
                                    <CardContent className="flex flex-col items-center justify-center py-12">
                                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                                            <Mail className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <p className="text-muted-foreground font-medium">
                                            {t.clients.noCampaigns}
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="rounded-xl border border-dashed overflow-hidden bg-card/30">
                                    <Table>
                                        <TableHeader className="bg-muted/30">
                                            <TableRow className="hover:bg-transparent border-dashed">
                                                <TableHead className="w-[300px] uppercase text-[10px] font-bold tracking-wider py-4">{t.tables.name}</TableHead>
                                                <TableHead className="uppercase text-[10px] font-bold tracking-wider py-4">{t.tables.subject}</TableHead>
                                                <TableHead className="uppercase text-[10px] font-bold tracking-wider py-4">{t.tables.status}</TableHead>
                                                <TableHead className="text-right uppercase text-[10px] font-bold tracking-wider py-4"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {client.campaigns.map((campaign) => (
                                                <TableRow
                                                    key={campaign.id}
                                                    className="group cursor-pointer hover:bg-muted/50 transition-colors border-dashed"
                                                    onClick={() => router.push(`/dashboard/clients/${client.slug}/campaigns/${campaign.id}`)}
                                                >
                                                    <TableCell className="font-bold py-4">{campaign.name}</TableCell>
                                                    <TableCell className="text-muted-foreground py-4">{campaign.subject}</TableCell>
                                                    <TableCell className="py-4">
                                                        <Badge
                                                            variant={
                                                                campaign.status === "SENT" ? "default" :
                                                                    campaign.status === "DRAFT" ? "secondary" : "outline"
                                                            }
                                                            className="font-bold text-[10px] uppercase tracking-wider"
                                                        >
                                                            {campaign.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right py-4">
                                                        <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors ml-auto" />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="audiences" className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">{t.audiences.recentAudiences}</h3>
                                <Button
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => setIsCreateAudienceOpen(true)}
                                >
                                    <Plus className="h-4 w-4" />
                                    {t.audiences.createAudience}
                                </Button>
                            </div>
                            {client.audiences.length === 0 ? (
                                <Card className="border-dashed">
                                    <CardContent className="flex flex-col items-center justify-center py-12">
                                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                                            <Users className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <p className="text-muted-foreground font-medium">
                                            {t.clients.noAudiences}
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="rounded-xl border border-dashed overflow-hidden bg-card/30">
                                    <Table>
                                        <TableHeader className="bg-muted/30">
                                            <TableRow className="hover:bg-transparent border-dashed">
                                                <TableHead className="w-[300px] uppercase text-[10px] font-bold tracking-wider py-4">{t.tables.name}</TableHead>
                                                <TableHead className="uppercase text-[10px] font-bold tracking-wider py-4">{t.tables.description}</TableHead>
                                                <TableHead className="uppercase text-[10px] font-bold tracking-wider py-4">{t.tables.contacts}</TableHead>
                                                <TableHead className="text-right uppercase text-[10px] font-bold tracking-wider py-4"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {client.audiences.map((audience) => (
                                                <TableRow
                                                    key={audience.id}
                                                    className="group cursor-pointer hover:bg-muted/50 transition-colors border-dashed"
                                                    onClick={() => router.push(`/dashboard/clients/${client.slug}/audiences/${audience.id}`)}
                                                >
                                                    <TableCell className="font-bold py-4">{audience.name}</TableCell>
                                                    <TableCell className="text-muted-foreground py-4 line-clamp-1 h-auto max-w-[400px]">
                                                        {audience.description || "—"}
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <Badge variant="secondary" className="font-bold text-[10px] uppercase tracking-wider bg-muted/50">
                                                            {audience.contactCount} {t.audiences.contacts}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right py-4">
                                                        <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors ml-auto" />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="templates" className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">{t.clients.recentTemplates}</h3>
                                <Button size="sm" className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    {t.clients.createTemplate}
                                </Button>
                            </div>
                            {client.templates.length === 0 ? (
                                <Card className="border-dashed">
                                    <CardContent className="flex flex-col items-center justify-center py-12">
                                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                                            <FileText className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <p className="text-muted-foreground font-medium">
                                            {t.clients.noTemplates}
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="rounded-xl border border-dashed overflow-hidden bg-card/30">
                                    <Table>
                                        <TableHeader className="bg-muted/30">
                                            <TableRow className="hover:bg-transparent border-dashed">
                                                <TableHead className="w-[300px] uppercase text-[10px] font-bold tracking-wider py-4">{t.tables.name}</TableHead>
                                                <TableHead className="uppercase text-[10px] font-bold tracking-wider py-4">{t.tables.description}</TableHead>
                                                <TableHead className="text-right uppercase text-[10px] font-bold tracking-wider py-4"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {client.templates.map((template) => (
                                                <TableRow
                                                    key={template.id}
                                                    className="group cursor-pointer hover:bg-muted/50 transition-colors border-dashed"
                                                    onClick={() => router.push(`/clients/${client.slug}/${template.id}`)}
                                                >
                                                    <TableCell className="font-bold py-4">{template.name}</TableCell>
                                                    <TableCell className="text-muted-foreground py-4 line-clamp-1 h-auto max-w-[500px]">
                                                        {template.description || "—"}
                                                    </TableCell>
                                                    <TableCell className="text-right py-4">
                                                        <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors ml-auto" />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </PageContent>

            <CreateAudienceDialog
                open={isCreateAudienceOpen}
                onOpenChange={setIsCreateAudienceOpen}
                clientId={client.id}
                onSuccess={() => {
                    // Refresh the page data
                    router.refresh();
                }}
            />
        </>
    );
}
