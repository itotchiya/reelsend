"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Sparkles, Send, ArrowLeft, Palette, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Client {
    id: string;
    name: string;
    slug: string;
}

const TEMPLATE_STYLES = [
    { value: "default", label: "Default", description: "Clean, professional layout" },
    { value: "colored", label: "Colored / Branded", description: "Vibrant, branded colors" },
    { value: "bento", label: "Bento-style", description: "Modern grid layout" },
    { value: "simple", label: "Simple with Accent", description: "Minimalist with accent color" },
    { value: "minimal", label: "Minimal / Clean", description: "Ultra-clean design" },
];

const EXAMPLE_PROMPTS = [
    "Create a welcome email for a hair salon with a friendly tone and a call-to-action to book an appointment",
    "Design a product launch announcement email for a tech startup",
    "Generate a monthly newsletter template for a fitness center",
    "Create an order confirmation email for an e-commerce store",
    "Design a password reset email with security tips",
];

export default function PromptBuilderPage() {
    const router = useRouter();
    const { t } = useI18n();

    const [prompt, setPrompt] = useState("");
    const [style, setStyle] = useState("default");
    const [clientId, setClientId] = useState<string | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingClients, setLoadingClients] = useState(true);

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

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            toast.error(t.promptBuilder?.promptRequired || "Please enter a prompt");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/prompt-builder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: prompt.trim(),
                    style,
                    clientId,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                toast.success(t.promptBuilder?.success || "Template created successfully!");
                router.push(data.redirectUrl);
            } else {
                const error = await res.text();
                toast.error(error || t.promptBuilder?.error || "Failed to generate template");
            }
        } catch (error) {
            toast.error(t.common?.error || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleExampleClick = (example: string) => {
        setPrompt(example);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex flex-col">
            {/* Header */}
            <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                <Sparkles className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="font-bold text-lg">{t.promptBuilder?.title || "Prompt Builder"}</h1>
                                <p className="text-xs text-muted-foreground">{t.promptBuilder?.subtitle || "AI-powered email generation"}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-6 py-8">
                {/* Intro */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold mb-2">
                        {t.promptBuilder?.heading || "Describe your email template"}
                    </h2>
                    <p className="text-muted-foreground">
                        {t.promptBuilder?.description || "Tell the AI what kind of email you want to create, and it will build it for you."}
                    </p>
                </div>

                {/* Options Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {/* Style Selector */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Palette className="h-4 w-4 text-muted-foreground" />
                            {t.promptBuilder?.styleLabel || "Template Style"}
                        </label>
                        <Select value={style} onValueChange={setStyle}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {TEMPLATE_STYLES.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{s.label}</span>
                                            <span className="text-xs text-muted-foreground">{s.description}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Client Selector */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {t.promptBuilder?.clientLabel || "Client (Optional)"}
                        </label>
                        <Select
                            value={clientId || "__none__"}
                            onValueChange={(v) => setClientId(v === "__none__" ? null : v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={loadingClients ? "Loading..." : "No client"} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__none__">
                                    <span className="text-muted-foreground">{t.promptBuilder?.noClient || "No client (generic template)"}</span>
                                </SelectItem>
                                {clients.map((client) => (
                                    <SelectItem key={client.id} value={client.id}>
                                        {client.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Prompt Input */}
                <div className="flex-1 flex flex-col">
                    <div className="relative flex-1 min-h-[200px]">
                        <Textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={t.promptBuilder?.placeholder || "Example: Create a welcome email for a hair salon with a friendly tone and a call-to-action to book an appointment..."}
                            className="w-full h-full min-h-[200px] resize-none text-base p-6 rounded-2xl border-2 focus:border-primary/50 transition-colors"
                            disabled={loading}
                        />
                    </div>

                    {/* Generate Button */}
                    <div className="flex justify-end mt-4">
                        <Button
                            size="lg"
                            onClick={handleGenerate}
                            disabled={loading || !prompt.trim()}
                            className="gap-2 px-8 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                        >
                            {loading ? (
                                <>
                                    <Spinner className="h-5 w-5" />
                                    {t.promptBuilder?.generating || "Generating..."}
                                </>
                            ) : (
                                <>
                                    <Send className="h-5 w-5" />
                                    {t.promptBuilder?.buildButton || "Build Template"}
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Example Prompts */}
                <div className="mt-8 pt-8 border-t">
                    <p className="text-sm font-medium text-muted-foreground mb-4">
                        {t.promptBuilder?.examplesTitle || "Try these examples:"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {EXAMPLE_PROMPTS.map((example, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleExampleClick(example)}
                                className={cn(
                                    "text-sm px-4 py-2 rounded-full border border-dashed",
                                    "hover:border-primary hover:text-primary hover:bg-primary/5",
                                    "transition-colors text-left"
                                )}
                                disabled={loading}
                            >
                                {example.length > 60 ? example.substring(0, 60) + "..." : example}
                            </button>
                        ))}
                    </div>
                </div>
            </main>

            {/* Loading Overlay */}
            {loading && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="text-center space-y-4">
                        <div className="relative">
                            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 animate-pulse flex items-center justify-center mx-auto">
                                <Sparkles className="h-10 w-10 text-white animate-bounce" />
                            </div>
                        </div>
                        <div>
                            <p className="text-lg font-semibold">{t.promptBuilder?.generatingTitle || "Creating your template..."}</p>
                            <p className="text-sm text-muted-foreground">{t.promptBuilder?.generatingDescription || "This may take a few seconds"}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
