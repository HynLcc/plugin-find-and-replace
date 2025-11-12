'use client';

import { useTranslation } from 'react-i18next';
import { Button } from '@teable/ui-lib';
import { Input } from '@teable/ui-lib';
import { Label } from '@teable/ui-lib';
import { Card, CardContent, CardHeader, CardTitle } from '@teable/ui-lib';
import { RadioGroup, RadioGroupItem } from '@teable/ui-lib';
import { Loader2, Search, RotateCcw } from 'lucide-react';
import { useFields } from '@/hooks/useFields';
import { FieldSelector } from './find-replace/FieldSelector';
import { ViewSelector } from './find-replace/ViewSelector';
import { SearchResultsMemo } from './find-replace/SearchResults';
import { RegexTester } from './find-replace/RegexTester';
import { DictionaryEditorMemo } from './find-replace/DictionaryEditor';
import { useFindReplaceState } from '@/hooks/useFindReplaceState';
import { useViews } from '@/hooks/useViews';
import { SearchMode } from '@/types';

/**
 * Find and Replace interface component with clean UI design
 * Maintains all functionality while improving the visual layout
 */
export function FindAndReplacePages() {
  const { t } = useTranslation('common');
  const { data: fieldsData, isLoading: fieldsLoading } = useFields();
  const { data: views = [] } = useViews();
  const fields = fieldsData || [];
  const {
    mode,
    selectedField,
    searchParams,
    dictionary,
    searchResults,
    isLoading,
    hasSearched,
    hasReplaced,
    replacingRecordIds,
    selectedViewId,
    setSelectedField,
    setSearchText,
    setReplaceText,
    setRegexPattern,
    setDictionary,
    setSelectedViewId,
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

  
  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      {/* Field Selection */}
      <FieldSelector
        fields={fields}
        selectedField={selectedField || ''}
        onFieldChange={setSelectedField}
      />

      {/* View Selection */}
      <ViewSelector
        selectedViewId={selectedViewId || ''}
        onViewChange={setSelectedViewId}
        disabled={isLoading}
      />

      {/* Search Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t('findReplace.searchMode', '搜索模式')}</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={mode} onValueChange={(value) => handleModeChange(value as SearchMode)} className="flex flex-row gap-6">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={SearchMode.SIMPLE} id="simple" />
              <Label htmlFor="simple">{t('findReplace.modes.simple', '文本')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={SearchMode.REGEX} id="regex" />
              <Label htmlFor="regex">{t('findReplace.modes.regex', '正则表达式')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={SearchMode.DICTIONARY} id="dictionary" />
              <Label htmlFor="dictionary">{t('findReplace.modes.dictionary', '字典')}</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Mode-specific inputs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t('findReplace.searchCriteria', '搜索条件')}</CardTitle>
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
                  placeholder={t('findReplace.searchTextPlaceholder')}
                  value={searchParams.searchText ?? ''}
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
                  placeholder={t('findReplace.replaceTextPlaceholder', '请输入替换内容')}
                  value={searchParams.replacementText ?? ''}
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
                  {t('findReplace.regularExpression', '正则表达式')}
                </Label>
                <Input
                  id="regex-input"
                  placeholder={t('findReplace.enterRegularExpression', '请输入正则表达式')}
                  value={searchParams.regexPattern ?? ''}
                  onChange={(e) => setRegexPattern(e.target.value)}
                  className="w-full"
                />
                {searchParams.regexPattern && (
                  <RegexTester
                    pattern={searchParams.regexPattern}
                    replacementText={searchParams.replacementText || ''}
                    onPatternChange={setRegexPattern}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="regex-replace-input" className="text-sm font-medium">
                  {t('findReplace.replaceText', '替换为')}
                </Label>
                <Input
                  id="regex-replace-input"
                  placeholder={t('findReplace.replaceTextPlaceholder', '请输入替换内容')}
                  value={searchParams.replacementText ?? ''}
                  onChange={(e) => setReplaceText(e.target.value)}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground">
                  {t('findReplace.regularExpressionHelpReplace', '提示：使用 $1, $2 等引用捕获组，例如：将 (\d+) 替换为 数字:$1')}
                </div>
              </div>
            </>
          )}

          {mode === SearchMode.DICTIONARY && (
            <DictionaryEditorMemo
              dictionary={dictionary}
              onChange={setDictionary}
            />
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <Button
            onClick={() => {
              const selectedView = views.find(v => v.id === selectedViewId);
              const viewName = selectedView?.name;
              handleSearch(viewName);
            }}
            disabled={!selectedField || !selectedViewId || isLoading}
            className="flex-1"
            variant="default"
          >
            <Search className="w-4 h-4 mr-2" />
            {t('findReplace.find', '查找')}
          </Button>

          <Button
            onClick={handleReplaceAll}
            disabled={!selectedField || !selectedViewId || searchResults.length === 0 || isLoading || hasReplaced}
            className="flex-1"
            variant="outline"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {t('findReplace.replaceAll', '全部替换')}
          </Button>
        </div>
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