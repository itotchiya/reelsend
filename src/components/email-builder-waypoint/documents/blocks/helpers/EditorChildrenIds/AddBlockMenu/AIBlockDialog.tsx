import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AISphere } from '@/components/ui-kit/ai-sphere';
import { AnimatedGradient } from '@/components/ui-kit/animated-gradient';
import { GradientInputContainer, PromptInputArea } from '@/components/ui-kit/gradient-input-container';
import { toast } from 'sonner';
import { TEditorBlock } from '../../../../editor/core';
import { editorStateStore } from '../../../../editor/EditorContext';
import { useParams } from 'next/navigation';
import { useI18n } from '@/lib/i18n';

interface AIBlockDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onInsert: (block: TEditorBlock) => void;
}

export function AIBlockDialog({ open, onOpenChange, onInsert }: AIBlockDialogProps) {
    const { t } = useI18n();
    const [prompt, setPrompt] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    // Get client slug from URL if available
    const params = useParams();
    const clientSlug = params?.clientSlug as string;

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setIsLoading(true);
        try {
            const res = await fetch('/api/ai-block-generation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: prompt.trim(),
                    clientSlug
                })
            });

            if (!res.ok) throw new Error("Generation failed");

            const data = await res.json();
            const { rootBlockId, blocks } = data;

            if (!rootBlockId || !blocks) throw new Error("Invalid response format");

            // Utility to generate unique IDs compatible with the editor
            const generateUniqueId = (prefix: string = 'block') => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            // Mapping from AI IDs to local IDs
            const idMap: Record<string, string> = {};

            // First, map all AI IDs to new local IDs
            Object.keys(blocks).forEach(id => {
                idMap[id] = generateUniqueId(blocks[id].type.toLowerCase());
            });

            // Re-map internal childrenIds
            const finalBlocks: Record<string, TEditorBlock> = {};
            Object.keys(blocks).forEach(id => {
                const block = { ...blocks[id] };
                if (block.data?.props?.childrenIds) {
                    block.data.props.childrenIds = block.data.props.childrenIds.map((cid: string) => idMap[cid] || cid);
                }
                // Handle ColumnsContainer columns
                if (block.data?.props?.columns) {
                    block.data.props.columns = block.data.props.columns.map((col: any) => ({
                        ...col,
                        childrenIds: col.childrenIds.map((cid: string) => idMap[cid] || cid)
                    }));
                }
                finalBlocks[idMap[id]] = block;
            });

            const finalRootBlockId = idMap[rootBlockId];
            const finalRootBlock = finalBlocks[finalRootBlockId];

            // Inject all child blocks into the global state BEFORE inserting the root
            const { [finalRootBlockId]: root, ...onlyChildren } = finalBlocks;

            const currentDoc = editorStateStore.getState().document;
            editorStateStore.setState({
                document: {
                    ...currentDoc,
                    ...onlyChildren
                }
            });

            // Now insert the root via the standard callback (which will trigger childrenIds update in parent)
            onInsert(finalRootBlock);

            toast.success(t.aiBlockGenerator?.success || "Block generated!");
            onOpenChange(false);
            setPrompt("");
        } catch (e) {
            toast.error(t.aiBlockGenerator?.error || "Failed to generate block");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md overflow-hidden border-0 bg-background/80 backdrop-blur-xl">
                {/* Subtle ambient background */}
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                    <AnimatedGradient variant={isLoading ? "active" : "default"} />
                </div>

                <DialogHeader className="relative z-10 flex flex-col items-center gap-4 py-6">
                    <AISphere state={isLoading ? "active" : "idle"} size="md" />
                    <DialogTitle className="text-xl font-semibold text-center">
                        {isLoading ? t.aiBlockGenerator?.generating : t.aiBlockGenerator?.title}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        {t.aiBlockGenerator?.description}
                    </DialogDescription>
                </DialogHeader>

                <div className="relative z-10 space-y-4 px-2 pb-6">
                    <GradientInputContainer>
                        <PromptInputArea
                            value={prompt}
                            onChange={setPrompt}
                            onSubmit={handleGenerate}
                            placeholder={t.aiBlockGenerator?.placeholder}
                            disabled={isLoading}
                            buttonLabel={isLoading ? t.aiBlockGenerator?.thinking : t.aiBlockGenerator?.generate}
                        />
                    </GradientInputContainer>
                    <p className="text-xs text-center text-muted-foreground">
                        {t.aiBlockGenerator?.description}
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
