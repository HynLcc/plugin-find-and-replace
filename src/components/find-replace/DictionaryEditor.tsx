'use client';

import { useState, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@teable/ui-lib';
import { Input } from '@teable/ui-lib';
import { Badge } from '@teable/ui-lib';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';

interface DictionaryItem {
  id: string;
  key: string;
  value: string;
  isEditing?: boolean;
  editKey?: string;
  editValue?: string;
}

interface DictionaryEditorProps {
  dictionary: Record<string, string>;
  onChange: (dictionary: Record<string, string>) => void;
  placeholder?: string;
}

export function DictionaryEditor({
  dictionary,
  onChange,
  placeholder = '请添加替换项'
}: DictionaryEditorProps) {
  const { t } = useTranslation('common');

  const [items, setItems] = useState<DictionaryItem[]>(() => {
    return Object.entries(dictionary || {}).map(([key, value]) => ({
      id: Math.random().toString(36).substr(2, 9),
      key,
      value,
      isEditing: false
    }));
  });

  const [newItem, setNewItem] = useState({ key: '', value: '' });

  const parseEscapedString = useCallback((input: string): string => {
    try {
      return JSON.parse(`"${input}"`);
    } catch {
      return input;
    }
  }, []);

  const escapeToJSON = useCallback((str: string): string => {
    return JSON.stringify(str).slice(1, -1);
  }, []);

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
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          isEditing: true,
          editKey: escapeToJSON(item.key),
          editValue: escapeToJSON(item.value)
        };
      }
      return item;
    }));
  }, [escapeToJSON]);

  const handleCancelEdit = useCallback((id: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const { editKey: _editKey, editValue: _editValue, isEditing: _isEditing, ...rest } = item;
        return rest;
      }
      return item;
    }));
  }, []);

  const handleSaveEdit = useCallback((id: string, editKey: string, editValue: string) => {
    if (!editKey.trim() || !editValue.trim()) {
      return;
    }

    const parsedKey = parseEscapedString(editKey.trim());
    const parsedValue = parseEscapedString(editValue.trim());

    const newItems = items.map(item => {
      if (item.id === id) {
        const { editKey: _editKey, editValue: _editValue, isEditing: _isEditing, ...rest } = item;
        return {
          ...rest,
          key: parsedKey,
          value: parsedValue,
          isEditing: false
        };
      }
      return item;
    });

    setItems(newItems);
    notifyChange(newItems);
  }, [items, parseEscapedString, notifyChange]);

  const handleEditKeyDown = useCallback((e: React.KeyboardEvent, id: string, isKey: boolean) => {
    if (e.key === 'Enter') {
      const container = e.currentTarget.closest('[data-item-id]');
      const keyInput = container?.querySelector('input[placeholder="旧文本"]') as HTMLInputElement;
      const valueInput = container?.querySelector('input[placeholder="新文本"]') as HTMLInputElement;
      const key = isKey ? e.currentTarget.value : keyInput?.value || '';
      const value = isKey ? valueInput?.value || '' : e.currentTarget.value;
      handleSaveEdit(id, key, value);
    }
    if (e.key === 'Escape') {
      handleCancelEdit(id);
    }
  }, [handleSaveEdit, handleCancelEdit]);

  const handleSaveClick = useCallback((id: string) => {
    const container = document.querySelector(`[data-item-id="${id}"]`);
    const keyInput = container?.querySelector('input[placeholder="旧文本"]') as HTMLInputElement;
    const valueInput = container?.querySelector('input[placeholder="新文本"]') as HTMLInputElement;
    if (keyInput && valueInput) {
      handleSaveEdit(id, keyInput.value, valueInput.value);
    }
  }, [handleSaveEdit]);

  return (
    <div className="space-y-3">
      {/* 输入区域 - 整合头部和输入框 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">添加新项</span>
            {items.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {items.length}项
              </Badge>
            )}
          </div>
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={!newItem.key.trim() || !newItem.value.trim()}
          >
            <Plus className="w-3 h-3 mr-1" />
            添加
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="旧文本（查找内容）"
            value={newItem.key}
            onChange={(e) => setNewItem(prev => ({ ...prev, key: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAdd();
              }
            }}
          />
          <Input
            placeholder="新文本（替换内容）"
            value={newItem.value}
            onChange={(e) => setNewItem(prev => ({ ...prev, value: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAdd();
              }
            }}
          />
        </div>
        {/* 轻量级JSON提示 */}
        <div className="text-xs text-muted-foreground">
          💡 提示：JSON中转义字符 <code className="bg-muted px-1 py-0.5 rounded font-mono text-xs">\n</code> 表示换行符，<code className="bg-muted px-1 py-0.5 rounded font-mono text-xs">\\n</code> 表示斜线+n
        </div>
      </div>

      {/* 字典项列表 */}
      {items.length > 0 ? (
        <div className="space-y-0 border rounded-md divide-y">
          {items.map((item) => (
            <div key={item.id} data-item-id={item.id} className="p-3 hover:bg-muted/30 transition-colors">
              {item.isEditing ? (
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="旧文本"
                    defaultValue={item.editKey}
                    autoFocus
                    onKeyDown={(e) => handleEditKeyDown(e, item.id, true)}
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="新文本"
                      defaultValue={item.editValue}
                      onKeyDown={(e) => handleEditKeyDown(e, item.id, false)}
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
                      <span className="text-xs text-muted-foreground">旧文本:</span>
                      <div className="text-sm font-medium truncate" title={item.key}>
                        {item.key}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">新文本:</span>
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
      ) : (
        <div className="text-center py-8 text-sm text-muted-foreground">
          {placeholder}
        </div>
      )}
    </div>
  );
}

export const DictionaryEditorMemo = memo(DictionaryEditor, (prevProps, nextProps) => {
  const prevKeys = Object.keys(prevProps.dictionary || {});
  const nextKeys = Object.keys(nextProps.dictionary || {});

  if (prevKeys.length !== nextKeys.length) {
    return false;
  }

  for (const key of prevKeys) {
    if (prevProps.dictionary[key] !== nextProps.dictionary[key]) {
      return false;
    }
  }

  return prevProps.onChange === nextProps.onChange &&
         prevProps.placeholder === nextProps.placeholder;
});