"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ChevronDown, Sparkles, Zap, Brain, Cpu } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { SelectableCard, SelectableCardHeader, SelectableCardDescription } from "./selectable-card";

// Provider and model definitions
export interface AIModel {
    id: string;
    icon: React.ReactNode;
    isNew?: boolean;
    isFast?: boolean;
}

export interface AIProvider {
    id: "openai" | "gemini";
    icon: React.ReactNode;
    color: string;
    models: AIModel[];
}

// OpenAI Icon Component
function OpenAIIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
        </svg>
    );
}

// Google/Gemini Icon Component
function GeminiIcon({ className }: { className?: string }) {
    return (
        <img
            src="/icons/Gemini-Logo.png"
            alt="Gemini"
            width={18}
            height={18}
            className={cn("object-contain", className)}
        />
    );
}

// Define available providers and models
export const AI_PROVIDERS: AIProvider[] = [
    {
        id: "gemini",
        icon: <GeminiIcon className="h-5 w-5" />,
        color: "from-blue-500 via-purple-500 to-pink-500",
        models: [
            { id: "gemini-1.5-pro", icon: <Brain className="h-4 w-4" />, isNew: false },
            { id: "gemini-1.5-flash", icon: <Zap className="h-4 w-4" />, isFast: true },
            { id: "gemini-2.0-flash", icon: <Zap className="h-4 w-4" />, isNew: true, isFast: true },
            { id: "gemini-2.0-flash-lite", icon: <Zap className="h-4 w-4" />, isFast: true },
        ],
    },
    {
        id: "openai",
        icon: <OpenAIIcon className="h-5 w-5" />,
        color: "from-emerald-400 to-teal-500",
        models: [
            { id: "gpt-4.1", icon: <Cpu className="h-4 w-4" />, isNew: true },
            { id: "gpt-4.1-mini", icon: <Zap className="h-4 w-4" />, isNew: true, isFast: true },
            { id: "gpt-4o", icon: <Brain className="h-4 w-4" /> },
            { id: "o3-mini", icon: <Sparkles className="h-4 w-4" /> },
        ],
    },
];

export interface SelectedModel {
    provider: "openai" | "gemini";
    model: string;
}

export const DEFAULT_MODEL: SelectedModel = {
    provider: "gemini",
    model: "gemini-1.5-flash",
};

interface ModelSelectorDialogProps {
    selectedModel: SelectedModel;
    onModelSelect: (model: SelectedModel) => void;
    className?: string;
}

export function ModelSelectorDialog({
    selectedModel,
    onModelSelect,
    className,
}: ModelSelectorDialogProps) {
    const { t } = useI18n();
    const [open, setOpen] = React.useState(false);

    const handleModelSelect = (providerId: "openai" | "gemini", modelId: string) => {
        onModelSelect({ provider: providerId, model: modelId });
        setOpen(false);
    };

    // Helper to get translated labels
    const getModelLabel = (id: string) => {
        const key = id.replace(/[^a-zA-Z0-9]/g, "");
        return (t.promptBuilder?.models as any)?.[key] || id;
    };

    const getModelDesc = (id: string) => {
        const key = id.replace(/[^a-zA-Z0-9]/g, "") + "Desc";
        return (t.promptBuilder?.models as any)?.[key] || "";
    };

    const selectedProvider = AI_PROVIDERS.find((p) => p.id === selectedModel.provider);
    const selectedModelData = selectedProvider?.models.find((m) => m.id === selectedModel.model);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm",
                        "h-9 whitespace-nowrap transition-[color,box-shadow] outline-none",
                        "border-input bg-transparent",
                        "hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        "dark:bg-input/30 dark:hover:bg-input/50",
                        className
                    )}
                >
                    <div className="flex items-center gap-2 truncate">
                        {selectedProvider?.icon}
                        <span className="font-medium truncate">
                            {getModelLabel(selectedModel.model)}
                        </span>
                    </div>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4">
                    <DialogTitle className="text-xl">
                        {t.promptBuilder?.selectModel || "Select AI Model"}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Choose the AI model you want to use for generating your email template.
                    </DialogDescription>
                </DialogHeader>

                <div className="px-6 pb-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {AI_PROVIDERS.map((provider) => (
                        <div key={provider.id} className="space-y-3">
                            {/* Provider Header */}
                            <div className="flex items-center gap-2">
                                <div className={cn(
                                    "p-1.5 rounded-lg",
                                    provider.id === "gemini"
                                        ? "bg-white shadow-none border border-gray-100 dark:bg-white"
                                        : "bg-gradient-to-br " + provider.color
                                )}>
                                    <div className={provider.id === "gemini" ? "" : "text-white"}>
                                        {provider.icon}
                                    </div>
                                </div>
                                <span className="font-semibold text-foreground">
                                    {(t.promptBuilder?.models as any)?.[provider.id] || provider.id}
                                </span>
                            </div>

                            {/* Models Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {provider.models.map((model) => {
                                    const isSelected =
                                        selectedModel.provider === provider.id &&
                                        selectedModel.model === model.id;

                                    return (
                                        <SelectableCard
                                            key={model.id}
                                            isSelected={isSelected}
                                            onClick={() => handleModelSelect(provider.id, model.id)}
                                        >
                                            <SelectableCardHeader
                                                icon={model.icon}
                                                title={getModelLabel(model.id)}
                                                badge={model.isNew ? "New" : model.isFast ? "Fast" : undefined}
                                                badgeVariant={model.isNew ? "primary" : "warning"}
                                            />
                                            <SelectableCardDescription>
                                                {getModelDesc(model.id)}
                                            </SelectableCardDescription>
                                        </SelectableCard>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
