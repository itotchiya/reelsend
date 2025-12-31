"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
        logo: string | null;
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

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
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
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {initialAudiences.map((audience) => (
                            <InteractiveCard
                                key={audience.id}
                                onClick={() => router.push(`/dashboard/clients/${audience.client.slug}/audiences/${audience.id}`)}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Client Logo */}
                                    <Avatar className="h-12 w-12 rounded-lg shrink-0 border">
                                        <AvatarImage src={audience.client.logo || ""} className="object-cover" />
                                        <AvatarFallback className="rounded-lg bg-muted text-xs font-bold">
                                            {getInitials(audience.client.name)}
                                        </AvatarFallback>
                                    </Avatar>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <h3 className="font-semibold text-base truncate">
                                            {audience.name}
                                        </h3>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {audience.client.name}
                                        </p>
                                        <p className="text-sm text-muted-foreground line-clamp-1">
                                            {audience.description || t.audiences.noDescription}
                                        </p>
                                    </div>
                                </div>

                                {/* Stats - no divider */}
                                <div className="flex items-center gap-1.5 mt-4 text-sm text-muted-foreground">
                                    <Users className="h-3.5 w-3.5" />
                                    <span>{audience._count.contacts.toLocaleString()} {t.audiences.contacts}</span>
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

