"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Users } from "lucide-react";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { CreateAudienceDialog } from "@/components/dashboard/create-audience-dialog";
import { InteractiveCard } from "@/components/ui/interactive-card";
import { useI18n } from "@/lib/i18n";

interface Audience {
    id: string;
    name: string;
    description: string | null;
    client: {
        id: string;
        name: string;
        slug: string;
    };
    _count: {
        contacts: number;
        segments: number;
    };
    createdAt: string;
}

interface AudiencesClientProps {
    initialAudiences: Audience[];
}

export function AudiencesClient({ initialAudiences }: AudiencesClientProps) {
    const router = useRouter();
    const { t } = useI18n();
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    return (
        <>
            <PageHeader title={t.audiences.title}>
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t.audiences.newAudience}
                </Button>
            </PageHeader>
            <PageContent>
                {initialAudiences.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
                                <Users className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">{t.clients.noAudiences}</h3>
                            <p className="text-muted-foreground max-w-sm mb-8">
                                {t.audiences.createFirstAudience}
                            </p>
                            <Button onClick={() => setIsCreateOpen(true)} size="lg" className="gap-2">
                                <Plus className="h-5 w-5" />
                                {t.audiences.createAudience}
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {initialAudiences.map((audience) => (
                            <InteractiveCard
                                key={audience.id}
                                className="h-full border-none"
                                onClick={() => router.push(`/dashboard/clients/${audience.client.slug}/audiences/${audience.id}`)}
                            >
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <div className="flex items-start justify-between">
                                            <h3 className="text-xl font-bold tracking-tight">{audience.name}</h3>
                                            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider border-muted-foreground/20">
                                                {audience.client.name}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2 h-10">
                                            {audience.description || t.audiences.noDescription}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-6 text-sm text-muted-foreground/80">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4" />
                                            <span className="font-medium">{audience._count.contacts.toLocaleString()} {t.audiences.contacts}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="text-[10px] font-bold bg-muted/50">
                                                {audience._count.segments} {t.audiences.segments}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <Button
                                            variant="default"
                                            size="sm"
                                            asChild
                                            className="flex-1 font-bold shadow-sm"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Link href={`/dashboard/clients/${audience.client.slug}/audiences/${audience.id}`}>
                                                {t.audiences.manage}
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                            className="flex-1 font-bold bg-background/50"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Link href={`/dashboard/clients/${audience.client.slug}/audiences/${audience.id}?tab=contacts`}>
                                                {t.audiences.import}
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </InteractiveCard>
                        ))}
                    </div>
                )}
            </PageContent>

            <CreateAudienceDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onSuccess={(newAudience) => {
                    router.refresh();
                }}
            />
        </>
    );
}
