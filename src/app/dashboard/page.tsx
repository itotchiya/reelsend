"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Users, Building2, TrendingUp } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";

export default function DashboardPage() {
    const { t } = useI18n();

    const stats = [
        {
            title: t.dashboard.totalCampaigns,
            value: "0",
            description: t.dashboard.activeCampaigns,
            icon: Mail,
        },
        {
            title: t.dashboard.totalContacts,
            value: "0",
            description: t.dashboard.acrossAudiences,
            icon: Users,
        },
        {
            title: t.dashboard.activeClients,
            value: "0",
            description: t.dashboard.clientsWithCampaigns,
            icon: Building2,
        },
        {
            title: t.dashboard.avgOpenRate,
            value: "0%",
            description: t.dashboard.last30Days,
            icon: TrendingUp,
        },
    ];

    return (
        <>
            <PageHeader title={t.dashboard.title} />
            <PageContent>
                {/* Stats Grid */}
                <div className="space-y-8">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {stats.map((stat) => (
                            <Card key={stat.title}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stat.value}</div>
                                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Quick Actions */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t.dashboard.getStarted}</CardTitle>
                                <CardDescription>{t.dashboard.setupGuide}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        1
                                    </div>
                                    <div>
                                        <p className="font-medium">{t.dashboard.addClient}</p>
                                        <p className="text-sm text-muted-foreground">{t.dashboard.createFirstClient}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        2
                                    </div>
                                    <div>
                                        <p className="font-medium">{t.dashboard.importContacts}</p>
                                        <p className="text-sm text-muted-foreground">{t.dashboard.uploadContactList}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        3
                                    </div>
                                    <div>
                                        <p className="font-medium">{t.dashboard.createCampaign}</p>
                                        <p className="text-sm text-muted-foreground">{t.dashboard.designFirstEmail}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>{t.dashboard.recentActivity}</CardTitle>
                                <CardDescription>{t.dashboard.latestActions}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">{t.dashboard.noRecentActivity}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>{t.dashboard.emailHealth}</CardTitle>
                                <CardDescription>{t.dashboard.domainStatus}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">mail.mbouf.site</span>
                                    <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                                        {t.dashboard.pendingVerification}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {t.dashboard.checkSES}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </PageContent>
        </>
    );
}
