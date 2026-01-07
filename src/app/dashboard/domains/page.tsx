import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Globe, CheckCircle, Clock, XCircle } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";

const statusConfig = {
    PENDING: { label: "Pending", variant: "outline" as const, icon: Clock, color: "text-yellow-600" },
    VERIFIED: { label: "Verified", variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
    FAILED: { label: "Failed", variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
};

export default async function DomainsPage() {
    const domains = await db.domain.findMany({
        include: {
            client: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return (
        <>
            <PageHeader title="Domains">
                <Button asChild className="gap-2">
                    <Link href="/dashboard/domains/new">
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Add Domain</span>
                    </Link>
                </Button>
            </PageHeader>
            <PageContent>
                {domains.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No domains yet</h3>
                            <p className="text-muted-foreground text-center mb-4">
                                Add a sending domain and verify it to start sending emails.
                            </p>
                            <Button asChild className="gap-2">
                                <Link href="/dashboard/domains/new">
                                    <Plus className="h-4 w-4" />
                                    <span className="hidden sm:inline">Add Your First Domain</span>
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {domains.map((domain) => {
                            const status = statusConfig[domain.status];
                            const StatusIcon = status.icon;

                            return (
                                <Card key={domain.id}>
                                    <CardHeader className="flex flex-row items-center gap-4">
                                        <Globe className="h-8 w-8 text-muted-foreground" />
                                        <div className="flex-1">
                                            <CardTitle className="text-lg">{domain.domain}</CardTitle>
                                            <CardDescription>
                                                {domain.client.name} • {domain.fromEmail || "No from email set"}
                                            </CardDescription>
                                        </div>
                                        <Badge variant={status.variant} className="gap-1">
                                            <StatusIcon className={`h-3 w-3 ${status.color}`} />
                                            {status.label}
                                        </Badge>
                                    </CardHeader>
                                    <CardContent>
                                        {domain.status === "PENDING" && (
                                            <p className="text-sm text-muted-foreground">
                                                Check your DNS settings and AWS SES console to complete verification.
                                            </p>
                                        )}
                                        {domain.status === "VERIFIED" && domain.verifiedAt && (
                                            <p className="text-sm text-muted-foreground">
                                                Verified on {new Date(domain.verifiedAt).toLocaleDateString()}. Ready to send emails.
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </PageContent>
        </>
    );
}
