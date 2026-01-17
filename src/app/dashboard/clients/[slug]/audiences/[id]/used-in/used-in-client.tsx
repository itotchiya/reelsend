"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { DataTable, Column } from "@/components/ui-kit/data-table";
import { FilterBar } from "@/components/ui-kit/filter-bar";
import { Button } from "@/components/ui/button";
import { CardBadge } from "@/components/ui-kit/card-badge";
import { Mail, ArrowLeft, Calendar, CheckCircle, Clock, Send, AlertCircle } from "lucide-react";
import { useBreadcrumbs } from "@/lib/contexts/breadcrumb-context";
import { useI18n } from "@/lib/i18n";
import { DashboardBreadcrumb } from "@/components/dashboard/layout";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguagePickerDialog } from "@/components/ui-kit/language-picker-dialog";
import { Pagination } from "@/components/ui-kit/pagination";
import { ListPaginationFooter } from "@/components/ui-kit/list-pagination-footer";
import { useTabLoading } from "@/lib/contexts/tab-loading-context";
import { ClientContentSkeleton } from "@/components/skeletons/client-content-skeleton";
import { AudienceTabs } from "@/components/ui-kit/motion-tabs";
import { InteractiveDashedCard } from "@/components/ui-kit/interactive-dashed-card";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Campaign {
    id: string;
    name: string;
    status: string;
    createdAt: string;
    sentAt: string | null;
    scheduledAt: string | null;
    template: { name: string } | null;
    audience: { name: string } | null;
    segment: { name: string } | null;
}

interface UsedInClientProps {
    audience: { id: string; name: string; client: { slug: string; name: string } };
    campaigns: Campaign[];
    totalCount: number;
    currentPage: number;
    pageSize: number;
    searchValue: string;
    statusFilter: string;
}

export function UsedInClient({
    audience,
    campaigns,
    totalCount,
    currentPage,
    pageSize,
    searchValue,
    statusFilter,
}: UsedInClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { t } = useI18n();
    const { setOverride, removeOverride } = useBreadcrumbs();
    const { isLoading } = useTabLoading();

    useEffect(() => {
        setOverride(audience.client.slug, audience.client.name);
        setOverride(audience.id, audience.name);
        setOverride("used-in", t.tables?.campaigns || "Used In");
        return () => {
            removeOverride(audience.client.slug);
            removeOverride(audience.id);
            removeOverride("used-in");
        };
    }, [audience.client.slug, audience.client.name, audience.id, audience.name, t.tables?.campaigns, setOverride, removeOverride]);

    const updateUrl = (params: Record<string, string>) => {
        const searchParams = new URLSearchParams(window.location.search);
        Object.entries(params).forEach(([key, value]) => {
            if (value && value !== "all") {
                searchParams.set(key, value);
            } else {
                searchParams.delete(key);
            }
        });

        // Always reset to page 1 if search or status changes, unless page is explicitly provided
        if ((params.search !== undefined || params.status !== undefined) && params.page === undefined) {
            searchParams.set("page", "1");
        }

        const queryString = searchParams.toString();
        router.push(queryString ? `${pathname}?${queryString}` : pathname);
    };

    const handleSearch = (value: string) => {
        updateUrl({ search: value, page: "1", status: statusFilter });
    };

    const handleFilterChange = (key: string, value: string) => {
        updateUrl({ search: searchValue, page: "1", status: value });
    };

    const handlePageChange = (page: number) => {
        updateUrl({ page: page.toString() });
    };

    const handlePageSizeChange = (size: number) => {
        updateUrl({ pageSize: size.toString(), page: "1" });
    };

    const handleClearFilters = () => {
        router.push(pathname);
    };

    const getStatusConfig = (status: string) => {
        switch (status.toUpperCase()) {
            case "COMPLETED":
                return { label: "Completed", color: "green", icon: CheckCircle };
            case "SENDING":
                return { label: "Sending", color: "blue", icon: Send };
            case "SCHEDULED":
                return { label: "Scheduled", color: "purple", icon: Clock };
            case "DRAFT":
                return { label: "Draft", color: "gray", icon: Mail };
            case "FAILED":
                return { label: "Failed", color: "red", icon: AlertCircle };
            default:
                return { label: status, color: "gray", icon: Mail };
        }
    };

    const columns: Column<Campaign>[] = [
        {
            key: "name",
            header: t.tables?.name || "Name",
            render: (campaign) => (
                <div className="flex flex-col">
                    <span className="font-medium">{campaign.name}</span>
                    <span className="text-xs text-muted-foreground">
                        {campaign.template?.name || "No template"}
                    </span>
                </div>
            ),
        },
        {
            key: "segmentId",
            header: "Target",
            render: (campaign) => (
                <div className="flex flex-col">
                    {campaign.segment ? (
                        <CardBadge variant="border" color="purple" size="sm">
                            {campaign.segment.name}
                        </CardBadge>
                    ) : (
                        <CardBadge variant="border" color="blue" size="sm">
                            Entire Audience
                        </CardBadge>
                    )}
                </div>
            ),
        },
        {
            key: "status",
            header: t.tables?.status || "Status",
            render: (campaign) => {
                const config = getStatusConfig(campaign.status);
                return (
                    <CardBadge variant="border" color={config.color as any}>
                        <config.icon className="h-3 w-3 mr-1" />
                        {config.label}
                    </CardBadge>
                );
            },
        },
        {
            key: "createdAt",
            header: t.tables?.createdAt || "Date",
            render: (campaign) => (
                <div className="flex flex-col text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {campaign.sentAt || campaign.scheduledAt
                            ? new Date(campaign.sentAt || campaign.scheduledAt!).toLocaleDateString()
                            : new Date(campaign.createdAt).toLocaleDateString()}
                    </div>
                </div>
            ),
        },
        {
            key: "actions",
            header: "",
            render: (campaign) => (
                <Link href={`/dashboard/clients/${audience.client.slug}/campaigns/${campaign.id}`}>
                    <Button variant="ghost" size="sm">
                        View
                    </Button>
                </Link>
            ),
        },
    ];

    const filters = [
        {
            key: "status",
            label: "Status",
            options: [
                { label: "All Status", value: "all" },
                { label: "Completed", value: "completed" },
                { label: "Sending", value: "sending" },
                { label: "Scheduled", value: "scheduled" },
                { label: "Draft", value: "draft" },
                { label: "Failed", value: "failed" },
            ],
        },
    ];

    return (
        <div className="h-dvh flex flex-col bg-background">
            <header className="relative shrink-0 flex items-center justify-between px-6 h-16 border-b bg-background">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="-ml-2">
                        <Link href={`/dashboard/clients/${audience.client.slug}/audiences/${audience.id}`}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <DashboardBreadcrumb />
                </div>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
                    <AudienceTabs slug={audience.client.slug} id={audience.id} />
                </div>

                <div className="flex items-center gap-2">
                    <LanguagePickerDialog />
                    <ThemeToggle />
                </div>
            </header>

            {isLoading ? (
                <ClientContentSkeleton />
            ) : (
                <>
                    <main className="flex-1 flex flex-col overflow-y-auto">
                        <div className={cn(
                            "p-6 md:p-12 space-y-6 flex flex-col",
                            campaigns.length === 0 ? "flex-1 justify-center" : ""
                        )}>
                            {campaigns.length > 0 && (
                                <>
                                    <div>
                                        <h1 className="text-2xl font-bold tracking-tight">{t.tables?.campaigns || "Used In"}</h1>
                                        <p className="text-muted-foreground">
                                            Campaigns using {audience.name} audience or its segments.
                                        </p>
                                    </div>

                                    <FilterBar
                                        searchValue={searchValue}
                                        onSearchChange={handleSearch}
                                        searchPlaceholder="Search campaigns..."
                                        filters={filters}
                                        filterValues={{ status: statusFilter }}
                                        onFilterChange={handleFilterChange}
                                        onClearFilters={handleClearFilters}
                                    />
                                </>
                            )}

                            {campaigns.length > 0 ? (
                                <DataTable
                                    data={campaigns}
                                    columns={columns}
                                    currentPage={currentPage}
                                    totalItems={totalCount}
                                    pageSize={pageSize}
                                    pageSizeOptions={[10, 20, 30, 40, 50]}
                                    emptyMessage="No campaigns found using this audience"
                                    emptyIcon={<Mail className="h-10 w-10 text-muted-foreground/40" />}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center">
                                    <InteractiveDashedCard
                                        title={t.audiences?.notUsedYet || "Not Used Yet"}
                                        description={t.audiences?.notUsedYetDescription || "This audience hasn't been used in any campaigns yet. Start a new campaign to reach your audience."}
                                        actionTitle={t.campaigns?.createCampaign || "Create Campaign"}
                                        icon={Mail}
                                        color="green"
                                        href={`/dashboard/clients/${audience.client.slug}/campaigns`}
                                    />
                                </div>
                            )}
                        </div>
                    </main>

                    <ListPaginationFooter
                        currentPage={currentPage}
                        totalPages={Math.ceil(totalCount / pageSize)}
                        totalItems={totalCount}
                        pageSize={pageSize}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                    />
                </>
            )}
        </div>
    );
}
