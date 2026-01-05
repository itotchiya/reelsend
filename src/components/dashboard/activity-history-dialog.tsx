"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Plus, Copy, FileEdit, Info } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface TemplateActivity {
    id: string;
    action: string;
    description: string | null;
    createdAt: string;
    user: {
        id: string;
        name: string | null;
        image: string | null;
    } | null;
}

interface ActivityHistoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    templateId: string;
    templateName: string;
}

const getActionIcon = (action: string) => {
    switch (action) {
        case "created":
            return <Plus className="h-4 w-4 text-green-500" />;
        case "duplicated":
            return <Copy className="h-4 w-4 text-blue-500" />;
        case "updated":
            return <FileEdit className="h-4 w-4 text-orange-500" />;
        default:
            return <Info className="h-4 w-4 text-gray-500" />;
    }
};

const getActionLabel = (action: string) => {
    switch (action) {
        case "created":
            return "Created";
        case "duplicated":
            return "Duplicated";
        case "updated":
            return "Updated";
        default:
            return action;
    }
};

export function ActivityHistoryDialog({
    open,
    onOpenChange,
    templateId,
    templateName,
}: ActivityHistoryDialogProps) {
    const [activities, setActivities] = useState<TemplateActivity[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (open && templateId) {
            fetchActivities();
        }
    }, [open, templateId]);

    const fetchActivities = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`/api/templates/${templateId}/activities`);
            if (!res.ok) throw new Error("Failed to load activity history");
            const data = await res.json();
            setActivities(data);
        } catch (err) {
            setError("Failed to load activities");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Activity History: {templateName}</DialogTitle>
                </DialogHeader>

                <ScrollArea className="h-[400px] w-full pr-4">
                    {loading ? (
                        <div className="flex h-[200px] items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : error ? (
                        <div className="flex h-[200px] items-center justify-center text-red-500">
                            {error}
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                            No activity recorded yet for this template.
                        </div>
                    ) : (
                        <div className="relative border-l border-border ml-3 my-4 space-y-6">
                            {activities.map((activity) => (
                                <div key={activity.id} className="relative pl-6">
                                    {/* Timeline Dot */}
                                    <div className="absolute -left-2 top-1 h-4 w-4 rounded-full border bg-background flex items-center justify-center shadow-sm">
                                        {getActionIcon(activity.action)}
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm">
                                                {getActionLabel(activity.action)}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {format(new Date(activity.createdAt), "PPP p", { locale: fr })}
                                            </span>
                                        </div>

                                        {activity.description && (
                                            <p className="text-sm text-foreground/80">
                                                {activity.description}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-2 mt-1">
                                            {activity.user?.image ? (
                                                <img
                                                    src={activity.user.image}
                                                    alt={activity.user?.name || "User"}
                                                    className="h-5 w-5 rounded-full"
                                                />
                                            ) : (
                                                <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">
                                                    {(activity.user?.name || "U")[0]}
                                                </div>
                                            )}
                                            <span className="text-xs text-muted-foreground">
                                                by {activity.user?.name || "Unknown User"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
