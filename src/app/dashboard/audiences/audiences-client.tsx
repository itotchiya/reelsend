"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, X, Users } from "lucide-react";
import { AudienceCard, AudienceCardData } from "@/components/ui-kit/audience-card";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination } from "@/components/ui-kit/pagination";
import { CreateAudienceDialog } from "@/components/dashboard/create-entity-dialog";
import { DeleteConfirmDialog } from "@/components/dashboard/delete-confirm-dialog";
import { toast } from "sonner";

interface AudiencesClientProps {
    initialAudiences: AudienceCardData[];
    clients: { id: string; name: string; slug: string }[];
}

const ITEMS_PER_PAGE = 12;

export function AudiencesClient({ initialAudiences, clients }: AudiencesClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // States
    const [audiences, setAudiences] = useState(initialAudiences);
    const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
    const [clientFilter, setClientFilter] = useState<string>(searchParams.get("client") || "all");
    const [usageFilter, setUsageFilter] = useState<string>(searchParams.get("usage") || "all");
    const [currentPage, setCurrentPage] = useState(1);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingAudience, setDeletingAudience] = useState<AudienceCardData | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [pageSize, setPageSize] = useState(16);

    // Filter audiences
    const filteredAudiences = useMemo(() => {
        return audiences.filter((audience) => {
            const matchesSearch =
                audience.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (audience.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
            const matchesClient = clientFilter === "all" || audience.client?.id === clientFilter;
            const matchesUsage =
                usageFilter === "all" ||
                (usageFilter === "used" && audience.campaigns && audience.campaigns.length > 0) ||
                (usageFilter === "unused" && (!audience.campaigns || audience.campaigns.length === 0));
            return matchesSearch && matchesClient && matchesUsage;
        });
    }, [audiences, searchQuery, clientFilter, usageFilter]);

    // Pagination
    const totalPages = Math.ceil(filteredAudiences.length / pageSize);
    const paginatedAudiences = filteredAudiences.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, clientFilter, usageFilter, pageSize]);

    // Handlers
    const handleView = (audience: AudienceCardData) => {
        if (audience.client?.slug) {
            router.push(`/dashboard/clients/${audience.client.slug}/audiences/${audience.id}`);
        }
    };

    const handleCampaignClick = (campaignId: string) => {
        // Find the campaign's client slug
        const audience = audiences.find((a) =>
            a.campaigns?.some((c) => c.id === campaignId)
        );
        if (audience?.client?.slug) {
            router.push(`/dashboard/clients/${audience.client.slug}/campaigns/${campaignId}`);
        }
    };

    const handleDelete = async () => {
        if (!deletingAudience) return;
        setDeleteLoading(true);
        try {
            const response = await fetch(`/api/audiences/${deletingAudience.id}`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error("Failed to delete");
            setAudiences(audiences.filter((a) => a.id !== deletingAudience.id));
            toast.success("Audience deleted");
            setDeleteDialogOpen(false);
            setDeletingAudience(null);
        } catch (error) {
            toast.error("Failed to delete audience");
        } finally {
            setDeleteLoading(false);
        }
    };

    const clearFilters = () => {
        setSearchQuery("");
        setClientFilter("all");
        setUsageFilter("all");
    };

    const hasActiveFilters = searchQuery || clientFilter !== "all" || usageFilter !== "all";

    return (
        <>
            <PageHeader
                title="Audiences"
                description="Manage all your contact lists and segments across clients"
                action={
                    <Button onClick={() => setCreateDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Audience
                    </Button>
                }
            />
            <PageContent>
                <div className="space-y-6">
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search audiences..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={usageFilter} onValueChange={setUsageFilter}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Usage" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Audiences</SelectItem>
                                <SelectItem value="used">Used in Campaigns</SelectItem>
                                <SelectItem value="unused">Not Used</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={clientFilter} onValueChange={setClientFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Client" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Clients</SelectItem>
                                {clients.map((client) => (
                                    <SelectItem key={client.id} value={client.id}>
                                        {client.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {hasActiveFilters && (
                            <Button variant="ghost" size="icon" onClick={clearFilters}>
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {/* Results count */}
                    <div className="text-sm text-muted-foreground">
                        {filteredAudiences.length} audience{filteredAudiences.length !== 1 ? "s" : ""} found
                    </div>

                    {/* Audience Grid */}
                    {paginatedAudiences.length > 0 ? (
                        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                            {paginatedAudiences.map((audience) => (
                                <AudienceCard
                                    key={audience.id}
                                    audience={audience}
                                    onView={() => handleView(audience)}
                                    onCampaignClick={handleCampaignClick}
                                    onDelete={() => {
                                        setDeletingAudience(audience);
                                        setDeleteDialogOpen(true);
                                    }}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                <Users className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No audiences found</h3>
                            <p className="text-muted-foreground mb-4">
                                {hasActiveFilters
                                    ? "Try adjusting your filters"
                                    : "Create your first audience to get started"}
                            </p>
                            {hasActiveFilters ? (
                                <Button variant="outline" onClick={clearFilters}>
                                    Clear Filters
                                </Button>
                            ) : (
                                <Button onClick={() => setCreateDialogOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Audience
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Pagination */}
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        pageSize={pageSize}
                        onPageSizeChange={setPageSize}
                        pageSizeOptions={[12, 16, 24, 48]}
                    />
                </div>
            </PageContent>

            {/* Create Dialog */}
            <CreateAudienceDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSuccess={() => {
                    setCreateDialogOpen(false);
                    router.refresh();
                }}
            />

            {/* Delete Dialog */}
            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleDelete}
                loading={deleteLoading}
                title="Delete Audience"
                description={`Are you sure you want to delete "${deletingAudience?.name}"? This action cannot be undone.`}
            />
        </>
    );
}
