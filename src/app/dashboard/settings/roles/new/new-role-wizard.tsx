"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { IconPicker, getRoleIconByName } from "@/components/ui-kit/icon-picker";
import { ColorPicker } from "@/components/ui-kit/color-picker";
import { ProcessWizardLayout } from "@/components/ui-kit/process-wizard-layout";
import { WizardStepHeader } from "@/components/ui-kit/wizard-step-header";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { useI18n } from "@/lib/i18n";

interface Permission {
    id: string;
    key: string;
    name: string;
    description: string | null;
    category: string;
}

interface NewRoleWizardProps {
    permissionsByCategory: Record<string, Permission[]>;
}

export function NewRoleWizard({ permissionsByCategory }: NewRoleWizardProps) {
    const { t } = useI18n();
    const router = useRouter();

    // Type casting for dictionary access
    const rolesT = t.roles as any;
    const wizardT = rolesT?.wizard || {};

    const steps = [
        wizardT?.steps?.name || "Name",
        wizardT?.steps?.appearance || "Appearance",
        wizardT?.steps?.permissions || "Permissions"
    ];
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [icon, setIcon] = useState("Shield");
    const [color, setColor] = useState("#6B7280");
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

    const IconComponent = getRoleIconByName(icon);

    const canProceed = () => {
        if (currentStep === 0) return name.trim().length >= 2;
        if (currentStep === 1) return !!(icon && color);
        if (currentStep === 2) return selectedPermissions.length > 0;
        return false;
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleCreate();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const togglePermission = (permKey: string) => {
        setSelectedPermissions((prev) =>
            prev.includes(permKey)
                ? prev.filter((p) => p !== permKey)
                : [...prev, permKey]
        );
    };

    const toggleCategory = (category: string) => {
        const categoryPerms = permissionsByCategory[category]?.map((p) => p.key) || [];
        const allSelected = categoryPerms.every((key) => selectedPermissions.includes(key));

        if (allSelected) {
            setSelectedPermissions((prev) => prev.filter((p) => !categoryPerms.includes(p)));
        } else {
            setSelectedPermissions((prev) => [...new Set([...prev, ...categoryPerms])]);
        }
    };

    const handleCreate = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch("/api/roles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim().toUpperCase().replace(/\s+/g, "_"),
                    icon,
                    color,
                    permissions: selectedPermissions,
                }),
            });

            if (response.ok) {
                toast.success(wizardT?.createSuccess || "Role created successfully");
                router.push("/dashboard/settings/roles");
                router.refresh();
            } else {
                const data = await response.json();
                toast.error(data.error || wizardT?.createError || "Failed to create role");
            }
        } catch (err) {
            console.error(err);
            toast.error(wizardT?.createError || "Failed to create role");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStepDetails = () => {
        switch (currentStep) {
            case 0:
                return {
                    title: wizardT?.step1?.title || "Create New Role",
                    description: wizardT?.step1?.description || "Enter role details"
                };
            case 1:
                return {
                    title: wizardT?.step2?.title || "Choose Appearance",
                    description: wizardT?.step2?.description || "Select icon and color"
                };
            case 2:
                return {
                    title: wizardT?.step3?.title || "Set Permissions",
                    description: wizardT?.step3?.description || "Configure access levels"
                };
            default:
                return { title: "", description: "" };
        }
    };

    const handleStepClick = (stepIndex: number) => {
        if (stepIndex < currentStep) {
            setCurrentStep(stepIndex);
        }
    };

    const renderStepContent = () => {
        const { title, description } = getStepDetails();

        switch (currentStep) {
            case 0:
                return (
                    <div className="max-w-[480px] mx-auto space-y-8">
                        <WizardStepHeader
                            title={title || ""}
                            description={description}
                        />
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">{wizardT?.step1?.label || "Role Name"}</Label>
                                <Input
                                    id="name"
                                    placeholder={wizardT?.step1?.placeholder || "e.g., Editor"}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="text-lg py-6"
                                    autoFocus
                                />
                                <p className="text-xs text-muted-foreground">
                                    {wizardT?.step1?.preview || "Will be displayed as:"} {name.trim().toUpperCase().replace(/\s+/g, "_") || "ROLE_NAME"}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div className="max-w-[480px] mx-auto space-y-8">
                        <WizardStepHeader
                            title={title || ""}
                            description={description}
                        />
                        <div className="space-y-10">
                            {/* Preview */}
                            <div className="flex justify-center py-4">
                                <div
                                    className="flex h-24 w-24 items-center justify-center rounded-full border-2 transition-all duration-300"
                                    style={{
                                        backgroundColor: `${color}15`,
                                        borderColor: `${color}40`,
                                    }}
                                >
                                    <IconComponent
                                        className="h-12 w-12 transition-colors duration-300"
                                        style={{ color }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <Label className="text-base">{wizardT?.step2?.color || "Color"}</Label>
                                    <ColorPicker value={color} onChange={setColor} />
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-base">{wizardT?.step2?.icon || "Icon"}</Label>
                                    <IconPicker value={icon} onChange={setIcon} color={color} />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="max-w-[480px] mx-auto space-y-8">
                        <WizardStepHeader
                            title={title || ""}
                            description={description}
                        />
                        <div className="space-y-6">
                            <div className="space-y-4">
                                {Object.entries(permissionsByCategory).map(([category, perms]) => {
                                    const allSelected = perms.every((p) =>
                                        selectedPermissions.includes(p.key)
                                    );
                                    const someSelected = perms.some((p) =>
                                        selectedPermissions.includes(p.key)
                                    );

                                    return (
                                        <div key={category} className="border rounded-xl overflow-hidden">
                                            {/* Category Header */}
                                            <div
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => toggleCategory(category)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" || e.key === " ") {
                                                        e.preventDefault();
                                                        toggleCategory(category);
                                                    }
                                                }}
                                                className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                                            >
                                                <span className="font-medium capitalize">
                                                    {t.roles.categories?.[category as keyof typeof t.roles.categories] || category}
                                                </span>
                                                <Checkbox
                                                    checked={allSelected}
                                                    className={cn(someSelected && !allSelected && "opacity-50")}
                                                />
                                            </div>

                                            {/* Permissions */}
                                            <div className="divide-y">
                                                {perms.map((perm) => (
                                                    <label
                                                        key={perm.id}
                                                        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
                                                    >
                                                        <span className="text-sm">
                                                            {t.roles.permNames?.[perm.key as keyof typeof t.roles.permNames] || perm.name}
                                                        </span>
                                                        <Checkbox
                                                            checked={selectedPermissions.includes(perm.key)}
                                                            onCheckedChange={() => togglePermission(perm.key)}
                                                        />
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <p className="text-sm text-muted-foreground text-center">
                                {selectedPermissions.length} {wizardT?.step3?.selected || "permissions selected"}
                            </p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <ProcessWizardLayout
            steps={steps}
            currentStep={currentStep}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onStepClick={handleStepClick}
            cancelHref="/dashboard/settings/roles"
            isSubmitting={isSubmitting}
            canProceed={canProceed()}
            finishLabel={wizardT?.createBtn || "Create Role"}
        >
            {renderStepContent()}
        </ProcessWizardLayout>
    );
}
