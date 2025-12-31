"use client";

import React from "react";
import { useEmailEditorStore } from "@/lib/email-editor/store";
import { GlobalSettingsPanel } from "./settings/global-settings";
import { RowSettingsPanel } from "./settings/row-settings";
import { ColumnSettingsPanel } from "./settings/column-settings";
import { BlockSettingsPanel } from "./settings/block-settings";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export function SettingsPanel() {
    const { selectedId, email } = useEmailEditorStore();

    // Find the selected element and its type
    let selectedElement: any = null;
    let type: "global" | "row" | "column" | "block" = "global";

    if (selectedId) {
        // Check rows
        const row = email.rows.find((r) => r.id === selectedId);
        if (row) {
            selectedElement = row;
            type = "row";
        }

        if (!selectedElement) {
            // Check columns and blocks
            email.rows.forEach((row) => {
                const col = row.columns.find((c) => c.id === selectedId);
                if (col) {
                    selectedElement = col;
                    type = "column";
                }

                const block = row.columns.flatMap(c => c.blocks).find(b => b.id === selectedId);
                if (block) {
                    selectedElement = block;
                    type = "block";
                }
            });
        }
    }

    const renderPanel = () => {
        switch (type) {
            case "row":
                return <RowSettingsPanel row={selectedElement} />;
            case "column":
                return <ColumnSettingsPanel column={selectedElement} />;
            case "block":
                return <BlockSettingsPanel block={selectedElement} />;
            default:
                return <GlobalSettingsPanel />;
        }
    };

    return (
        <div className="w-80 border-l bg-background flex flex-col h-full">
            <div className="p-4 border-b flex items-center justify-between">
                <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                    {type === "global" ? "Global Settings" : `${type} Settings`}
                </h2>
            </div>
            <ScrollArea className="flex-1">
                {renderPanel()}
            </ScrollArea>
        </div>
    );
}
