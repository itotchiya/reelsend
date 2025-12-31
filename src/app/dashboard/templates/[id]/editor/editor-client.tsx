"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Save,
    Eye,
    Loader2,
    Smartphone,
    Monitor,
    Tags,
    Blocks,
    Upload,
    ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { getMergeTagsByCategory, MergeTag } from "@/lib/email-builder/merge-tags";
import { SavedBlocksPanel } from "@/components/email-builder/saved-blocks-panel";
import { EmailCanvas } from "@/components/email-builder/email-canvas";

interface Template {
    id: string;
    name: string;
    description: string | null;
    htmlContent: string;
    jsonContent: any;
    client: {
        id: string;
        name: string;
        logo: string | null;
        brandColors: any;
        fonts: any;
    };
}

interface SavedBlock {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    jsonContent: any;
    thumbnail: string | null;
}

interface EmailEditorClientProps {
    template: Template;
    savedBlocks: SavedBlock[];
}

export function EmailEditorClient({ template, savedBlocks: initialSavedBlocks }: EmailEditorClientProps) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
    const [showPreview, setShowPreview] = useState(false);
    const [sidebarTab, setSidebarTab] = useState<"blocks" | "saved" | "merge">("blocks");
    const [savedBlocks, setSavedBlocks] = useState<SavedBlock[]>(initialSavedBlocks);
    const [hasChanges, setHasChanges] = useState(false);

    // Email content state
    const [jsonContent, setJsonContent] = useState<any>(template.jsonContent || getDefaultContent());
    const [htmlContent, setHtmlContent] = useState(template.htmlContent || "");

    const mergeTagsByCategory = getMergeTagsByCategory();

    // Handle content changes
    const handleContentChange = useCallback((newJson: any, newHtml: string) => {
        setJsonContent(newJson);
        setHtmlContent(newHtml);
        setHasChanges(true);
    }, []);

    // Save template
    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/templates/${template.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    htmlContent,
                    jsonContent,
                }),
            });

            if (res.ok) {
                toast.success("Template saved successfully");
                setHasChanges(false);
            } else {
                toast.error("Failed to save template");
            }
        } catch (error) {
            toast.error("Failed to save template");
        } finally {
            setSaving(false);
        }
    };

    // Insert merge tag at cursor
    const insertMergeTag = (tag: MergeTag) => {
        // Copy to clipboard for easy paste
        navigator.clipboard.writeText(tag.value);
        toast.success(`Copied "${tag.name}" to clipboard`);
    };

    // Handle image upload
    const handleImageUpload = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("templateId", template.id);

        const res = await fetch("/api/upload/email-asset", {
            method: "POST",
            body: formData,
        });

        if (!res.ok) {
            throw new Error("Upload failed");
        }

        const data = await res.json();
        return data.url;
    };

    // Save block to library
    const handleSaveBlock = async (blockJson: any, name: string, category?: string) => {
        try {
            const res = await fetch("/api/saved-blocks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    category,
                    jsonContent: blockJson,
                    clientId: template.client.id,
                }),
            });

            if (res.ok) {
                const newBlock = await res.json();
                setSavedBlocks([newBlock, ...savedBlocks]);
                toast.success("Block saved to library");
            } else {
                toast.error("Failed to save block");
            }
        } catch (error) {
            toast.error("Failed to save block");
        }
    };

    // Warn before leaving with unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasChanges) {
                e.preventDefault();
                e.returnValue = "";
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [hasChanges]);

    return (
        <div className="h-screen flex flex-col bg-background">
            {/* Header */}
            <header className="h-14 border-b flex items-center justify-between px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            if (hasChanges) {
                                if (confirm("You have unsaved changes. Are you sure you want to leave?")) {
                                    router.push("/dashboard/templates");
                                }
                            } else {
                                router.push("/dashboard/templates");
                            }
                        }}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <div className="h-4 w-px bg-border" />
                    <div>
                        <h1 className="font-semibold text-sm">{template.name}</h1>
                        <p className="text-xs text-muted-foreground">{template.client.name}</p>
                    </div>
                    {hasChanges && (
                        <span className="text-xs text-orange-500 font-medium">Unsaved changes</span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Preview Mode Toggle */}
                    <div className="flex items-center border rounded-lg p-1 bg-muted/30">
                        <Button
                            variant={previewMode === "desktop" ? "secondary" : "ghost"}
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => setPreviewMode("desktop")}
                        >
                            <Monitor className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={previewMode === "mobile" ? "secondary" : "ghost"}
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => setPreviewMode("mobile")}
                        >
                            <Smartphone className="h-4 w-4" />
                        </Button>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPreview(!showPreview)}
                    >
                        <Eye className="h-4 w-4 mr-2" />
                        {showPreview ? "Edit" : "Preview"}
                    </Button>

                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                        className="gap-2"
                    >
                        {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Save
                    </Button>
                </div>
            </header>

            {/* Main Editor Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar - Tools */}
                <aside className="w-64 border-r bg-muted/20 flex flex-col">
                    {/* Sidebar Tabs */}
                    <div className="border-b p-2 flex gap-1">
                        <Button
                            variant={sidebarTab === "blocks" ? "secondary" : "ghost"}
                            size="sm"
                            className="flex-1 gap-2"
                            onClick={() => setSidebarTab("blocks")}
                        >
                            <Blocks className="h-4 w-4" />
                            Blocks
                        </Button>
                        <Button
                            variant={sidebarTab === "saved" ? "secondary" : "ghost"}
                            size="sm"
                            className="flex-1 gap-2"
                            onClick={() => setSidebarTab("saved")}
                        >
                            <Upload className="h-4 w-4" />
                            Saved
                        </Button>
                        <Button
                            variant={sidebarTab === "merge" ? "secondary" : "ghost"}
                            size="sm"
                            className="flex-1 gap-2"
                            onClick={() => setSidebarTab("merge")}
                        >
                            <Tags className="h-4 w-4" />
                            Tags
                        </Button>
                    </div>

                    {/* Sidebar Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {sidebarTab === "blocks" && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                                    Content Blocks
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {blockTypes.map((block) => (
                                        <div
                                            key={block.type}
                                            className="p-3 border rounded-lg bg-background hover:bg-muted/50 cursor-grab transition-colors text-center"
                                            draggable
                                            onDragStart={(e) => {
                                                e.dataTransfer.setData("block-type", block.type);
                                            }}
                                        >
                                            <block.icon className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                                            <span className="text-xs font-medium">{block.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {sidebarTab === "saved" && (
                            <SavedBlocksPanel
                                savedBlocks={savedBlocks}
                                onDeleteBlock={async (id) => {
                                    await fetch(`/api/saved-blocks/${id}`, { method: "DELETE" });
                                    setSavedBlocks(savedBlocks.filter(b => b.id !== id));
                                    toast.success("Block deleted");
                                }}
                            />
                        )}

                        {sidebarTab === "merge" && (
                            <div className="space-y-4">
                                {Object.entries(mergeTagsByCategory).map(([category, tags]) => (
                                    <div key={category}>
                                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2">
                                            {category}
                                        </h3>
                                        <div className="space-y-1">
                                            {tags.map((tag) => (
                                                <button
                                                    key={tag.value}
                                                    className="w-full p-2 text-left rounded-lg hover:bg-muted/50 transition-colors text-sm"
                                                    onClick={() => insertMergeTag(tag)}
                                                >
                                                    <div className="font-medium">{tag.name}</div>
                                                    <code className="text-xs text-muted-foreground">{tag.value}</code>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>

                {/* Center Canvas */}
                <main className="flex-1 bg-muted/30 overflow-auto p-8">
                    <div
                        className={cn(
                            "mx-auto bg-background shadow-lg rounded-lg overflow-hidden transition-all duration-300",
                            previewMode === "desktop" ? "max-w-[700px]" : "max-w-[375px]"
                        )}
                    >
                        {showPreview ? (
                            <div
                                className="min-h-[600px] p-4"
                                dangerouslySetInnerHTML={{ __html: htmlContent || "<p>No content yet</p>" }}
                            />
                        ) : (
                            <EmailCanvas
                                initialContent={jsonContent}
                                brandColors={template.client.brandColors}
                                onContentChange={handleContentChange}
                                onImageUpload={handleImageUpload}
                                onSaveBlock={handleSaveBlock}
                            />
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

// Block types for the sidebar
import {
    Type,
    Image,
    Square,
    Columns,
    Minus,
    Link2,
    List,
    Quote,
} from "lucide-react";

const blockTypes = [
    { type: "text", label: "Text", icon: Type },
    { type: "image", label: "Image", icon: Image },
    { type: "button", label: "Button", icon: Square },
    { type: "columns", label: "Columns", icon: Columns },
    { type: "divider", label: "Divider", icon: Minus },
    { type: "link", label: "Link", icon: Link2 },
    { type: "list", label: "List", icon: List },
    { type: "quote", label: "Quote", icon: Quote },
];

// Default empty content structure
function getDefaultContent() {
    return {
        root: {
            type: "EmailLayout",
            data: {
                backdropColor: "#f5f5f5",
                borderRadius: 8,
                canvasColor: "#ffffff",
                textColor: "#333333",
                fontFamily: "Inter, sans-serif",
            },
            children: [],
        },
    };
}
