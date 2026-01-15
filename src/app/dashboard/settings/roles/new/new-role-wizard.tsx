"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { IconPicker, getRoleIconByName } from "@/components/ui-kit/icon-picker";
import { ColorPicker } from "@/components/ui-kit/color-picker";
import { ProcessWizardLayout } from "@/components/ui-kit/process-wizard-layout";
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

    const steps = [
        (t as any)?.roles?.wizard?.steps?.name || "Name",
        (t as any)?.roles?.wizard?.steps?.appearance || "Appearance",
        (t as any)?.roles?.wizard?.steps?.permissions || "Permissions"
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
                toast.success((t as any)?.roles?.wizard?.createSuccess || "Role created successfully");
                router.push("/dashboard/settings/roles");
                router.refresh();
            } else {
                const data = await response.json();
                toast.error(data.error || (t as any)?.roles?.wizard?.createError || "Failed to create role");
            }
        } catch (error) {
            toast.error((t as any)?.roles?.wizard?.createError || "Failed to create role");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStepDetails = () => {
        switch (currentStep) {
            case 0:
                return {
                    title: (t as any)?.roles?.wizard?.step1?.title || "Create New Role",
                    description: (t as any)?.roles?.wizard?.step1?.description || "Enter role details"
                };
            case 1:
                return {
                    title: (t as any)?.roles?.wizard?.step2?.title || "Choose Appearance",
                    description: (t as any)?.roles?.wizard?.step2?.description || "Select icon and color"
                };
            case 2:
                return {
                    title: (t as any)?.roles?.wizard?.step3?.title || "Set Permissions",
                    description: (t as any)?.roles?.wizard?.step3?.description || "Configure access levels"
                };
            default:
                return {};
        }
    };

    const handleStepClick = (stepIndex: number) => {
        if (stepIndex < currentStep) {
            setCurrentStep(stepIndex);
        }
    };

    const { title, description } = getStepDetails();

    return (
        <ProcessWizardLayout
            steps={steps}
            currentStep={currentStep}
            title={title || ""}
            description={description}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onStepClick={handleStepClick}
            cancelHref="/dashboard/settings/roles"
            isSubmitting={isSubmitting}
            canProceed={canProceed()}
            finishLabel={(t as any)?.roles?.wizard?.createBtn || "Create Role"}
        >
            {/* Step 1: Name */}
            {currentStep === 0 && (
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">{(t as any)?.roles?.wizard?.step1?.label || "Role Name"}</Label>
                        <Input
                            id="name"
                            placeholder={(t as any)?.roles?.wizard?.step1?.placeholder || "e.g., Editor"}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="text-lg py-6"
                            autoFocus
                        />
                        <p className="text-xs text-muted-foreground">
                            {(t as any)?.roles?.wizard?.step1?.preview || "Will be displayed as:"} {name.trim().toUpperCase().replace(/\s+/g, "_") || "ROLE_NAME"}
                        </p>
                    </div>
                </div>
            )}

            {/* Step 2: Appearance */}
            {currentStep === 1 && (
                <div className="space-y-10">
                    {/* Preview */}
                    <div className="flex justify-center mb-10 py-4">
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
                            <Label className="text-base">{(t as any)?.roles?.wizard?.step2?.color || "Color"}</Label>
                            <ColorPicker value={color} onChange={setColor} />
                        </div>

                        <div className="space-y-4">
                            <Label className="text-base">{(t as any)?.roles?.wizard?.step2?.icon || "Icon"}</Label>
                            <IconPicker value={icon} onChange={setIcon} color={color} />
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Permissions */}
            {currentStep === 2 && (
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
                                            {(t.roles.categories as any)?.[category] || category}
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
                                                    {(t.roles.permNames as any)?.[perm.key] || perm.name}
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
                        {selectedPermissions.length} {(t as any)?.roles?.wizard?.step3?.selected || "permissions selected"}
                    </p>
                </div>
            )}
        </ProcessWizardLayout>
    );
}


