"use client";

import { X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProcessSteps } from "@/components/ui-kit/process-steps";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProcessWizardLayoutProps {
    steps: string[];
    currentStep: number;
    title?: string;
    description?: string;
    onNext: () => void;
    onPrevious: () => void;
    onCancel?: () => void;
    onStepClick?: (stepIndex: number) => void;
    cancelHref?: string;
    isSubmitting?: boolean;
    canProceed?: boolean;
    nextLabel?: string;
    previousLabel?: string;
    finishLabel?: string;
    children: React.ReactNode;
}

export function ProcessWizardLayout({
    steps,
    currentStep,
    title,
    description,
    onNext,
    onPrevious,
    onCancel,
    onStepClick,
    cancelHref,
    isSubmitting = false,
    canProceed = true,
    nextLabel = "Next",
    previousLabel = "Previous",
    finishLabel = "Create",
    children,
}: ProcessWizardLayoutProps) {
    const router = useRouter();
    const [showExitDialog, setShowExitDialog] = useState(false);

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        } else if (cancelHref) {
            router.push(cancelHref);
        } else {
            router.back();
        }
    };

    const isLastStep = currentStep === steps.length - 1;

    return (
        <div className="h-dvh bg-background flex flex-col overflow-hidden">
            {/* Fixed Header */}
            <header className="shrink-0 h-24 flex items-center justify-between px-4 md:px-12 lg:px-24 border-b border-border bg-background relative z-10">
                {/* Left: Back Button */}
                <Button
                    variant="ghost"
                    onClick={() => setShowExitDialog(true)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors z-20 relative"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Back</span>
                </Button>

                {/* Centered Steps Indicator */}
                <div className="absolute inset-x-0 top-0 h-full flex items-center justify-center pointer-events-none">
                    <div className="pointer-events-auto">
                        <ProcessSteps
                            steps={steps}
                            currentStep={currentStep}
                            onStepClick={onStepClick}
                        />
                    </div>
                </div>

                {/* Right: Cancel Button */}
                <div className="z-20 relative">
                    <Button
                        variant="ghost"
                        onClick={() => setShowExitDialog(true)}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                    >
                        <span className="hidden sm:inline mr-2">Cancel</span>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </header>

            {/* Exit Confirmation Dialog */}
            <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Discard creation?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel the creation? All progress will be lost.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Continue Editing</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCancel}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                            Discard
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Scrollable Content */}
            <main className="flex-1 overflow-y-auto px-4 md:px-12 lg:px-24 py-8">
                <div className="max-w-2xl mx-auto h-full flex flex-col">
                    {/* Optional step header inside content */}
                    {(title || description) && (
                        <div className="text-center mb-8 shrink-0">
                            {title && <h1 className="text-2xl font-bold">{title}</h1>}
                            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
                        </div>
                    )}

                    <div className="flex-1">
                        {children}
                    </div>
                </div>
            </main>

            {/* Fixed Footer */}
            <footer className="shrink-0 flex items-center justify-between px-4 md:px-12 lg:px-24 py-4 border-t border-border bg-background">
                <Button
                    variant="outline"
                    onClick={onPrevious}
                    disabled={currentStep === 0 || isSubmitting}
                    className={cn(currentStep === 0 && "invisible")}
                >
                    {previousLabel}
                </Button>

                <Button
                    onClick={onNext}
                    disabled={!canProceed || isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <Spinner className="mr-2 h-4 w-4" />
                            {isLastStep ? "Processing..." : nextLabel}
                        </>
                    ) : (
                        isLastStep ? finishLabel : nextLabel
                    )}
                </Button>
            </footer>
        </div>
    );
}
