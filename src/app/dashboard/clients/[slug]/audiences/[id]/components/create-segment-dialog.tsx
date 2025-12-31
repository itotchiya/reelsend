"use client";

import { useState } from "react";
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
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

interface CreateSegmentDialogProps {
    audienceId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function CreateSegmentDialog({
    audienceId,
    open,
    onOpenChange,
    onSuccess
}: CreateSegmentDialogProps) {
    const { t } = useI18n();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        rules: {},
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name) {
            toast.error("Name is required");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/audiences/${audienceId}/segments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast.success(t.common.success);
                setFormData({ name: "", description: "", rules: {} });
                onSuccess();
                onOpenChange(false);
            } else {
                toast.error(t.common.error);
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
                    <DialogTitle>Create Segment</DialogTitle>
                    <DialogDescription>
                        Define a group of contacts based on filter rules.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">{t.common.name} *</Label>
                        <Input
                            id="name"
                            placeholder="e.g. Active Customers"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">{t.common.description}</Label>
                        <Textarea
                            id="description"
                            placeholder="Optional description for this segment"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="p-4 rounded-lg bg-muted/50 border border-dashed">
                        <p className="text-sm font-medium mb-1">Filter Rules (MVP)</p>
                        <p className="text-xs text-muted-foreground">
                            Dynamic rule builder coming soon. For now, segments will group all contacts by default.
                        </p>
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
                        <Button type="submit" disabled={loading} className="gap-2">
                            {loading && <Spinner className="h-4 w-4" />}
                            Create Segment
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
