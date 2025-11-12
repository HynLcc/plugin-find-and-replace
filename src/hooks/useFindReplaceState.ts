'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGlobalUrlParams } from './useGlobalUrlParams';
import { toast } from 'sonner';
import {
  SearchMode,
  ISearchParams,
  ISearchResult,
  ISearchStats,
  IFindReplaceState
} from '@/types';
import { searchAlgorithms } from '@/utils/findReplace/searchAlgorithms';

/**
 * Find and Replace state management hook
 *
 * This hook manages all the state for the find and replace functionality,
 * including search modes, parameters, results, and UI state.
 */
export function useFindReplaceState(): Omit<IFindReplaceState, 'searchStats'> & {
  handleSearch: () => Promise<void>;
  handleReplaceAll: () => Promise<void>;
  handleReplaceSingle: (recordId: string, fieldId: string) => Promise<void>;
  searchStats: ISearchStats;
} {
  const { t } = useTranslation('common');
  const { tableId } = useGlobalUrlParams();

  // Basic state
  const [mode, setMode] = useState<SearchMode>(SearchMode.SIMPLE);
  const [selectedField, setSelectedField] = useState<string>('');
  const [searchParams, setSearchParams] = useState<ISearchParams>({});
  const [searchResults, setSearchResults] = useState<ISearchResult[]>([]);
  // 保存原始搜索结果快照，用于全部替换时基于原始值计算
  const [originalSearchResults, setOriginalSearchResults] = useState<ISearchResult[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
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

  // Search parameter states for different modes
  const [searchText, setSearchTextState] = useState('');
  const [replaceText, setReplaceTextState] = useState('');
  const [regexPattern, setRegexPatternState] = useState('');
  const [dictionary, setDictionaryState] = useState<Record<string, string>>({});

  // Update search parameters when individual states change
  const setSearchText = useCallback((text: string) => {
    console.log('🔍 用户输入 - 查找内容:', text);
    setSearchTextState(text);
    setSearchParams(prev => ({ ...prev, searchText: text }));
  }, []);

  const setReplaceText = useCallback((text: string) => {
    console.log('📝 用户输入 - 替换内容:', text);
    setReplaceTextState(text);
    setSearchParams(prev => ({ ...prev, replacementText: text }));
  }, []);

  const setRegexPattern = useCallback((pattern: string) => {
    setRegexPatternState(pattern);
    setSearchParams(prev => ({ ...prev, regexPattern: pattern }));
  }, []);

  const setDictionary = useCallback((dict: Record<string, string>) => {
    setDictionaryState(dict);
    setSearchParams(prev => ({ ...prev, dictionary: dict }));
  }, []);

  // 自定义 setMode 函数，在模式切换时清空相关输入
  const handleModeChange = useCallback((newMode: SearchMode) => {
    console.log('🔄 切换搜索模式:', { 从: mode, 到: newMode });

    // 清空所有搜索状态和结果
    setSearchText('');
    setReplaceText('');
    setRegexPattern('');
    setDictionary({});
    setSearchResults([]);
    setOriginalSearchResults([]);
    setHasSearched(false);
    setHasReplaced(false);
    setError(null);
    setCurrentPage(1);

    // 设置新模式
    setMode(newMode);
    setSearchParams({}); // 清空搜索参数

    console.log('✅ 模式切换完成，已清空所有输入和结果');
  }, [mode, setMode]);

  // Calculate search statistics
  const searchStats: ISearchStats = {
    totalRecords: searchResults.length,
    matchedRecords: searchResults.filter(r => r.matchedText).length,
    totalMatches: searchResults.reduce((acc, result) => acc + (result.matchedText ? 1 : 0), 0),
    replacedCount: searchResults.filter(r => r.isModified).length,
  };

  // Search handler
  const handleSearch = useCallback(async () => {
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
        throw new Error(`Search algorithm not found for mode: ${mode}`);
      }

      // Validate inputs based on mode
      if (mode === SearchMode.SIMPLE && !searchText) {
        throw new Error(t('findReplace.errors.searchTextRequired', 'Search text is required'));
      }

      if (mode === SearchMode.REGEX && !regexPattern) {
        throw new Error(t('findReplace.errors.regexPatternRequired', 'Regex pattern is required'));
      }

      if (mode === SearchMode.DICTIONARY && Object.keys(dictionary).length === 0) {
        throw new Error(t('findReplace.errors.dictionaryRequired', 'Dictionary is required'));
      }

      // 确保replacementText总是被设置，即使为空字符串
      const searchParamsWithReplacement = {
        ...searchParams,
        replacementText: searchParams.replacementText ?? '',
      };

      console.log('🚀 开始搜索 - 调用搜索算法:', {
        mode,
        tableId,
        selectedField,
        searchParams: searchParamsWithReplacement,
        'searchParams.replacementText': searchParamsWithReplacement.replacementText,
        'replacementText类型': typeof searchParamsWithReplacement.replacementText
      });

      const results = await algorithm.search({
        tableId,
        fieldId: selectedField,
        params: searchParamsWithReplacement,
      });

      console.log('📊 搜索结果返回:', {
      结果数量: results.length,
      前几个结果: results.slice(0, 3).map(r => ({
        recordId: r.recordId,
        originalValue: r.originalValue,
        newValue: r.newValue,
        replacement: r.replacement,
        'newValue类型': typeof r.newValue
      }))
    });

      setSearchResults(results);
      // 保存原始搜索结果快照，用于全部替换时基于原始值计算
      const originalSnapshot = results.map(r => ({ ...r }));
      setOriginalSearchResults(originalSnapshot);
      setCurrentPage(1);

      if (results.length === 0) {
        toast.info(t('findReplace.noResults', 'No matches found'));
      } else {
        toast.success(t('findReplace.resultsFound', 'Found {{count}} matches', { count: results.length }));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('findReplace.errors.searchFailed', 'Search failed');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [tableId, selectedField, mode, searchText, regexPattern, dictionary, searchParams, t]);

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
        throw new Error(`Search algorithm not found for mode: ${mode}`);
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
      const errorMessage = err instanceof Error ? err.message : t('findReplace.errors.replaceAllFailed', 'Replace all failed');
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
        throw new Error(`Search algorithm not found for mode: ${mode}`);
      }

      // 使用 ref 获取最新的 searchResults，避免依赖变化
      const result = searchResultsRef.current.find(r => r.recordId === recordId && r.fieldId === fieldId);

      console.log('🎯 单次替换 - 查找目标记录:', {
        recordId,
        fieldId,
        找到结果: !!result,
        result详情: result ? {
          originalValue: result.originalValue,
          newValue: result.newValue,
          replacement: result.replacement,
          isModified: result.isModified,
          'newValue类型': typeof result.newValue
        } : null
      });

      if (!result) {
        throw new Error(t('findReplace.errors.noMatchToReplace', 'No match to replace'));
      }

      // 检查是否有匹配的文本和替换内容
      if (!result.matchedText || result.replacement === undefined) {
        console.error('❌ 单次替换 - 无效的替换条件:', {
          matchedText: result.matchedText,
          replacement: result.replacement
        });
        throw new Error(t('findReplace.errors.noMatchToReplace', 'No match to replace'));
      }

      await algorithm.replaceSingle(tableId, result);

      // 标记为已替换，但不更新显示内容
      // 这样用户可以继续看到替换计划，直到下次搜索
      setSearchResults(prev => {
        const targetIndex = prev.findIndex(r => r.recordId === recordId && r.fieldId === fieldId);
        if (targetIndex === -1) return prev;

        const target = prev[targetIndex];
        // 如果已经是修改状态，不需要更新
        if (target.isModified) {
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
      const errorMessage = err instanceof Error ? err.message : t('findReplace.errors.replaceFailed', 'Replace failed');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setReplacingRecordIds(prev => {
        const next = new Set(prev);
        next.delete(recordKey);
        return next;
      });
    }
  }, [mode, t, tableId, originalSearchResults]);

  return {
    // State
    mode,
    selectedField,
    searchParams,
    searchResults,
    currentPage,
    pageSize,
    isLoading,
    error,
    hasSearched,
    hasReplaced,
    searchStats,
    replacingRecordIds, // 导出细粒度的加载状态

    // Actions
    setMode,
    setSelectedField,
    setSearchText,
    setReplaceText,
    setRegexPattern,
    setDictionary,
    handleSearch,
    handleReplaceAll,
    handleReplaceSingle,
    handleModeChange, // 新增的模式切换处理函数
  };
}