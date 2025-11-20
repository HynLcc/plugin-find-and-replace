'use client';

import { useState, useCallback, memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ISearchResult } from '@/types';
import { Button } from '@teable/ui-lib';
import { Loader2, Search, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

interface SearchResultsProps {
  results: ISearchResult[];
  isLoading: boolean;
  hasSearched: boolean;
  onReplaceSingle: (recordId: string, fieldId: string) => Promise<void>;
  replacingRecordIds?: Set<string>;
}

/**
 * Simplified search results display component
 * Based on the user's design reference
 */
export function SearchResults({
  results,
  isLoading,
  hasSearched,
  onReplaceSingle,
  replacingRecordIds = new Set(),
}: SearchResultsProps) {
  const { t } = useTranslation('common');

  // Pagination state
  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // 使用useMemo优化分页计算
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(results.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const currentPageResults = results.slice(startIndex, startIndex + pageSize);

    return { totalPages, currentPageResults };
  }, [results, currentPage]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePrevious = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  const handleNext = useCallback(() => {
    if (currentPage < paginationData.totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, paginationData.totalPages]);

  // 处理单个替换，防止页面刷新
  const handleReplaceClick = useCallback((e: React.MouseEvent, recordId: string, fieldId: string) => {
    e.preventDefault();
    e.stopPropagation();
    onReplaceSingle(recordId, fieldId);
  }, [onReplaceSingle]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-sm">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
          <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-l-primary/30 animate-pulse"></div>
        </div>
        <p className="mt-4 text-muted-foreground font-medium">{t('findReplace.searching', '搜索中...')}</p>
        <div className="flex gap-1 mt-2">
          <div className="w-1 h-3 bg-primary/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-1 h-3 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-1 h-3 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    );
  }

  // Show empty state when no results after search
  if (hasSearched && results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-muted/50 to-muted border border-border shadow-sm">
          <Search className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="mt-6 text-lg font-semibold text-foreground">{t('findReplace.noResultsFound', '未找到匹配项')}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{t('findReplace.searchSuggestions', '尝试调整搜索条件或检查拼写')}</p>
      </div>
    );
  }

  // Don't show anything if haven't searched yet
  if (!hasSearched) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between px-1 py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <h2 className="text-base font-semibold text-foreground">
              {results.length > 0
                ? (t('findReplace.resultsSimple', '找到 {{count}} 个匹配项', { count: results.length }))
                : (t('findReplace.noResultsFound', '未找到匹配项'))
              }
            </h2>
          </div>
          {paginationData.totalPages > 1 && (
            <span className="text-xs text-muted-foreground px-2 py-1 bg-muted/50 rounded-full">
              {t('findReplace.pagination', '第 {{current}} 页，共 {{total}} 页（{{items}} 项）', {
                current: currentPage,
                total: paginationData.totalPages,
                items: results.length
              })}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">{t('findReplace.total', '总计')}:</span>
            <span className="font-semibold text-primary">{results.length}</span>
          </div>
          {results.filter(r => r.isModified).length > 0 && (
            <>
              <div className="w-px h-3 bg-border"></div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">{t('findReplace.replaced', '已替换')}:</span>
                <span className="font-semibold text-green-600">{results.filter(r => r.isModified).length}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Compact Grid Cards */}
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {paginationData.currentPageResults.map((result, index) => (
          <div
            key={`${result.recordId}-${result.fieldId}`}
            className="group"
          >
            <div className="h-full bg-card border border-border/50 rounded-lg p-3 hover:border-primary/40 transition-colors duration-150" style={{ minHeight: '180px' }}>
              {/* Header with status and action */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground font-mono">
                  #{index + 1 + (currentPage - 1) * pageSize}
                </span>
                <div className="flex items-center gap-2 min-h-[24px]">
                  {!result.isModified ? (
                    // 未修改状态 - 显示替换按钮
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 text-xs border-primary/20 hover:bg-primary/50 hover:text-primary-foreground hover:border-primary transition-colors duration-150"
                      onClick={(e) => handleReplaceClick(e, result.recordId, result.fieldId)}
                      disabled={isLoading || replacingRecordIds.has(`${result.recordId}-${result.fieldId}`)}
                    >
                      {replacingRecordIds.has(`${result.recordId}-${result.fieldId}`) ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          {t('findReplace.replaceInProgress', '处理中')}
                        </>
                      ) : (
                        <>{t('findReplace.replace', '替换')}</>
                      )}
                    </Button>
                  ) : (
                    // 已修改状态 - 显示完成状态
                    <div className="flex items-center gap-1 px-2 py-0.5 border border-green-200/50 dark:border-green-800/30 rounded text-green-600">
                      <CheckCircle2 className="w-3 h-3" />
                      <span className="text-xs font-medium">{t('findReplace.replaced', '已替换')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Content sections with fixed height */}
              <div className="space-y-3 min-h-[120px]">
                {/* Original */}
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    {t('findReplace.originalContent', '原始内容')}
                  </div>
                  <div className="bg-muted/50 rounded px-2 py-1.5">
                    <p className="text-sm text-foreground leading-snug overflow-hidden" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {result.originalValue || t('findReplace.empty', '(空)')}
                    </p>
                  </div>
                </div>

                {/* New - always rendered to maintain height */}
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    {t('findReplace.newContent', '替换后')}
                  </div>
                  <div className={`rounded px-2 py-1.5 min-h-[1rem] flex items-center ${
                    (result.replacement !== undefined || result.newValue !== undefined || result.isModified)
                      ? 'bg-muted/50 border border-green-200/50 dark:border-green-800/30'
                      : 'bg-muted/20 border border-dashed border-border/30'
                  }`}>
                    <p className="text-sm text-foreground leading-snug overflow-hidden w-full" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      minHeight: '1rem'
                    }}>
                      {(result.replacement !== undefined || result.newValue !== undefined || result.isModified)
                        ? (result.newValue ?? result.replacement ?? t('findReplace.empty', '(空)'))
                        : t('findReplace.empty', '(空)')
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modern Pagination */}
      {paginationData.totalPages > 1 && (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent rounded-2xl"></div>
          <div className="relative border border-border/30 bg-background/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Previous Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className="hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 order-2 sm:order-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('findReplace.previous', '上一页')}
              </Button>

              {/* Page Indicators */}
              <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2 overflow-x-auto py-2 sm:py-0">
                {Array.from({ length: Math.min(paginationData.totalPages, 7) }, (_, i) => {
                  let pageNum;

                  // Smart pagination display
                  if (paginationData.totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= paginationData.totalPages - 2) {
                    pageNum = paginationData.totalPages - 6 + i;
                  } else {
                    pageNum = currentPage - 3 + i;
                  }

                  // Show ellipsis logic
                  if (i === 0 && pageNum > 1) {
                    return (
                      <div key="start-ellipsis" className="flex items-center gap-1 sm:gap-2">
                        <button
                          key={1}
                          onClick={() => handlePageChange(1)}
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-all duration-200 flex-shrink-0 ${
                            currentPage === 1
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          1
                        </button>
                        <span className="text-muted-foreground px-1 sm:px-2 flex-shrink-0">...</span>
                      </div>
                    );
                  }

                  if (i === 6 && pageNum < paginationData.totalPages) {
                    return (
                      <div key="end-ellipsis" className="flex items-center gap-1 sm:gap-2">
                        <span className="text-muted-foreground px-1 sm:px-2 flex-shrink-0">...</span>
                        <button
                          key={paginationData.totalPages}
                          onClick={() => handlePageChange(paginationData.totalPages)}
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-all duration-200 flex-shrink-0 ${
                            currentPage === paginationData.totalPages
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {paginationData.totalPages}
                        </button>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-all duration-200 relative group flex-shrink-0 ${
                        currentPage === pageNum
                          ? 'bg-primary text-primary-foreground shadow-sm scale-110'
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground hover:scale-105'
                      }`}
                    >
                      {pageNum}
                      <div className={`absolute inset-0 rounded-full bg-primary/20 scale-0 group-hover:scale-100 transition-transform duration-300 ${
                        currentPage === pageNum ? 'scale-100' : ''
                      }`}></div>
                    </button>
                  );
                })}
              </div>

              {/* Next Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNext}
                disabled={currentPage === paginationData.totalPages}
                className="hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 order-3"
              >
                <ArrowRight className="w-4 h-4 ml-2" />
                {t('findReplace.next', '下一页')}
              </Button>
            </div>

            {/* Page info */}
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                {t('findReplace.pageInfo', '第 {{current}} 页，共 {{total}} 页', {
                  current: currentPage,
                  total: paginationData.totalPages
                })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('findReplace.itemsInfo', '显示 {{start}}-{{end}} 项，共 {{total}} 项', {
                  start: (currentPage - 1) * pageSize + 1,
                  end: Math.min(currentPage * pageSize, results.length),
                  total: results.length
                })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const SearchResultsMemo = memo(SearchResults, (prevProps, nextProps) => {
  // Fast comparison for expensive props
  if (
    prevProps.isLoading !== nextProps.isLoading ||
    prevProps.hasSearched !== nextProps.hasSearched ||
    prevProps.results.length !== nextProps.results.length
  ) {
    return false;
  }

  // Compare replacingRecordIds efficiently
  const prevReplacingSize = prevProps.replacingRecordIds?.size ?? 0;
  const nextReplacingSize = nextProps.replacingRecordIds?.size ?? 0;
  if (prevReplacingSize !== nextReplacingSize) {
    return false;
  }

  // Quick check for results content equality
  if (prevReplacingSize === 0 && nextReplacingSize === 0) {
    return true; // No changes in replacing state
  }

  // Detailed comparison only when necessary
  return prevProps.results.every((prev, index) => {
    const next = nextProps.results[index];
    if (!next) return false;

    return (
      prev.recordId === next.recordId &&
      prev.fieldId === next.fieldId &&
      prev.isModified === next.isModified &&
      prev.originalValue === next.originalValue &&
      prev.newValue === next.newValue &&
      prev.matchedText === next.matchedText &&
      prev.replacement === next.replacement
    );
  });
});