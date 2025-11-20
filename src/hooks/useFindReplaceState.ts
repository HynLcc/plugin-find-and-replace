'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useGlobalUrlParams } from './useGlobalUrlParams';
import { toast } from 'sonner';
import {
  SearchMode,
  ISearchParams,
  ISearchResult,
  ISearchStats,
  IFindReplaceStateWithView,
  ISearchConfigWithView
} from '@/types';
import { searchAlgorithms } from '@/utils/findReplace/searchAlgorithms';
import { standardizeError, ErrorCode, ErrorCreators, createAppError } from '@/utils/errorHandling';

/**
 * Comprehensive state management hook for Find and Replace functionality
 *
 * This hook encapsulates all complex state logic for the find and replace feature,
 * providing a clean interface for components to interact with search operations,
 * mode switching, result management, and view filtering. It handles:
 *
 * - Search mode management (Simple, Regex, Dictionary)
 * - Search parameter state and validation
 * - Search results and pagination
 * - Loading and error states
 * - View-based filtering support
 * - Individual and batch replace operations
 *
 * @returns Object containing state values and handler functions
 */
export function useFindReplaceState(): Omit<IFindReplaceStateWithView, 'searchStats'> & {
  handleSearch: (viewName?: string) => Promise<void>;
  handleReplaceAll: () => Promise<void>;
  handleReplaceSingle: (recordId: string, fieldId: string) => Promise<void>;
  searchStats: ISearchStats;
  // Setter functions for state management
  setSelectedField: (field: string) => void;
  setSearchText: (text: string) => void;
  setReplaceText: (text: string) => void;
  setRegexPattern: (pattern: string) => void;
  setDictionary: (dict: Record<string, string>) => void;
  setSelectedViewId: (viewId: string) => void;
  // Additional handler functions
  handleModeChange: (newMode: SearchMode) => void;
} {
  const { t } = useTranslation('common');
  const { tableId } = useGlobalUrlParams();

  // Basic state
  const [mode, setMode] = useState<SearchMode>(SearchMode.SIMPLE);
  const [selectedField, setSelectedField] = useState<string>('');
  const [searchParams, setSearchParams] = useState<ISearchParams>({});
  const [searchResults, setSearchResults] = useState<ISearchResult[]>([]);

  // View filtering state
  const [selectedViewId, setSelectedViewIdState] = useState<string>();
  const [viewFilterActive, setViewFilterActive] = useState(false);

  // Pagination state
  const [currentPage] = useState(1);
  const [pageSize] = useState(10); // Fixed page size

  // 保存原始搜索结果快照，用于全部替换时基于原始值计算
  const [originalSearchResults, setOriginalSearchResults] = useState<ISearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [hasReplaced, setHasReplaced] = useState(false);
  // 使用单独的 state 跟踪正在替换的记录，避免全局 isLoading 导致组件重新渲染
  const [replacingRecordIds, setReplacingRecordIds] = useState<Set<string>>(new Set());

  // 使用 ref 存储最新的 searchResults，避免 handleReplaceSingle 依赖变化导致函数重新创建
  const searchResultsRef = useRef<ISearchResult[]>([]);
  useEffect(() => {
    searchResultsRef.current = searchResults;
  }, [searchResults]);

  // Consolidated search parameter state with better typing
  const [searchText, setSearchTextState] = useState('');
  const [replaceText, setReplaceTextState] = useState('');
  const [regexPattern, setRegexPatternState] = useState('');
  const [dictionary, setDictionaryState] = useState<Record<string, string>>({});

  // Centralized search parameter management
  const updateSearchParams = useCallback(() => {
    const newParams: ISearchParams = {};

    if (mode === SearchMode.SIMPLE) {
      newParams.searchText = searchText;
      newParams.replacementText = replaceText;
    } else if (mode === SearchMode.REGEX) {
      newParams.regexPattern = regexPattern;
      newParams.replacementText = replaceText;
    } else if (mode === SearchMode.DICTIONARY) {
      newParams.dictionary = dictionary;
      newParams.replacementText = replaceText;
    }

    setSearchParams(newParams);
  }, [mode, searchText, replaceText, regexPattern, dictionary]);

  // Update search params when any search-related state changes
  useEffect(() => {
    updateSearchParams();
  }, [mode, searchText, replaceText, regexPattern, dictionary, updateSearchParams]);

  // Simplified setter functions
  const setSearchText = useCallback((text: string) => {
    setSearchTextState(text);
  }, []);

  const setReplaceText = useCallback((text: string) => {
    setReplaceTextState(text);
  }, []);

  const setRegexPattern = useCallback((pattern: string) => {
    setRegexPatternState(pattern);
  }, []);

  const setDictionary = useCallback((dict: Record<string, string>) => {
    setDictionaryState(dict);
    updateSearchParams();
  }, [updateSearchParams]);

  const setSelectedViewId = useCallback((viewId: string) => {
    setSelectedViewIdState(viewId);
    // 视图变更时清空搜索结果，要求用户重新搜索
    setSearchResults([]);
    setOriginalSearchResults([]);
    setHasSearched(false);
    setHasReplaced(false);
    setError(null);
    // 如果选择了视图，则激活视图筛选
    setViewFilterActive(viewId !== undefined);
  }, []);

  // Simplified mode change handler
  const handleModeChange = useCallback((newMode: SearchMode) => {
    // Clear search state but preserve view selection
    setSearchText('');
    setReplaceText('');
    setRegexPattern('');
    setDictionary({});
    setSearchResults([]);
    setOriginalSearchResults([]);
    setHasSearched(false);
    setHasReplaced(false);
    setError(null);
    // Don't reset view filtering when changing modes - preserve user's view selection
    // setViewFilterActive(false);
    // setSelectedViewIdState(undefined);
    setMode(newMode);
    setSearchParams({});
  }, [setSearchText, setReplaceText, setRegexPattern, setDictionary]);

  // Calculate search statistics - 使用 useMemo 优化计算
  const searchStats: ISearchStats = useMemo(() => {
    const matchedRecords = searchResults.filter(r => r.matchedText);
    return {
      totalRecords: searchResults.length,
      matchedRecords: matchedRecords.length,
      totalMatches: matchedRecords.length,
      replacedCount: searchResults.filter(r => r.isModified).length,
    };
  }, [searchResults]);

  // Search handler with simplified logic
  const handleSearch = useCallback(async (viewName?: string) => {
    if (!tableId || !selectedField) {
      toast.error(t('findReplace.errors.noTableOrField', 'Please select a field to search'));
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setHasReplaced(false);

    try {
      const algorithm = searchAlgorithms[mode];
      if (!algorithm) {
        throw ErrorCreators.algorithmNotFound(mode);
      }

      // Validate inputs based on mode
      const validation = validateSearchInputs(mode, searchText, regexPattern, dictionary, t);
      if (!validation.valid) {
        throw createAppError(
          validation.error?.includes('searchText') ? ErrorCode.SEARCH_TEXT_REQUIRED :
          validation.error?.includes('regexPattern') ? ErrorCode.REGEX_PATTERN_REQUIRED :
          validation.error?.includes('dictionary') ? ErrorCode.DICTIONARY_REQUIRED :
          ErrorCode.UNKNOWN_ERROR,
          validation.error || 'Validation failed'
        );
      }

      // Build search configuration
      const searchConfig = buildSearchConfig(mode, tableId, selectedField, searchParams, viewFilterActive, selectedViewId);

      const results = await algorithm.search(searchConfig);
      setSearchResults(results);
      setOriginalSearchResults(results.map(r => ({ ...r })));

      // Show appropriate message
      showSearchResultsMessage(results.length, Boolean(viewFilterActive && selectedViewId), viewName, t);
    } catch (err) {
      const standardError = standardizeError(err, t('findReplace.errors.searchFailed', 'Search failed'));
      const errorMessage = standardError.message;
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [tableId, selectedField, mode, searchText, regexPattern, dictionary, searchParams, selectedViewId, viewFilterActive, t]);

  // Helper function for input validation
  const validateSearchInputs = useCallback((currentMode: SearchMode, currentSearchText: string, currentRegexPattern: string, currentDictionary: Record<string, string> | undefined, translationFunc: any) => {
    switch (currentMode) {
      case SearchMode.SIMPLE:
        return { valid: !!currentSearchText, error: !currentSearchText ? translationFunc('findReplace.errors.searchTextRequired', 'Search text is required') : '' };
      case SearchMode.REGEX:
        return { valid: !!currentRegexPattern, error: !currentRegexPattern ? translationFunc('findReplace.errors.regularExpressionPatternRequired', 'Regular expression pattern is required') : '' };
      case SearchMode.DICTIONARY:
        const hasDictionary = currentDictionary && Object.keys(currentDictionary).length > 0;
        return { valid: hasDictionary, error: !hasDictionary ? translationFunc('findReplace.errors.dictionaryRequired', 'Dictionary is required') : '' };
      default:
        return { valid: true, error: '' };
    }
  }, []);

  // Helper function to build search config
  const buildSearchConfig = useCallback((currentMode: SearchMode, currentTableId: string, currentFieldId: string, currentSearchParams: ISearchParams, currentViewFilterActive: boolean, currentSelectedViewId: string | undefined): ISearchConfigWithView => {
    const searchParamsWithReplacement = {
      ...currentSearchParams,
      replacementText: currentSearchParams.replacementText ?? '',
    };

    const searchConfigBase: Omit<ISearchConfigWithView, 'viewId'> = {
      mode: currentMode,
      tableId: currentTableId,
      fieldId: currentFieldId,
      params: searchParamsWithReplacement,
    };

    const finalViewId = currentViewFilterActive && currentSelectedViewId ? currentSelectedViewId : undefined;

    return finalViewId
      ? { ...searchConfigBase, viewId: finalViewId }
      : searchConfigBase;
  }, []);

  // Helper function to show search results message
  const showSearchResultsMessage = useCallback((resultCount: number, hasViewFilter: boolean, currentViewName: string | undefined, translationFunc: any) => {
    if (resultCount === 0) {
      const message = hasViewFilter && currentViewName
        ? translationFunc('findReplace.noResultsInView', '在视图 "{{viewName}}" 中未找到匹配项', { viewName: currentViewName })
        : translationFunc('findReplace.noResults', 'No matches found');
      toast.info(message);
    } else {
      const message = hasViewFilter && currentViewName
        ? translationFunc('findReplace.resultsFoundInView', '在视图 "{{viewName}}" 中找到 {{count}} 个匹配项', { count: resultCount, viewName: currentViewName })
        : translationFunc('findReplace.resultsFound', 'Found {{count}} matches', { count: resultCount });
      toast.success(message);
    }
  }, []);

  // Replace all handler
  const handleReplaceAll = useCallback(async () => {
    if (searchResults.length === 0) {
      toast.error(t('findReplace.errors.noResultsToReplace', 'No results to replace'));
      return;
    }

    setIsLoading(true);

    try {
      const algorithm = searchAlgorithms[mode];
      if (!algorithm) {
        throw ErrorCreators.algorithmNotFound(mode);
      }

      // 只处理未替换的记录，基于原始搜索结果计算
      // 这样可以避免单个替换后，全部替换基于错误的基础值计算
      const resultsToReplace = originalSearchResults
        .filter(r => r.matchedText && !r.isModified)
        .map(originalResult => {
          // 从当前搜索结果中找到对应的记录，检查是否已被单个替换
          const currentResult = searchResults.find(
            r => r.recordId === originalResult.recordId && r.fieldId === originalResult.fieldId
          );
          // 如果已经被单个替换过，跳过
          if (currentResult?.isModified) {
            return null;
          }
          // 使用原始搜索结果的值进行计算
          return originalResult;
        })
        .filter((r): r is ISearchResult => r !== null);

      if (resultsToReplace.length === 0) {
        toast.info(t('findReplace.allAlreadyReplaced', 'All matching items have already been replaced'));
        return;
      }

      if (!tableId) {
        throw new Error('Table ID is required for replacement');
      }

      await algorithm.replaceAll(tableId, resultsToReplace);

      // Update results to reflect the changes - 只更新未替换的记录
      setSearchResults(prev => prev.map(result => {
        const wasReplaced = resultsToReplace.some(
          r => r.recordId === result.recordId && r.fieldId === result.fieldId
        );
        if (wasReplaced && !result.isModified) {
          return {
            ...result,
            isModified: true,
            newValue: result.replacement || result.newValue,
          };
        }
        return result;
      }));

      // Mark as replaced
      setHasReplaced(true);

      toast.success(t('findReplace.replaceAllSuccess', 'Replaced {{count}} items', { count: resultsToReplace.length }));
    } catch (err) {
      const standardError = standardizeError(err, t('findReplace.errors.replaceAllFailed', 'Replace all failed'));
      const errorMessage = standardError.message;
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [searchResults, originalSearchResults, mode, tableId, t]);

  // Replace single handler
  const handleReplaceSingle = useCallback(async (recordId: string, fieldId: string) => {
    const recordKey = `${recordId}-${fieldId}`;

    // 使用细粒度的加载状态，避免全局 isLoading 导致组件重新渲染
    setReplacingRecordIds(prev => new Set(prev).add(recordKey));

    try {
      const algorithm = searchAlgorithms[mode];
      if (!algorithm) {
        throw ErrorCreators.algorithmNotFound(mode);
      }

      // 使用 ref 获取最新的 searchResults，避免依赖变化
      const result = searchResultsRef.current.find(r => r.recordId === recordId && r.fieldId === fieldId);

      if (!result) {
        throw new Error(t('findReplace.errors.noMatchToReplace', 'No match to replace'));
      }

      // 检查是否有匹配的文本和替换内容
      if (!result.matchedText || result.replacement === undefined) {
        throw new Error(t('findReplace.errors.noMatchToReplace', 'No match to replace'));
      }

      if (!tableId) {
        throw new Error('Table ID is required for replacement');
      }

      await algorithm.replaceSingle(tableId, result);

      // 标记为已替换，但不更新显示内容
      // 这样用户可以继续看到替换计划，直到下次搜索
      setSearchResults(prev => {
        const targetIndex = prev.findIndex(r => r.recordId === recordId && r.fieldId === fieldId);
        if (targetIndex === -1) return prev;

        const target = prev[targetIndex];
        // 如果找不到目标或者已经是修改状态，不需要更新
        if (!target || target.isModified) {
          return prev;
        }

        // 只更新 isModified 状态，保持显示内容不变
        const newResults = [...prev];
        newResults[targetIndex] = {
          ...target,
          isModified: true,
          // 保持 originalValue、newValue、replacement 不变
          // 这样界面会继续显示原始的替换计划
        };

        return newResults;
      });

      toast.success(t('findReplace.replaceSuccess', 'Replaced successfully'));
    } catch (err) {
      const standardError = standardizeError(err, t('findReplace.errors.replaceFailed', 'Replace failed'));
      const errorMessage = standardError.message;
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setReplacingRecordIds(prev => {
        const next = new Set(prev);
        next.delete(recordKey);
        return next;
      });
    }
  }, [mode, t, tableId]);

  return {
    // State
    mode,
    selectedField,
    searchParams,
    dictionary,
    searchResults,
    currentPage,
    pageSize,
    isLoading,
    error,
    hasSearched,
    hasReplaced,
    searchStats,
    replacingRecordIds,
    selectedViewId: selectedViewId || '',
    viewFilterActive,

    // Actions
    setSelectedField,
    setSearchText,
    setReplaceText,
    setRegexPattern,
    setDictionary,
    setSelectedViewId,
    handleSearch,
    handleReplaceAll,
    handleReplaceSingle,
    handleModeChange,
  };
}