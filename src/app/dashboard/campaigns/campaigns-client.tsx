"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
    Search as SearchIcon,
    X,
    ChevronLeft,
    ChevronRight,
    Mail
} from "lucide-react";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { CreateCampaignDialog } from "./create-campaign-dialog";
import { CampaignCard, type CampaignCardData } from "@/components/ui-kit/campaign-card";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

interface CampaignsClientProps {
    initialCampaigns: CampaignCardData[];
    clients: { id: string; name: string }[];
}

export function CampaignsClient({ initialCampaigns, clients }: CampaignsClientProps) {
    const { t } = useI18n();
    const router = useRouter();
    const [campaigns, setCampaigns] = useState(initialCampaigns);

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [clientFilter, setClientFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);

    // Compute filtered campaigns
    const filteredCampaigns = useMemo(() => {
        return campaigns.filter((campaign) => {
            // Search filter
            const matchesSearch = searchQuery === "" ||
                campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                campaign.subject?.toLowerCase().includes(searchQuery.toLowerCase());

            // Client filter
            const matchesClient = clientFilter === "all" || campaign.client.id === clientFilter;

            // Status filter
            const matchesStatus = statusFilter === "all" || campaign.status === statusFilter;

            return matchesSearch && matchesClient && matchesStatus;
        });
    }, [campaigns, searchQuery, clientFilter, statusFilter]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredCampaigns.length / pageSize);
    const paginatedCampaigns = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return filteredCampaigns.slice(startIndex, startIndex + pageSize);
    }, [filteredCampaigns, currentPage, pageSize]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, clientFilter, statusFilter, pageSize]);

    // Update local state when initialCampaigns changes
    useEffect(() => {
        setCampaigns(initialCampaigns);
    }, [initialCampaigns]);

    const handleView = (campaign: CampaignCardData) => {
        router.push(`/dashboard/campaigns/${campaign.id}`);
    };

    const handleEdit = (campaign: CampaignCardData) => {
        // For now, redirect to view as we might not have a separate edit dialog yet
        // or it's handled within the view page
        router.push(`/dashboard/campaigns/${campaign.id}`);
    };

    const handleDelete = async (campaign: CampaignCardData) => {
        if (!confirm(`Are you sure you want to delete "${campaign.name}"?`)) return;

        try {
            const res = await fetch(`/api/campaigns/${campaign.id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setCampaigns(prev => prev.filter(c => c.id !== campaign.id));
                toast.success("Campaign deleted successfully");
                router.refresh();
            } else {
                toast.error("Failed to delete campaign");
            }
        } catch (error) {
            toast.error("Failed to delete campaign");
        }
    };

    return (
        <>
            <PageHeader title={t.common.campaigns}>
                <CreateCampaignDialog clients={clients} />
            </PageHeader>
            <PageContent>
                {/* Filter Bar */}
                {campaigns.length > 0 && (
                    <div className="mb-6 space-y-3">
                        {/* Search Input */}
                        <div className="relative w-full">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search campaigns..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-9 w-full"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {/* Filter Dropdowns */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Client Filter */}
                            <Select value={clientFilter} onValueChange={setClientFilter}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Filter by Client" />
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

                            {/* Status Filter */}
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Filter by Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="DRAFT">Draft</SelectItem>
                                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                                    <SelectItem value="SENDING">Sending</SelectItem>
                                    <SelectItem value="COMPLETED">Completed</SelectItem>
                                    <SelectItem value="FAILED">Failed</SelectItem>
                                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="text-sm text-muted-foreground text-right">
                            {filteredCampaigns.length} campaigns
                        </div>
                    </div>
                )}

                {campaigns.length === 0 ? (
                    <div className="border border-dashed rounded-lg">
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
                                <Mail className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">No campaigns yet</h3>
                            <p className="text-muted-foreground max-w-sm mb-8">
                                Create your first campaign to start sending emails.
                            </p>
                            <CreateCampaignDialog
                                clients={clients}
                                trigger={
                                    <Button size="lg" className="gap-2">
                                        <Plus className="h-5 w-5" />
                                        Create Your First Campaign
                                    </Button>
                                }
                            />
                        </div>
                    </div>
                ) : filteredCampaigns.length === 0 ? (
                    <div className="border border-dashed rounded-lg py-12 text-center">
                        <SearchIcon className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
                        <h3 className="font-semibold mb-1">No campaigns found</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Try adjusting your filters or search query
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setSearchQuery("");
                                setClientFilter("all");
                                setStatusFilter("all");
                            }}
                        >
                            Clear Filters
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                            {paginatedCampaigns.map((campaign) => (
                                <CampaignCard
                                    key={campaign.id}
                                    campaign={campaign}
                                    onView={handleView}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="mt-6 border-t pt-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center justify-center sm:justify-start gap-2">
                                    <span className="text-sm text-muted-foreground">Show</span>
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
                                        </SelectContent>
                                    </Select>
                                    <span className="text-sm text-muted-foreground">per page</span>
                                </div>

                                <div className="flex items-center justify-center sm:justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage <= 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                        <span>Page</span>
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
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
        </>
    );
}
