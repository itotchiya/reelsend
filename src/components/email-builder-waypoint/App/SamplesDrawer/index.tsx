'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Divider,
  Drawer,
  Stack,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import { Add, Layers, Dashboard, Delete, Save, AddCircleOutline } from '@mui/icons-material';

import {
  useSamplesDrawerOpen,
  useClientId,
  useDocument,
  setDocument,
  useSelectedBlockId,
} from '../../documents/editor/EditorContext';
import { TEditorBlock } from '../../documents/editor/core';

export const SAMPLES_DRAWER_WIDTH = 280;

// Default block categories
const DEFAULT_CATEGORIES = [
  { value: 'headers', label: 'Headers' },
  { value: 'content', label: 'Content' },
  { value: 'cta', label: 'CTAs' },
  { value: 'footers', label: 'Footers' },
];

interface SavedBlock {
  id: string;
  name: string;
  description?: string;
  category?: string;
  jsonContent: any;
  thumbnail?: string;
  clientId?: string | null;
  createdAt: string;
}

// Save Block Dialog Component
function SaveBlockDialog({
  open,
  onClose,
  onSave,
  existingCategories,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, category: string, isGlobal: boolean) => Promise<void>;
  existingCategories: string[];
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('content');
  const [isGlobal, setIsGlobal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);

  // Merge default and existing categories
  const allCategories = [
    ...DEFAULT_CATEGORIES,
    ...existingCategories
      .filter(c => !DEFAULT_CATEGORIES.some(d => d.value === c))
      .map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))
  ];

  const handleSave = async () => {
    if (!name.trim()) return;

    setSaving(true);
    try {
      const finalCategory = showNewCategoryInput && newCategory.trim()
        ? newCategory.trim().toLowerCase()
        : category;
      await onSave(name.trim(), finalCategory, isGlobal);
      // Reset form
      setName('');
      setCategory('content');
      setIsGlobal(false);
      setNewCategory('');
      setShowNewCategoryInput(false);
      onClose();
    } catch (error) {
      console.error('Failed to save block:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setName('');
      setCategory('content');
      setIsGlobal(false);
      setNewCategory('');
      setShowNewCategoryInput(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Save sx={{ color: 'primary.main' }} />
          <Typography variant="h6">Save Block</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} pt={1}>
          {/* Block Name */}
          <TextField
            label="Block Name"
            placeholder="e.g., Hero Section, Footer CTA"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            autoFocus
            size="small"
          />

          {/* Category Selection */}
          {!showNewCategoryInput ? (
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                label="Category"
                onChange={(e) => setCategory(e.target.value)}
              >
                {allCategories.map((cat) => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </MenuItem>
                ))}
                <Divider />
                <MenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    setShowNewCategoryInput(true);
                  }}
                  sx={{ color: 'primary.main' }}
                >
                  <AddCircleOutline sx={{ mr: 1, fontSize: 18 }} />
                  Create New Category
                </MenuItem>
              </Select>
            </FormControl>
          ) : (
            <TextField
              label="New Category"
              placeholder="Enter category name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              fullWidth
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      size="small"
                      onClick={() => {
                        setShowNewCategoryInput(false);
                        setNewCategory('');
                      }}
                    >
                      Cancel
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
          )}

          {/* Scope Selection */}
          <Box>
            <Typography variant="caption" color="text.secondary" mb={1} display="block">
              Block Scope
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip
                label="Client Only"
                variant={!isGlobal ? 'filled' : 'outlined'}
                onClick={() => setIsGlobal(false)}
                color={!isGlobal ? 'primary' : 'default'}
                size="small"
              />
              <Chip
                label="Global (All Clients)"
                variant={isGlobal ? 'filled' : 'outlined'}
                onClick={() => setIsGlobal(true)}
                color={isGlobal ? 'primary' : 'default'}
                size="small"
              />
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!name.trim() || saving}
          startIcon={saving ? <CircularProgress size={16} /> : <Save />}
        >
          {saving ? 'Saving...' : 'Save Block'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function BlockCard({ block, onAdd, onDelete }: {
  block: SavedBlock;
  onAdd: () => void;
  onDelete: () => void;
}) {
  const isGlobal = !block.clientId;

  return (
    <Box
      onClick={onAdd}
      sx={{
        p: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: 'action.hover',
        },
        position: 'relative',
      }}
    >
      {/* Thumbnail or placeholder */}
      <Box
        sx={{
          height: 60,
          bgcolor: 'grey.100',
          borderRadius: 0.5,
          mb: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {block.thumbnail ? (
          <Box component="img" src={block.thumbnail} sx={{ maxHeight: '100%', maxWidth: '100%' }} />
        ) : (
          <Layers sx={{ color: 'grey.400', fontSize: 24 }} />
        )}
      </Box>

      {/* Block name */}
      <Typography variant="body2" fontWeight={500} noWrap>
        {block.name}
      </Typography>

      {/* Badges */}
      <Stack direction="row" spacing={0.5} mt={0.5} flexWrap="wrap">
        {isGlobal && (
          <Chip label="Global" size="small" sx={{ height: 18, fontSize: 10 }} />
        )}
        {block.category && (
          <Chip label={block.category} size="small" variant="outlined" sx={{ height: 18, fontSize: 10 }} />
        )}
      </Stack>

      {/* Delete button */}
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        sx={{
          position: 'absolute',
          top: 4,
          right: 4,
          opacity: 0,
          transition: 'opacity 0.2s',
          '.MuiBox-root:hover &': { opacity: 1 },
        }}
      >
        <Delete fontSize="small" />
      </IconButton>
    </Box>
  );
}

export default function BlockLibraryDrawer() {
  const samplesDrawerOpen = useSamplesDrawerOpen();
  const clientId = useClientId();
  const document = useDocument();
  const selectedBlockId = useSelectedBlockId();

  const [blocks, setBlocks] = useState<SavedBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0); // 0 = Blocks, 1 = Templates
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  // Check if a block is selected
  const hasSelectedBlock = Boolean(selectedBlockId);

  // Fetch blocks when drawer opens or clientId changes
  useEffect(() => {
    if (samplesDrawerOpen) {
      fetchBlocks();
    }
  }, [samplesDrawerOpen, clientId]);

  const fetchBlocks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (clientId) params.set('clientId', clientId);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);

      const response = await fetch(`/api/saved-blocks?${params}`);
      if (response.ok) {
        const data = await response.json();
        setBlocks(data);
      }
    } catch (error) {
      console.error('Failed to fetch blocks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get existing categories from blocks
  const existingCategories = [...new Set(blocks.map(b => b.category).filter(Boolean))] as string[];

  // Add block to email document
  const handleAddBlock = (block: SavedBlock) => {
    const blockContent = block.jsonContent;

    // Generate a unique ID for this block instance
    const blockId = `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // Get current document
    const currentDoc = { ...document };
    const rootBlock = currentDoc.root;

    if (!rootBlock || rootBlock.type !== 'EmailLayout') return;

    // Add the block content to the document with the new ID
    const newBlock: TEditorBlock = {
      type: blockContent.type || 'Container',
      data: blockContent.data || blockContent,
    };

    currentDoc[blockId] = newBlock;

    // Add block ID to root's childrenIds
    const currentChildrenIds = rootBlock.data?.childrenIds || [];
    currentDoc.root = {
      ...rootBlock,
      data: {
        ...rootBlock.data,
        childrenIds: [...currentChildrenIds, blockId],
      },
    };

    setDocument(currentDoc);
  };

  // Save selected block
  const handleSaveBlock = async (name: string, category: string, isGlobal: boolean) => {
    if (!selectedBlockId || !document[selectedBlockId]) {
      throw new Error('No block selected');
    }

    const blockData = document[selectedBlockId];

    const response = await fetch('/api/saved-blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        category,
        jsonContent: blockData,
        clientId: isGlobal ? null : clientId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save block');
    }

    // Refresh blocks list
    fetchBlocks();
  };

  // Delete block
  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm('Are you sure you want to delete this block?')) return;

    try {
      const response = await fetch(`/api/saved-blocks/${blockId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setBlocks(blocks.filter(b => b.id !== blockId));
      }
    } catch (error) {
      console.error('Failed to delete block:', error);
    }
  };

  // Filter blocks
  const filteredBlocks = blocks.filter(block => {
    if (categoryFilter === 'all') return true;
    return block.category === categoryFilter;
  });

  // Separate global and client blocks
  const globalBlocks = filteredBlocks.filter(b => !b.clientId);
  const clientBlocks = filteredBlocks.filter(b => b.clientId);

  // Category filter chips including 'all'
  const filterCategories = [
    { value: 'all', label: 'All' },
    ...DEFAULT_CATEGORIES,
  ];

  return (
    <>
      <Drawer
        variant="persistent"
        anchor="left"
        open={samplesDrawerOpen}
        sx={{
          width: samplesDrawerOpen ? SAMPLES_DRAWER_WIDTH : 0,
        }}
      >
        <Stack width={SAMPLES_DRAWER_WIDTH} height="100%" bgcolor="background.paper">
          {/* Header */}
          <Box px={2} py={1.5} borderBottom={1} borderColor="divider">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Dashboard sx={{ color: 'primary.main' }} />
              <Typography variant="h6" fontWeight={600}>
                Block Library
              </Typography>
            </Stack>
          </Box>

          {/* Tabs */}
          <Tabs
            value={selectedTab}
            onChange={(_, v) => setSelectedTab(v)}
            sx={{ px: 1, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Blocks" sx={{ minWidth: 0, flex: 1 }} />
            <Tab label="Templates" sx={{ minWidth: 0, flex: 1 }} />
          </Tabs>

          {selectedTab === 0 && (
            <>
              {/* Category Filter */}
              <Stack direction="row" spacing={0.5} p={1} flexWrap="wrap" gap={0.5}>
                {filterCategories.map(cat => (
                  <Chip
                    key={cat.value}
                    label={cat.label}
                    size="small"
                    variant={categoryFilter === cat.value ? 'filled' : 'outlined'}
                    onClick={() => {
                      setCategoryFilter(cat.value);
                    }}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Stack>

              <Divider />

              {/* Blocks List */}
              <Box flex={1} overflow="auto" p={1}>
                {loading ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress size={24} />
                  </Box>
                ) : filteredBlocks.length === 0 ? (
                  <Box textAlign="center" py={4}>
                    <Layers sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      No blocks saved yet
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Select elements and save as block
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={1.5}>
                    {/* Client Blocks Section */}
                    {clientBlocks.length > 0 && (
                      <>
                        <Typography variant="caption" color="text.secondary" px={0.5} fontWeight={600}>
                          Client Blocks
                        </Typography>
                        {clientBlocks.map(block => (
                          <BlockCard
                            key={block.id}
                            block={block}
                            onAdd={() => handleAddBlock(block)}
                            onDelete={() => handleDeleteBlock(block.id)}
                          />
                        ))}
                      </>
                    )}

                    {/* Global Blocks Section */}
                    {globalBlocks.length > 0 && (
                      <>
                        <Typography variant="caption" color="text.secondary" px={0.5} fontWeight={600} mt={clientBlocks.length > 0 ? 1 : 0}>
                          Global Blocks
                        </Typography>
                        {globalBlocks.map(block => (
                          <BlockCard
                            key={block.id}
                            block={block}
                            onAdd={() => handleAddBlock(block)}
                            onDelete={() => handleDeleteBlock(block.id)}
                          />
                        ))}
                      </>
                    )}
                  </Stack>
                )}
              </Box>

              {/* Save Block Button */}
              <Box p={1.5} borderTop={1} borderColor="divider">
                <Button
                  fullWidth
                  variant={hasSelectedBlock ? 'contained' : 'outlined'}
                  startIcon={hasSelectedBlock ? <Save /> : <Add />}
                  disabled={!hasSelectedBlock}
                  onClick={() => setSaveDialogOpen(true)}
                  sx={{ textTransform: 'none' }}
                >
                  {hasSelectedBlock ? 'Save Block' : 'Select a block to save'}
                </Button>
                {!hasSelectedBlock && (
                  <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={0.5}>
                    Click on any block in the editor
                  </Typography>
                )}
              </Box>
            </>
          )}

          {selectedTab === 1 && (
            <Box flex={1} overflow="auto" p={2}>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Sample templates coming soon
              </Typography>
            </Box>
          )}
        </Stack>
      </Drawer>

      {/* Save Block Dialog */}
      <SaveBlockDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSave={handleSaveBlock}
        existingCategories={existingCategories}
      />
    </>
  );
}
