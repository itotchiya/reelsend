"use client";

import * as React from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Pencil,
    Trash2,
    Copy,
    History,
    Eye,
    ExternalLink,
    Send,
} from "lucide-react";

/**
 * TableRowActions - A reusable dropdown menu for table row actions
 * Uses the same action types as CardActions for consistency
 */

export type ActionType = "view" | "edit" | "delete" | "duplicate" | "viewActivity" | "openEditor" | "sendTest";

export interface RowAction {
    type: ActionType | "custom";
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    danger?: boolean;
    hidden?: boolean;
    separatorBefore?: boolean;
}

interface TableRowActionsProps {
    actions: RowAction[];
    disabled?: boolean;
}

const defaultIcons: Record<ActionType, React.ReactNode> = {
    view: <ExternalLink className="h-4 w-4" />,
    edit: <Pencil className="h-4 w-4" />,
    delete: <Trash2 className="h-4 w-4" />,
    duplicate: <Copy className="h-4 w-4" />,
    viewActivity: <History className="h-4 w-4" />,
    openEditor: <Eye className="h-4 w-4" />,
    sendTest: <Send className="h-4 w-4" />,
};

export function TableRowActions({ actions, disabled = false }: TableRowActionsProps) {
    const visibleActions = actions.filter((action) => !action.hidden);

    if (visibleActions.length === 0) return null;

    const handleClick = (e: React.MouseEvent, action: RowAction) => {
        e.stopPropagation();
        if (!action.disabled) {
            action.onClick();
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 p-0"
                    disabled={disabled}
                    onClick={(e) => e.stopPropagation()}
                >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                {visibleActions.map((action, index) => (
                    <React.Fragment key={`${action.type}-${index}`}>
                        {action.separatorBefore && <DropdownMenuSeparator />}
                        <DropdownMenuItem
                            onClick={(e) => handleClick(e, action)}
                            disabled={action.disabled}
                            className={`cursor-pointer ${action.danger ? "text-destructive focus:text-destructive" : ""}`}
                        >
                            <span className="mr-2">
                                {action.icon || (action.type !== "custom" && defaultIcons[action.type])}
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
// Pre-configured action builders for each entity type
// ============================================

interface CampaignActionsConfig {
    campaign: { id: string };
    onView?: () => void;
    onEdit?: () => void;
    onDuplicate?: () => void;
    onDelete?: () => void;
    canDelete?: boolean;
}

export function buildCampaignActions(config: CampaignActionsConfig): RowAction[] {
    const actions: RowAction[] = [];

    if (config.onView) {
        actions.push({
            type: "view",
            label: "View Campaign",
            onClick: config.onView,
        });
    }

    if (config.onEdit) {
        actions.push({
            type: "edit",
            label: "Edit",
            onClick: config.onEdit,
        });
    }

    if (config.onDuplicate) {
        actions.push({
            type: "duplicate",
            label: "Duplicate",
            onClick: config.onDuplicate,
        });
    }

    if (config.onDelete) {
        actions.push({
            type: "delete",
            label: "Delete",
            onClick: config.onDelete,
            danger: true,
            separatorBefore: true,
            disabled: config.canDelete === false,
        });
    }

    return actions;
}

interface AudienceActionsConfig {
    audience: { id: string };
    onView?: () => void;
    onEdit?: () => void;
    onDuplicate?: () => void;
    onDelete?: () => void;
    canDelete?: boolean;
}

export function buildAudienceActions(config: AudienceActionsConfig): RowAction[] {
    const actions: RowAction[] = [];

    if (config.onView) {
        actions.push({
            type: "view",
            label: "View Audience",
            onClick: config.onView,
        });
    }

    if (config.onEdit) {
        actions.push({
            type: "edit",
            label: "Edit",
            onClick: config.onEdit,
        });
    }

    if (config.onDuplicate) {
        actions.push({
            type: "duplicate",
            label: "Duplicate",
            onClick: config.onDuplicate,
        });
    }

    if (config.onDelete) {
        actions.push({
            type: "delete",
            label: "Delete",
            onClick: config.onDelete,
            danger: true,
            separatorBefore: true,
            disabled: config.canDelete === false,
        });
    }

    return actions;
}

interface TemplateActionsConfig {
    template: { id: string };
    onOpenEditor?: () => void;
    onEdit?: () => void;
    onDuplicate?: () => void;
    onViewActivity?: () => void;
    onDelete?: () => void;
    canDelete?: boolean;
}

export function buildTemplateActions(config: TemplateActionsConfig): RowAction[] {
    const actions: RowAction[] = [];

    if (config.onOpenEditor) {
        actions.push({
            type: "openEditor",
            label: "Open Editor",
            onClick: config.onOpenEditor,
        });
    }

    if (config.onEdit) {
        actions.push({
            type: "edit",
            label: "Edit Details",
            onClick: config.onEdit,
        });
    }

    if (config.onDuplicate) {
        actions.push({
            type: "duplicate",
            label: "Duplicate",
            onClick: config.onDuplicate,
        });
    }

    if (config.onViewActivity) {
        actions.push({
            type: "viewActivity",
            label: "View Activity",
            onClick: config.onViewActivity,
        });
    }

    if (config.onDelete) {
        actions.push({
            type: "delete",
            label: "Delete",
            onClick: config.onDelete,
            danger: true,
            separatorBefore: true,
            disabled: config.canDelete === false,
        });
    }

    return actions;
}
