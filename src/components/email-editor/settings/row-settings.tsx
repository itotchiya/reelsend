"use client";

import React from "react";
import { useEmailEditorStore } from "@/lib/email-editor/store";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Row } from "@/lib/email-editor/types";

interface RowSettingsPanelProps {
    row: Row;
}

export function RowSettingsPanel({ row }: RowSettingsPanelProps) {
    const { email, dispatch } = useEmailEditorStore();

    const updateRow = (updates: Partial<Row>) => {
        const nextDoc = JSON.parse(JSON.stringify(email));
        const rowIndex = nextDoc.rows.findIndex((r: Row) => r.id === row.id);
        if (rowIndex !== -1) {
            nextDoc.rows[rowIndex] = { ...nextDoc.rows[rowIndex], ...updates };
            dispatch({ type: "SET_DOCUMENT", document: nextDoc });
        }
    };

    const updateStyles = (updates: any) => {
        updateRow({ styles: { ...row.styles, ...updates } });
    };

    return (
        <div className="p-4 space-y-6">
            <div className="space-y-4">
                <Label className="text-xs uppercase text-muted-foreground">Appearance</Label>

                <div className="space-y-2">
                    <Label>Background Color</Label>
                    <div className="flex gap-2">
                        <Input
                            type="color"
                            value={row.styles.backgroundColor || "#ffffff"}
                            onChange={(e) => updateStyles({ backgroundColor: e.target.value })}
                            className="w-10 h-10 p-1"
                        />
                        <Input
                            type="text"
                            value={row.styles.backgroundColor || "#ffffff"}
                            onChange={(e) => updateStyles({ backgroundColor: e.target.value })}
                            className="flex-1"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Padding</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <span className="text-[10px] text-muted-foreground">Top/Bottom</span>
                            <Input
                                type="number"
                                value={parseInt(row.styles.padding?.split(" ")[0]) || 20}
                                onChange={(e) => updateStyles({ padding: `${e.target.value}px 0` })}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
