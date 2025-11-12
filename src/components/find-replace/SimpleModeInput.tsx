'use client';

import { useTranslation } from 'react-i18next';
import { Input } from '@teable/ui-lib';
import { Label } from '@teable/ui-lib';

interface SimpleModeInputProps {
  searchText: string;
  replaceText: string;
  onSearchTextChange: (value: string) => void;
  onReplaceTextChange: (value: string) => void;
}

/**
 * Simple mode input component for basic text search and replace
 *
 * This component provides simple text input fields for search and replace operations.
 */
export function SimpleModeInput({
  searchText,
  replaceText,
  onSearchTextChange,
  onReplaceTextChange,
}: SimpleModeInputProps) {
  const { t } = useTranslation('common');

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="search-text">
          {t('findReplace.searchText', 'Find Text')}
        </Label>
        <Input
          id="search-text"
          type="text"
          value={searchText}
          onChange={(e) => onSearchTextChange(e.target.value)}
          placeholder={t('findReplace.searchTextPlaceholder', 'Enter text to find...')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="replace-text">
          {t('findReplace.replaceText', 'Replace With')}
        </Label>
        <Input
          id="replace-text"
          type="text"
          value={replaceText}
          onChange={(e) => onReplaceTextChange(e.target.value)}
          placeholder={t('findReplace.replaceTextPlaceholder', 'Enter replacement text...')}
        />
      </div>
    </div>
  );
}