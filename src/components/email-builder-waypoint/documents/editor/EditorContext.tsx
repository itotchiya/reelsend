import { create } from 'zustand';

import getConfiguration from '../../getConfiguration';

import { TEditorConfiguration } from './core';

// Maximum number of history states to keep
const MAX_HISTORY_SIZE = 50;

type TValue = {
  document: TEditorConfiguration;

  selectedBlockId: string | null;
  selectedSidebarTab: 'block-configuration' | 'styles';
  selectedMainTab: 'editor' | 'preview' | 'json' | 'html';
  selectedScreenSize: 'desktop' | 'mobile';

  inspectorDrawerOpen: boolean;
  samplesDrawerOpen: boolean;

  // History for undo/redo
  history: TEditorConfiguration[];
  historyIndex: number;
  isUndoRedoAction: boolean;

  // Save status tracking
  savedDocumentSnapshot: string | null;
  hasUnsavedChanges: boolean;

  // Client context for Block Library
  clientId: string | null;
};

export const editorStateStore = create<TValue>(() => ({
  document: getConfiguration(''),
  selectedBlockId: null,
  selectedSidebarTab: 'styles',
  selectedMainTab: 'editor',
  selectedScreenSize: 'desktop',

  inspectorDrawerOpen: true,
  samplesDrawerOpen: false,

  // Initialize empty history
  history: [],
  historyIndex: -1,
  isUndoRedoAction: false,

  // Save status
  savedDocumentSnapshot: null,
  hasUnsavedChanges: false,

  // Client context
  clientId: null,
}));

export function useDocument() {
  return editorStateStore((s) => s.document);
}

export function useSelectedBlockId() {
  return editorStateStore((s) => s.selectedBlockId);
}

export function useSelectedScreenSize() {
  return editorStateStore((s) => s.selectedScreenSize);
}

export function useSelectedMainTab() {
  return editorStateStore((s) => s.selectedMainTab);
}

export function setSelectedMainTab(selectedMainTab: TValue['selectedMainTab']) {
  return editorStateStore.setState({ selectedMainTab });
}

export function useSelectedSidebarTab() {
  return editorStateStore((s) => s.selectedSidebarTab);
}

export function useInspectorDrawerOpen() {
  return editorStateStore((s) => s.inspectorDrawerOpen);
}

export function useSamplesDrawerOpen() {
  return editorStateStore((s) => s.samplesDrawerOpen);
}

// Client context hooks
export function useClientId() {
  return editorStateStore((s) => s.clientId);
}

export function setClientId(clientId: string | null) {
  return editorStateStore.setState({ clientId });
}

// History hooks
export function useCanUndo() {
  return editorStateStore((s) => s.historyIndex > 0);
}

export function useCanRedo() {
  return editorStateStore((s) => s.historyIndex < s.history.length - 1);
}

// Save status hooks and functions
export function useHasUnsavedChanges() {
  return editorStateStore((s) => s.hasUnsavedChanges);
}

export function markAsSaved() {
  const state = editorStateStore.getState();
  editorStateStore.setState({
    savedDocumentSnapshot: JSON.stringify(state.document),
    hasUnsavedChanges: false,
  });
}

function checkUnsavedChanges() {
  const state = editorStateStore.getState();
  if (state.savedDocumentSnapshot === null) return;
  const currentSnapshot = JSON.stringify(state.document);
  const hasChanges = currentSnapshot !== state.savedDocumentSnapshot;
  if (hasChanges !== state.hasUnsavedChanges) {
    editorStateStore.setState({ hasUnsavedChanges: hasChanges });
  }
}

export function setSelectedBlockId(selectedBlockId: TValue['selectedBlockId']) {
  const selectedSidebarTab = selectedBlockId === null ? 'styles' : 'block-configuration';
  const options: Partial<TValue> = {};
  if (selectedBlockId !== null) {
    options.inspectorDrawerOpen = true;
  }
  return editorStateStore.setState({
    selectedBlockId,
    selectedSidebarTab,
    ...options,
  });
}

export function setSidebarTab(selectedSidebarTab: TValue['selectedSidebarTab']) {
  return editorStateStore.setState({ selectedSidebarTab });
}

export function resetDocument(document: TValue['document']) {
  // When resetting document (e.g., loading a template), initialize history
  return editorStateStore.setState({
    document,
    selectedSidebarTab: 'styles',
    selectedBlockId: null,
    history: [JSON.parse(JSON.stringify(document))],
    historyIndex: 0,
    isUndoRedoAction: false,
  });
}

// Initialize history with the current document
export function initializeHistory(document: TEditorConfiguration) {
  const snapshot = JSON.stringify(document);
  editorStateStore.setState({
    history: [JSON.parse(snapshot)],
    historyIndex: 0,
    isUndoRedoAction: false,
    savedDocumentSnapshot: snapshot,
    hasUnsavedChanges: false,
  });
}

export function setDocument(document: TValue['document']) {
  const state = editorStateStore.getState();
  const originalDocument = state.document;

  const newDocument = {
    ...originalDocument,
    ...document,
  };

  // If this is an undo/redo action, don't add to history
  if (state.isUndoRedoAction) {
    editorStateStore.setState({
      document: newDocument,
      isUndoRedoAction: false,
    });
    checkUnsavedChanges();
    return;
  }

  // Add to history
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(JSON.parse(JSON.stringify(newDocument)));

  // Limit history size
  if (newHistory.length > MAX_HISTORY_SIZE) {
    newHistory.shift();
  }

  editorStateStore.setState({
    document: newDocument,
    history: newHistory,
    historyIndex: newHistory.length - 1,
  });

  checkUnsavedChanges();
}

// Undo function
export function undo() {
  const state = editorStateStore.getState();

  if (state.historyIndex <= 0) {
    return; // Nothing to undo
  }

  const newIndex = state.historyIndex - 1;
  const previousDocument = state.history[newIndex];

  if (previousDocument) {
    editorStateStore.setState({
      document: JSON.parse(JSON.stringify(previousDocument)),
      historyIndex: newIndex,
      isUndoRedoAction: true,
    });
    checkUnsavedChanges();
  }
}

// Redo function
export function redo() {
  const state = editorStateStore.getState();

  if (state.historyIndex >= state.history.length - 1) {
    return; // Nothing to redo
  }

  const newIndex = state.historyIndex + 1;
  const nextDocument = state.history[newIndex];

  if (nextDocument) {
    editorStateStore.setState({
      document: JSON.parse(JSON.stringify(nextDocument)),
      historyIndex: newIndex,
      isUndoRedoAction: true,
    });
    checkUnsavedChanges();
  }
}

export function toggleInspectorDrawerOpen() {
  const inspectorDrawerOpen = !editorStateStore.getState().inspectorDrawerOpen;
  return editorStateStore.setState({ inspectorDrawerOpen });
}

export function toggleSamplesDrawerOpen() {
  const samplesDrawerOpen = !editorStateStore.getState().samplesDrawerOpen;
  return editorStateStore.setState({ samplesDrawerOpen });
}

export function setSelectedScreenSize(selectedScreenSize: TValue['selectedScreenSize']) {
  return editorStateStore.setState({ selectedScreenSize });
}
