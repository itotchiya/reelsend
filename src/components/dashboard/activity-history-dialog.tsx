"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { History, User as UserIcon, Calendar, Activity } from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

interface Activity {
    id: string;
    action: string;
    description: string | null;
    createdAt: string;
    user: {
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

export function ActivityHistoryDialog({
    open,
    onOpenChange,
    templateId,
    templateName,
}: ActivityHistoryDialogProps) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && templateId) {
            fetchActivities();
        }
    }, [open, templateId]);

    const fetchActivities = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/templates/${templateId}/activities`);
            if (res.ok) {
                const data = await res.json();
                setActivities(data);
            } else {
                toast.error("Failed to load activity history");
            }
        } catch (error) {
            console.error("Error fetching activities:", error);
            toast.error("Failed to load activity history");
        } finally {
            setLoading(false);
        }
    };

    const getActionLabel = (action: string) => {
        switch (action) {
            case "created":
                return "Created template";
            case "updated":
                return "Updated template content";
            case "details_updated":
                return "Updated template details";
            case "duplicated":
                return "Duplicated template";
            default:
                return action.replace(/_/g, " ");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Activity History
                    </DialogTitle>
                    <DialogDescription>
                        Recent changes and activities for "{templateName}"
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Spinner size="md" />
                        </div>
                    ) : activities.length > 0 ? (
                        <ScrollArea className="h-[400px] pr-4">
                            <div className="space-y-6">
                                {activities.map((activity) => (
                                    <div key={activity.id} className="relative pl-6 pb-2 border-l border-muted last:border-l-0">
                                        <div className="absolute left-[-5px] top-0 h-2.5 w-2.5 rounded-full bg-primary" />

                                        <div className="flex flex-col gap-1">
                                            <p className="text-sm font-medium leading-none">
                                                {getActionLabel(activity.action)}
                                            </p>

                                            {activity.description && (
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {activity.description}
                                                </p>
                                            )}

                                            <div className="flex items-center gap-4 mt-2">
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Calendar className="h-3 w-3" />
                                                    {format(new Date(activity.createdAt), "MMM d, yyyy 'at' h:mm a")}
                                                </div>

                                                {activity.user && (
                                                    <div className="flex items-center gap-1.5" title={activity.user.name || "Unknown user"}>
                                                        <Avatar className="h-4 w-4">
                                                            <AvatarImage src={activity.user.image || undefined} />
                                                            <AvatarFallback className="text-[9px]">
                                                                {activity.user.name?.charAt(0) || "U"}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                                                            {activity.user.name}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                            <Activity className="h-8 w-8 mb-2 opacity-50" />
                            <p>No activity recorded yet</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
