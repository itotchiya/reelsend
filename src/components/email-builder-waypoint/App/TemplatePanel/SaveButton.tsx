"use client";

import React, { useState } from 'react';
import { Button, Chip, Stack } from '@mui/material';
import { Save as SaveIcon, Check as CheckIcon, Warning as WarningIcon } from '@mui/icons-material';
import { renderToStaticMarkup } from '@usewaypoint/email-builder';
import { toast } from 'sonner';
import { useDocument, useHasUnsavedChanges, markAsSaved } from '../../documents/editor/EditorContext';
import { useParams } from 'next/navigation';

export default function SaveButton() {
    const [saving, setSaving] = useState(false);
    const document = useDocument();
    const hasUnsavedChanges = useHasUnsavedChanges();
    const params = useParams();

    // Get template ID from either route structure:
    // /templates/[id] -> params.id
    // /clients/[slug]/[templateId] -> params.templateId
    const templateId = params.templateId || params.id;

    const handleSave = async () => {
        if (!templateId) {
            toast.error('Template ID not found');
            return;
        }

        setSaving(true);
        try {
            const htmlContent = renderToStaticMarkup(document, { rootBlockId: 'root' });

            const res = await fetch(`/api/templates/${templateId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    htmlContent,
                    jsonContent: document,
                }),
            });

            if (res.ok) {
                toast.success('Template saved successfully');
                markAsSaved();
                // Dispatch event to notify header of successful save
                window.dispatchEvent(new Event('template-saved'));
            } else {
                toast.error('Failed to save template');
            }
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Failed to save template');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Stack direction="row" spacing={1} alignItems="center">
            {/* Save Status Badge */}
            <Chip
                icon={hasUnsavedChanges ? <WarningIcon fontSize="small" /> : <CheckIcon fontSize="small" />}
                label={hasUnsavedChanges ? "Unsaved" : "Saved"}
                size="small"
                color={hasUnsavedChanges ? "warning" : "success"}
                variant="outlined"
                sx={{
                    fontWeight: 500,
                    '& .MuiChip-icon': {
                        fontSize: '14px'
                    }
                }}
            />

            {/* Save Button */}
            <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving || !templateId}
            >
                {saving ? 'Saving...' : 'Save'}
            </Button>
        </Stack>
    );
}
