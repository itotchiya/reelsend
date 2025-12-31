"use client";

import { Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SavedBlock {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    jsonContent: any;
    thumbnail: string | null;
}

interface SavedBlocksPanelProps {
    savedBlocks: SavedBlock[];
    onDeleteBlock: (id: string) => Promise<void>;
}

export function SavedBlocksPanel({ savedBlocks, onDeleteBlock }: SavedBlocksPanelProps) {
    if (savedBlocks.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">No saved blocks yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                    Select a block in the editor and click "Save to Library" to create one
                </p>
            </div>
        );
    }

    // Group blocks by category
    const blocksByCategory = savedBlocks.reduce((acc, block) => {
        const category = block.category || "Uncategorized";
        if (!acc[category]) acc[category] = [];
        acc[category].push(block);
        return acc;
    }, {} as Record<string, SavedBlock[]>);

    return (
        <div className="space-y-4">
            {Object.entries(blocksByCategory).map(([category, blocks]) => (
                <div key={category}>
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2">
                        {category}
                    </h3>
                    <div className="space-y-2">
                        {blocks.map((block) => (
                            <div
                                key={block.id}
                                className="group relative border rounded-lg bg-background hover:bg-muted/50 transition-colors overflow-hidden"
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData("saved-block", JSON.stringify(block.jsonContent));
                                    e.dataTransfer.setData("saved-block-id", block.id);
                                }}
                            >
                                <div className="flex items-center p-2 gap-2">
                                    <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab" />

                                    {block.thumbnail ? (
                                        <div className="h-10 w-14 rounded bg-muted overflow-hidden flex-shrink-0">
                                            <img
                                                src={block.thumbnail}
                                                alt={block.name}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-10 w-14 rounded bg-gradient-to-br from-primary/20 to-primary/5 flex-shrink-0" />
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{block.name}</p>
                                        {block.description && (
                                            <p className="text-xs text-muted-foreground truncate">{block.description}</p>
                                        )}
                                    </div>

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete saved block?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete "{block.name}" from your library. This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => onDeleteBlock(block.id)}
                                                    className="bg-destructive hover:bg-destructive/90"
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
