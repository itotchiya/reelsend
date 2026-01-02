"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    MoreHorizontal,
    Pencil,
    Trash2,
    ExternalLink,
    Copy,
    History,
    Eye,
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * CardActions Component
 * 
 * @path src/components/ui-kit/card-actions.tsx
 * 
 * A reusable dropdown menu component for card actions.
 * Provides consistent styling and behavior across all card components.
 * 
 * Features:
 * - Pre-configured actions (view, edit, delete, duplicate, viewActivity)
 * - Custom action support
 * - Disabled state support
 * - Danger styling for destructive actions
 * - Automatic stopPropagation handling
 */

// Pre-defined action types
export type CardActionType = "view" | "edit" | "delete" | "duplicate" | "viewActivity" | "openEditor";

export interface CardAction {
    type: CardActionType | "custom";
    label: string;
    icon?: LucideIcon | React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    danger?: boolean;
    hidden?: boolean;
    separatorBefore?: boolean;
}

export interface CardActionsProps {
    actions: CardAction[];
    triggerClassName?: string;
    contentClassName?: string;
    align?: "start" | "center" | "end";
    disabled?: boolean;
}

// Default icons for each action type
const defaultIcons: Record<CardActionType, LucideIcon> = {
    view: ExternalLink,
    edit: Pencil,
    delete: Trash2,
    duplicate: Copy,
    viewActivity: History,
    openEditor: Eye,
};

// Helper to get the icon component
function getActionIcon(action: CardAction): React.ReactNode {
    if (action.icon) {
        // If icon is already a React node (JSX element), return it
        if (React.isValidElement(action.icon)) {
            return action.icon;
        }
        // If icon is a LucideIcon component
        const IconComponent = action.icon as LucideIcon;
        return <IconComponent className="h-4 w-4" />;
    }

    // Use default icon based on action type
    if (action.type !== "custom") {
        const IconComponent = defaultIcons[action.type];
        return <IconComponent className="h-4 w-4" />;
    }

    return null;
}

export function CardActions({
    actions,
    triggerClassName,
    contentClassName,
    align = "end",
    disabled = false,
}: CardActionsProps) {
    // Filter out hidden actions
    const visibleActions = actions.filter((action) => !action.hidden);

    if (visibleActions.length === 0) {
        return null;
    }

    const handleActionClick = (e: React.MouseEvent, action: CardAction) => {
        e.stopPropagation();
        if (!action.disabled) {
            action.onClick();
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-7 w-7 shrink-0", triggerClassName)}
                    disabled={disabled}
                >
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={align} className={contentClassName}>
                {visibleActions.map((action, index) => (
                    <React.Fragment key={`${action.type}-${index}`}>
                        {action.separatorBefore && index > 0 && <DropdownMenuSeparator />}
                        <DropdownMenuItem
                            onClick={(e) => handleActionClick(e, action)}
                            disabled={action.disabled}
                            className={cn(
                                "cursor-pointer",
                                action.danger && "text-destructive focus:text-destructive focus:bg-destructive/10",
                                action.disabled && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <span className={cn(
                                "mr-2 flex items-center",
                                action.danger && "text-destructive"
                            )}>
                                {getActionIcon(action)}
                            </span>
                            {action.label}
                        </DropdownMenuItem>
                    </React.Fragment>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// ============================================
// Pre-configured action builders
// ============================================

export interface StandardCardActionsConfig<T> {
    item: T;
    onView?: (item: T) => void;
    onEdit?: (item: T) => void;
    onDelete?: (item: T) => void;
    onDuplicate?: (item: T) => void;
    onViewActivity?: (item: T) => void;
    onOpenEditor?: (item: T) => void;
    canView?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    canDuplicate?: boolean;
    canViewActivity?: boolean;
    canOpenEditor?: boolean;
    labels?: {
        view?: string;
        edit?: string;
        delete?: string;
        duplicate?: string;
        viewActivity?: string;
        openEditor?: string;
    };
}

const defaultActionLabels = {
    view: "View",
    edit: "Edit",
    delete: "Delete",
    duplicate: "Duplicate",
    viewActivity: "View Activity",
    openEditor: "Open Editor",
};

/**
 * Build a standard set of card actions
 */
export function buildCardActions<T>(config: StandardCardActionsConfig<T>): CardAction[] {
    const labels = { ...defaultActionLabels, ...config.labels };
    const actions: CardAction[] = [];

    // View action
    if (config.onView && config.canView !== false) {
        actions.push({
            type: "view",
            label: labels.view,
            onClick: () => config.onView!(config.item),
        });
    }

    // Open Editor action
    if (config.onOpenEditor && config.canOpenEditor !== false) {
        actions.push({
            type: "openEditor",
            label: labels.openEditor,
            onClick: () => config.onOpenEditor!(config.item),
        });
    }

    // Edit action
    if (config.onEdit && config.canEdit !== false) {
        actions.push({
            type: "edit",
            label: labels.edit,
            onClick: () => config.onEdit!(config.item),
        });
    }

    // Duplicate action
    if (config.onDuplicate && config.canDuplicate !== false) {
        actions.push({
            type: "duplicate",
            label: labels.duplicate,
            onClick: () => config.onDuplicate!(config.item),
        });
    }

    // View Activity action
    if (config.onViewActivity && config.canViewActivity !== false) {
        actions.push({
            type: "viewActivity",
            label: labels.viewActivity,
            onClick: () => config.onViewActivity!(config.item),
        });
    }

    // Delete action (always last with separator)
    if (config.onDelete && config.canDelete !== false) {
        actions.push({
            type: "delete",
            label: labels.delete,
            onClick: () => config.onDelete!(config.item),
            danger: true,
            separatorBefore: actions.length > 0,
        });
    }

    return actions;
}

// ============================================
// Convenience component for standard actions
// ============================================

export interface StandardCardActionsProps<T> extends Omit<CardActionsProps, "actions">, StandardCardActionsConfig<T> { }

export function StandardCardActions<T>({
    item,
    onView,
    onEdit,
    onDelete,
    onDuplicate,
    onViewActivity,
    onOpenEditor,
    canView,
    canEdit,
    canDelete,
    canDuplicate,
    canViewActivity,
    canOpenEditor,
    labels,
    ...cardActionsProps
}: StandardCardActionsProps<T>) {
    const actions = buildCardActions({
        item,
        onView,
        onEdit,
        onDelete,
        onDuplicate,
        onViewActivity,
        onOpenEditor,
        canView,
        canEdit,
        canDelete,
        canDuplicate,
        canViewActivity,
        canOpenEditor,
        labels,
    });

    return <CardActions actions={actions} {...cardActionsProps} />;
}
