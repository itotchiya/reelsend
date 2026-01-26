"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProcessStepsProps {
    steps: string[];
    currentStep: number;
    onStepClick?: (stepIndex: number) => void;
    className?: string;
}

export function ProcessSteps({ steps, currentStep, onStepClick, className }: ProcessStepsProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center w-full", className)}>
            {/* Step Info Header */}
            <div className="flex items-center justify-center mb-2 gap-2">
                <span className="text-muted-foreground text-xs font-normal">Step {currentStep + 1} of {steps.length}</span>
                <span className="text-foreground text-sm font-bold">{steps[currentStep]}</span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="flex items-center gap-0 h-1.5 bg-muted rounded-full overflow-hidden w-[160px]">
                {steps.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isActive = index === currentStep;

                    // Allow clicking any previous step or the current step
                    const isClickable = index <= currentStep && !!onStepClick;

                    return (
                        <div
                            key={step}
                            onClick={() => isClickable && onStepClick && onStepClick(index)}
                            className={cn(
                                "h-full flex-1 transition-all duration-300",
                                // Active: Solid Primary
                                isActive ? "bg-primary" :
                                    // Completed: Solid Primary (to make it look like one continuous filled bar up to current)
                                    isCompleted ? "bg-primary" :
                                        // Future: Transparent (shows bg-muted of container)
                                        "bg-transparent",

                                isClickable && isCompleted && "hover:bg-primary/90 cursor-pointer"
                            )}
                            title={step} // Tooltip for clarity
                        />
                    );
                })}
            </div>
        </div>
    );
}
