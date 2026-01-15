"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Trash2,
    GripVertical,
    Plus,
    Type,
    Image as ImageIcon,
    Square,
    Minus,
    Save,
    Upload,
    Edit3,
    MoveUp,
    MoveDown,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EmailBlock {
    id: string;
    type: "text" | "image" | "button" | "divider" | "spacer" | "columns";
    content: any;
}

interface EmailCanvasProps {
    initialContent: any;
    brandColors: any;
    onContentChange: (json: any, html: string) => void;
    onImageUpload: (file: File) => Promise<string>;
    onSaveBlock: (blockJson: any, name: string, category?: string) => Promise<void>;
}

export function EmailCanvas({
    initialContent,
    brandColors,
    onContentChange,
    onImageUpload,
    onSaveBlock,
}: EmailCanvasProps) {
    const [blocks, setBlocks] = useState<EmailBlock[]>(() => {
        if (initialContent?.blocks && Array.isArray(initialContent.blocks)) {
            return initialContent.blocks;
        }
        return [];
    });
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [blockToSave, setBlockToSave] = useState<EmailBlock | null>(null);
    const [saveName, setSaveName] = useState("");
    const [saveCategory, setSaveCategory] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null);

    // Generate unique ID
    const generateId = () => `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Update parent when blocks change
    useEffect(() => {
        const json = { blocks };
        const html = generateHtml(blocks, brandColors);
        onContentChange(json, html);
    }, [blocks, brandColors, onContentChange]);

    // Handle dropping a block
    const handleDrop = useCallback((e: React.DragEvent, insertIndex?: number) => {
        e.preventDefault();
        const blockType = e.dataTransfer.getData("block-type");
        const savedBlockData = e.dataTransfer.getData("saved-block");

        if (blockType) {
            const newBlock = createBlock(blockType);
            if (insertIndex !== undefined) {
                setBlocks(prev => [
                    ...prev.slice(0, insertIndex),
                    newBlock,
                    ...prev.slice(insertIndex)
                ]);
            } else {
                setBlocks(prev => [...prev, newBlock]);
            }
            setSelectedBlockId(newBlock.id);
        } else if (savedBlockData) {
            try {
                const savedContent = JSON.parse(savedBlockData);
                if (savedContent.blocks) {
                    const newBlocks = savedContent.blocks.map((b: EmailBlock) => ({
                        ...b,
                        id: generateId()
                    }));
                    if (insertIndex !== undefined) {
                        setBlocks(prev => [
                            ...prev.slice(0, insertIndex),
                            ...newBlocks,
                            ...prev.slice(insertIndex)
                        ]);
                    } else {
                        setBlocks(prev => [...prev, ...newBlocks]);
                    }
                }
            } catch (error) {
                console.error("Failed to parse saved block", error);
            }
        }
    }, []);

    // Create a new block based on type
    const createBlock = (type: string): EmailBlock => {
        const id = generateId();
        switch (type) {
            case "text":
                return { id, type: "text", content: { text: "Click to edit text...", align: "left" } };
            case "image":
                return { id, type: "image", content: { src: "", alt: "Image", width: "100%" } };
            case "button":
                return {
                    id,
                    type: "button",
                    content: {
                        text: "Click Here",
                        url: "#",
                        backgroundColor: brandColors?.primary || "#6366f1",
                        textColor: "#ffffff",
                        align: "center",
                    }
                };
            case "divider":
                return { id, type: "divider", content: { color: "#e5e7eb", thickness: 1 } };
            case "spacer":
                return { id, type: "spacer", content: { height: 20 } };
            default:
                return { id, type: "text", content: { text: "New block" } };
        }
    };

    // Update block content
    const updateBlock = (blockId: string, newContent: any) => {
        setBlocks(prev => prev.map(b =>
            b.id === blockId ? { ...b, content: { ...b.content, ...newContent } } : b
        ));
    };

    // Delete block
    const deleteBlock = (blockId: string) => {
        setBlocks(prev => prev.filter(b => b.id !== blockId));
        setSelectedBlockId(null);
    };

    // Move block up/down
    const moveBlock = (blockId: string, direction: "up" | "down") => {
        setBlocks(prev => {
            const index = prev.findIndex(b => b.id === blockId);
            if (index === -1) return prev;
            if (direction === "up" && index === 0) return prev;
            if (direction === "down" && index === prev.length - 1) return prev;

            const newBlocks = [...prev];
            const swapIndex = direction === "up" ? index - 1 : index + 1;
            [newBlocks[index], newBlocks[swapIndex]] = [newBlocks[swapIndex], newBlocks[index]];
            return newBlocks;
        });
    };

    // Handle image upload for a specific block
    const handleImageUploadClick = (blockId: string) => {
        setUploadingBlockId(blockId);
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !uploadingBlockId) return;

        try {
            const url = await onImageUpload(file);
            updateBlock(uploadingBlockId, { src: url });
            toast.success("Image uploaded successfully");
        } catch (error) {
            toast.error("Failed to upload image");
        } finally {
            setUploadingBlockId(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    // Open save dialog for a block
    const handleSaveBlockClick = (block: EmailBlock) => {
        setBlockToSave(block);
        setSaveName("");
        setSaveCategory("");
        setSaveDialogOpen(true);
    };

    // Save block to library
    const handleSaveBlockConfirm = async () => {
        if (!blockToSave || !saveName) return;

        await onSaveBlock({ blocks: [blockToSave] }, saveName, saveCategory || undefined);
        setSaveDialogOpen(false);
        setBlockToSave(null);
    };

    return (
        <div className="min-h-[600px] relative">
            {/* Hidden file input for image uploads */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />

            {/* Drop zone */}
            <div
                className={cn(
                    "min-h-[600px] p-6",
                    blocks.length === 0 && "flex items-center justify-center"
                )}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e)}
            >
                {blocks.length === 0 ? (
                    <div className="text-center text-muted-foreground">
                        <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                            <Plus className="h-8 w-8" />
                        </div>
                        <p className="font-medium">Drag blocks here to start building</p>
                        <p className="text-sm">Or drag saved blocks from your library</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {blocks.map((block, index) => (
                            <div
                                key={block.id}
                                className={cn(
                                    "group relative border rounded-lg transition-all",
                                    selectedBlockId === block.id
                                        ? "border-primary ring-2 ring-primary/20"
                                        : "border-transparent hover:border-muted-foreground/30"
                                )}
                                onClick={() => setSelectedBlockId(block.id)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.stopPropagation();
                                    handleDrop(e, index);
                                }}
                            >
                                {/* Block Toolbar */}
                                <div className={cn(
                                    "absolute -top-8 left-0 right-0 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity z-10",
                                    selectedBlockId === block.id && "opacity-100"
                                )}>
                                    <div className="flex items-center gap-1 bg-background border rounded-md shadow-none p-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                            onClick={(e) => { e.stopPropagation(); moveBlock(block.id, "up"); }}
                                        >
                                            <MoveUp className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                            onClick={(e) => { e.stopPropagation(); moveBlock(block.id, "down"); }}
                                        >
                                            <MoveDown className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-1 bg-background border rounded-md shadow-none p-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                            onClick={(e) => { e.stopPropagation(); handleSaveBlockClick(block); }}
                                        >
                                            <Save className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                            onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Block Content */}
                                <div className="p-4">
                                    {block.type === "text" && (
                                        <Textarea
                                            value={block.content.text}
                                            onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                                            className="min-h-[60px] resize-none border-none focus-visible:ring-0 p-0 text-base"
                                            placeholder="Enter text..."
                                            style={{ textAlign: block.content.align }}
                                        />
                                    )}

                                    {block.type === "image" && (
                                        <div className="text-center">
                                            {block.content.src ? (
                                                <div className="relative group/img">
                                                    <img
                                                        src={block.content.src}
                                                        alt={block.content.alt}
                                                        className="max-w-full mx-auto rounded"
                                                        style={{ width: block.content.width }}
                                                    />
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        className="absolute top-2 right-2 opacity-0 group-hover/img:opacity-100 transition-opacity"
                                                        onClick={() => handleImageUploadClick(block.id)}
                                                    >
                                                        <Edit3 className="h-4 w-4 mr-1" />
                                                        Change
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    className="py-8 px-12"
                                                    onClick={() => handleImageUploadClick(block.id)}
                                                >
                                                    <Upload className="h-5 w-5 mr-2" />
                                                    Upload Image
                                                </Button>
                                            )}
                                        </div>
                                    )}

                                    {block.type === "button" && (
                                        <div style={{ textAlign: block.content.align as any }}>
                                            <div className="inline-flex flex-col gap-2 items-center">
                                                <button
                                                    className="px-6 py-3 rounded-md font-medium transition-colors cursor-pointer"
                                                    style={{
                                                        backgroundColor: block.content.backgroundColor,
                                                        color: block.content.textColor,
                                                    }}
                                                    onClick={(e) => e.preventDefault()}
                                                >
                                                    <Input
                                                        value={block.content.text}
                                                        onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                                                        className="bg-transparent border-none text-center p-0 h-auto focus-visible:ring-0"
                                                        style={{ color: block.content.textColor }}
                                                    />
                                                </button>
                                                <Input
                                                    value={block.content.url}
                                                    onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                                                    placeholder="Button URL"
                                                    className="max-w-xs text-xs h-7"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {block.type === "divider" && (
                                        <hr
                                            style={{
                                                borderColor: block.content.color,
                                                borderWidth: block.content.thickness,
                                            }}
                                        />
                                    )}

                                    {block.type === "spacer" && (
                                        <div
                                            style={{ height: block.content.height }}
                                            className="bg-muted/30 rounded flex items-center justify-center"
                                        >
                                            <span className="text-xs text-muted-foreground">
                                                {block.content.height}px spacer
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Save Block Dialog */}
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Save Block to Library</DialogTitle>
                        <DialogDescription>
                            Save this block to reuse in other templates.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="block-name">Block Name *</Label>
                            <Input
                                id="block-name"
                                value={saveName}
                                onChange={(e) => setSaveName(e.target.value)}
                                placeholder="e.g., Company Footer"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="block-category">Category</Label>
                            <Select value={saveCategory} onValueChange={setSaveCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="headers">Headers</SelectItem>
                                    <SelectItem value="footers">Footers</SelectItem>
                                    <SelectItem value="cta">Call to Action</SelectItem>
                                    <SelectItem value="content">Content</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveBlockConfirm} disabled={!saveName}>
                            Save Block
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Generate HTML from blocks
function generateHtml(blocks: EmailBlock[], brandColors: any): string {
    const primaryColor = brandColors?.primary || "#6366f1";

    const blockHtml = blocks.map(block => {
        switch (block.type) {
            case "text":
                return `<p style="margin: 0; padding: 16px 0; text-align: ${block.content.align || 'left'};">${escapeHtml(block.content.text)}</p>`;
            case "image":
                if (!block.content.src) return "";
                return `<img src="${block.content.src}" alt="${escapeHtml(block.content.alt || '')}" style="max-width: 100%; width: ${block.content.width}; display: block; margin: 0 auto;" />`;
            case "button":
                return `<table cellpadding="0" cellspacing="0" border="0" style="margin: 16px ${block.content.align === 'center' ? 'auto' : block.content.align === 'right' ? '0 0 auto' : 'auto 0 0'};">
                    <tr>
                        <td style="background-color: ${block.content.backgroundColor}; padding: 12px 24px; border-radius: 6px;">
                            <a href="${block.content.url}" style="color: ${block.content.textColor}; text-decoration: none; font-weight: 500;">${escapeHtml(block.content.text)}</a>
                        </td>
                    </tr>
                </table>`;
            case "divider":
                return `<hr style="border: none; border-top: ${block.content.thickness}px solid ${block.content.color}; margin: 16px 0;" />`;
            case "spacer":
                return `<div style="height: ${block.content.height}px;"></div>`;
            default:
                return "";
        }
    }).join("\n");

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.5; color: #333; }
        img { max-width: 100%; height: auto; }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                    <tr>
                        <td style="padding: 32px;">
                            ${blockHtml}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/\n/g, "<br>");
}
