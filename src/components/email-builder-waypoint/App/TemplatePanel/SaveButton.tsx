"use client";

import React, { useState } from 'react';
import { Button } from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { renderToStaticMarkup } from '@usewaypoint/email-builder';
import { toast } from 'sonner';
import { useDocument } from '../../documents/editor/EditorContext';
import { useParams } from 'next/navigation';

export default function SaveButton() {
    const [saving, setSaving] = useState(false);
    const document = useDocument();
    const { id } = useParams();

    const handleSave = async () => {
        setSaving(true);
        try {
            const htmlContent = renderToStaticMarkup(document, { rootBlockId: 'root' });

            const res = await fetch(`/api/templates/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    htmlContent,
                    jsonContent: document,
                }),
            });

            if (res.ok) {
                toast.success('Template saved successfully');
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
        <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
        >
            {saving ? 'Saving...' : 'Save'}
        </Button>
    );
}

