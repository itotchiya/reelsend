import React, { useState } from 'react';

import { TEditorBlock } from '../../../../editor/core';

import BlocksMenu from './BlocksMenu';
import DividerButton from './DividerButton';
import PlaceholderButton from './PlaceholderButton';
import { AIBlockDialog } from './AIBlockDialog';

type Props = {
  placeholder?: boolean;
  onSelect: (block: TEditorBlock) => void;
};
export default function AddBlockButton({ onSelect, placeholder }: Props) {
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [buttonElement, setButtonElement] = useState<HTMLElement | null>(null);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);

  const handleButtonClick = () => {
    setMenuAnchorEl(buttonElement);
  };

  const renderButton = () => {
    if (placeholder) {
      return <PlaceholderButton onClick={handleButtonClick} />;
    } else {
      return <DividerButton buttonElement={buttonElement} onClick={handleButtonClick} />;
    }
  };

  const handleAiClick = () => {
    setMenuAnchorEl(null);
    setAiDialogOpen(true);
  };

  return (
    <>
      <div ref={setButtonElement} style={{ position: 'relative' }}>
        {renderButton()}
      </div>
      <BlocksMenu
        anchorEl={menuAnchorEl}
        setAnchorEl={setMenuAnchorEl}
        onSelect={onSelect}
        onAiClick={handleAiClick}
      />
      <AIBlockDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        onInsert={onSelect}
      />
    </>
  );
}

