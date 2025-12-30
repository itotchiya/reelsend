import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Users } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";

export default async function AudiencesPage() {
    const audiences = await db.audience.findMany({
        include: {
            client: true,
            _count: {
                select: {
                    contacts: true,
                    segments: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return (
        <>
            <PageHeader title="Audiences">
                <Button asChild>
                    <Link href="/dashboard/audiences/new">
                        <Plus className="mr-2 h-4 w-4" />
                        New Audience
                    </Link>
                </Button>
            </PageHeader>
            <PageContent>
                {audiences.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Users className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No audiences yet</h3>
                            <p className="text-muted-foreground text-center mb-4">
                                Create an audience to start collecting and managing contacts.
                            </p>
                            <Button asChild>
                                <Link href="/dashboard/audiences/new">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Your First Audience
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {audiences.map((audience) => (
                            <Card key={audience.id} className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">{audience.name}</CardTitle>
                                        <Badge variant="outline">{audience.client.name}</Badge>
                                    </div>
                                    <CardDescription>{audience.description || "No description"}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex gap-4 text-sm text-muted-foreground mb-4">
                                        <span>{audience._count.contacts.toLocaleString()} contacts</span>
                                        <span>{audience._count.segments} segments</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" asChild className="flex-1">
                                            <Link href={`/dashboard/audiences/${audience.id}`}>
                                                View
                                            </Link>
                                        </Button>
                                        <Button variant="outline" size="sm" asChild className="flex-1">
                                            <Link href={`/dashboard/audiences/${audience.id}/import`}>
                                                Import
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </PageContent>
        </>
    );
}
