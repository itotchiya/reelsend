"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Plus,
    Users,
    Search as SearchIcon,
    X,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { CreateAudienceDialog } from "@/components/dashboard/create-audience-dialog";
import { useI18n } from "@/lib/i18n";
import { AudienceCard, type AudienceCardData } from "@/components/ui-kit/audience-card";

interface Audience extends AudienceCardData {
    createdAt: string;
}

interface AudiencesClientProps {
    initialAudiences: Audience[];
}

export function AudiencesClient({ initialAudiences }: AudiencesClientProps) {
    const router = useRouter();
    const { t } = useI18n();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [audiences, setAudiences] = useState<Audience[]>(initialAudiences);

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [clientFilter, setClientFilter] = useState("all");
    const [usageFilter, setUsageFilter] = useState("all");

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);

    // Get unique clients for filter
    const uniqueClients = useMemo(() => {
        const clients = new Map<string, { id: string; name: string }>();
        audiences.forEach((a) => {
            if (!clients.has(a.client.id)) {
                clients.set(a.client.id, { id: a.client.id, name: a.client.name });
            }
        });
        return Array.from(clients.values());
    }, [audiences]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, clientFilter, usageFilter, pageSize]);

    // Filtered audiences
    const filteredAudiences = useMemo(() => {
        return audiences.filter((audience) => {
            // Search filter
            const searchMatch =
                searchQuery === "" ||
                audience.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                audience.client.name.toLowerCase().includes(searchQuery.toLowerCase());

            // Client filter
            let clientMatch = true;
            if (clientFilter !== "all") {
                clientMatch = audience.client.id === clientFilter;
            }

            // Usage filter
            let usageMatch = true;
            const isUsed = (audience.campaigns?.length || 0) > 0;
            if (usageFilter === "used") {
                usageMatch = isUsed;
            } else if (usageFilter === "notUsed") {
                usageMatch = !isUsed;
            }

            return searchMatch && clientMatch && usageMatch;
        });
    }, [audiences, searchQuery, clientFilter, usageFilter]);

    // Paginated audiences
    const totalPages = Math.ceil(filteredAudiences.length / pageSize);
    const paginatedAudiences = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return filteredAudiences.slice(startIndex, startIndex + pageSize);
    }, [filteredAudiences, currentPage, pageSize]);

    const handleView = (audience: AudienceCardData) => {
        router.push(`/dashboard/clients/${audience.client.slug}/audiences/${audience.id}`);
    };

    const hasActiveFilters = searchQuery || clientFilter !== "all" || usageFilter !== "all";

    const clearFilters = () => {
        setSearchQuery("");
        setClientFilter("all");
        setUsageFilter("all");
    };

    return (
        <>
            <PageHeader title={t.audiences.title}>
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t.audiences.newAudience}
                </Button>
            </PageHeader>

            <PageContent>
                {/* Filter Bar - One row on desktop, stacked on mobile */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t.audiences?.searchPlaceholder || "Search audiences..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 w-full"
                        />
                        {searchQuery && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                onClick={() => setSearchQuery("")}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {/* Client Filter */}
                    <Select value={clientFilter} onValueChange={setClientFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder={t.audiences?.filterByClient || "Client"} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t.audiences?.allClients || "All Clients"}</SelectItem>
                            {uniqueClients.map((client) => (
                                <SelectItem key={client.id} value={client.id}>
                                    {client.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Usage Filter */}
                    <Select value={usageFilter} onValueChange={setUsageFilter}>
                        <SelectTrigger className="w-full sm:w-[160px]">
                            <SelectValue placeholder={t.audiences?.filterByUsage || "Usage"} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t.audiences?.allUsage || "All Usage"}</SelectItem>
                            <SelectItem value="used">{t.audiences?.usedInCampaign || "Used in Campaign"}</SelectItem>
                            <SelectItem value="notUsed">{t.audiences?.notUsedYet || "Not Used Yet"}</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Results Count */}
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {filteredAudiences.length} {t.audiences?.audiencesCount || "audiences"}
                    </span>
                </div>

                {audiences.length === 0 ? (
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
                ) : filteredAudiences.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <SearchIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                            {t.audiences?.noResults || "No audiences found"}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            {t.audiences?.noResultsDesc || "Try adjusting your search or filter criteria."}
                        </p>
                        <Button variant="outline" onClick={clearFilters}>
                            {t.audiences?.clearFilters || "Clear Filters"}
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Audience Grid */}
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {paginatedAudiences.map((audience) => (
                                <AudienceCard
                                    key={audience.id}
                                    audience={audience}
                                    onView={handleView}
                                    canEdit={true}
                                    canDelete={true}
                                    labels={{
                                        viewAudience: t.audiences?.viewAudience || "View Audience",
                                        edit: t.common.edit,
                                        delete: t.common.delete,
                                        contacts: t.audiences?.contacts || "Contacts",
                                        segments: t.audiences?.segments || "Segments",
                                        notUsed: t.audiences?.notUsedBadge || "Not Used",
                                        usedIn: t.audiences?.usedIn || "Used in",
                                    }}
                                />
                            ))}
                        </div>

                        {/* Pagination Controls - Horizontal on desktop, stacked on mobile */}
                        <div className="mt-6 border-t pt-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                {/* Page Size Selector - Left on desktop */}
                                <div className="flex items-center justify-center sm:justify-start gap-2">
                                    <span className="text-sm text-muted-foreground">
                                        {t.audiences?.showPerPage || "Show"}
                                    </span>
                                    <Select
                                        value={String(pageSize)}
                                        onValueChange={(val) => setPageSize(Number(val))}
                                    >
                                        <SelectTrigger className="w-[80px] h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="8">8</SelectItem>
                                            <SelectItem value="12">12</SelectItem>
                                            <SelectItem value="24">24</SelectItem>
                                            <SelectItem value="48">48</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <span className="text-sm text-muted-foreground">
                                        {t.audiences?.perPage || "per page"}
                                    </span>
                                </div>

                                {/* Page Navigation - Right on desktop */}
                                <div className="flex items-center justify-center sm:justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage <= 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                        <span>{t.audiences?.page || "Page"}</span>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={Math.max(1, totalPages)}
                                            value={currentPage}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                if (!isNaN(val) && val >= 1 && val <= totalPages) {
                                                    setCurrentPage(val);
                                                }
                                            }}
                                            className="w-14 h-8 text-center px-1"
                                        />
                                        <span>/ {Math.max(1, totalPages)}</span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage >= totalPages || totalPages <= 1}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </>
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
