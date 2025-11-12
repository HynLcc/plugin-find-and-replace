'use client';

import { useTranslation } from 'react-i18next';
import { IField } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@teable/ui-lib';
import { A, LongText } from '@teable/icons';

interface FieldSelectorProps {
  fields: IField[];
  selectedField?: string;
  onFieldChange: (fieldId: string) => void;
}

/**
 * Field selection component for find and replace
 *
 * This component allows users to select which field to search in.
 * It filters fields to show only text-compatible fields.
 */
export function FieldSelector({ fields, selectedField, onFieldChange }: FieldSelectorProps) {
  const { t } = useTranslation('common');

  // 获取字段类型图标
  const getFieldIcon = (fieldType: string) => {
    const type = fieldType?.toLowerCase() || '';
    if (type === 'singlelinetext' || type === 'a') {
      return <A className="w-4 h-4" />;
    }
    if (type === 'longtext' || type === 'longtext') {
      return <LongText className="w-4 h-4" />;
    }
    return <A className="w-4 h-4" />; // 默认图标
  };

  // 只支持 singleLineText 和 longText 字段
  const textCompatibleFields = (fields || []).filter(field => {
    const fieldType = field.type?.toLowerCase() || '';
    const cellValueType = field.cellValueType?.toLowerCase() || '';

    // 支持的字段类型
    const supportedTypes = ['singlelinetext', 'longtext'];

    return supportedTypes.includes(fieldType) ||
           supportedTypes.includes(cellValueType);
  });

  
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {t('findReplace.selectField', 'Select Field')}
      </label>
      <Select value={selectedField || ''} onValueChange={onFieldChange}>
        <SelectTrigger>
          <SelectValue placeholder={t('findReplace.selectFieldPlaceholder', 'Choose a field to search')} />
        </SelectTrigger>
        <SelectContent>
          {textCompatibleFields.map((field) => (
            <SelectItem key={field.id} value={field.id}>
              <div className="flex items-center gap-2">
                {getFieldIcon(field.type)}
                <div className="flex flex-col items-start">
                  <span className="font-medium">{field.name}</span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

  
      {textCompatibleFields.length === 0 && (
        <p className="text-xs text-destructive">
          {t('findReplace.noTextFields', 'No singleLineText or longText fields found in this table')}
        </p>
      )}
    </div>
  );
}