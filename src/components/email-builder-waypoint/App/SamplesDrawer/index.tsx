'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { Layers, Dashboard, Delete, Save, AddCircleOutline, ViewQuilt, Article } from '@mui/icons-material';

import { renderToStaticMarkup } from '@usewaypoint/email-builder';
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
const DEFAULT_BLOCK_CATEGORIES = [
  { value: 'headers', label: 'Headers' },
  { value: 'content', label: 'Content' },
  { value: 'cta', label: 'CTAs' },
  { value: 'footers', label: 'Footers' },
];

const DEFAULT_TEMPLATE_CATEGORIES = [
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'promotional', label: 'Promotional' },
  { value: 'transactional', label: 'Transactional' },
  { value: 'welcome', label: 'Welcome' },
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
  _isTemplate?: boolean;
}

// Helper: Is this a full template blueprint?
const isBlueprint = (block: SavedBlock) => {
  return block._isTemplate === true;
};

function SaveBlockDialog({
  open,
  onClose,
  onSave,
  existingBlockCategories,
  existingTemplateCategories,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, category: string, isGlobal: boolean, type: 'block' | 'template') => Promise<void>;
  existingBlockCategories: string[];
  existingTemplateCategories: string[];
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'block' | 'template'>('block');
  const [category, setCategory] = useState('');
  const [isGlobal, setIsGlobal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);

  // Set default category when type changes
  useEffect(() => {
    if (type === 'block') {
      setCategory('content');
    } else {
      setCategory('newsletter');
    }
    setShowNewCategoryInput(false);
    setNewCategory('');
  }, [type]);

  const currentDefaults = type === 'block' ? DEFAULT_BLOCK_CATEGORIES : DEFAULT_TEMPLATE_CATEGORIES;
  const currentExisting = type === 'block' ? existingBlockCategories : existingTemplateCategories;

  // Merge default and existing categories
  const availableCategories = useMemo(() => {
    const defaults = currentDefaults;
    const others = currentExisting
      .filter(c => !defaults.some(d => d.value === c))
      .map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }));
    return [...defaults, ...others];
  }, [currentDefaults, currentExisting, type]);

  const handleSave = async () => {
    if (!name.trim()) return;

    setSaving(true);
    try {
      const finalCategory = (showNewCategoryInput && newCategory.trim())
        ? newCategory.trim().toLowerCase()
        : category;

      await onSave(name.trim(), finalCategory, isGlobal, type);

      // Reset form
      setName('');
      setIsGlobal(false);
      setNewCategory('');
      setShowNewCategoryInput(false);
      setType('block');
      onClose();
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setName('');
      setIsGlobal(false);
      setNewCategory('');
      setShowNewCategoryInput(false);
      setType('block');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Save sx={{ color: 'primary.main' }} />
          <Typography variant="h6">Save to Library</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} pt={1}>
          {/* Type Selection */}
          <Box>
            <Typography variant="caption" color="text.secondary" mb={1} display="block">
              Item Type
            </Typography>
            <ToggleButtonGroup
              value={type}
              exclusive
              onChange={(_, v) => v && setType(v)}
              fullWidth
              size="small"
              color="primary"
            >
              <ToggleButton value="block">
                <ViewQuilt sx={{ mr: 1, fontSize: 18 }} />
                Partial Block
              </ToggleButton>
              <ToggleButton value="template">
                <Article sx={{ mr: 1, fontSize: 18 }} />
                Full Template
              </ToggleButton>
            </ToggleButtonGroup>
            <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
              {type === 'block'
                ? "Saves ONLY the selected element."
                : "Saves the ENTIRE canvas as a reusable blueprint."}
            </Typography>
          </Box>

          {/* Block Name */}
          <TextField
            label={type === 'block' ? "Block Name" : "Template Name"}
            placeholder={type === 'block' ? "e.g., Hero Section" : "e.g., Monthly Newsletter"}
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
                {availableCategories.map((cat) => (
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
          )
          }

          {/* Scope Selection */}
          <Box>
            <Typography variant="caption" color="text.secondary" mb={1} display="block">
              Visibility
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
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function BlockCard({ block, onAdd, onDelete, isTemplate }: {
  block: SavedBlock;
  onAdd: () => void;
  onDelete: () => void;
  isTemplate?: boolean;
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
      {/* Thumbnail */}
      <Box
        sx={{
          height: isTemplate ? 120 : 60,
          bgcolor: 'grey.100',
          borderRadius: 0.5,
          mb: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
      >
        {block.thumbnail ? (
          <Box component="img" src={block.thumbnail} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          isTemplate ? <Article sx={{ color: 'grey.400', fontSize: 32 }} /> : <Layers sx={{ color: 'grey.400', fontSize: 24 }} />
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
        {isTemplate ? (
          <Chip label="Blueprint Template" size="small" color="primary" variant="outlined" sx={{ height: 18, fontSize: 10 }} />
        ) : (
          <Chip label="Block Component" size="small" color="secondary" variant="outlined" sx={{ height: 18, fontSize: 10 }} />
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
          bgcolor: 'background.paper',
          boxShadow: 1
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
  const hasSelectedBlock = Boolean(selectedBlockId);

  const [blocks, setBlocks] = useState<SavedBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0); // 0 = Blocks, 1 = Templates
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  // Load items
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

      const [blocksResponse, templatesResponse] = await Promise.all([
        fetch(`/api/saved-blocks?${params}`),
        fetch(`/api/templates?${params}&hasCategory=true`)
      ]);

      let combinedData: SavedBlock[] = [];

      if (blocksResponse.ok) {
        const blocksData = await blocksResponse.json();
        combinedData = [...combinedData, ...blocksData];
      }

      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json();
        // Map templates to SavedBlock shape
        const mappedTemplates = templatesData.map((t: any) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          category: t.category,
          jsonContent: t.jsonContent,
          thumbnail: t.thumbnail || t.previewUrl, // Use previewUrl as thumbnail if valid
          clientId: t.clientId,
          createdAt: t.createdAt,
          _isTemplate: true // Explicitly tag as template
        }));
        combinedData = [...combinedData, ...mappedTemplates];
      }

      setBlocks(combinedData);
    } catch (error) {
      console.error('Failed to fetch library:', error);
    } finally {
      setLoading(false);
    }
  };

  // Derive Lists & Categories
  const { blockItems, templateItems, blockCategories, templateCategories } = useMemo(() => {
    // 1. Split items
    const bItems: SavedBlock[] = [];
    const tItems: SavedBlock[] = [];

    blocks.forEach(item => {
      if (isBlueprint(item)) {
        tItems.push(item);
      } else {
        bItems.push(item);
      }
    });

    // 2. Extract unique categories (exclude defaults to avoid dupes in logic)
    const bCats = [...new Set(bItems.map(b => b.category).filter(Boolean))] as string[];
    const tCats = [...new Set(tItems.map(b => b.category).filter(Boolean))] as string[];

    return {
      blockItems: bItems,
      templateItems: tItems,
      blockCategories: bCats,
      templateCategories: tCats
    };
  }, [blocks]);

  // Handle Adding Item
  const handleAddItem = (item: SavedBlock) => {
    // TEMPLATE: Replace Document
    if (isBlueprint(item)) {
      if (!confirm('Apply this Blueprint? This will REPLACE your current design completely.')) return;
      try {
        const clonedDoc = JSON.parse(JSON.stringify(item.jsonContent));
        setDocument(clonedDoc);
      } catch (e) {
        console.error("Failed to apply template", e);
      }
      return;
    }

    // BLOCK: Add to Document
    const savedConfig = item.jsonContent;
    if (!savedConfig) return;

    // Detect if this is a full configuration or a single block
    const isFullConfig = Boolean(savedConfig.root);

    const currentDoc = { ...document };
    const rootBlock = currentDoc.root;
    if (!rootBlock || rootBlock.type !== 'EmailLayout') return;

    let incomingBlock: TEditorBlock;
    let newBlockId = `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    if (isFullConfig) {
      // Extract the main content from the saved config
      // Usually stored under 'main-block' based on our save logic
      const incomingRoot = savedConfig.root;
      const mainBlockId = incomingRoot.data?.childrenIds?.[0] || 'main-block';

      // We need to remap all IDs in the savedConfig subtree to avoid collisions
      const idMap = new Map<string, string>();

      const remapRecursive = (oldId: string): string => {
        if (idMap.has(oldId)) return idMap.get(oldId)!;
        const newId = `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        idMap.set(oldId, newId);

        const block = savedConfig[oldId];
        if (block) {
          const cloned = JSON.parse(JSON.stringify(block));

          // Remap childrenIds
          if (cloned.data?.childrenIds) {
            cloned.data.childrenIds = cloned.data.childrenIds.map((cId: string) => remapRecursive(cId));
          }

          // Remap columns (for ColumnsContainer)
          if (cloned.data?.columns) {
            cloned.data.columns = cloned.data.columns.map((col: any) => ({
              ...col,
              childrenIds: col.childrenIds?.map((cId: string) => remapRecursive(cId)) || []
            }));
          }

          currentDoc[newId] = cloned;
        }
        return newId;
      };

      newBlockId = remapRecursive(mainBlockId);
    } else {
      // Legacy/Simple Block
      currentDoc[newBlockId] = {
        type: savedConfig.type || 'Container',
        data: savedConfig.data || savedConfig,
      };
    }

    const currentChildrenIds = rootBlock.data?.childrenIds || [];
    currentDoc.root = {
      ...rootBlock,
      data: { ...rootBlock.data, childrenIds: [...currentChildrenIds, newBlockId] },
    };

    setDocument(currentDoc);
  };

  // Handle Save
  const handleSaveItem = async (name: string, category: string, isGlobal: boolean, type: 'block' | 'template') => {
    let jsonContent: any;
    let endpoint = '/api/saved-blocks';
    let body: any = {
      name,
      category,
      clientId: isGlobal ? null : clientId,
    };

    if (type === 'template') {
      // Save WHOLE document via /api/templates
      endpoint = '/api/templates';
      jsonContent = document;
      body.jsonContent = jsonContent;
      // Generate real HTML content for preview/AI
      try {
        body.htmlContent = renderToStaticMarkup(document, { rootBlockId: 'root' });
      } catch (e) {
        console.error("HTML Generation failed", e);
        body.htmlContent = "";
      }
    } else {
      // Save partial block via /api/saved-blocks
      if (!selectedBlockId || !document[selectedBlockId]) {
        throw new Error('No block selected');
      }

      // We wrap the block in a minimal layout for possible previewing / standalone use
      const wrapperDocument: any = {
        root: {
          type: 'EmailLayout',
          data: {
            backdropColor: '#F5F5F5',
            canvasColor: '#FFFFFF',
            textColor: '#262626',
            fontFamily: 'MODERN_SANS',
            childrenIds: ['main-block'],
          },
        },
      };

      const collectBlocks = (blockId: string, targetId: string): boolean => {
        const block = document[blockId];
        if (!block) return false;
        const clonedBlock = JSON.parse(JSON.stringify(block));

        // Handle childrenIds
        const childrenIds = clonedBlock.data?.childrenIds || [];
        if (childrenIds.length > 0) {
          const newChildrenIds: string[] = [];
          childrenIds.forEach((childId: string, index: number) => {
            const newChildId = `${targetId}-child-${index}`;
            if (collectBlocks(childId, newChildId)) newChildrenIds.push(newChildId);
          });
          clonedBlock.data.childrenIds = newChildrenIds;
        }

        // Handle columns (for ColumnsContainer)
        const columns = clonedBlock.data?.columns || [];
        if (columns.length > 0) {
          clonedBlock.data.columns = columns.map((col: any, colIdx: number) => {
            const colChildrenIds = col.childrenIds || [];
            const newColChildrenIds: string[] = [];
            colChildrenIds.forEach((childId: string, childIdx: number) => {
              const newChildId = `${targetId}-col-${colIdx}-child-${childIdx}`;
              if (collectBlocks(childId, newChildId)) newColChildrenIds.push(newChildId);
            });
            return { ...col, childrenIds: newColChildrenIds };
          });
        }

        wrapperDocument[targetId] = clonedBlock;
        return true;
      };
      collectBlocks(selectedBlockId, 'main-block');

      // For Blocks, we save the WHOLE wrapperDocument so it can be edited standalone
      // The importer will know to extract 'main-block'
      body.jsonContent = wrapperDocument;
      try {
        body.htmlContent = renderToStaticMarkup(wrapperDocument, { rootBlockId: 'root' });
      } catch (e) {
        body.htmlContent = "";
      }
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(err || 'Failed to save');
    }
    fetchBlocks();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await fetch(`/api/saved-blocks/${id}`, { method: 'DELETE' });
      setBlocks(prev => prev.filter(b => b.id !== id));
    } catch (e) { console.error(e); }
  };

  // Determine which list to show
  const activeItems = selectedTab === 0 ? blockItems : templateItems;

  // Determine categories to show
  const activeDefaults = selectedTab === 0 ? DEFAULT_BLOCK_CATEGORIES : DEFAULT_TEMPLATE_CATEGORIES;
  const activeAvailableFilterCats = [{ value: 'all', label: 'All' }, ...activeDefaults];

  // Add user-created categories to filter list
  const activeUserCats = selectedTab === 0 ? blockCategories : templateCategories;
  const activeUserCatsFormatted = activeUserCats
    .filter(c => !activeDefaults.some(d => d.value === c))
    .map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }));

  const finalFilterList = [...activeAvailableFilterCats, ...activeUserCatsFormatted];

  // Filter Active Items by Category
  const filteredItems = activeItems.filter(item => {
    if (categoryFilter === 'all') return true;
    return item.category === categoryFilter;
  });

  const globalItems = filteredItems.filter(b => !b.clientId);
  const clientItems = filteredItems.filter(b => b.clientId);

  return (
    <>
      <Drawer
        variant="persistent"
        anchor="left"
        open={samplesDrawerOpen}
        sx={{ width: samplesDrawerOpen ? SAMPLES_DRAWER_WIDTH : 0 }}
      >
        <Stack width={SAMPLES_DRAWER_WIDTH} height="100%" bgcolor="background.paper">
          {/* Header */}
          <Box px={2} py={1.5} borderBottom={1} borderColor="divider">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Dashboard sx={{ color: 'primary.main' }} />
              <Typography variant="h6" fontWeight={600}>
                Library
              </Typography>
            </Stack>
          </Box>

          {/* Tabs */}
          <Tabs
            value={selectedTab}
            onChange={(_, v) => {
              setSelectedTab(v);
              setCategoryFilter('all');
            }}
            sx={{ px: 1, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Blocks" sx={{ minWidth: 0, flex: 1 }} />
            <Tab label="Blueprints" sx={{ minWidth: 0, flex: 1 }} />
          </Tabs>

          {/* Filter Chips */}
          <Stack direction="row" spacing={0.5} p={1} flexWrap="wrap" gap={0.5} borderBottom={1} borderColor="divider">
            {finalFilterList.map(cat => (
              <Chip
                key={cat.value}
                label={cat.label}
                size="small"
                variant={categoryFilter === cat.value ? 'filled' : 'outlined'}
                onClick={() => setCategoryFilter(cat.value)}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Stack>

          {/* List */}
          <Box flex={1} overflow="auto" p={1}>
            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress size={24} />
              </Box>
            ) : filteredItems.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Layers sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {selectedTab === 0 ? "No blocks found" : "No templates found"}
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {clientItems.length > 0 && (
                  <>
                    <Typography variant="caption" color="text.secondary" px={0.5} fontWeight={600}>
                      Client {selectedTab === 0 ? "Blocks" : "Blueprints"}
                    </Typography>
                    {clientItems.map(block => (
                      <BlockCard
                        key={block.id}
                        block={block}
                        onAdd={() => handleAddItem(block)}
                        onDelete={() => handleDelete(block.id)}
                        isTemplate={selectedTab === 1}
                      />
                    ))}
                  </>
                )}

                {globalItems.length > 0 && (
                  <>
                    <Typography variant="caption" color="text.secondary" px={0.5} fontWeight={600} mt={clientItems.length > 0 ? 1 : 0}>
                      Global {selectedTab === 0 ? "Blocks" : "Blueprints"}
                    </Typography>
                    {globalItems.map(block => (
                      <BlockCard
                        key={block.id}
                        block={block}
                        onAdd={() => handleAddItem(block)}
                        onDelete={() => handleDelete(block.id)}
                        isTemplate={selectedTab === 1}
                      />
                    ))}
                  </>
                )}
              </Stack>
            )}
          </Box>

          {/* Footer Save */}
          <Box p={1.5} borderTop={1} borderColor="divider">
            <Button
              fullWidth
              variant={'contained'}
              startIcon={<Save />}
              onClick={() => setSaveDialogOpen(true)}
              sx={{ textTransform: 'none' }}
              disabled={selectedTab === 0 && !hasSelectedBlock}
            >
              {selectedTab === 0
                ? (hasSelectedBlock ? 'Save Selection' : 'Select block to save')
                : 'Save Current Design'}
            </Button>
          </Box>
        </Stack>
      </Drawer>

      <SaveBlockDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSave={handleSaveItem}
        existingBlockCategories={blockCategories}
        existingTemplateCategories={templateCategories}
      />
    </>
  );
}
