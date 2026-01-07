import React, { useEffect, useRef } from 'react';

import { MonitorOutlined, PhoneIphoneOutlined, Undo, Redo } from '@mui/icons-material';
import { Box, Stack, SxProps, ToggleButton, ToggleButtonGroup, Tooltip, IconButton } from '@mui/material';
import { Reader } from '@usewaypoint/email-builder';

import EditorBlock from '../../documents/editor/EditorBlock';
import {
  setSelectedScreenSize,
  useDocument,
  useSelectedMainTab,
  useSelectedScreenSize,
  useCanUndo,
  useCanRedo,
  undo,
  redo,
  useHasUnsavedChanges,
} from '../../documents/editor/EditorContext';
import { useEditorKeyboardShortcuts } from '../../documents/editor/useEditorKeyboardShortcuts';
import ToggleInspectorPanelButton from '../InspectorDrawer/ToggleInspectorPanelButton';
import ToggleSamplesPanelButton from '../SamplesDrawer/ToggleSamplesPanelButton';

import DownloadJson from './DownloadJson';
import HtmlPanel from './HtmlPanel';
import ImportJson from './ImportJson';
import JsonPanel from './JsonPanel';
import MainTabsGroup from './MainTabsGroup';
import ShareButton from './ShareButton';
import SaveButton from './SaveButton';
import { ChevronLeft } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

export default function TemplatePanel() {
  const router = useRouter();
  const document = useDocument();
  const selectedMainTab = useSelectedMainTab();
  const selectedScreenSize = useSelectedScreenSize();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const hasUnsavedChanges = useHasUnsavedChanges();
  const historyPushedRef = useRef(false);

  // Enable keyboard shortcuts
  useEditorKeyboardShortcuts();

  // Handle browser back/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Handle browser back button (SPA navigation)
  useEffect(() => {
    if (hasUnsavedChanges) {
      // Push a dummy state so 'Back' doesn't leave the page immediately
      // Push dummy state to "trap" the back button
      window.history.pushState(null, document.title, window.location.href);
      historyPushedRef.current = true;

      const handlePopState = () => {
        // When this fires, the dummy state was JUST popped by the browser.
        // So visually we are back at the "real" state.

        if (window.confirm('the files is not saved you may lost your template are you sure')) {
          // User wants to leave.
          window.removeEventListener('popstate', handlePopState);
          // We don't need to cleanup history manually here because the user *already* popped it by clicking Back.
          historyPushedRef.current = false;
          window.history.back(); // Go back for real (to the previous page)
        } else {
          // User stays. Restore the trap.
          window.history.pushState(null, document.title, window.location.href);
          historyPushedRef.current = true;
        }
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
        // CRITICAL FIX:
        // If we are unmounting or changing state (e.g. Saved), and we still think we have a pushed state,
        // we must pop it to clean up the stack.
        if (historyPushedRef.current) {
          window.history.back();
          historyPushedRef.current = false;
        }
      };
    }
  }, [hasUnsavedChanges]);

  // Handle back button
  // We rely on the popstate listener (useEffect above) to handle unsaved changes confirmation
  const handleBack = () => {
    // Force a full page reload when going back to ensure the list page shows updated data (thumbnails, etc.)
    const parentUrl = window.location.pathname.split('/').slice(0, -1).join('/');
    window.location.href = parentUrl;
  };

  let mainBoxSx: SxProps = {
    height: '100%',
  };
  if (selectedScreenSize === 'mobile') {
    mainBoxSx = {
      ...mainBoxSx,
      margin: '32px auto',
      width: 370,
      height: 800,
      boxShadow:
        'rgba(33, 36, 67, 0.04) 0px 10px 20px, rgba(33, 36, 67, 0.04) 0px 2px 6px, rgba(33, 36, 67, 0.04) 0px 0px 1px',
    };
  }

  const handleScreenSizeChange = (_: unknown, value: unknown) => {
    switch (value) {
      case 'mobile':
      case 'desktop':
        setSelectedScreenSize(value);
        return;
      default:
        setSelectedScreenSize('desktop');
    }
  };

  const renderMainPanel = () => {
    switch (selectedMainTab) {
      case 'editor':
        return (
          <Box sx={mainBoxSx}>
            <EditorBlock id="root" />
          </Box>
        );
      case 'preview':
        return (
          <Box sx={mainBoxSx}>
            <Reader document={document} rootBlockId="root" />
          </Box>
        );
      case 'html':
        return <HtmlPanel />;
      case 'json':
        return <JsonPanel />;
    }
  };

  return (
    <>
      <Stack
        sx={{
          height: 49,
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: 'white',
          position: 'sticky',
          top: 0,
          zIndex: 'appBar',
          px: 1,
        }}
        direction="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <ToggleSamplesPanelButton />
        <Stack px={2} direction="row" gap={2} width="100%" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton onClick={handleBack} size="small" sx={{ mr: 1 }}>
              <ChevronLeft fontSize="small" />
            </IconButton>
            <Tooltip title="Undo (Ctrl+Z)">
              <span>
                <IconButton onClick={undo} size="small" disabled={!canUndo}>
                  <Undo fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Redo (Ctrl+Shift+Z)">
              <span>
                <IconButton onClick={redo} size="small" disabled={!canRedo}>
                  <Redo fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <MainTabsGroup />
          </Stack>
          <Stack direction="row" spacing={2}>
            <SaveButton />
            <DownloadJson />
            <ImportJson />
            <ToggleButtonGroup value={selectedScreenSize} exclusive size="small" onChange={handleScreenSizeChange}>
              <ToggleButton value="desktop">
                <Tooltip title="Desktop view">
                  <MonitorOutlined fontSize="small" />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="mobile">
                <Tooltip title="Mobile view">
                  <PhoneIphoneOutlined fontSize="small" />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
            <ShareButton />
          </Stack>
        </Stack>
        <ToggleInspectorPanelButton />
      </Stack>
      <Box sx={{ height: 'calc(100vh - 49px)', overflow: 'auto', minWidth: 370 }}>{renderMainPanel()}</Box>
    </>
  );
}

