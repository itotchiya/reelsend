import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";

export default async function TemplatesPage() {
    const templates = await db.template.findMany({
        include: {
            client: true,
            baseLayout: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return (
        <>
            <PageHeader title="Templates">
                <Button asChild>
                    <Link href="/dashboard/templates/new">
                        <Plus className="mr-2 h-4 w-4" />
                        New Template
                    </Link>
                </Button>
            </PageHeader>
            <PageContent>
                {templates.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
                            <p className="text-muted-foreground text-center mb-4">
                                Create your first email template to use in campaigns.
                            </p>
                            <Button asChild>
                                <Link href="/dashboard/templates/new">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Your First Template
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {templates.map((template) => (
                            <Card key={template.id} className="hover:shadow-md transition-shadow overflow-hidden">
                                <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                    <FileText className="h-12 w-12 text-primary/50" />
                                </div>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">{template.name}</CardTitle>
                                        <Badge variant="outline">{template.client.name}</Badge>
                                    </div>
                                    <CardDescription>{template.description || "No description"}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="outline" size="sm" asChild className="w-full">
                                        <Link href={`/dashboard/templates/${template.id}`}>
                                            Edit Template
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </PageContent>
        </>
    );
}
