import React, { createContext, useContext } from 'react';

import { EditorBlock as CoreEditorBlock } from './core';
import { useDocument } from './EditorContext';

const EditorBlockContext = createContext<string | null>(null);
export const useCurrentBlockId = () => useContext(EditorBlockContext)!;

type EditorBlockProps = {
  id: string;
};

/**
 *
 * @param id - Block id
 * @returns EditorBlock component that loads data from the EditorDocumentContext
 */
export default function EditorBlock({ id }: EditorBlockProps) {
  const document = useDocument();
  const block = document[id];
  if (!block) {
    // Gracefully handle missing blocks instead of crashing the editor
    console.warn(`EditorBlock: Could not find block with id "${id}". Skipping.`);
    return null;
  }
  return (
    <EditorBlockContext.Provider value={id}>
      <CoreEditorBlock {...block} />
    </EditorBlockContext.Provider>
  );
}

