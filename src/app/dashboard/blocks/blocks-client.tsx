"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, LayoutGrid, Loader2 } from "lucide-react";
import { BlockCard, BlockCardData } from "@/components/ui-kit/block-card";
import { useBreadcrumbs } from "@/lib/contexts/breadcrumb-context";
import { toast } from "sonner";

interface Client {
    id: string;
    name: string;
    slug: string;
}

interface BlocksClientProps {
    blocks: BlockCardData[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    filters: {
        categories: string[];
        clients: Client[];
    };
    currentFilters: {
        category: string;
        clientId: string;
        search: string;
    };
}

export function BlocksClient({
    blocks: initialBlocks,
    pagination,
    filters,
    currentFilters,
}: BlocksClientProps) {
    const { t } = useI18n();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setOverride, removeOverride } = useBreadcrumbs();

    const [blocks, setBlocks] = useState(initialBlocks);
    const [searchQuery, setSearchQuery] = useState(currentFilters.search);
    const [selectedCategory, setSelectedCategory] = useState(currentFilters.category);
    const [selectedClientId, setSelectedClientId] = useState(currentFilters.clientId);

    // Create block dialog
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newBlockName, setNewBlockName] = useState("");
    const [newBlockDescription, setNewBlockDescription] = useState("");
    const [newBlockCategory, setNewBlockCategory] = useState("");
    const [newBlockClientId, setNewBlockClientId] = useState("");

    // Edit block dialog
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingBlock, setEditingBlock] = useState<BlockCardData | null>(null);
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editCategory, setEditCategory] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Set breadcrumb
    useEffect(() => {
        setOverride("blocks", t.blocks?.title || "Block Library");
        return () => removeOverride("blocks");
    }, [setOverride, removeOverride, t]);

    // Update URL with filters
    const updateFilters = (updates: Partial<typeof currentFilters>) => {
        const params = new URLSearchParams(searchParams.toString());

        const newFilters = { ...currentFilters, ...updates };

        if (newFilters.category && newFilters.category !== "all") {
            params.set("category", newFilters.category);
        } else {
            params.delete("category");
        }

        if (newFilters.clientId) {
            params.set("clientId", newFilters.clientId);
        } else {
            params.delete("clientId");
        }

        if (newFilters.search) {
            params.set("search", newFilters.search);
        } else {
            params.delete("search");
        }

        // Reset to page 1 when filters change
        params.delete("page");

        router.push(`/dashboard/blocks?${params.toString()}`);
    };

    // Handle search with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== currentFilters.search) {
                updateFilters({ search: searchQuery });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Handle category change
    const handleCategoryChange = (value: string) => {
        setSelectedCategory(value);
        updateFilters({ category: value });
    };

    // Handle client change
    const handleClientChange = (value: string) => {
        setSelectedClientId(value);
        updateFilters({ clientId: value === "all" ? "" : value });
    };

    // Handle page change
    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", newPage.toString());
        router.push(`/dashboard/blocks?${params.toString()}`);
    };

    // Create block
    const handleCreateBlock = async () => {
        if (!newBlockName.trim()) {
            toast.error(t.blocks?.nameRequired || "Name is required");
            return;
        }

        setIsCreating(true);
        try {
            const response = await fetch("/api/blocks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newBlockName,
                    description: newBlockDescription || null,
                    category: newBlockCategory || null,
                    clientId: newBlockClientId || null,
                    jsonContent: {
                        root: {
                            type: "EmailLayout",
                            data: {
                                backdropColor: "#F5F5F5",
                                canvasColor: "#FFFFFF",
                                textColor: "#262626",
                                fontFamily: "MODERN_SANS",
                                childrenIds: [],
                            },
                        },
                    },
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to create block");
            }

            const block = await response.json();
            toast.success(t.blocks?.createSuccess || "Block created successfully");
            setIsCreateOpen(false);
            setNewBlockName("");
            setNewBlockDescription("");
            setNewBlockCategory("");
            setNewBlockClientId("");

            // Navigate to editor
            router.push(`/dashboard/blocks/${block.id}`);
        } catch (error) {
            console.error(error);
            toast.error(t.blocks?.createFailed || "Failed to create block");
        } finally {
            setIsCreating(false);
        }
    };

    // Open block in editor
    const handleOpenBlock = (block: BlockCardData) => {
        router.push(`/dashboard/blocks/${block.id}`);
    };

    // Edit block details
    const handleEditBlock = (block: BlockCardData) => {
        setEditingBlock(block);
        setEditName(block.name);
        setEditDescription(block.description || "");
        setEditCategory(block.category || "");
        setIsEditOpen(true);
    };

    // Save edited block
    const handleSaveEdit = async () => {
        if (!editingBlock) return;

        setIsSaving(true);
        try {
            const response = await fetch(`/api/blocks/${editingBlock.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editName,
                    description: editDescription || null,
                    category: editCategory || null,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to update block");
            }

            toast.success(t.blocks?.updateSuccess || "Block updated successfully");
            setIsEditOpen(false);
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error(t.blocks?.updateFailed || "Failed to update block");
        } finally {
            setIsSaving(false);
        }
    };

    // Duplicate block
    const handleDuplicateBlock = async (block: BlockCardData) => {
        try {
            const response = await fetch("/api/blocks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: `${block.name} (Copy)`,
                    description: block.description,
                    category: block.category,
                    clientId: block.client?.id || null,
                    jsonContent: block.jsonContent,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to duplicate block");
            }

            toast.success(t.blocks?.duplicateSuccess || "Block duplicated successfully");
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error(t.blocks?.duplicateFailed || "Failed to duplicate block");
        }
    };

    // Delete block
    const handleDeleteBlock = async (block: BlockCardData) => {
        if (!confirm(t.blocks?.deleteConfirm || "Are you sure you want to delete this block?")) {
            return;
        }

        try {
            const response = await fetch(`/api/blocks/${block.id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete block");
            }

            toast.success(t.blocks?.deleteSuccess || "Block deleted successfully");
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error(t.blocks?.deleteFailed || "Failed to delete block");
        }
    };

    const categoryOptions = [
        { value: "headers", label: t.blocks?.categories?.headers || "Headers" },
        { value: "footers", label: t.blocks?.categories?.footers || "Footers" },
        { value: "cta", label: t.blocks?.categories?.cta || "Call to Action" },
        { value: "content", label: t.blocks?.categories?.content || "Content" },
        { value: "images", label: t.blocks?.categories?.images || "Images" },
        { value: "social", label: t.blocks?.categories?.social || "Social" },
    ];

    return (
        <>
            <PageHeader
                title={t.blocks?.title || "Block Library"}
                description={t.blocks?.description || "Manage reusable email blocks"}
            >
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t.blocks?.createBlock || "Create Block"}
                </Button>
            </PageHeader>

            <PageContent>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t.blocks?.searchPlaceholder || "Search blocks..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                        <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder={t.blocks?.filterByCategory || "Category"} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t.blocks?.allCategories || "All Categories"}</SelectItem>
                            {categoryOptions.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>
                                    {cat.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={selectedClientId || "all"} onValueChange={handleClientChange}>
                        <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder={t.blocks?.filterByClient || "Client"} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t.blocks?.allClients || "All Clients"}</SelectItem>
                            <SelectItem value="global">{t.blocks?.globalBlock || "Global"}</SelectItem>
                            {filters.clients.map((client) => (
                                <SelectItem key={client.id} value={client.id}>
                                    {client.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Blocks Grid */}
                {blocks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                            <LayoutGrid className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                            {t.blocks?.noBlocks || "No blocks yet"}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                            {t.blocks?.createFirst || "Create your first reusable block to use in your email templates."}
                        </p>
                        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                            <Plus className="h-4 w-4" />
                            {t.blocks?.createBlock || "Create Block"}
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {blocks.map((block) => (
                                <BlockCard
                                    key={block.id}
                                    block={block}
                                    onOpen={handleOpenBlock}
                                    onEdit={handleEditBlock}
                                    onDuplicate={handleDuplicateBlock}
                                    onDelete={handleDeleteBlock}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-8">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                >
                                    {t.common?.back || "Previous"}
                                </Button>
                                <span className="text-sm text-muted-foreground px-4">
                                    {t.audiences?.page || "Page"} {pagination.page} / {pagination.totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page === pagination.totalPages}
                                >
                                    {t.common?.next || "Next"}
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </PageContent>

            {/* Create Block Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t.blocks?.createBlock || "Create Block"}</DialogTitle>
                        <DialogDescription>
                            {t.blocks?.createDescription || "Create a new reusable email block."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t.common?.name || "Name"}</Label>
                            <Input
                                id="name"
                                value={newBlockName}
                                onChange={(e) => setNewBlockName(e.target.value)}
                                placeholder={t.blocks?.namePlaceholder || "Enter block name"}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">{t.common?.description || "Description"}</Label>
                            <Input
                                id="description"
                                value={newBlockDescription}
                                onChange={(e) => setNewBlockDescription(e.target.value)}
                                placeholder={t.blocks?.descriptionPlaceholder || "Brief description (optional)"}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{t.blocks?.category || "Category"}</Label>
                            <Select value={newBlockCategory} onValueChange={setNewBlockCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t.blocks?.selectCategory || "Select category"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {categoryOptions.map((cat) => (
                                        <SelectItem key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>{t.common?.client || "Client"}</Label>
                            <Select value={newBlockClientId} onValueChange={setNewBlockClientId}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t.blocks?.selectClient || "Global (available to all)"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">{t.blocks?.globalBlock || "Global"}</SelectItem>
                                    {filters.clients.map((client) => (
                                        <SelectItem key={client.id} value={client.id}>
                                            {client.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                            {t.common?.cancel || "Cancel"}
                        </Button>
                        <Button onClick={handleCreateBlock} disabled={isCreating}>
                            {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {t.common?.create || "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Block Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t.blocks?.editDetails || "Edit Block Details"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">{t.common?.name || "Name"}</Label>
                            <Input
                                id="edit-name"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-description">{t.common?.description || "Description"}</Label>
                            <Input
                                id="edit-description"
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{t.blocks?.category || "Category"}</Label>
                            <Select value={editCategory} onValueChange={setEditCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t.blocks?.selectCategory || "Select category"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {categoryOptions.map((cat) => (
                                        <SelectItem key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                            {t.common?.cancel || "Cancel"}
                        </Button>
                        <Button onClick={handleSaveEdit} disabled={isSaving}>
                            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {t.common?.save || "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
