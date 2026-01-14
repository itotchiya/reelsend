"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";

// Entity type configuration
type EntityType = "campaign" | "audience" | "template";

interface EntityConfig {
    apiEndpoint: string;
    titleCreate: string;
    titleEdit: string;
    description: string;
    nameLabel: string;
    namePlaceholder: string;
    descLabel: string;
    descPlaceholder: string;
    submitLabel: string;
}

const entityConfigs: Record<EntityType, EntityConfig> = {
    campaign: {
        apiEndpoint: "/api/campaigns",
        titleCreate: "Create Campaign",
        titleEdit: "Edit Campaign",
        description: "Create a new email campaign.",
        nameLabel: "Campaign Name",
        namePlaceholder: "Enter campaign name",
        descLabel: "Description",
        descPlaceholder: "Brief description of your campaign",
        submitLabel: "Create Campaign",
    },
    audience: {
        apiEndpoint: "/api/audiences",
        titleCreate: "Create Audience",
        titleEdit: "Edit Audience",
        description: "Create a new audience for your campaigns.",
        nameLabel: "Audience Name",
        namePlaceholder: "Enter audience name",
        descLabel: "Description",
        descPlaceholder: "Brief description of your audience",
        submitLabel: "Create Audience",
    },
    template: {
        apiEndpoint: "/api/templates",
        titleCreate: "Create Template",
        titleEdit: "Edit Template",
        description: "Create a new email template.",
        nameLabel: "Template Name",
        namePlaceholder: "Enter template name",
        descLabel: "Description",
        descPlaceholder: "Brief description of your template",
        submitLabel: "Create Template",
    },
};

interface Client {
    id: string;
    name: string;
}

interface InitialData {
    id: string;
    name: string;
    description: string | null;
    client: { id: string };
}

interface CreateEntityDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entityType: EntityType;
    clientId?: string;
    initialData?: InitialData | null;
    onSuccess?: (entity: any) => void;
}

export function CreateEntityDialog({
    open,
    onOpenChange,
    entityType,
    clientId: initialClientId,
    initialData,
    onSuccess,
}: CreateEntityDialogProps) {
    const { t } = useI18n();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetchingClients, setFetchingClients] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);

    const isEdit = !!initialData;
    const config = entityConfigs[entityType];

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        clientId: initialClientId || "",
    });

    // Reset form when dialog opens/closes
    useEffect(() => {
        if (open) {
            if (initialData) {
                setFormData({
                    name: initialData.name,
                    description: initialData.description || "",
                    clientId: initialData.client.id,
                });
            } else {
                setFormData({
                    name: "",
                    description: "",
                    clientId: initialClientId || "",
                });
            }

            // Fetch clients if no initialClientId (allow editing to change client)
            if (!initialClientId) {
                fetchClients();
            }
        }
    }, [open, initialClientId, initialData]);

    const fetchClients = async () => {
        setFetchingClients(true);
        try {
            const res = await fetch("/api/clients");
            if (res.ok) {
                const data = await res.json();
                setClients(data);
            }
        } catch (error) {
            console.error("Failed to fetch clients", error);
        } finally {
            setFetchingClients(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name) {
            toast.error("Name is required");
            return;
        }
        // Client is optional for templates - they can be unassigned
        if (entityType !== "template" && !formData.clientId) {
            toast.error("Please select a client");
            return;
        }

        setLoading(true);
        try {
            const url = isEdit ? `${config.apiEndpoint}/${initialData.id}` : config.apiEndpoint;
            const method = isEdit ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    clientId: formData.clientId === "none" ? null : (formData.clientId || null),
                }),
            });

            if (res.ok) {
                const entity = await res.json();
                toast.success(t.common.success);
                onOpenChange(false);
                if (onSuccess) {
                    onSuccess(entity);
                }
                router.refresh();
            } else {
                const error = await res.text();
                toast.error(error || t.common.error);
            }
        } catch (error) {
            toast.error(t.common.error);
        } finally {
            setLoading(false);
        }
    };

    // Get translated labels with fallbacks
    const getTitle = () => {
        if (isEdit) {
            return config.titleEdit;
        }
        // Try to use i18n translations with fallback
        if (entityType === "campaign") return t.clients?.createCampaign || config.titleCreate;
        if (entityType === "audience") return t.audiences?.createAudience || config.titleCreate;
        if (entityType === "template") return t.clients?.createTemplate || config.titleCreate;
        return config.titleCreate;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{getTitle()}</DialogTitle>
                    <DialogDescription>{config.description}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {!initialClientId && (
                        <div className="space-y-2">
                            <Label htmlFor="clientId">
                                {t.common?.clients || "Client"}{entityType !== "template" && " *"}
                            </Label>
                            <Select
                                value={formData.clientId}
                                onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                                disabled={fetchingClients}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={fetchingClients ? t.common.loading : "Select a client"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {entityType === "template" && (
                                        <SelectItem value="none">
                                            {t.templates?.createDialog?.noClient || "No Client (Unassigned)"}
                                        </SelectItem>
                                    )}
                                    {clients.map((client) => (
                                        <SelectItem key={client.id} value={client.id}>
                                            {client.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="name">{config.nameLabel} *</Label>
                        <Input
                            id="name"
                            placeholder={config.namePlaceholder}
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">{config.descLabel}</Label>
                        <Textarea
                            id="description"
                            placeholder={config.descPlaceholder}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="resize-none"
                            rows={3}
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            {t.common.cancel}
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || (fetchingClients && !initialClientId && !isEdit) || (entityType !== "template" && !formData.clientId && !initialClientId && !isEdit)}
                            className="gap-2"
                        >
                            {loading && <Spinner className="h-4 w-4" />}
                            {isEdit ? t.common.save : config.submitLabel}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// Re-export convenience wrappers that match existing API for backwards compatibility
export function CreateCampaignDialog(props: Omit<CreateEntityDialogProps, "entityType"> & { onCampaignCreated?: (campaign: any) => void }) {
    return <CreateEntityDialog {...props} entityType="campaign" onSuccess={props.onCampaignCreated || props.onSuccess} />;
}

export function CreateAudienceDialog(props: Omit<CreateEntityDialogProps, "entityType">) {
    return <CreateEntityDialog {...props} entityType="audience" />;
}

export function CreateTemplateDialog(props: Omit<CreateEntityDialogProps, "entityType"> & { onTemplateCreated?: (template: any) => void }) {
    return <CreateEntityDialog {...props} entityType="template" onSuccess={props.onTemplateCreated || props.onSuccess} />;
}
