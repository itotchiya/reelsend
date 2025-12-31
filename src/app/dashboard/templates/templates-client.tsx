"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, LayoutTemplate } from "lucide-react";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { CreateTemplateDialog } from "@/components/dashboard/create-template-dialog";
import { useI18n } from "@/lib/i18n";

interface Template {
    id: string;
    name: string;
    description: string | null;
    client: {
        id: string;
        name: string;
    };
    createdAt: Date;
}

interface TemplatesClientProps {
    initialTemplates: Template[];
}

export function TemplatesClient({ initialTemplates }: TemplatesClientProps) {
    const { t } = useI18n();
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    return (
        <>
            <PageHeader title="Templates">
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Template
                </Button>
            </PageHeader>
            <PageContent>
                {initialTemplates.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
                                <LayoutTemplate className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">No templates yet</h3>
                            <p className="text-muted-foreground max-w-sm mb-8">
                                Create your first email template to use in campaigns.
                            </p>
                            <Button onClick={() => setIsCreateOpen(true)} size="lg" className="gap-2">
                                <Plus className="h-5 w-5" />
                                Create First Template
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {initialTemplates.map((template) => (
                            <Card key={template.id} className="hover:shadow-md transition-shadow overflow-hidden group">
                                <div className="h-32 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary/10 transition-colors">
                                    <FileText className="h-12 w-12 text-primary/40 group-hover:text-primary/60 transition-colors" />
                                </div>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between gap-2 overflow-hidden">
                                        <CardTitle className=" text-base font-bold truncate">
                                            {template.name}
                                        </CardTitle>
                                        <Badge variant="secondary" className="shrink-0 text-[10px] uppercase font-bold tracking-wider">
                                            {template.client.name}
                                        </Badge>
                                    </div>
                                    <CardDescription className="line-clamp-2 min-h-[40px]">
                                        {template.description || "No description provided"}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="outline" size="sm" asChild className="w-full">
                                        <Link href={`/editor/${template.id}`}>
                                            Open Editor
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </PageContent>

            <CreateTemplateDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
            />
        </>
    );
}
