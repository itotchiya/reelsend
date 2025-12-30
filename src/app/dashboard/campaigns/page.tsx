import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";

const statusConfig = {
    DRAFT: { label: "Draft", variant: "secondary" as const, icon: Clock },
    SCHEDULED: { label: "Scheduled", variant: "outline" as const, icon: Clock },
    SENDING: { label: "Sending", variant: "default" as const, icon: Mail },
    COMPLETED: { label: "Completed", variant: "default" as const, icon: CheckCircle },
    FAILED: { label: "Failed", variant: "destructive" as const, icon: AlertCircle },
    CANCELLED: { label: "Cancelled", variant: "secondary" as const, icon: AlertCircle },
};

export default async function CampaignsPage() {
    const campaigns = await db.campaign.findMany({
        include: {
            client: true,
            template: true,
            audience: true,
            analytics: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return (
        <>
            <PageHeader title="Campaigns">
                <Button asChild>
                    <Link href="/dashboard/campaigns/new">
                        <Plus className="mr-2 h-4 w-4" />
                        New Campaign
                    </Link>
                </Button>
            </PageHeader>
            <PageContent>
                {campaigns.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
                            <p className="text-muted-foreground text-center mb-4">
                                Create your first campaign to start sending emails.
                            </p>
                            <Button asChild>
                                <Link href="/dashboard/campaigns/new">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Your First Campaign
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {campaigns.map((campaign) => {
                            const status = statusConfig[campaign.status];
                            const StatusIcon = status.icon;

                            return (
                                <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader className="flex flex-row items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <CardTitle className="text-lg">{campaign.name}</CardTitle>
                                                <Badge variant={status.variant}>
                                                    <StatusIcon className="mr-1 h-3 w-3" />
                                                    {status.label}
                                                </Badge>
                                            </div>
                                            <CardDescription className="mt-1">
                                                {campaign.client.name} • {campaign.subject}
                                            </CardDescription>
                                        </div>
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/dashboard/campaigns/${campaign.id}`}>
                                                View
                                            </Link>
                                        </Button>
                                    </CardHeader>
                                    {campaign.analytics && (
                                        <CardContent>
                                            <div className="flex gap-6 text-sm">
                                                <div>
                                                    <span className="text-muted-foreground">Sent:</span>{" "}
                                                    <span className="font-medium">{campaign.analytics.sent}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Opened:</span>{" "}
                                                    <span className="font-medium">
                                                        {campaign.analytics.sent > 0
                                                            ? Math.round((campaign.analytics.opened / campaign.analytics.sent) * 100)
                                                            : 0}%
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Clicked:</span>{" "}
                                                    <span className="font-medium">
                                                        {campaign.analytics.sent > 0
                                                            ? Math.round((campaign.analytics.clicked / campaign.analytics.sent) * 100)
                                                            : 0}%
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                )}
            </PageContent>
        </>
    );
}
