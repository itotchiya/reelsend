"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Trash2,
    RefreshCw,
    Eye,
    EyeOff,
    Terminal,
    Pencil
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import {
    StatusBadge,
    CountBadge,
    CampaignBadge
} from "@/components/ui-kit/card-badge";
import { getContrastColor } from "@/lib/colors";

export interface SmtpProfile {
    id: string;
    name: string;
    host: string;
    port: number;
    user: string;
    password: string;
    secure: boolean;
    defaultFromEmail: string | null;
    isActive: boolean;
    createdAt: string;
    campaigns: {
        id: string;
        name: string;
    }[];
    client?: {
        id: string;
        name: string;
        slug?: string;
        brandColors?: {
            primary?: string;
        } | null;
    } | null;
}

interface SmtpProfileCardProps {
    profile: SmtpProfile;
    isActivating?: boolean;
    isDeleting?: boolean;
    onActivate: (id: string) => void;
    onDelete: (profile: SmtpProfile) => void;
    onEdit?: (profile: SmtpProfile) => void;
    className?: string;
}

export function SmtpProfileCard({
    profile,
    isActivating = false,
    isDeleting = false,
    onActivate,
    onDelete,
    onEdit,
    className
}: SmtpProfileCardProps) {
    const { t } = useI18n();
    const [showPassword, setShowPassword] = useState(false);

    // Get branded colors for client badge
    const clientPrimaryColor = profile.client?.brandColors?.primary || "#3b82f6";
    const clientContrastColor = getContrastColor(clientPrimaryColor);

    return (
        <div
            className={cn(
                "group relative flex flex-col rounded-xl border bg-card overflow-hidden transition-all duration-200 border-dashed border-zinc-500/50 hover:border-solid hover:border-zinc-500",
                className
            )}
        >
            {/* Card Header & Content Wrapper */}
            <div className="p-4 pb-3">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <Terminal className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-semibold text-sm truncate">{profile.name}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {profile.host}:{profile.port}
                        </p>
                    </div>

                    <div className="flex items-center gap-1">
                        {onEdit && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(profile);
                                }}
                                aria-label={t.common?.edit || "Edit"}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(profile);
                            }}
                            disabled={isDeleting}
                            aria-label={t.common?.delete || "Delete"}
                        >
                            {isDeleting ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* Badges Row */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {profile.client ? (
                        profile.client.slug ? (
                            <Link
                                href={`/dashboard/clients/${profile.client.slug}`}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <span
                                    className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium transition-opacity hover:opacity-80"
                                    style={{
                                        backgroundColor: clientPrimaryColor,
                                        color: clientContrastColor,
                                    }}
                                >
                                    {profile.client.name}
                                </span>
                            </Link>
                        ) : (
                            <span
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium"
                                style={{
                                    backgroundColor: clientPrimaryColor,
                                    color: clientContrastColor,
                                }}
                            >
                                {profile.client.name}
                            </span>
                        )
                    ) : (
                        <StatusBadge status="inactive">
                            {t.postal?.profiles?.systemWide || "System Wide"}
                        </StatusBadge>
                    )}

                    {profile.campaigns && profile.campaigns.length > 0 && (
                        <CountBadge count={profile.campaigns.length} />
                    )}
                </div>

                {/* Config Details */}
                <div className="space-y-2 text-xs text-muted-foreground mb-4">
                    <div className="flex justify-between items-center">
                        <span>{t.postal?.profiles?.userLabel || "User"}</span>
                        <span className="font-mono truncate ml-2 text-foreground" title={profile.user}>
                            {profile.user}
                        </span>
                    </div>
                    <div className="flex justify-between items-center group/pass">
                        <span>{t.postal?.profiles?.passLabel || "Pass"}</span>
                        <div className="flex items-center gap-1.5 ml-2 min-w-0">
                            <span className="font-mono truncate text-foreground">
                                {showPassword ? profile.password : "••••••••••••"}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 opacity-0 group-hover/pass:opacity-100 transition-opacity p-0 hover:bg-transparent text-muted-foreground hover:text-foreground"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </Button>
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <span>{t.postal?.profiles?.fromLabel || "From"}</span>
                        <span className="truncate ml-2 text-foreground" title={profile.defaultFromEmail || ""}>
                            {profile.defaultFromEmail || "—"}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] mt-3 pt-3 border-t border-dashed border-zinc-500/50">
                        <span>{t.common?.added || "Added"}</span>
                        <span className="text-muted-foreground">
                            {(() => {
                                const date = new Date(profile.createdAt);
                                return `${date.toLocaleDateString('fr-FR')} - ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
                            })()}
                        </span>
                    </div>
                </div>

                {/* Used In Section */}
                {profile.campaigns && profile.campaigns.length > 0 && (
                    <div className="pt-3 border-t border-dashed border-zinc-500/50">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2">
                            {t.postal?.profiles?.usedInCampaigns || "Used In Campaigns"}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {profile.campaigns.slice(0, 3).map(campaign => (
                                <CampaignBadge key={campaign.id} campaignName={campaign.name} size="sm" />
                            ))}
                            {profile.campaigns.length > 3 && (
                                <span className="text-[10px] text-muted-foreground">
                                    +{profile.campaigns.length - 3} {t.common?.more || "more"}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Action Area */}
            <div
                className="mt-auto border-t border-dashed border-zinc-500/50 transition-colors cursor-pointer flex items-center justify-center py-2 text-xs font-medium hover:bg-green-500/5 group-hover:border-green-500/20"
                onClick={() => onActivate(profile.id)}
            >
                {isActivating ? (
                    <span className="text-muted-foreground flex items-center gap-1.5">
                        <RefreshCw className="h-3 w-3 animate-spin" /> {t.common?.loading || "Loading..."}
                    </span>
                ) : (
                    <span className="text-muted-foreground hover:text-green-600 transition-colors">
                        {t.postal?.profiles?.useConfig || "Load into Editor"}
                    </span>
                )}
            </div>
        </div>
    );
}
