'use client';

import { useTranslation } from 'react-i18next';
import { SearchMode } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@teable/ui-lib';

interface ModeSelectorProps {
  mode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
}

/**
 * Mode selection component for find and replace
 *
 * This component allows users to select between different search modes:
 * - Simple Mode: Basic text search and replace
 * - Regex Mode: Regular expression search and replace
 * - Dictionary Mode: Dictionary-based search and replace
 */
export function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  const { t } = useTranslation('common');

  const modes = [
    {
      value: SearchMode.SIMPLE,
      label: t('findReplace.modes.simple', 'Simple Mode'),
      description: t('findReplace.modes.simpleDescription', 'Basic text search and replace'),
    },
    {
      value: SearchMode.REGEX,
      label: t('findReplace.modes.regex', 'Regex Mode'),
      description: t('findReplace.modes.regexDescription', 'Regular expression search and replace'),
    },
    {
      value: SearchMode.DICTIONARY,
      label: t('findReplace.modes.dictionary', 'Dictionary Mode'),
      description: t('findReplace.modes.dictionaryDescription', 'Dictionary-based search and replace'),
    },
  ];

  const selectedMode = modes.find(m => m.value === mode);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {t('findReplace.selectMode', 'Search Mode')}
      </label>
      <Select value={mode} onValueChange={onModeChange}>
        <SelectTrigger>
          <SelectValue placeholder={t('findReplace.selectModePlaceholder', 'Select a search mode')} />
        </SelectTrigger>
        <SelectContent>
          {modes.map((modeOption) => (
            <SelectItem key={modeOption.value} value={modeOption.value}>
              <div className="flex flex-col items-start">
                <span className="font-medium">{modeOption.label}</span>
                <span className="text-xs text-muted-foreground">
                  {modeOption.description}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedMode && (
        <p className="text-xs text-muted-foreground">
          {selectedMode.description}
        </p>
      )}
    </div>
  );
}