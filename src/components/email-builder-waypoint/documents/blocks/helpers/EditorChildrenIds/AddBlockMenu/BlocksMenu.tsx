import React from 'react';
import { Box, Menu } from '@mui/material';
import { TEditorBlock } from '../../../../editor/core';
import BlockButton from './BlockButton';
import { BUTTONS } from './buttons';
import { Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

type BlocksMenuProps = {
  anchorEl: HTMLElement | null;
  setAnchorEl: (v: HTMLElement | null) => void;
  onSelect: (block: TEditorBlock) => void;
  onAiClick?: () => void;
};

export default function BlocksMenu({ anchorEl, setAnchorEl, onSelect, onAiClick }: BlocksMenuProps) {
  const { t } = useI18n();
  const onClose = () => {
    setAnchorEl(null);
  };

  const onClick = (block: TEditorBlock) => {
    onSelect(block);
    setAnchorEl(null);
  };

  if (anchorEl === null) {
    return null;
  }

  return (
    <Menu
      open
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Box sx={{ p: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
        {/* AI Spark Button */}
        <BlockButton
          label={t.aiBlockGenerator?.menuLabel || "AI Block"}
          icon={<Sparkles className="w-6 h-6 text-purple-600 animate-pulse" />}
          onClick={() => onAiClick && onAiClick()}
        />

        {BUTTONS.map((k, i) => (
          <BlockButton key={i} label={k.label} icon={k.icon} onClick={() => onClick(k.block())} />
        ))}
      </Box>
    </Menu>
  );
}

