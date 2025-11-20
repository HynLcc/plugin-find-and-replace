'use client';

import { useState, useCallback, memo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@teable/ui-lib';
import { Input } from '@teable/ui-lib';
import { Badge } from '@teable/ui-lib';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';

interface DictionaryItem {
  id: string;
  key: string;
  value: string;
  isEditing: boolean;
  editKey?: string;
  editValue?: string;
}

interface DictionaryEditorProps {
  dictionary: Record<string, string>;
  onChange: (dictionary: Record<string, string>) => void;
}

// Helper functions extracted for better performance
const parseEscapedString = (input: string): string => {
  try {
    return JSON.parse(`"${input}"`);
  } catch {
    return input;
  }
};

const escapeToJSON = (str: string): string => {
    return JSON.stringify(str).slice(1, -1);
};

// DictionaryEditor component with performance optimizations
function DictionaryEditorInner({
  dictionary,
  onChange
}: DictionaryEditorProps) {
  const { t } = useTranslation('common');

  // State for managing dictionary items with proper IDs
  const [items, setItems] = useState(() => {
    return Object.entries(dictionary || {}).map(([key, value]) => ({
      id: Math.random().toString(36).substr(2, 9),
      key,
      value,
      isEditing: false
    }));
  });

  // Sync items with dictionary prop changes
  useEffect(() => {
    setItems(Object.entries(dictionary || {}).map(([key, value]) => ({
      id: Math.random().toString(36).substr(2, 9),
      key,
      value,
      isEditing: false
    })));
  }, [dictionary]);

  const [newItem, setNewItem] = useState({ key: '', value: '' });
  const [editingValues, setEditingValues] = useState<Record<string, { key: string; value: string }>>({});

  // Optimized change notification
  const notifyChange = useCallback((newItems: DictionaryItem[]) => {
    const newDictionary: Record<string, string> = {};
    newItems.forEach(item => {
      if (item.key && item.value) {
        newDictionary[item.key] = item.value;
      }
    });
    onChange(newDictionary);
  }, [onChange]);

  const handleAdd = useCallback(() => {
    if (!newItem.key.trim() || !newItem.value.trim()) {
      return;
    }

    const parsedKey = parseEscapedString(newItem.key.trim());
    const parsedValue = parseEscapedString(newItem.value.trim());

    const newItems: DictionaryItem[] = [
      ...items,
      {
        id: Math.random().toString(36).substr(2, 9),
        key: parsedKey,
        value: parsedValue,
        isEditing: false
      }
    ];

    setItems(newItems);
    notifyChange(newItems);
    setNewItem({ key: '', value: '' });
  }, [newItem, items, parseEscapedString, notifyChange]);

  const handleDelete = useCallback((id: string) => {
    const newItems = items.filter(item => item.id !== id);
    setItems(newItems);
    notifyChange(newItems);
  }, [items, notifyChange]);

  const handleEdit = useCallback((id: string) => {
    const item = items.find(i => i.id === id);
    if (item) {
      setItems(prev => prev.map(i => i.id === id ? { ...i, isEditing: true } : i));
      setEditingValues(prev => ({
        ...prev,
        [id]: {
          key: escapeToJSON(item.key),
          value: escapeToJSON(item.value)
        }
      }));
    }
  }, [items, escapeToJSON]);

  const handleCancelEdit = useCallback((id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, isEditing: false } : item));
    setEditingValues(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const handleSaveEdit = useCallback((id: string, editKey: string, editValue: string) => {
    if (!editKey.trim() || !editValue.trim()) {
      return;
    }

    const parsedKey = parseEscapedString(editKey.trim());
    const parsedValue = parseEscapedString(editValue.trim());

    setItems(prev => {
      const newItems = prev.map(item =>
        item.id === id
          ? { ...item, key: parsedKey, value: parsedValue, isEditing: false }
          : item
      );
      notifyChange(newItems);
      return newItems;
    });
  }, [parseEscapedString, notifyChange]);

  const handleEditChange = useCallback((id: string, field: 'key' | 'value', value: string) => {
    setEditingValues(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || { key: '', value: '' }),
        [field]: value
      }
    }));
  }, []);

  const handleEditKeyDown = useCallback((e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      const editValues = editingValues[id];
      if (editValues?.key && editValues?.value) {
        handleSaveEdit(id, editValues.key, editValues.value);
        setEditingValues(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    } else if (e.key === 'Escape') {
      handleCancelEdit(id);
    }
  }, [editingValues, handleSaveEdit, handleCancelEdit]);

  const handleSaveClick = useCallback((id: string) => {
    const editValues = editingValues[id];
    if (editValues?.key && editValues?.value) {
      handleSaveEdit(id, editValues.key, editValues.value);
      setEditingValues(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }, [editingValues, handleSaveEdit]);

  return (
    <div className="space-y-3">
      {/* 输入区域 - 整合头部和输入框 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{t('findReplace.addItem', 'Add New Item')}</span>
            {items.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {items.length}{t('findReplace.items', 'items')}
              </Badge>
            )}
          </div>
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={!newItem.key.trim() || !newItem.value.trim()}
          >
            <Plus className="w-3 h-3 mr-1" />
            {t('findReplace.add', 'Add')}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder={t('findReplace.oldTextPlaceholder', 'Old text (to find)')}
            value={newItem.key ?? ''}
            onChange={(e) => setNewItem(prev => ({ ...prev, key: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAdd();
              }
            }}
          />
          <Input
            placeholder={t('findReplace.newTextPlaceholder', 'New text (to replace with)')}
            value={newItem.value ?? ''}
            onChange={(e) => setNewItem(prev => ({ ...prev, value: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAdd();
              }
            }}
          />
        </div>
        {/* JSON提示 */}
        <div className="text-xs text-muted-foreground">
          💡 {t('findReplace.dictionaryHelp', 'JSON escape characters: {newline} for newline, {escapedNewline} for backslash+n', {
            newline: <code className="bg-muted px-1 py-0.5 rounded font-mono text-xs">\n</code>,
            escapedNewline: <code className="bg-muted px-1 py-0.5 rounded font-mono text-xs">\\n</code>
          })}
        </div>
      </div>

      {/* 字典项列表 */}
      {items.length > 0 && (
        <div className="space-y-0 border rounded-md divide-y">
          {items.map((item) => (
            <div key={item.id} data-item-id={item.id} className="p-3 hover:bg-muted/30 transition-colors">
              {item.isEditing ? (
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder={t('findReplace.oldText', 'Old Text')}
                    value={editingValues[item.id]?.key ?? ''}
                    onChange={(e) => handleEditChange(item.id, 'key', e.target.value)}
                    autoFocus
                    onKeyDown={(e) => handleEditKeyDown(e, item.id)}
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder={t('findReplace.newText', 'New Text')}
                      value={editingValues[item.id]?.value ?? ''}
                      onChange={(e) => handleEditChange(item.id, 'value', e.target.value)}
                      onKeyDown={(e) => handleEditKeyDown(e, item.id)}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSaveClick(item.id)}
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCancelEdit(item.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="grid grid-cols-2 gap-3 flex-1 min-w-0">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">{t('findReplace.oldText', 'Old Text')}:</span>
                      <div className="text-sm font-medium truncate" title={item.key}>
                        {item.key}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">{t('findReplace.newText', 'New Text')}:</span>
                      <div className="text-sm text-green-600 truncate" title={item.value}>
                        {item.value}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(item.id)}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const DictionaryEditorMemo = memo(DictionaryEditorInner, (prevProps, nextProps) => {
  // Fast comparison for expensive props
  if (prevProps.onChange !== nextProps.onChange) {
    return false;
  }

  const prevDict = prevProps.dictionary || {};
  const nextDict = nextProps.dictionary || {};

  const prevKeys = Object.keys(prevDict);
  const nextKeys = Object.keys(nextDict);

  if (prevKeys.length !== nextKeys.length) {
    return false;
  }

  // Quick Set-based comparison for performance
  const prevKeySet = new Set(prevKeys);
  const nextKeySet = new Set(nextKeys);

  if (prevKeySet.size !== nextKeySet.size) {
    return false;
  }

  // Check if all keys are the same
  for (const key of prevKeySet) {
    if (!nextKeySet.has(key)) {
      return false;
    }
  }

  // Check if all values are the same
  for (const key of prevKeys) {
    if (prevDict[key] !== nextDict[key]) {
      return false;
    }
  }

  return true;
});