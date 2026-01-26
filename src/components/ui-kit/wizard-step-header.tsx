"use client";

import { cn } from "@/lib/utils";

interface WizardStepHeaderProps {
    title: string;
    description?: string;
    className?: string;
}

/**
 * A centered header for wizard steps with title and optional description.
 * Used in ProcessWizardLayout-based wizards for consistent step headers.
 */
export function WizardStepHeader({ title, description, className }: WizardStepHeaderProps) {
    return (
        <div className={cn("text-center mb-8", className)}>
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            {description && (
                <p className="text-muted-foreground mt-2">{description}</p>
            )}
        </div>
    );
}
