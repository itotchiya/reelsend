"use client";

import React from "react";
import { useEmailEditorStore } from "@/lib/email-editor/store";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

export function GlobalSettingsPanel() {
    const { email, updateGlobalSettings } = useEmailEditorStore();
    const settings = email.settings;

    const handleChange = (key: string, value: any) => {
        updateGlobalSettings({ [key]: value });
    };

    const handlePaddingChange = (side: string, value: number) => {
        updateGlobalSettings({
            padding: { ...settings.padding, [side]: value }
        });
    };

    return (
        <div className="p-4 space-y-6">
            <div className="space-y-2">
                <Label>Background Color</Label>
                <div className="flex gap-2">
                    <Input
                        type="color"
                        value={settings.backgroundColor}
                        onChange={(e) => handleChange("backgroundColor", e.target.value)}
                        className="w-10 h-10 p-1 rounded cursor-pointer"
                    />
                    <Input
                        type="text"
                        value={settings.backgroundColor}
                        onChange={(e) => handleChange("backgroundColor", e.target.value)}
                        className="flex-1"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Max Width (px)</Label>
                <div className="flex items-center gap-4">
                    <Slider
                        value={[settings.maxWidth]}
                        min={300}
                        max={1200}
                        step={10}
                        onValueChange={(vals: number[]) => handleChange("maxWidth", vals[0])}
                        className="flex-1"
                    />
                    <span className="text-sm w-12 text-right">{settings.maxWidth}</span>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Default Text Color</Label>
                <div className="flex gap-2">
                    <Input
                        type="color"
                        value={settings.textColor}
                        onChange={(e) => handleChange("textColor", e.target.value)}
                        className="w-10 h-10 p-1 rounded cursor-pointer"
                    />
                    <Input
                        type="text"
                        value={settings.textColor}
                        onChange={(e) => handleChange("textColor", e.target.value)}
                        className="flex-1"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Font Family</Label>
                <select
                    className="w-full flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={settings.fontFamily}
                    onChange={(e) => handleChange("fontFamily", e.target.value)}
                >
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="'Helvetica Neue', Helvetica, sans-serif">Helvetica</option>
                    <option value="'Courier New', Courier, monospace">Courier New</option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="'Times New Roman', Times, serif">Times New Roman</option>
                    <option value="Verdana, Geneva, sans-serif">Verdana</option>
                    <option value="'Open Sans', sans-serif">Open Sans</option>
                    <option value="'Roboto', sans-serif">Roboto</option>
                    <option value="'Inter', sans-serif">Inter</option>
                </select>
            </div>
        </div>
    );
}
