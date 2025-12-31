"use client";

import React from "react";
import { useEmailEditorStore } from "@/lib/email-editor/store";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Column } from "@/lib/email-editor/types";
import { Slider } from "@/components/ui/slider";

interface ColumnSettingsPanelProps {
    column: Column;
}

export function ColumnSettingsPanel({ column }: ColumnSettingsPanelProps) {
    const { email, dispatch } = useEmailEditorStore();

    const updateColumn = (updates: Partial<Column>) => {
        const nextDoc = JSON.parse(JSON.stringify(email));
        nextDoc.rows.forEach((row: any) => {
            const colIndex = row.columns.findIndex((c: any) => c.id === column.id);
            if (colIndex !== -1) {
                row.columns[colIndex] = { ...row.columns[colIndex], ...updates };
            }
        });
        dispatch({ type: "SET_DOCUMENT", document: nextDoc });
    };

    const updateStyles = (updates: any) => {
        updateColumn({ styles: { ...column.styles, ...updates } });
    };

    return (
        <div className="p-4 space-y-6">
            <div className="space-y-4">
                <Label className="text-xs uppercase text-muted-foreground">Layout</Label>

                <div className="space-y-2">
                    <Label>Width (%)</Label>
                    <div className="flex items-center gap-4">
                        <Slider
                            value={[column.width]}
                            min={10}
                            max={100}
                            step={1}
                            onValueChange={(vals) => updateColumn({ width: vals[0] })}
                            className="flex-1"
                        />
                        <span className="text-sm w-12 text-right">{column.width}%</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Vertical Alignment</Label>
                    <div className="grid grid-cols-3 gap-2">
                        {["top", "middle", "bottom"].map((align) => (
                            <button
                                key={align}
                                onClick={() => updateStyles({ verticalAlign: align === "middle" ? "middle" : align })}
                                className={`p-2 border rounded text-xs capitalize ${column.styles.verticalAlign === align ? "bg-primary text-primary-foreground" : ""
                                    }`}
                            >
                                {align}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <Label className="text-xs uppercase text-muted-foreground">Spacing</Label>
                <div className="space-y-2">
                    <Label>Background Color</Label>
                    <div className="flex gap-2">
                        <Input
                            type="color"
                            value={column.styles.backgroundColor || "transparent"}
                            onChange={(e) => updateStyles({ backgroundColor: e.target.value })}
                            className="w-10 h-10 p-1"
                        />
                        <Input
                            type="text"
                            value={column.styles.backgroundColor || "transparent"}
                            onChange={(e) => updateStyles({ backgroundColor: e.target.value })}
                            className="flex-1"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
