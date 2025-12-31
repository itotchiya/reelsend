"use client";

import React, { useCallback } from "react";
import {
    DndContext,
    DragOverlay,
    closestCenter,
    rectIntersection,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    useDroppable,
    DragStartEvent,
    DragEndEvent,
    DefaultAnnouncements,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useEmailEditorStore } from "@/lib/email-editor/store";
import { cn } from "@/lib/utils";
import { RowRenderer } from "./renderers/row-renderer";
import { moveItem, createInitialRow, createInitialBlock } from "@/lib/email-editor/utils";

export function EmailEditorEngine() {
    const { document, draggedId, dispatch } = useEmailEditorStore();

    const { setNodeRef: setCanvasRef, isOver: isCanvasOver } = useDroppable({
        id: "canvas",
        data: {
            type: "canvas",
        },
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        dispatch({ type: "SET_DRAGGED", id: event.active.id as string });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        dispatch({ type: "SET_DRAGGED", id: null });

        if (!over) return;

        if (active.data.current?.isSidebar) {
            const type = active.data.current.type as any;
            const isRow = type.includes("layout");

            const newDoc = JSON.parse(JSON.stringify(document));
            if (isRow) {
                const colCount = parseInt(type.split("-")[0]) || 1;
                const newRow = createInitialRow(colCount);

                // If dropped over another row, insert before it
                const overRowIndex = newDoc.rows.findIndex((r: any) => r.id === over.id);
                if (overRowIndex !== -1) {
                    newDoc.rows.splice(overRowIndex, 0, newRow);
                } else if (over.id === "canvas" || over.data.current?.type === "canvas") {
                    newDoc.rows.push(newRow);
                } else {
                    // Default to appending if it's a sidebar row drop but we can't find exact target
                    newDoc.rows.push(newRow);
                }
            } else {
                // Find column or block dropped over
                let targetColId = over.id as string;
                if (over.data.current?.type === "block") {
                    // Find column containing this block
                    newDoc.rows.forEach((r: any) => {
                        r.columns.forEach((c: any) => {
                            if (c.blocks.some((b: any) => b.id === over.id)) {
                                targetColId = c.id;
                            }
                        });
                    });
                }

                const column = newDoc.rows.flatMap((r: any) => r.columns).find((c: any) => c.id === targetColId);
                if (column) {
                    // If dropped over a block, insert at its position
                    const bIndex = column.blocks.findIndex((b: any) => b.id === over.id);
                    if (bIndex !== -1) {
                        column.blocks.splice(bIndex, 0, createInitialBlock(type));
                    } else {
                        column.blocks.push(createInitialBlock(type));
                    }
                }
            }
            dispatch({ type: "SET_DOCUMENT", document: newDoc });
            return;
        }

        // Handle existing item moves
        if (over.id === "canvas") return; // Can't "move" to canvas itself

        if (active.id !== over.id) {
            const newDoc = moveItem(document, active.id as string, over.id as string);
            dispatch({ type: "SET_DOCUMENT", document: newDoc });
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={rectIntersection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex-1 bg-muted/30 overflow-auto p-8 min-h-screen">
                <div
                    ref={setCanvasRef}
                    className={cn(
                        "mx-auto bg-background shadow-xl rounded-lg overflow-hidden transition-all duration-300 relative min-h-[400px]",
                        isCanvasOver && document.rows.length === 0 && "ring-2 ring-primary ring-inset"
                    )}
                    style={{
                        maxWidth: document.settings.maxWidth,
                        backgroundColor: document.settings.canvasColor,
                        padding: `${document.settings.padding.top}px ${document.settings.padding.right}px ${document.settings.padding.bottom}px ${document.settings.padding.left}px`,
                    }}
                >
                    {document.rows.length === 0 ? (
                        <div className="py-20 text-center border-2 border-dashed rounded-lg border-muted-foreground/20">
                            <p className="text-muted-foreground">Drag a row layout here to start</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {document.rows.map((row) => (
                                <RowRenderer key={row.id} row={row} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <DragOverlay>
                {draggedId ? (
                    <div className="bg-primary/10 border-2 border-primary rounded p-4 shadow-lg">
                        Dragging {draggedId}
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
