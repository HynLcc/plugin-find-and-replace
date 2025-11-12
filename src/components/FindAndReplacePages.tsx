'use client';

import { useTranslation } from 'react-i18next';
import { Button } from '@teable/ui-lib';
import { Input } from '@teable/ui-lib';
import { Label } from '@teable/ui-lib';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@teable/ui-lib';
import { Card, CardContent, CardHeader, CardTitle } from '@teable/ui-lib';
import { RadioGroup, RadioGroupItem } from '@teable/ui-lib';
import { Textarea } from '@teable/ui-lib';
import { Loader2, Search, RotateCcw } from 'lucide-react';
import { useFields } from '@/hooks/useFields';
import { FieldSelector } from './find-replace/FieldSelector';
import { SearchResultsMemo } from './find-replace/SearchResults';
import { RegexTester } from './find-replace/RegexTester';
import { useFindReplaceState } from '@/hooks/useFindReplaceState';
import { SearchMode } from '@/types';

/**
 * Find and Replace interface component with clean UI design
 * Maintains all functionality while improving the visual layout
 */
export function FindAndReplacePages() {
  const { t } = useTranslation('common');
  const { data: fieldsData, isLoading: fieldsLoading } = useFields();
  const fields = fieldsData || [];
  const {
    mode,
    selectedField,
    searchText,
    replaceText,
    regexPattern,
    dictionary,
    searchResults,
    isLoading,
    hasSearched,
    hasReplaced,
    replacingRecordIds,
    setSelectedField,
    setSearchText,
    setReplaceText,
    setRegexPattern,
    setDictionary,
    handleSearch,
    handleReplaceAll,
    handleReplaceSingle,
    handleModeChange
  } = useFindReplaceState();

  if (fieldsLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2 text-sm">{t('loading', 'Loading...')}</span>
      </div>
    );
  }

  // Helper function to format dictionary for display
  const formatDictionaryForDisplay = (dict: Record<string, string>) => {
    if (!dict || typeof dict !== 'object') {
      return '';
    }
    return Object.entries(dict)
      .map(([key, value]) => `${key} => ${value}`)
      .join('\n');
  };

  // Helper function to parse dictionary from input
  const parseDictionaryFromInput = (input: string): Record<string, string> => {
    const dict: Record<string, string> = {};
    const lines = input.split('\n').filter(line => line.trim());

    lines.forEach(line => {
      const parts = line.split('=>').map(s => s.trim());
      if (parts.length === 2 && parts[0] && parts[1]) {
        dict[parts[0]] = parts[1];
      }
    });

    return dict;
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      {/* Field Selection */}
      <FieldSelector
        fields={fields}
        selectedField={selectedField}
        onFieldChange={setSelectedField}
      />

      {/* Search Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">搜索模式</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={mode} onValueChange={(value) => handleModeChange(value as SearchMode)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={SearchMode.SIMPLE} id="simple" />
              <Label htmlFor="simple">简单文本</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={SearchMode.REGEX} id="regex" />
              <Label htmlFor="regex">正则表达式</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={SearchMode.DICTIONARY} id="dictionary" />
              <Label htmlFor="dictionary">字典替换</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Mode-specific inputs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">搜索条件</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === SearchMode.SIMPLE && (
            <>
              <div className="space-y-2">
                <Label htmlFor="find-input" className="text-sm font-medium">
                  {t('findReplace.find', '查找')}
                </Label>
                <Input
                  id="find-input"
                  placeholder={t('findReplace.findPlaceholder', '请输入查找内容')}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="replace-input" className="text-sm font-medium">
                  {t('findReplace.replace', '替换')}
                </Label>
                <Input
                  id="replace-input"
                  placeholder={t('findReplace.replacePlaceholder', '请输入替换内容')}
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  className="w-full"
                />
              </div>
            </>
          )}

          {mode === SearchMode.REGEX && (
            <>
              <div className="space-y-2">
                <Label htmlFor="regex-input" className="text-sm font-medium">
                  正则表达式
                </Label>
                <Input
                  id="regex-input"
                  placeholder="请输入正则表达式"
                  value={regexPattern}
                  onChange={(e) => setRegexPattern(e.target.value)}
                  className="w-full"
                />
                {regexPattern && (
                  <RegexTester
                    pattern={regexPattern}
                    replacementText={replaceText}
                    onPatternChange={setRegexPattern}
                    onReplacementChange={setReplaceText}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="regex-replace-input" className="text-sm font-medium">
                  替换为
                </Label>
                <Input
                  id="regex-replace-input"
                  placeholder="请输入替换内容"
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground">
                  提示：使用 $1, $2 等引用捕获组，例如：将 (\d+) 替换为 数字:$1
                </div>
              </div>
            </>
          )}

          {mode === SearchMode.DICTIONARY && (
            <div className="space-y-2">
              <Label htmlFor="dictionary-input" className="text-sm font-medium">
                字典 (每行一个替换项，格式: 查找内容 => 替换内容)
              </Label>
              <Textarea
                id="dictionary-input"
                placeholder="例如：&#10;旧文本1 => 新文本1&#10;旧文本2 => 新文本2"
                value={formatDictionaryForDisplay(dictionary)}
                onChange={(e) => setDictionary(parseDictionaryFromInput(e.target.value))}
                className="w-full"
                rows={6}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleSearch}
          disabled={!selectedField || isLoading}
          className="flex-1"
          variant="default"
        >
          <Search className="w-4 h-4 mr-2" />
          {t('findReplace.find', '查找')}
        </Button>

        <Button
          onClick={handleReplaceAll}
          disabled={!selectedField || searchResults.length === 0 || isLoading || hasReplaced}
          className="flex-1"
          variant="outline"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          {t('findReplace.replaceAll', '全部替换')}
        </Button>
      </div>

      {/* Results Display */}
      <div className="mt-6">
        <SearchResultsMemo
          results={searchResults}
          isLoading={isLoading}
          hasSearched={hasSearched}
          onReplaceSingle={handleReplaceSingle}
          replacingRecordIds={replacingRecordIds}
        />
      </div>
    </div>
  );
}