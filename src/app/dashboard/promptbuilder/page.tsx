"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useI18n } from "@/lib/i18n";
import { useSidebar } from "@/components/ui/sidebar";
import {
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AISphere } from "@/components/ui-kit/ai-sphere";
import { AnimatedGradient } from "@/components/ui-kit/animated-gradient";
import { GradientInputContainer, PromptInputArea } from "@/components/ui-kit/gradient-input-container";
import { ExamplePromptCard, EXAMPLE_PROMPTS } from "@/components/ui-kit/example-prompt-card";
import { PageHeader, PageContent } from "@/components/dashboard/page-header";
import { ModelSelectorDialog, DEFAULT_MODEL, SelectedModel } from "@/components/ui-kit/model-selector-dialog";
import { StyleSelectorDialog, DEFAULT_STYLE } from "@/components/ui-kit/style-selector-dialog";
import { ClientSelectorDialog } from "@/components/ui-kit/client-selector-dialog";

interface Client {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
}



// Loading steps for the generation process
const LOADING_STEPS = [
    { key: "understanding", duration: 2000 },
    { key: "analyzing", duration: 2500 },
    { key: "generating", duration: 3000 },
    { key: "building", duration: 2500 },
    { key: "styling", duration: 2000 },
    { key: "finishing", duration: 1500 },
];

function getGreeting(t: any): string {
    const hour = new Date().getHours();
    if (hour < 12) return t.promptBuilder?.greeting?.morning || "Good Morning";
    if (hour < 18) return t.promptBuilder?.greeting?.afternoon || "Good Afternoon";
    return t.promptBuilder?.greeting?.evening || "Good Evening";
}

function useIsMac(): boolean {
    const [isMac, setIsMac] = useState(false);
    useEffect(() => {
        setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
    }, []);
    return isMac;
}

export default function PromptBuilderPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const { t } = useI18n();
    const { setOpen } = useSidebar();
    const isMac = useIsMac();

    const [prompt, setPrompt] = useState("");
    const [style, setStyle] = useState(DEFAULT_STYLE);
    const [clientId, setClientId] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<SelectedModel>(DEFAULT_MODEL);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingClients, setLoadingClients] = useState(true);
    const [loadingStep, setLoadingStep] = useState(0);
    const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const userName = session?.user?.name?.split(" ")[0] || "there";

    // Auto-collapse sidebar on mount, restore on unmount
    useEffect(() => {
        setOpen(false);
        return () => {
            setOpen(true);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch available clients
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const res = await fetch("/api/clients");
                if (res.ok) {
                    const data = await res.json();
                    setClients(data);
                }
            } catch (error) {
                console.error("Failed to fetch clients:", error);
            } finally {
                setLoadingClients(false);
            }
        };
        fetchClients();
    }, []);

    // Animate loading steps
    useEffect(() => {
        if (loading) {
            setLoadingStep(0);
            let currentStep = 0;

            const advanceStep = () => {
                currentStep++;
                if (currentStep < LOADING_STEPS.length) {
                    setLoadingStep(currentStep);
                    loadingIntervalRef.current = setTimeout(advanceStep, LOADING_STEPS[currentStep].duration);
                }
            };

            loadingIntervalRef.current = setTimeout(advanceStep, LOADING_STEPS[0].duration);
        } else {
            if (loadingIntervalRef.current) {
                clearTimeout(loadingIntervalRef.current);
            }
        }

        return () => {
            if (loadingIntervalRef.current) {
                clearTimeout(loadingIntervalRef.current);
            }
        };
    }, [loading]);

    const [success, setSuccess] = useState(false);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            toast.error(t.promptBuilder?.promptRequired || "Please enter a prompt");
            return;
        }

        setLoading(true);
        setSuccess(false);
        try {
            // Determine the API endpoint based on the selected provider
            const apiEndpoint = selectedModel.provider === "openai"
                ? "/api/prompt-builder-openai"
                : "/api/prompt-builder";

            const res = await fetch(apiEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: prompt.trim(),
                    style,
                    clientId,
                    model: selectedModel.model,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setSuccess(true);
                // Don't set loading to false here - keep overlay until navigation completes
                router.push(data.redirectUrl);
            } else {
                const error = await res.text();
                toast.error(error || t.promptBuilder?.error || "Failed to generate template");
                setLoading(false);
            }
        } catch (error) {
            toast.error(t.common?.error || "An error occurred");
            setLoading(false);
        }
    };

    const handleExampleClick = (fullText: string) => {
        setPrompt(fullText);
    };

    // Get style label from translations
    const getStyleLabel = (key: string) => {
        const styles = t.promptBuilder?.styles as any;
        return styles?.[key] || key.charAt(0).toUpperCase() + key.slice(1);
    };

    // Get current loading message
    const getLoadingMessage = () => {
        const step = LOADING_STEPS[loadingStep];
        const messages = t.promptBuilder?.generating as any;
        return messages?.[step.key] || step.key;
    };

    // Loading overlay with active sphere and progress
    if (loading) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center z-50 gap-8">
                {/* Subtle gradient background with blur */}
                <div className="absolute inset-0 bg-background">
                    <AnimatedGradient
                        variant="active"
                        className="opacity-[0.08] blur-3xl"
                    />
                </div>

                {/* Content */}
                <div className="relative z-10 transition-all duration-500">
                    <AISphere state="active" size="lg" />
                </div>
                <div className="relative z-10 text-center space-y-3">
                    <p className="text-xl font-semibold text-foreground animate-pulse">
                        {success
                            ? (t.promptBuilder?.success || "Template created! Redirecting...")
                            : getLoadingMessage()
                        }
                    </p>
                    {/* Progress dots */}
                    <div className="flex items-center justify-center gap-1.5">
                        {LOADING_STEPS.map((_, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "w-2 h-2 rounded-full transition-all duration-300",
                                    (success || idx <= loadingStep)
                                        ? "bg-foreground scale-100"
                                        : "bg-foreground/30 scale-75"
                                )}
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <PageHeader
                title={t.promptBuilder?.title || "Prompt Builder"}
                showBack
            />
            <PageContent>
                <div className="max-w-3xl mx-auto flex flex-col items-center py-8 px-4">
                    {/* AI Sphere */}
                    <div className="mb-6">
                        <AISphere state="idle" size="md" />
                    </div>

                    {/* Greeting */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold mb-2">
                            {getGreeting(t)}, <span className="text-foreground">{userName}</span>
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            {t.promptBuilder?.question || "What kind of"}{" "}
                            <span className="text-primary font-medium">{t.promptBuilder?.emailTemplate || "email template"}</span>{" "}
                            {t.promptBuilder?.wouldLike || "would you like to create?"}
                        </p>
                    </div>

                    {/* Model Selector + Dropdowns - Full width grid */}
                    <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                        {/* AI Model Selector */}
                        <ModelSelectorDialog
                            selectedModel={selectedModel}
                            onModelSelect={setSelectedModel}
                            className="w-full"
                        />
                        {/* Style Selector Dialog */}
                        <StyleSelectorDialog
                            selectedStyle={style}
                            onStyleSelect={setStyle}
                            className="w-full"
                        />

                        {/* Client Selector Dialog */}
                        <ClientSelectorDialog
                            clients={clients}
                            selectedClientId={clientId}
                            onClientSelect={setClientId}
                            loading={loadingClients}
                            className="w-full"
                        />
                    </div>

                    {/* Gradient Input Container with Input Area */}
                    <GradientInputContainer className="w-full">
                        <PromptInputArea
                            value={prompt}
                            onChange={setPrompt}
                            onSubmit={handleGenerate}
                            placeholder={t.promptBuilder?.placeholder || "Describe the email template you want to create..."}
                            disabled={loading}
                            buttonLabel={t.promptBuilder?.buildButton || "Generate"}
                        />
                    </GradientInputContainer>

                    {/* Keyboard shortcut hint */}
                    <p className="text-xs text-muted-foreground text-center mt-4">
                        {t.promptBuilder?.pressKey || "Press"}{" "}
                        <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[10px]">
                            {isMac ? "⌘" : "Ctrl"}
                        </kbd>{" "}
                        +{" "}
                        <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[10px]">Enter</kbd>{" "}
                        {t.promptBuilder?.toGenerate || "to generate"}
                    </p>

                    {/* Example Prompts */}
                    <div className="w-full mt-12">
                        <p className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
                            {t.promptBuilder?.examplesTitle || "Get started with an example"}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {EXAMPLE_PROMPTS.map((example, idx) => (
                                <ExamplePromptCard
                                    key={idx}
                                    title={example.title}
                                    icon={example.icon}
                                    onClick={() => handleExampleClick(example.fullText)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </PageContent>
        </>
    );
}
