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

interface Client {
    id: string;
    name: string;
}

interface CreateTemplateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId?: string;
}

export function CreateTemplateDialog({
    open,
    onOpenChange,
    clientId: initialClientId
}: CreateTemplateDialogProps) {
    const { t } = useI18n();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetchingClients, setFetchingClients] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        clientId: initialClientId || "",
    });

    useEffect(() => {
        if (open) {
            setFormData({
                name: "",
                description: "",
                clientId: initialClientId || "",
            });

            if (!initialClientId) {
                fetchClients();
            }
        }
    }, [open, initialClientId]);

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
        if (!formData.clientId) {
            toast.error("Please select a client");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/templates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                const template = await res.json();
                toast.success(t.common.success);
                onOpenChange(false);
                router.push(`/dashboard/templates/${template.id}/editor`);
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create Email Template</DialogTitle>
                    <DialogDescription>
                        Set up the basic details for your new email template.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {!initialClientId && (
                        <div className="space-y-2">
                            <Label htmlFor="clientId">Client *</Label>
                            <Select
                                value={formData.clientId}
                                onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                                disabled={fetchingClients}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={fetchingClients ? t.common.loading : "Select a client"} />
                                </SelectTrigger>
                                <SelectContent>
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
                        <Label htmlFor="name">Template Name *</Label>
                        <Input
                            id="name"
                            placeholder="e.g., Welcome Email"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Briefly describe what this template is for..."
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
                        <Button type="submit" disabled={loading || (fetchingClients && !initialClientId)} className="gap-2">
                            {loading && <Spinner className="h-4 w-4" />}
                            Create Template
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
