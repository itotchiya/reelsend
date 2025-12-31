"use client";

import React from "react";
import { useEmailEditorStore } from "@/lib/email-editor/store";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Block } from "@/lib/email-editor/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BlockSettingsPanelProps {
    block: Block;
}

export function BlockSettingsPanel({ block }: BlockSettingsPanelProps) {
    const { email, dispatch } = useEmailEditorStore();

    const updateBlock = (updates: Partial<Block>) => {
        const nextDoc = JSON.parse(JSON.stringify(email));
        nextDoc.rows.forEach((row: any) => {
            row.columns.forEach((col: any) => {
                const bIndex = col.blocks.findIndex((b: any) => b.id === block.id);
                if (bIndex !== -1) {
                    col.blocks[bIndex] = { ...col.blocks[bIndex], ...updates };
                }
            });
        });
        dispatch({ type: "SET_DOCUMENT", document: nextDoc });
    };

    const updateContent = (updates: any) => {
        updateBlock({ content: { ...block.content, ...updates } });
    };

    const updateStyles = (updates: any) => {
        updateBlock({ styles: { ...block.styles, ...updates } });
    };

    return (
        <div className="p-4 flex flex-col gap-6">
            <Tabs defaultValue="content" className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="style">Style</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-6 pt-4">
                    {block.type === "heading" || block.type === "paragraph" ? (
                        <div className="space-y-2">
                            <Label>Text Content</Label>
                            <textarea
                                className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={block.content.text || ""}
                                onChange={(e) => updateContent({ text: e.target.value })}
                            />
                        </div>
                    ) : null}

                    {block.type === "button" ? (
                        <>
                            <div className="space-y-2">
                                <Label>Button Text</Label>
                                <Input
                                    value={block.content.text || ""}
                                    onChange={(e) => updateContent({ text: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>URL</Label>
                                <Input
                                    value={block.content.url || ""}
                                    onChange={(e) => updateContent({ url: e.target.value })}
                                />
                            </div>
                        </>
                    ) : null}

                    {block.type === "image" ? (
                        <div className="space-y-2">
                            <Label>Image URL</Label>
                            <Input
                                value={block.content.src || ""}
                                onChange={(e) => updateContent({ src: e.target.value })}
                            />
                        </div>
                    ) : null}

                    {block.type === "social" ? (
                        <div className="space-y-4">
                            <Label>Social Links</Label>
                            {/* Logic for adding/editing social icons would go here */}
                            <p className="text-xs text-muted-foreground italic">Edit links in JSON mode or via dedicated picker (coming soon)</p>
                        </div>
                    ) : null}

                    {block.type === "video" ? (
                        <div className="space-y-2">
                            <Label>Thumbnail URL</Label>
                            <Input
                                value={block.content.thumbnail || ""}
                                onChange={(e) => updateContent({ thumbnail: e.target.value })}
                            />
                            <Label>Video URL</Label>
                            <Input
                                value={block.content.url || ""}
                                onChange={(e) => updateContent({ url: e.target.value })}
                            />
                        </div>
                    ) : null}

                    {block.type === "html" ? (
                        <div className="space-y-2">
                            <Label>Custom HTML</Label>
                            <textarea
                                className="w-full min-h-[150px] font-mono text-xs rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={block.content.html || ""}
                                onChange={(e) => updateContent({ html: e.target.value })}
                            />
                        </div>
                    ) : null}
                </TabsContent>

                <TabsContent value="style" className="space-y-6 pt-4">
                    {/* General styles like padding, alignment */}
                    <div className="space-y-2">
                        <Label>Alignment</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {["left", "center", "right"].map((align) => (
                                <button
                                    key={align}
                                    onClick={() => updateContent({ align })}
                                    className={`p-2 border rounded text-xs capitalize ${block.content.align === align ? "bg-primary text-primary-foreground" : ""
                                        }`}
                                >
                                    {align}
                                </button>
                            ))}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
