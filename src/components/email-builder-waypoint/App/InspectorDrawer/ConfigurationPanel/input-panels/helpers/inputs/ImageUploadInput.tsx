import React, { useState } from 'react';
import { IconButton, InputAdornment, TextField, Tooltip, CircularProgress } from '@mui/material';
import { CloudUploadOutlined } from '@mui/icons-material';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';

type Props = {
    label: string;
    placeholder?: string;
    helperText?: string | React.ReactNode;
    defaultValue: string;
    onChange: (v: string) => void;
};

export default function ImageUploadInput({ helperText, label, placeholder, defaultValue, onChange }: Props) {
    const [value, setValue] = useState(defaultValue);
    const [uploading, setUploading] = useState(false);
    const { id: templateId } = useParams();

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        if (typeof templateId === 'string') {
            formData.append('templateId', templateId);
        }

        try {
            const response = await fetch('/api/upload/email-asset', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            setValue(data.url);
            onChange(data.url);
            toast.success('Image uploaded successfully');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    return (
        <TextField
            fullWidth
            variant="standard"
            label={label}
            placeholder={placeholder}
            helperText={helperText}
            value={value}
            onChange={(ev) => {
                const v = ev.target.value;
                setValue(v);
                onChange(v);
            }}
            InputProps={{
                endAdornment: (
                    <InputAdornment position="end">
                        <input
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="image-upload-button"
                            type="file"
                            onChange={handleUpload}
                        />
                        <label htmlFor="image-upload-button">
                            <Tooltip title="Upload image">
                                <IconButton
                                    component="span"
                                    disabled={uploading}
                                    size="small"
                                >
                                    {uploading ? <CircularProgress size={20} /> : <CloudUploadOutlined fontSize="small" />}
                                </IconButton>
                            </Tooltip>
                        </label>
                    </InputAdornment>
                ),
            }}
        />
    );
}

