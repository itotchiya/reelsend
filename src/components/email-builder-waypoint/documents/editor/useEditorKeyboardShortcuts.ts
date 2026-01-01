"use client";

import { useEffect } from 'react';
import { undo, redo } from './EditorContext';

export function useEditorKeyboardShortcuts() {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check if we're in an input field - if so, let browser handle it
            const target = e.target as HTMLElement;

            // For regular inputs/textareas, let browser handle it
            if ((target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') &&
                (e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z' || e.key === 'y' || e.key === 'Y')) {
                return; // Let browser handle undo/redo for input fields
            }

            // Redo: Ctrl+Shift+Z or Cmd+Shift+Z or Ctrl+Y (check this first before undo)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
                e.preventDefault();
                redo();
                return;
            }

            // Redo: Ctrl+Y
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
                e.preventDefault();
                redo();
                return;
            }

            // Undo: Ctrl+Z or Cmd+Z (without shift)
            if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
                e.preventDefault();
                undo();
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
}
