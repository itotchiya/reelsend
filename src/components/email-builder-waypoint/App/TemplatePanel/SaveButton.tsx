"use client";

import React, { useState } from 'react';
import { Button, Chip, Stack } from '@mui/material';
import { Save as SaveIcon, Check as CheckIcon, Warning as WarningIcon } from '@mui/icons-material';
import { renderToStaticMarkup } from '@usewaypoint/email-builder';
import { toast } from 'sonner';
import { useDocument, useHasUnsavedChanges, markAsSaved } from '../../documents/editor/EditorContext';
import { useParams, useRouter } from 'next/navigation';

export default function SaveButton() {
    const [saving, setSaving] = useState(false);
    const document = useDocument();
    const hasUnsavedChanges = useHasUnsavedChanges();
    const params = useParams();
    const router = useRouter();

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

            // Determine API endpoint: /api/blocks or /api/templates
            const isBlockEditor = window.location.pathname.includes('/dashboard/blocks/');
            const apiEndpoint = isBlockEditor ? `/api/blocks/${templateId}` : `/api/templates/${templateId}`;

            const res = await fetch(apiEndpoint, {
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
                // Refresh the router to update server components (previews in lists)
                router.refresh();
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
                icon={hasUnsavedChanges ? <WarningIcon fontSize="small" style={{ color: '#d32f2f' }} /> : <CheckIcon fontSize="small" style={{ color: '#2e7d32' }} />}
                label={hasUnsavedChanges ? "Unsaved" : "Saved"}
                size="small"
                sx={{
                    fontWeight: 600,
                    backgroundColor: hasUnsavedChanges ? '#ffebee' : '#e8f5e9',
                    color: hasUnsavedChanges ? '#c62828' : '#2e7d32',
                    borderColor: hasUnsavedChanges ? '#ffcdd2' : '#c8e6c9',
                    '& .MuiChip-icon': {
                        fontSize: '16px'
                    }
                }}
                variant="outlined"
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
