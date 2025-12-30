"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Users, FileText } from "lucide-react";

interface PortalClientProps {
    client: {
        name: string;
        slug: string;
        logo: string | null;
        brandColors: any | null;
        isPublic: boolean;
        _count: {
            audiences: number;
            campaigns: number;
            templates: number;
        };
    };
}

export function PortalClient({ client }: PortalClientProps) {
    const initials = client.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const primaryColor = client.brandColors?.primary || "#6366f1";
    const secondaryColor = client.brandColors?.secondary || "#a855f7";

    return (
        <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden text-foreground">
            {/* Ambient Background with Client Accent */}
            <div className="absolute inset-0 z-0">
                <div
                    className="absolute inset-0 opacity-[0.08] dark:opacity-[0.12]"
                    style={{
                        background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                    }}
                />
                <div className="absolute inset-0 bg-background/40 backdrop-blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-2xl">
                <div className="flex flex-col items-center text-center space-y-8">
                    {/* Logo Adaptation Container */}
                    <div className="h-24 w-24 md:h-32 md:w-32 rounded-3xl bg-background p-3 flex items-center justify-center overflow-hidden border border-white/10">
                        {client.logo ? (
                            <img
                                src={client.logo}
                                alt={client.name}
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <div
                                className="h-full w-full rounded-2xl flex items-center justify-center"
                                style={{ background: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}20)` }}
                            >
                                <span className="text-3xl font-bold" style={{ color: primaryColor }}>{initials}</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <h1 className="text-4xl font-extrabold tracking-tight">
                                {client.name}
                            </h1>
                            <p className="text-muted-foreground font-medium text-lg">
                                Client Portal • @{client.slug}
                            </p>
                        </div>

                        {!client.isPublic && (
                            <div className="mt-8 p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 backdrop-blur-sm">
                                <p className="text-amber-500 font-medium">
                                    This portal is currently private.
                                </p>
                                <p className="text-muted-foreground text-sm mt-1">
                                    Please ask the Reelsend team to make your portal public.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Minimalist Stats Grid - Only show if public */}
                    {client.isPublic && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
                            <Card className="bg-background/50 backdrop-blur-md border-white/5 shadow-xl hover:scale-[1.02] transition-transform">
                                <CardHeader className="flex flex-row items-center justify-center space-y-0 pb-2">
                                    <Mail className="h-4 w-4 mr-2" style={{ color: primaryColor }} />
                                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                        Campaigns
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-center">
                                    <div className="text-2xl font-bold">{client._count.campaigns}</div>
                                </CardContent>
                            </Card>

                            <Card className="bg-background/50 backdrop-blur-md border-white/5 shadow-xl hover:scale-[1.02] transition-transform">
                                <CardHeader className="flex flex-row items-center justify-center space-y-0 pb-2">
                                    <Users className="h-4 w-4 mr-2" style={{ color: primaryColor }} />
                                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                        Audiences
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-center">
                                    <div className="text-2xl font-bold">{client._count.audiences}</div>
                                </CardContent>
                            </Card>

                            <Card className="bg-background/50 backdrop-blur-md border-white/5 shadow-xl hover:scale-[1.02] transition-transform">
                                <CardHeader className="flex flex-row items-center justify-center space-y-0 pb-2">
                                    <FileText className="h-4 w-4 mr-2" style={{ color: primaryColor }} />
                                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                        Templates
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-center">
                                    <div className="text-2xl font-bold">{client._count.templates}</div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    <div className="pt-8">
                        <div className="h-px w-24 bg-gradient-to-r from-transparent via-border to-transparent" />
                    </div>
                </div>
            </div>
        </div>
    );
}
