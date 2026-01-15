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
        <div className={cn("flex items-center justify-center w-full", className)}>
            <div className="flex items-center gap-2">
                {steps.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isActive = index === currentStep;
                    const isLast = index === steps.length - 1;
                    const isClickable = index < currentStep && !!onStepClick;

                    return (
                        <div key={step} className="flex items-center">
                            {/* Step Container */}
                            <div
                                onClick={() => isClickable && onStepClick(index)}
                                className={cn(
                                    "flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full transition-all duration-200 border",
                                    isActive
                                        ? "bg-primary/10 border-transparent text-primary"
                                        : isCompleted
                                            ? "bg-transparent border-transparent text-foreground"
                                            : "bg-transparent border-transparent text-muted-foreground",
                                    isClickable && "cursor-pointer hover:bg-muted/50"
                                )}
                            >
                                {/* Indicator Circle */}
                                <div
                                    className={cn(
                                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors duration-200 shrink-0",
                                        isActive
                                            ? "bg-primary text-primary-foreground"
                                            : isCompleted
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted text-muted-foreground"
                                    )}
                                >
                                    {isCompleted ? (
                                        <Check className="w-3.5 h-3.5" />
                                    ) : (
                                        <span>{index + 1}</span>
                                    )}
                                </div>

                                {/* Step Label - Hidden on mobile, visible on sm+ */}
                                {isActive ? (
                                    <span className="text-sm font-medium whitespace-nowrap">
                                        {step}
                                    </span>
                                ) : (
                                    <span className={cn(
                                        "text-sm font-medium whitespace-nowrap hidden sm:inline",
                                        isCompleted ? "text-foreground" : "text-muted-foreground"
                                    )}>
                                        {step}
                                    </span>
                                )}
                            </div>

                            {/* Divider Line */}
                            {!isLast && (
                                <div className="w-4 sm:w-8 h-[1px] border-t-2 border-solid border-border/80 mx-1" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
