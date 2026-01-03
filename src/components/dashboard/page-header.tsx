"use client";

import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface PageHeaderProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
    children?: React.ReactNode; // Backward compatibility
    onBack?: () => void;
    showBack?: boolean;
}

export function PageHeader({ title, description, action, children, onBack, showBack }: PageHeaderProps) {
    const router = useRouter();
    const handleBack = onBack || (() => router.back());

    return (
        <div className="sticky top-0 z-[5] bg-dashboard-surface border-b px-8 h-20 flex items-center">
            <div className="flex items-center justify-between gap-4 w-full">
                <div className="flex items-center gap-4">
                    {showBack && (
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={handleBack}
                        >
                            <ChevronLeft />
                        </Button>
                    )}
                    <div className="flex flex-col">
                        <span className="text-lg font-semibold text-foreground">
                            {title}
                        </span>
                        {description && (
                            <span className="text-sm text-muted-foreground">
                                {description}
                            </span>
                        )}
                    </div>
                </div>
                {(action || children) && (
                    <div className="flex items-center gap-2 shrink-0">
                        {action || children}
                    </div>
                )}
            </div>
        </div>
    );
}

// Page content wrapper with proper padding
export function PageContent({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex-1 px-8 pt-8 pb-16">
            {children}
        </div>
    );
}
