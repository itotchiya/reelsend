"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    XCircle,
    Loader2,
    Eye,
    EyeOff,
    Save,
    Terminal,
    Search,
    Globe,
    Plus,
    RefreshCw,
    CheckCircle2,
    Trash2,
    Send,
    AlertCircle,
    Building2,
    ArrowLeft,
    Server
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CardBadge } from "@/components/ui-kit/card-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SmtpProfileCard, SmtpProfile } from "@/components/ui-kit/smtp-profile-card";
import { EditProfileNameDialog, DeleteProfileDialog } from "@/components/dashboard/smtp-profile-dialogs";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { DashboardBreadcrumb } from "@/components/dashboard/layout";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguagePickerDialog } from "@/components/ui-kit/language-picker-dialog";
import { PostalTabs } from "@/components/ui-kit/motion-tabs/postal-tabs";
import { InteractiveDashedCard } from "@/components/ui-kit/interactive-dashed-card";
import { ListPaginationFooter } from "@/components/ui-kit/list-pagination-footer";
import { FilterBar } from "@/components/ui-kit/filter-bar";
import { useTabLoading } from "@/lib/contexts/tab-loading-context";
import { ClientContentSkeleton } from "@/components/skeletons/client-content-skeleton";

interface SmtpConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    secure: boolean;
}

interface TestResult {
    success: boolean;
    message: string;
    error?: string;
}

interface Client {
    id: string;
    name: string;
}

interface PostalClientProps {
    tab: "config" | "saved";
}

export default function PostalClient({ tab }: PostalClientProps) {
    const { t } = useI18n();
    const { isLoading } = useTabLoading();

    // Config state
    const [config, setConfig] = useState<SmtpConfig>({
        host: "",
        port: 587,
        user: "",
        password: "",
        secure: false,
    });
    const [originalConfig, setOriginalConfig] = useState<SmtpConfig | null>(null);
    const [originalFromEmail, setOriginalFromEmail] = useState("");
    const [testEmail, setTestEmail] = useState("");
    const [fromEmail, setFromEmail] = useState("");
    const [fromName, setFromName] = useState("Reelsend Test");
    const [profileName, setProfileName] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingProfiles, setLoadingProfiles] = useState(true);
    const [testing, setTesting] = useState(false);
    const [sending, setSending] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<"unknown" | "connected" | "failed" | "expired">("unknown");
    const [lastTestSuccessTime, setLastTestSuccessTime] = useState<number | null>(null);
    const [lastTestResult, setLastTestResult] = useState<TestResult | null>(null);
    const [profiles, setProfiles] = useState<SmtpProfile[]>([]);
    const [activatingProfile, setActivatingProfile] = useState<string | null>(null);
    const [deletingProfile, setDeletingProfile] = useState<string | null>(null);

    // Client selection for profiles
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>("default");
    const [loadingClients, setLoadingClients] = useState(false);

    // Profile action states
    const [profileToDelete, setProfileToDelete] = useState<SmtpProfile | null>(null);
    const [profileToEdit, setProfileToEdit] = useState<SmtpProfile | null>(null);

    const [hasStoredPassword, setHasStoredPassword] = useState(false);

    // Search and Pagination for saved profiles
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Load current config and profiles on mount
    useEffect(() => {
        loadConfig();
        loadProfiles();
        loadClients();
    }, []);

    const loadClients = async () => {
        setLoadingClients(true);
        try {
            const res = await fetch("/api/clients");
            if (res.ok) {
                const data = await res.json();
                const essentialClients = (data || []).map((c: any) => ({
                    id: c.id,
                    name: c.name
                }));
                setClients(essentialClients);
            }
        } catch (error) {
            console.error("Failed to load clients:", error);
        } finally {
            setLoadingClients(false);
        }
    };

    // Session Expiry Check
    useEffect(() => {
        if (connectionStatus !== 'connected' || !lastTestSuccessTime) return;

        const interval = setInterval(() => {
            const now = Date.now();
            if (now - lastTestSuccessTime > 120000) {
                setConnectionStatus('expired');
                setLastTestResult(prev => prev ? { ...prev, success: false, message: "Session Expired - Please re-test connection" } : null);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [connectionStatus, lastTestSuccessTime]);

    const loadConfig = async () => {
        try {
            const res = await fetch("/api/postal/config");
            if (res.ok) {
                const data = await res.json();
                setConfig(data.config);
                setOriginalConfig(data.config);
                setFromEmail(data.defaultFromEmail || "");
                setOriginalFromEmail(data.defaultFromEmail || "");
                setHasStoredPassword(data.hasStoredPassword || false);
                setConnectionStatus('unknown');
                setLastTestSuccessTime(null);
                setLastTestResult(null);
            }
        } catch (error) {
            console.error("Failed to load config:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadProfiles = async () => {
        setLoadingProfiles(true);
        try {
            const res = await fetch("/api/postal/profiles");
            if (res.ok) {
                const data = await res.json();
                setProfiles(data.profiles || []);
            }
        } catch (error) {
            console.error("Failed to load profiles:", error);
        } finally {
            setLoadingProfiles(false);
        }
    };

    const startEditing = () => {
        setOriginalConfig({ ...config });
        setOriginalFromEmail(fromEmail);
        setIsEditing(true);
    };

    const cancelEditing = () => {
        if (originalConfig) {
            setConfig(originalConfig);
        }
        setFromEmail(originalFromEmail);
        setIsEditing(false);
        setConnectionStatus("unknown");
        setLastTestSuccessTime(null);
        setLastTestResult(null);
    };

    const updateConfig = (newConfig: SmtpConfig) => {
        setConfig(newConfig);
        if (connectionStatus === 'connected' || connectionStatus === 'expired') {
            setConnectionStatus('unknown');
            setLastTestSuccessTime(null);
            setLastTestResult(null);
        }
    };

    const testConnection = async () => {
        setTesting(true);
        setLastTestResult(null);
        try {
            const res = await fetch("/api/postal/test-connection", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config),
            });
            const data = await res.json();

            if (data.success) {
                setConnectionStatus("connected");
                setLastTestSuccessTime(Date.now());
                setLastTestResult({ success: true, message: t.postal.currentConfig.connectionOk });
                toast.success(t.postal.currentConfig.connectionOk);
            } else {
                setConnectionStatus("failed");
                setLastTestSuccessTime(null);
                setLastTestResult({ success: false, message: t.postal.currentConfig.connectionFailed, error: data.error });
                toast.error(`${t.postal.currentConfig.connectionFailed}: ${data.error}`);
            }
        } catch (error: any) {
            setConnectionStatus("failed");
            setLastTestSuccessTime(null);
            setLastTestResult({ success: false, message: t.postal.currentConfig.connectionFailed, error: error.message });
            toast.error(`${t.postal.currentConfig.connectionFailed}: ${error.message}`);
        } finally {
            setTesting(false);
        }
    };

    const sendTestEmail = async () => {
        if (!testEmail) {
            toast.error(t.postal.toasts.errors.enterTestEmail);
            return;
        }
        if (!fromEmail) {
            toast.error(t.postal.toasts.errors.enterFromEmail);
            return;
        }

        setSending(true);
        try {
            const res = await fetch("/api/postal/send-test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    config: config,
                    to: testEmail,
                    from: fromEmail,
                    fromName: fromName,
                }),
            });
            const data = await res.json();

            if (data.success) {
                toast.success(`Test email sent to ${testEmail}!`);
                setLastTestResult({
                    success: true,
                    message: `Email sent successfully! Message ID: ${data.messageId}`
                });
            } else {
                toast.error(`Failed to send: ${data.error}`);
                setLastTestResult({
                    success: false,
                    message: "Failed to send email",
                    error: data.error
                });
            }
        } catch (error: any) {
            toast.error(`Failed to send: ${error.message}`);
            setLastTestResult({
                success: false,
                message: "Failed to send email",
                error: error.message
            });
        } finally {
            setSending(false);
        }
    };

    const saveConfig = async () => {
        const newPassword = config.password.trim();

        if (!newPassword && !hasStoredPassword) {
            toast.error(t.postal.toasts.errors.passwordRequired);
            return;
        }

        setSaving(true);
        try {
            const savePayload = {
                config: { ...config, password: newPassword || "" },
                defaultFromEmail: fromEmail
            };

            const response = await fetch("/api/postal/config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(savePayload),
            });
            const data = await response.json();
            if (data.success) {
                toast.success(t.postal.toasts.configSaved);
                if (newPassword) {
                    setHasStoredPassword(true);
                }
                setConfig({ ...config, password: "" });
                setIsEditing(false);
                loadConfig();
            } else {
                toast.error(t.postal.toasts.errors.failedToSave.replace("{{error}}", data.error || data.message));
            }
        } catch (error: any) {
            toast.error(t.postal.toasts.errors.failedToSave.replace("{{error}}", error.message));
        } finally {
            setSaving(false);
        }
    };

    const saveAsProfile = async () => {
        if (!profileName.trim()) {
            toast.error(t.postal.toasts.errors.profileNameRequired);
            return;
        }
        if (!config.host || !config.user) {
            toast.error(t.postal.toasts.errors.fillHostUser);
            return;
        }

        const profilePassword = config.password.trim();
        if (!profilePassword) {
            toast.error(t.postal.toasts.errors.saveProfilePassword);
            return;
        }

        setSavingProfile(true);
        try {
            const response = await fetch("/api/postal/profiles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: profileName,
                    host: config.host,
                    port: config.port,
                    user: config.user,
                    password: profilePassword,
                    secure: config.secure,
                    defaultFromEmail: fromEmail,
                    clientId: selectedClientId !== "default" ? selectedClientId : null,
                }),
            });
            const data = await response.json();
            if (data.success) {
                toast.success(t.postal.toasts.profileSaved.replace("{{name}}", profileName));
                setProfileName("");
                loadProfiles();
            } else {
                toast.error(t.postal.toasts.errors.failedToSave.replace("{{error}}", data.error || data.message));
            }
        } catch (error: any) {
            toast.error(t.postal.toasts.errors.failedToSave.replace("{{error}}", error.message));
        } finally {
            setSavingProfile(false);
        }
    };

    const activateProfile = async (profileId: string) => {
        const profile = profiles.find(p => p.id === profileId);
        if (!profile) return;

        setActivatingProfile(profileId);

        setTimeout(() => {
            setConfig({
                host: profile.host,
                port: profile.port,
                user: profile.user,
                password: profile.password,
                secure: profile.secure,
            });
            setFromEmail(profile.defaultFromEmail || "");
            setConnectionStatus("unknown");
            setLastTestSuccessTime(null);
            setLastTestResult(null);
            setIsEditing(true);
            setActivatingProfile(null);
            toast.success(t.postal.toasts.profileActivated || "Profile loaded into editor");
        }, 300);
    };

    const initiateDeleteProfile = (profile: SmtpProfile) => {
        setProfileToDelete(profile);
    };

    // Filter and Paginate profiles
    const filteredProfiles = profiles.filter(profile =>
        profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.host.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.user.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredProfiles.length / pageSize);
    const paginatedProfiles = filteredProfiles.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    // Reset page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const matchedProfiles = profiles.filter(p =>
        p.host === config.host &&
        p.port === config.port &&
        p.user === config.user &&
        p.secure === config.secure
    );

    const isConnectionVerified = connectionStatus === 'connected';

    if (loading) {
        return (
            <div className="h-dvh flex flex-col bg-background">
                <header className="relative shrink-0 flex items-center justify-between px-6 h-16 border-b bg-background">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild className="-ml-2">
                            <Link href="/dashboard/postal">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <DashboardBreadcrumb />
                    </div>
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
                        <PostalTabs profileCount={profiles.length} />
                    </div>
                    <div className="flex items-center gap-2">
                        <LanguagePickerDialog />
                        <ThemeToggle />
                    </div>
                </header>
                <ClientContentSkeleton />
            </div>
        );
    }

    return (
        <div className="h-dvh flex flex-col bg-background">
            {/* Header */}
            <header className="relative shrink-0 flex items-center justify-between px-6 h-16 border-b bg-background">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="-ml-2">
                        <Link href="/dashboard/postal">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <DashboardBreadcrumb />
                </div>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
                    <PostalTabs profileCount={profiles.length} />
                </div>
                <div className="flex items-center gap-2">
                    {tab === "config" && (
                        <Badge variant={lastTestResult?.success ? "default" : "secondary"} className={lastTestResult?.success ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : ""}>
                            {connectionStatus === 'expired'
                                ? "Session Expired"
                                : (lastTestResult === null
                                    ? t.postal.currentConfig.notTested
                                    : (lastTestResult.success
                                        ? t.postal.currentConfig.connectionOk
                                        : t.postal.currentConfig.connectionFailed))}
                        </Badge>
                    )}
                    <LanguagePickerDialog />
                    <ThemeToggle />
                </div>
            </header>

            {/* Edit Profile Name Dialog */}
            <EditProfileNameDialog
                open={!!profileToEdit}
                onOpenChange={(open) => !open && setProfileToEdit(null)}
                profileId={profileToEdit?.id || null}
                currentName={profileToEdit?.name || ""}
                onSuccess={loadProfiles}
            />

            {/* Delete Profile Dialog */}
            <DeleteProfileDialog
                open={!!profileToDelete}
                onOpenChange={(open) => !open && setProfileToDelete(null)}
                profileId={profileToDelete?.id || null}
                profileName={profileToDelete?.name || ""}
                onSuccess={loadProfiles}
            />

            {isLoading ? (
                <ClientContentSkeleton />
            ) : (
                <>
                    {tab === "config" ? (
                        // CONFIG TAB CONTENT
                        <main className="flex-1 overflow-y-auto">
                            <div className="p-6 md:p-12 space-y-6">
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight">{t.postal?.currentConfig?.title || "Configure SMTP"}</h1>
                                    <p className="text-muted-foreground">{t.postal?.currentConfig?.description || "Test and configure your SMTP settings"}</p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                    {/* Left Column: Configuration & Save as Profile */}
                                    <div className="lg:col-span-7 space-y-6">
                                        <Card className="border-dashed border-zinc-500/50">
                                            <CardHeader className="flex flex-row items-center justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <CardTitle className="text-lg">{t.postal.currentConfig.title}</CardTitle>
                                                        {matchedProfiles.length > 0 && matchedProfiles.map((profile) => (
                                                            <CardBadge
                                                                key={profile.id}
                                                                variant="border"
                                                                color="blue"
                                                                size="sm"
                                                            >
                                                                {profile.name}
                                                            </CardBadge>
                                                        ))}
                                                    </div>
                                                    <CardDescription>{t.postal.currentConfig.description}</CardDescription>
                                                </div>
                                                {!isEditing && (
                                                    <Button variant="outline" size="sm" onClick={startEditing}>
                                                        <Save className="mr-2 h-3 w-3" /> {t.postal.currentConfig.editProfile}
                                                    </Button>
                                                )}
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="host">{t.postal.currentConfig.host}</Label>
                                                        <Input
                                                            id="host"
                                                            value={config.host}
                                                            onChange={(e) => updateConfig({ ...config, host: e.target.value })}
                                                            placeholder="smtp.postal.com"
                                                            disabled={!isEditing}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="port">{t.postal.currentConfig.port}</Label>
                                                        <Input
                                                            id="port"
                                                            type="number"
                                                            value={config.port}
                                                            onChange={(e) => updateConfig({ ...config, port: parseInt(e.target.value) })}
                                                            placeholder="587"
                                                            disabled={!isEditing}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="user">{t.postal.currentConfig.user}</Label>
                                                        <Input
                                                            id="user"
                                                            value={config.user}
                                                            onChange={(e) => updateConfig({ ...config, user: e.target.value })}
                                                            placeholder="user@example.com"
                                                            disabled={!isEditing}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between">
                                                            <Label htmlFor="password">{t.postal.currentConfig.password}</Label>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-5 px-1.5 text-xs text-muted-foreground hover:text-foreground"
                                                                onClick={() => setShowPassword(!showPassword)}
                                                            >
                                                                {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                            </Button>
                                                        </div>
                                                        <Input
                                                            id="password"
                                                            type={showPassword ? "text" : "password"}
                                                            value={config.password}
                                                            onChange={(e) => updateConfig({ ...config, password: e.target.value })}
                                                            placeholder="••••••••••••"
                                                            disabled={!isEditing}
                                                        />
                                                        {!isEditing && hasStoredPassword && (
                                                            <p className="text-[10px] text-muted-foreground">
                                                                {t.postal.currentConfig.passwordStored}
                                                            </p>
                                                        )}
                                                        {!isEditing && !hasStoredPassword && (
                                                            <p className="text-[10px] text-red-500">
                                                                {t.postal.currentConfig.passwordNotStored}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                                                    <div className="space-y-0.5">
                                                        <Label htmlFor="secure" className="text-sm font-medium">TLS/SSL</Label>
                                                        <p className="text-xs text-muted-foreground">{t.postal.currentConfig.tlsDesc}</p>
                                                    </div>
                                                    <Switch
                                                        id="secure"
                                                        checked={config.secure}
                                                        onCheckedChange={(checked) => updateConfig({ ...config, secure: checked })}
                                                        disabled={!isEditing}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="fromEmail">{t.postal.currentConfig.fromEmail}</Label>
                                                    <Input
                                                        id="fromEmail"
                                                        value={fromEmail}
                                                        onChange={(e) => setFromEmail(e.target.value)}
                                                        placeholder="noreply@yourdomain.com"
                                                        disabled={!isEditing}
                                                    />
                                                    <p className="text-[10px] text-muted-foreground">
                                                        {t.postal.currentConfig.fromEmailDesc}
                                                    </p>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="flex justify-between border-t border-border/50 pt-6">
                                                <div className="flex gap-2">
                                                    {isEditing ? (
                                                        <>
                                                            <Button variant="outline" size="sm" onClick={cancelEditing}>
                                                                {t.postal.currentConfig.cancel}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                onClick={saveConfig}
                                                                disabled={saving}
                                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                            >
                                                                {saving ? <RefreshCw className="mr-2 h-3 w-3 animate-spin" /> : <Save className="mr-2 h-3 w-3" />}
                                                                {t.postal.currentConfig.saveChanges}
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={testConnection}
                                                            disabled={testing}
                                                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100"
                                                        >
                                                            {testing ? <RefreshCw className="mr-2 h-3 w-3 animate-spin" /> : t.postal.currentConfig.testConnection}
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardFooter>
                                        </Card>

                                        <Card className="border-dashed border-zinc-500/50">
                                            <CardHeader className="py-4">
                                                <CardTitle className="text-md">{t.postal.saveProfile.title}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="py-0 pb-4 space-y-4">
                                                <div className="space-y-3">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs text-muted-foreground">{t.postal.saveProfile.clientLabel || "Link to Client"}</Label>
                                                        <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                                                            <SelectTrigger className="h-9">
                                                                <SelectValue placeholder={t.postal.saveProfile.selectClient || "Select a client..."} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="default">{t.postal.saveProfile.noClient || "No Client (System Wide)"}</SelectItem>
                                                                {clients.map(client => (
                                                                    <SelectItem key={client.id} value={client.id}>
                                                                        {client.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs text-muted-foreground">{t.postal.saveProfile.nameLabel || "Profile Name"}</Label>
                                                        <div className="flex gap-3">
                                                            <Input
                                                                placeholder={t.postal.saveProfile.placeholder}
                                                                value={profileName}
                                                                onChange={(e) => setProfileName(e.target.value)}
                                                                className="h-9"
                                                            />
                                                            <Button
                                                                onClick={saveAsProfile}
                                                                disabled={savingProfile || !profileName || !isConnectionVerified}
                                                                variant="outline"
                                                                className="h-9 whitespace-nowrap"
                                                            >
                                                                {savingProfile ? (
                                                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                                                ) : (
                                                                    <Plus className="mr-2 h-3 w-3" />
                                                                )}
                                                                {t.postal.saveProfile.button}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                                {!isConnectionVerified && (
                                                    <p className="text-[10px] text-red-500">
                                                        * You must verify the connection before saving a profile.
                                                    </p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Right Column: Send Test Email */}
                                    <div className="lg:col-span-5">
                                        <Card className="h-full border-dashed border-zinc-500/50">
                                            <CardHeader>
                                                <CardTitle className="text-lg">{t.postal.testEmail.title}</CardTitle>
                                                <CardDescription>
                                                    {t.postal.testEmail.description}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="testEmail">{t.postal.testEmail.recipient}</Label>
                                                    <Input
                                                        id="testEmail"
                                                        type="email"
                                                        placeholder={t.postal.testEmail.placeholderEmail}
                                                        value={testEmail}
                                                        onChange={(e) => setTestEmail(e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="fromName">{t.postal.testEmail.fromName}</Label>
                                                    <Input
                                                        id="fromName"
                                                        placeholder={t.postal.testEmail.placeholderName}
                                                        value={fromName}
                                                        onChange={(e) => setFromName(e.target.value)}
                                                    />
                                                </div>

                                                {lastTestResult && (
                                                    <div className={cn(
                                                        "p-3 rounded-lg flex items-start gap-3 text-xs",
                                                        lastTestResult.success ? "bg-green-500/10 text-green-600 border border-green-500/20" : "bg-red-500/10 text-red-600 border border-red-500/20"
                                                    )}>
                                                        {lastTestResult.success ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
                                                        <div className="min-w-0">
                                                            <p className="font-semibold">{lastTestResult.message}</p>
                                                            {lastTestResult.error && <p className="mt-1 font-mono break-all opacity-80">{lastTestResult.error}</p>}
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                            <CardFooter className="pt-4 border-t border-border/50">
                                                <Button
                                                    className="w-full disabled:bg-muted disabled:text-muted-foreground disabled:opacity-80"
                                                    onClick={sendTestEmail}
                                                    disabled={sending || !testEmail}
                                                >
                                                    {sending ? (
                                                        <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <Send className="mr-2 h-3 w-3" />
                                                    )}
                                                    {t.postal.testEmail.sendButton}
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        </main>
                    ) : (
                        // SAVED TAB CONTENT
                        <main className="flex-1 flex flex-col overflow-y-auto">
                            <div className={cn(
                                "p-6 md:p-12 space-y-6 flex flex-col",
                                profiles.length === 0 ? "flex-1 justify-center" : ""
                            )}>
                                {profiles.length > 0 && (
                                    <>
                                        <div>
                                            <h1 className="text-2xl font-bold tracking-tight">{t.postal?.profiles?.title || "Saved Profiles"}</h1>
                                            <p className="text-muted-foreground">{t.postal?.profiles?.description || "Manage your saved SMTP configurations"}</p>
                                        </div>

                                        <FilterBar
                                            searchValue={searchQuery}
                                            onSearchChange={setSearchQuery}
                                            searchPlaceholder={t.postal?.profiles?.searchPlaceholder || "Search profiles..."}
                                            onClearFilters={() => setSearchQuery("")}
                                        />
                                    </>
                                )}

                                {profiles.length > 0 ? (
                                    loadingProfiles ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {[1, 2, 3].map(i => (
                                                <Card key={i} className="border-dashed border-zinc-500/50">
                                                    <CardHeader className="pb-3">
                                                        <Skeleton className="h-5 w-32" />
                                                        <Skeleton className="h-4 w-40" />
                                                    </CardHeader>
                                                    <CardContent>
                                                        <Skeleton className="h-20 w-full" />
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : paginatedProfiles.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {paginatedProfiles.map(profile => (
                                                <SmtpProfileCard
                                                    key={profile.id}
                                                    profile={profile}
                                                    isActivating={activatingProfile === profile.id}
                                                    isDeleting={deletingProfile === profile.id}
                                                    onActivate={(id) => activateProfile(id)}
                                                    onDelete={(profile) => initiateDeleteProfile(profile)}
                                                    onEdit={(profile) => setProfileToEdit(profile)}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <Globe className="h-12 w-12 text-muted-foreground/40 mb-4" />
                                            <p className="text-muted-foreground">No matching profiles found</p>
                                        </div>
                                    )
                                ) : (
                                    <div className="flex flex-col items-center justify-center">
                                        <InteractiveDashedCard
                                            title={t.postal?.profiles?.noProfiles || "No Saved Profiles"}
                                            description={t.postal?.profiles?.savePrompt || "Save your first SMTP profile from the configuration page to get started."}
                                            actionTitle={t.postal?.openConfig || "Configure SMTP"}
                                            icon={Server}
                                            color="orange"
                                            href="/dashboard/postal/config"
                                        />
                                    </div>
                                )}
                            </div>
                        </main>
                    )}

                    {/* Footer with pagination for saved tab */}
                    {tab === "saved" && profiles.length > 0 && (
                        <ListPaginationFooter
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={filteredProfiles.length}
                            pageSize={pageSize}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={setPageSize}
                        />
                    )}
                </>
            )}
        </div>
    );
}
