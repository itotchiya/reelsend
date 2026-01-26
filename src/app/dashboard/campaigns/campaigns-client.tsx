"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Filter, X } from "lucide-react";
import { CampaignCard, CampaignCardData } from "@/components/ui-kit/campaign-card";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination } from "@/components/ui-kit/pagination";
import { CreateCampaignDialog } from "@/components/dashboard/create-entity-dialog";
import { DeleteConfirmDialog } from "@/components/dashboard/delete-confirm-dialog";
import { toast } from "sonner";

interface CampaignsClientProps {
    initialCampaigns: CampaignCardData[];
    clients: { id: string; name: string; slug: string }[];
}

const ITEMS_PER_PAGE = 12;

export function CampaignsClient({ initialCampaigns, clients }: CampaignsClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // States
    const [campaigns, setCampaigns] = useState(initialCampaigns);
    const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
    const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("status") || "all");
    const [clientFilter, setClientFilter] = useState<string>(searchParams.get("client") || "all");
    const [currentPage, setCurrentPage] = useState(1);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingCampaign, setDeletingCampaign] = useState<CampaignCardData | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [pageSize, setPageSize] = useState(16);

    // Filter campaigns
    const filteredCampaigns = useMemo(() => {
        return campaigns.filter((campaign) => {
            const matchesSearch =
                campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (campaign.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
            const matchesStatus = statusFilter === "all" || campaign.status === statusFilter;
            const matchesClient = clientFilter === "all" || campaign.client?.id === clientFilter;
            return matchesSearch && matchesStatus && matchesClient;
        });
    }, [campaigns, searchQuery, statusFilter, clientFilter]);

    // Pagination
    const totalPages = Math.ceil(filteredCampaigns.length / pageSize);
    const paginatedCampaigns = filteredCampaigns.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    // Sync state with props when router refreshes (e.g., after creating a new campaign)
    useEffect(() => {
        setCampaigns(initialCampaigns);
    }, [initialCampaigns]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, clientFilter, pageSize]);

    // Handlers
    const handleView = (campaign: CampaignCardData) => {
        if (campaign.client?.slug) {
            router.push(`/dashboard/clients/${campaign.client.slug}/campaigns/${campaign.id}`);
        }
    };

    const handleDelete = async () => {
        if (!deletingCampaign) return;
        setDeleteLoading(true);
        try {
            const response = await fetch(`/api/campaigns/${deletingCampaign.id}`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error("Failed to delete");
            setCampaigns(campaigns.filter((c) => c.id !== deletingCampaign.id));
            toast.success("Campaign deleted");
            setDeleteDialogOpen(false);
            setDeletingCampaign(null);
        } catch (error) {
            toast.error("Failed to delete campaign");
        } finally {
            setDeleteLoading(false);
        }
    };

    const clearFilters = () => {
        setSearchQuery("");
        setStatusFilter("all");
        setClientFilter("all");
    };

    const hasActiveFilters = searchQuery || statusFilter !== "all" || clientFilter !== "all";

    return (
        <>
            <PageHeader
                title="Campaigns"
                description="Manage all your email campaigns across clients"
                action={
                    <Button asChild className="gap-2">
                        <a href="/dashboard/campaigns/new">
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline">New Campaign</span>
                        </a>
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
                                placeholder="Search campaigns..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-[160px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="DRAFT">Draft</SelectItem>
                                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                                <SelectItem value="SENDING">Sending</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="FAILED">Failed</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={clientFilter} onValueChange={setClientFilter}>
                            <SelectTrigger className="w-full sm:w-[180px]">
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
                        {filteredCampaigns.length} campaign{filteredCampaigns.length !== 1 ? "s" : ""} found
                    </div>

                    {/* Campaign Grid */}
                    {paginatedCampaigns.length > 0 ? (
                        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                            {paginatedCampaigns.map((campaign) => (
                                <CampaignCard
                                    key={campaign.id}
                                    campaign={campaign}
                                    onView={() => handleView(campaign)}
                                    onDelete={() => {
                                        setDeletingCampaign(campaign);
                                        setDeleteDialogOpen(true);
                                    }}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                <Filter className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
                            <p className="text-muted-foreground mb-4">
                                {hasActiveFilters
                                    ? "Try adjusting your filters"
                                    : "Create your first campaign to get started"}
                            </p>
                            {hasActiveFilters ? (
                                <Button variant="outline" onClick={clearFilters}>
                                    Clear Filters
                                </Button>
                            ) : (
                                <Button asChild>
                                    <a href="/dashboard/campaigns/new">
                                        <Plus className="mr-2 h-4 w-4" />
                                        New Campaign
                                    </a>
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
            <CreateCampaignDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onCampaignCreated={() => {
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
                title="Delete Campaign"
                description={`Are you sure you want to delete "${deletingCampaign?.name}"? This action cannot be undone.`}
            />
        </>
    );
}
