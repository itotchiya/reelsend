"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Plus } from "lucide-react";

interface Client {
    id: string;
    name: string;
}

interface CreateCampaignDialogProps {
    clients: Client[];
    trigger?: React.ReactNode;
}

export function CreateCampaignDialog({ clients, trigger }: CreateCampaignDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        clientId: "",
    });

    const isFormValid = formData.name.trim() !== "" && formData.clientId !== "";

    const handleSubmit = async () => {
        if (!isFormValid) return;

        setLoading(true);
        try {
            const response = await fetch("/api/campaigns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || "Failed to create campaign");
            }

            const campaign = await response.json();
            toast.success("Campaign created successfully");
            setOpen(false);
            router.push(`/dashboard/campaigns/${campaign.id}`);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Campaign
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Campaign</DialogTitle>
                    <DialogDescription>
                        Start a new email campaign. You can configure the template and audience later.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Campaign Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. Monthly Newsletter"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="client">Client</Label>
                        <Select
                            value={formData.clientId}
                            onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a client" />
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
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            placeholder="Brief description of this campaign..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || !isFormValid}>
                        {loading && <Spinner className="mr-2 h-4 w-4" />}
                        Create Campaign
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
