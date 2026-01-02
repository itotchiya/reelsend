"use client";

import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface PageHeaderProps {
    title: string;
    children?: React.ReactNode; // Actions slot (right side)
    onBack?: () => void;
    showBack?: boolean;
}

export function PageHeader({ title, children, onBack, showBack }: PageHeaderProps) {
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
                    <span className="text-lg font-normal text-muted-foreground">
                        {title}
                    </span>
                </div>
                {children && (
                    <div className="flex items-center gap-2 shrink-0">
                        {children}
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
