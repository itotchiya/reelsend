"use client";

import { useEffect, useState } from "react";
import { TemplateCard, TemplateCardData } from "@/components/ui-kit/template-card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Demo data for components
const demoTemplateWithContent: TemplateCardData = {
    id: "demo-template-1",
    name: "Head Spa - Campaign 04",
    description: "Promotional email for head spa services",
    htmlContent: `
        <!DOCTYPE html>
        <html>
        <head><style>body{font-family:Arial,sans-serif;margin:0;padding:20px;background:#f9f9f9;}</style></head>
        <body>
            <div style="max-width:600px;margin:0 auto;background:white;border-radius:8px;overflow:hidden;">
                <div style="background:linear-gradient(135deg,#6366f1,#a855f7);color:white;padding:20px;text-align:center;">
                    <h1 style="margin:0;font-size:24px;">Hello friend</h1>
                </div>
                <div style="padding:20px;">
                    <img src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600" style="width:100%;border-radius:8px;" alt="Spa" />
                    <p style="color:#333;line-height:1.6;">Experience our premium head spa treatment...</p>
                </div>
            </div>
        </body>
        </html>
    `,
    client: { id: "client-1", name: "NATULIQUE SUISSE", slug: "natulique-suisse", primaryColor: "#6366f1" },
    campaigns: [{ id: "camp-1", name: "Spring Campaign" }],
    createdBy: { id: "user-1", name: "Mustapha Boufous" },
    updatedBy: { id: "user-1", name: "Mustapha Boufous" },
    createdAt: new Date("2026-01-01T17:56:00"),
    updatedAt: new Date("2026-01-01T17:56:00"),
};

const demoTemplateEmpty: TemplateCardData = {
    id: "demo-template-2",
    name: "New Template",
    description: null,
    htmlContent: null,
    client: null,
    campaigns: [],
    createdBy: { id: "user-1", name: "Mustapha Boufous" },
    updatedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
};

const demoTemplateInUse: TemplateCardData = {
    id: "demo-template-3",
    name: "Welcome Email",
    description: "Welcome series first email",
    htmlContent: `<html><body style="font-family:Arial;padding:20px;"><h1 style="color:#6366f1;">Welcome!</h1><p>Thank you for joining us.</p></body></html>`,
    client: { id: "client-2", name: "Acme Corp", slug: "acme-corp", primaryColor: "#ef4444" },
    campaigns: [{ id: "camp-1", name: "Welcome Series" }, { id: "camp-2", name: "Onboarding" }],
    createdBy: { id: "user-1", name: "John Doe" },
    updatedBy: { id: "user-2", name: "Jane Smith" },
    createdAt: new Date("2025-12-15"),
    updatedAt: new Date("2026-01-01"),
};

const demoTemplateManyCampaigns: TemplateCardData = {
    id: "demo-template-4",
    name: "Newsletter Monthly",
    description: "Monthly newsletter template used across multiple campaigns",
    htmlContent: `<html><body style="font-family:Arial;padding:20px;background:#f0f0f0;"><h1 style="color:#10b981;">Monthly News</h1><p>Here's what's new this month...</p></body></html>`,
    client: { id: "client-3", name: "TechStartup", slug: "techstartup", primaryColor: "#10b981" },
    campaigns: [
        { id: "camp-1", name: "January" },
        { id: "camp-2", name: "February" },
        { id: "camp-3", name: "March" },
        { id: "camp-4", name: "April" },
    ],
    createdBy: { id: "user-3", name: "Alice Wonder" },
    updatedBy: { id: "user-3", name: "Alice Wonder" },
    createdAt: new Date("2025-11-01"),
    updatedAt: new Date("2026-01-01"),
};

interface ComponentVariant {
    name: string;
    description: string;
    component: React.ReactNode;
}

interface ComponentShowcase {
    id: string;
    name: string;
    path: string;
    description: string;
    variants: ComponentVariant[];
}

export default function UIKitClient() {
    const [activeSection, setActiveSection] = useState<string>("");

    const components: ComponentShowcase[] = [
        {
            id: "template-card",
            name: "TemplateCard",
            path: "src/components/ui-kit/template-card.tsx",
            description: "A card component for displaying email templates with preview, metadata, and actions.",
            variants: [
                {
                    name: "With Content (In Use)",
                    description: "Template with HTML content that is being used in campaigns",
                    component: (
                        <TemplateCard
                            template={demoTemplateWithContent}
                            onOpen={(t) => toast.info(`Open: ${t.name}`)}
                            onEdit={(t) => toast.info(`Edit: ${t.name}`)}
                            onDuplicate={(t) => toast.info(`Duplicate: ${t.name}`)}
                            onDelete={(t) => toast.error(`Delete: ${t.name}`)}
                            onViewActivity={(t) => toast.info(`Activity: ${t.name}`)}
                        />
                    ),
                },
                {
                    name: "Empty (Not Edited)",
                    description: "New template without any content - shows amber warning border",
                    component: (
                        <TemplateCard
                            template={demoTemplateEmpty}
                            onOpen={(t) => toast.info(`Open: ${t.name}`)}
                            onEdit={(t) => toast.info(`Edit: ${t.name}`)}
                            onDuplicate={(t) => toast.info(`Duplicate: ${t.name}`)}
                            onDelete={(t) => toast.error(`Delete: ${t.name}`)}
                            onViewActivity={(t) => toast.info(`Activity: ${t.name}`)}
                        />
                    ),
                },
                {
                    name: "Multiple Campaigns",
                    description: "Template used in two campaigns - shows campaign badges",
                    component: (
                        <TemplateCard
                            template={demoTemplateInUse}
                            onOpen={(t) => toast.info(`Open: ${t.name}`)}
                            onEdit={(t) => toast.info(`Edit: ${t.name}`)}
                            onDuplicate={(t) => toast.info(`Duplicate: ${t.name}`)}
                            onDelete={(t) => toast.error(`Delete: ${t.name}`)}
                            onViewActivity={(t) => toast.info(`Activity: ${t.name}`)}
                        />
                    ),
                },
                {
                    name: "Many Campaigns (+N more)",
                    description: "Template used in 4+ campaigns - shows '+N more' badge",
                    component: (
                        <TemplateCard
                            template={demoTemplateManyCampaigns}
                            onOpen={(t) => toast.info(`Open: ${t.name}`)}
                            onEdit={(t) => toast.info(`Edit: ${t.name}`)}
                            onDuplicate={(t) => toast.info(`Duplicate: ${t.name}`)}
                            onDelete={(t) => toast.error(`Delete: ${t.name}`)}
                            onViewActivity={(t) => toast.info(`Activity: ${t.name}`)}
                        />
                    ),
                },
            ],
        },
    ];

    // Handle scroll spy
    useEffect(() => {
        const handleScroll = () => {
            const sections = components.map(c => document.getElementById(c.id));
            const scrollPosition = window.scrollY + 100;

            for (let i = sections.length - 1; i >= 0; i--) {
                const section = sections[i];
                if (section && section.offsetTop <= scrollPosition) {
                    setActiveSection(components[i].id);
                    break;
                }
            }
        };

        window.addEventListener("scroll", handleScroll);
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex gap-10">
                    {/* Sticky Sidebar Navigation */}
                    <aside className="w-56 shrink-0">
                        <div className="sticky top-8">
                            {/* Title in sidebar */}
                            <div className="mb-6">
                                <h1 className="text-xl font-bold">UI Kit</h1>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Reusable components
                                </p>
                            </div>

                            <nav className="space-y-1">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
                                    Components
                                </p>
                                {components.map((component) => (
                                    <div key={component.id}>
                                        <button
                                            onClick={() => scrollToSection(component.id)}
                                            className={cn(
                                                "w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                                activeSection === component.id
                                                    ? "bg-primary text-primary-foreground"
                                                    : "hover:bg-muted text-foreground/70 hover:text-foreground"
                                            )}
                                        >
                                            {component.name}
                                        </button>
                                        {/* Variant links */}
                                        <div className="ml-4 mt-1 space-y-0.5">
                                            {component.variants.map((variant, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => scrollToSection(`${component.id}-${idx}`)}
                                                    className="w-full text-left px-3 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    {variant.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </nav>

                            {/* Legend */}
                            <div className="mt-8 p-4 rounded-lg border border-dashed bg-muted/20">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                    Legend
                                </p>
                                <div className="space-y-2 text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded bg-primary" />
                                        <span>Active section</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded border-2 border-amber-500" />
                                        <span>Empty/Warning state</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded bg-green-600" />
                                        <span>In use badge</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 min-w-0 max-w-4xl space-y-16">
                        {components.map((component) => (
                            <section key={component.id} id={component.id} className="scroll-mt-24">
                                {/* Component Header */}
                                <div className="rounded-xl border border-dashed p-5 bg-card mb-6">
                                    <div className="flex items-start justify-between gap-4 flex-wrap">
                                        <div>
                                            <h2 className="text-xl font-bold">{component.name}</h2>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {component.description}
                                            </p>
                                        </div>
                                        <code className="text-xs bg-muted px-3 py-1.5 rounded-md font-mono">
                                            {component.path}
                                        </code>
                                    </div>
                                </div>

                                {/* Component Variants */}
                                <div className="space-y-8">
                                    {component.variants.map((variant, idx) => (
                                        <div
                                            key={idx}
                                            id={`${component.id}-${idx}`}
                                            className="scroll-mt-24 rounded-xl border overflow-hidden"
                                        >
                                            {/* Variant Header */}
                                            <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-semibold text-sm">{variant.name}</h3>
                                                    <p className="text-xs text-muted-foreground">{variant.description}</p>
                                                </div>
                                                <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                                                    State {idx + 1}
                                                </span>
                                            </div>

                                            {/* Variant Demo */}
                                            <div className="p-6 bg-muted/10">
                                                <div className="max-w-sm">
                                                    {variant.component}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Usage Example */}
                                <details className="mt-6 rounded-xl border overflow-hidden">
                                    <summary className="px-5 py-3 bg-muted/50 cursor-pointer font-medium text-sm hover:bg-muted/70 transition-colors">
                                        View Import & Usage
                                    </summary>
                                    <div className="p-5 bg-card">
                                        <pre className="text-xs overflow-x-auto bg-muted p-4 rounded-lg">
                                            {`import { TemplateCard } from "@/components/ui-kit/template-card";

// Basic usage
<TemplateCard
    template={{
        id: "1",
        name: "My Template",
        description: "Template description",
        htmlContent: "<html>...</html>",
        client: { id: "c1", name: "Client", slug: "client" },
        campaigns: [],
        createdBy: { id: "u1", name: "User" },
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    }}
    onOpen={(t) => console.log("Open:", t.id)}
    onEdit={(t) => console.log("Edit:", t.id)}
    onDuplicate={(t) => console.log("Duplicate:", t.id)}
    onDelete={(t) => console.log("Delete:", t.id)}
    onViewActivity={(t) => console.log("Activity:", t.id)}
    labels={{
        openEditor: "Open Editor",
        editDetails: "Edit Details",
        duplicate: "Duplicate",
        viewActivity: "View Activity",
        delete: "Delete",
    }}
/>`}
                                        </pre>
                                    </div>
                                </details>
                            </section>
                        ))}

                        {/* Footer */}
                        <div className="rounded-xl border border-dashed p-12 text-center">
                            <p className="text-muted-foreground">
                                More components will be added as they are created.
                            </p>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
