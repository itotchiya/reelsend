"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    XCircle,
    Loader2,
    Eye,
    EyeOff,
    Save,
    Terminal,
    Search,
    Globe,
    ChevronLeft,
    ChevronRight,
    Plus,
    RefreshCw,
    CheckCircle2,
    Trash2,
    Send,
    AlertCircle,
    Building2 // Added for client icon
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CardBadge, ClientBadgeSolid, CampaignBadge, StatusBadge, CountBadge } from "@/components/ui-kit/card-badge";
import { CardActions } from "@/components/ui-kit/card-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { SmtpProfileCard, SmtpProfile } from "@/components/ui-kit/smtp-profile-card";
import { EditProfileNameDialog, DeleteProfileDialog } from "@/components/dashboard/smtp-profile-dialogs";
import { cn } from "@/lib/utils"; // Assuming cn utility is available
import { useI18n } from "@/lib/i18n";

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

export default function PostalConfigClient() {
    const { t } = useI18n();
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
    // showProfilePasswords removed as it is handled in SmtpProfileCard

    // Profile action states (used by shared dialog components)
    const [profileToDelete, setProfileToDelete] = useState<SmtpProfile | null>(null);
    const [profileToEdit, setProfileToEdit] = useState<SmtpProfile | null>(null);

    const [hasStoredPassword, setHasStoredPassword] = useState(false);

    // Search and Pagination
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const profilesPerPage = 6;

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
                // Filter essential fields
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
            // 2 minutes = 120000 ms
            if (now - lastTestSuccessTime > 120000) {
                setConnectionStatus('expired');
                setLastTestResult(prev => prev ? { ...prev, success: false, message: "Session Expired - Please re-test connection" } : null);
                // toast.warning("Connection test session expired. Please re-test before saving."); // Optional: Don't spam toasts
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
                // Track if there's a stored password in database
                setHasStoredPassword(data.hasStoredPassword || false);

                // Reset connection status when a new config is loaded
                setConnectionStatus('unknown');
                setLastTestSuccessTime(null);
                setLastTestResult(null);

                console.log("[CONFIG] Loaded - hasStoredPassword:", data.hasStoredPassword);
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
        // Keep the password field for editing so user can see/modify it
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

    // Reset status on config change
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
        // If user entered a new password, use it. Otherwise, if there's a stored password, API will preserve it.
        const newPassword = config.password.trim();

        // If no new password and no stored password, show error
        if (!newPassword && !hasStoredPassword) {
            toast.error(t.postal.toasts.errors.passwordRequired);
            return;
        }

        setSaving(true);
        try {
            // Send empty string if no new password - API will preserve existing
            const savePayload = {
                config: { ...config, password: newPassword || "" },
                defaultFromEmail: fromEmail
            };

            console.log("[SAVE] Saving - new password entered:", !!newPassword, "hasStoredPassword:", hasStoredPassword);

            const response = await fetch("/api/postal/config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(savePayload),
            });
            const data = await response.json();
            if (data.success) {
                toast.success(t.postal.toasts.configSaved);
                // Password is now stored in database
                if (newPassword) {
                    setHasStoredPassword(true);
                }
                setConfig({ ...config, password: "" }); // Clear password field after saving
                setIsEditing(false);
                // Reload to get fresh state
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

        // For saving as profile, we MUST have a password
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

        // Simulate loading for better UX
        setTimeout(() => {
            setConfig({
                host: profile.host,
                port: profile.port,
                user: profile.user,
                password: profile.password,
                secure: profile.secure,
            });
            setFromEmail(profile.defaultFromEmail || "");

            // Reset connection status for the newly loaded config
            setConnectionStatus("unknown");
            setLastTestSuccessTime(null);
            setLastTestResult(null);
            setIsEditing(true); // Open for editing

            setActivatingProfile(null);
            toast.success(t.postal.toasts.profileActivated || "Profile loaded into editor");
        }, 300);
    };

    const initiateDeleteProfile = (profile: SmtpProfile) => {
        setProfileToDelete(profile);
    };


    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <>
                <PageHeader title={<Skeleton className="h-8 w-64" />} />
                <PageContent>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {/* Current Config Skeleton */}
                        <Card className="md:col-span-1 lg:col-span-2 border-dashed border-zinc-500/50">
                            <CardHeader>
                                <Skeleton className="h-6 w-48 mb-2" />
                                <Skeleton className="h-4 w-full max-w-md" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="space-y-2">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-10 w-full" />
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-2 pt-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between border-t border-dashed border-zinc-500/50 pt-6">
                                <div className="flex gap-2">
                                    <Skeleton className="h-10 w-28" />
                                    <Skeleton className="h-10 w-32" />
                                </div>
                            </CardFooter>
                        </Card>

                        {/* Send Test Skeleton */}
                        <Card className="border-dashed border-zinc-500/50">
                            <CardHeader>
                                <Skeleton className="h-6 w-40 mb-2" />
                                <Skeleton className="h-4 w-full" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-28" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                                <Skeleton className="h-10 w-full mt-4" />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="mt-8">
                        <Skeleton className="h-6 w-40 mb-4" />
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {[1, 2, 3].map(i => (
                                <Card key={i} className="border-dashed border-zinc-500/50 overflow-hidden">
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-2">
                                                <Skeleton className="h-5 w-32" />
                                                <Skeleton className="h-4 w-40" />
                                            </div>
                                            <Skeleton className="h-8 w-8 rounded-md" />
                                        </div>
                                        <Skeleton className="h-5 w-20 rounded-full mt-2" />
                                    </CardHeader>
                                    <CardContent className="space-y-3 pb-6">
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <Skeleton className="h-3 w-12" />
                                                <Skeleton className="h-3 w-32" />
                                            </div>
                                            <div className="flex justify-between">
                                                <Skeleton className="h-3 w-12" />
                                                <Skeleton className="h-3 w-28" />
                                            </div>
                                            <div className="flex justify-between">
                                                <Skeleton className="h-3 w-12" />
                                                <Skeleton className="h-3 w-40" />
                                            </div>
                                        </div>
                                    </CardContent>
                                    <div className="border-t border-dashed border-zinc-500/50 py-3 flex justify-center">
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </PageContent>
            </>
        );
    }

    // Filter and Paginate profiles
    const filteredProfiles = profiles.filter(profile =>
        profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.host.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.user.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredProfiles.length / profilesPerPage);
    const paginatedProfiles = filteredProfiles.slice(
        (currentPage - 1) * profilesPerPage,
        currentPage * profilesPerPage
    );

    // Identify all profiles that match current config
    const matchedProfiles = profiles.filter(p =>
        p.host === config.host &&
        p.port === config.port &&
        p.user === config.user &&
        p.secure === config.secure
    );

    const isConnectionVerified = connectionStatus === 'connected';

    return (
        <div className="flex-1 space-y-6">
            <PageHeader
                title={t.postal.title}
                description={t.postal.description}
            >
                <div className="flex items-center gap-2">
                    {connectionStatus === 'expired' ? (
                        <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 gap-1.5 flex items-center">
                            <AlertCircle className="h-4 w-4" />
                            Session Expired - Test Again
                        </Badge>
                    ) : (
                        <Badge variant={lastTestResult?.success ? "default" : "secondary"} className={lastTestResult?.success ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : ""}>
                            {lastTestResult === null
                                ? t.postal.currentConfig.notTested
                                : (lastTestResult.success
                                    ? t.postal.currentConfig.connectionOk
                                    : t.postal.currentConfig.connectionFailed)}
                        </Badge>
                    )}
                </div>
            </PageHeader>

            {/* Edit Profile Name Dialog (shared component) */}
            <EditProfileNameDialog
                open={!!profileToEdit}
                onOpenChange={(open) => !open && setProfileToEdit(null)}
                profileId={profileToEdit?.id || null}
                currentName={profileToEdit?.name || ""}
                onSuccess={loadProfiles}
            />

            {/* Delete Profile Dialog (shared component) */}
            <DeleteProfileDialog
                open={!!profileToDelete}
                onOpenChange={(open) => !open && setProfileToDelete(null)}
                profileId={profileToDelete?.id || null}
                profileName={profileToDelete?.name || ""}
                onSuccess={loadProfiles}
            />

            <PageContent>
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

                {/* Profiles Section */}
                <div className="mt-12 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 pt-8">
                        <div>
                            <h2 className="text-xl font-bold">{t.postal.profiles.title}</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={t.postal.profiles.searchPlaceholder}
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {filteredProfiles.length === 0 ? (
                        <Card className="border-dashed border-zinc-500/50 py-12">
                            <CardContent className="flex flex-col items-center justify-center text-center space-y-3">
                                <div className="h-12 w-12 rounded-full bg-zinc-800/50 flex items-center justify-center">
                                    <Globe className="h-6 w-6 text-zinc-500" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-medium text-zinc-300">
                                        {searchQuery ? "No matching profiles found" : t.postal.profiles.noProfiles}
                                    </h3>
                                    <p className="text-sm text-zinc-500 max-w-[250px]">
                                        {searchQuery ? "Try a different search term" : t.postal.profiles.savePrompt}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        paginatedProfiles.length > 0 ? (
                            <div className="space-y-6">
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

                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-8">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4 mr-1" /> {t.pagination.previous}
                                        </Button>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: totalPages }).map((_, i) => (
                                                <Button
                                                    key={i}
                                                    variant={currentPage === i + 1 ? "default" : "outline"}
                                                    size="sm"
                                                    className="w-9 h-9"
                                                    onClick={() => setCurrentPage(i + 1)}
                                                >
                                                    {i + 1}
                                                </Button>
                                            ))}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                        >
                                            {t.pagination.next} <ChevronRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Card className="border-dashed border-zinc-500/50 py-12">
                                <CardContent className="flex flex-col items-center justify-center text-center space-y-3">
                                    <div className="h-12 w-12 rounded-full bg-zinc-800/50 flex items-center justify-center">
                                        <Globe className="h-6 w-6 text-zinc-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-medium text-zinc-300">
                                            {searchQuery ? "No matching profiles found" : t.postal.profiles.noProfiles}
                                        </h3>
                                        <p className="text-sm text-zinc-500 max-w-[250px]">
                                            {searchQuery ? "Try a different search term" : t.postal.profiles.savePrompt}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    )}
                </div>
            </PageContent>
        </div>
    );
}
