import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2 } from "lucide-react";
import { db } from "@/lib/db";

export default async function ClientsPage() {
    const clients = await db.client.findMany({
        include: {
            _count: {
                select: {
                    campaigns: true,
                    audiences: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
                    <p className="text-muted-foreground">
                        Manage your agency clients and their branding
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/clients/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Client
                    </Link>
                </Button>
            </div>

            {clients.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No clients yet</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            Add your first client to start managing their email campaigns.
                        </p>
                        <Button asChild>
                            <Link href="/dashboard/clients/new">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Your First Client
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {clients.map((client) => (
                        <Card key={client.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center gap-4">
                                {client.logo ? (
                                    <img
                                        src={client.logo}
                                        alt={client.name}
                                        className="h-12 w-12 rounded-lg object-cover"
                                    />
                                ) : (
                                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Building2 className="h-6 w-6 text-primary" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <CardTitle className="text-lg">{client.name}</CardTitle>
                                    <CardDescription>@{client.slug}</CardDescription>
                                </div>
                                <Badge variant={client.active ? "default" : "secondary"}>
                                    {client.active ? "Active" : "Inactive"}
                                </Badge>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-4 text-sm text-muted-foreground">
                                    <span>{client._count.campaigns} campaigns</span>
                                    <span>{client._count.audiences} audiences</span>
                                </div>
                                <div className="mt-4">
                                    <Button variant="outline" size="sm" asChild className="w-full">
                                        <Link href={`/dashboard/clients/${client.id}`}>
                                            View Details
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
