'use client';

import { useState, useCallback, memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ISearchResult } from '@/types';
import { Button } from '@teable/ui-lib';
import { Card, CardContent } from '@teable/ui-lib';
import { Badge } from '@teable/ui-lib';
import { Loader2, Search, RotateCcw, ArrowLeft, ArrowRight } from 'lucide-react';

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
    const endIndex = startIndex + pageSize;
    const currentPageResults = results.slice(startIndex, endIndex);

    return { totalPages, currentPageResults };
  }, [results, currentPage, pageSize]);

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
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        {t('findReplace.searching', '搜索中...')}
      </div>
    );
  }

  // Show empty state when no results after search
  if (hasSearched && results.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>{t('findReplace.noResultsFound', '未找到匹配项')}</p>
      </div>
    );
  }

  // Don't show anything if haven't searched yet
  if (!hasSearched) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Results summary */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          找到 <Badge variant="secondary" className="mx-1">{results.length}</Badge> 个匹配项
        </span>

        {/* Pagination info */}
        {paginationData.totalPages > 1 && (
          <span className="text-muted-foreground">
            第 {currentPage} 页，共 {paginationData.totalPages} 页
          </span>
        )}
      </div>

      {/* Results list */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {paginationData.currentPageResults.map((result, index) => (
              <div key={`${result.recordId}-${index}`} className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="text-sm flex items-center gap-2 overflow-hidden">
                    <span className="text-muted-foreground flex-shrink-0">替换前:</span>
                    <span className="font-medium overflow-x-auto whitespace-nowrap flex-1 min-w-0">
                      {result.originalValue}
                    </span>
                  </div>
                  {/* 始终显示替换后的值，无论是已替换还是未替换，只要存在替换内容 */}
                  {(result.replacement !== undefined || result.newValue !== undefined || result.isModified) && (
                    <div className="text-sm text-green-600 mt-1 flex items-center gap-2 overflow-hidden">
                      <span className="text-muted-foreground flex-shrink-0">替换后:</span>
                      <span className="font-medium overflow-x-auto whitespace-nowrap flex-1 min-w-0">
                        {result.newValue ?? result.replacement ?? '(空)'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {result.isModified && <Badge variant="default" className="text-xs">已替换</Badge>}
                  {!result.isModified && result.matchedText && (
                    <Button 
                      type="button"
                      size="sm" 
                      variant="outline" 
                      onClick={(e) => handleReplaceClick(e, result.recordId, result.fieldId)} 
                      disabled={isLoading || replacingRecordIds.has(`${result.recordId}-${result.fieldId}`)}
                    >
                      {replacingRecordIds.has(`${result.recordId}-${result.fieldId}`) ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          替换中
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-3 h-3 mr-1" />
                          替换
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pagination controls */}
      {paginationData.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={currentPage === 1}
          >
            <ArrowLeft className="w-3 h-3 mr-1" />
            上一页
          </Button>

          <div className="flex gap-1">
            {Array.from({ length: paginationData.totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page)}
                className="w-8 h-8 p-0"
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentPage === paginationData.totalPages}
          >
            下一页
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

export const SearchResultsMemo = memo(SearchResults, (prevProps, nextProps) => {
  // 自定义比较函数，只在关键props变化时重新渲染
  // 对于 results 数组，进行浅比较：比较长度和每个元素的引用
  const resultsEqual = 
    prevProps.results.length === nextProps.results.length &&
    prevProps.results.every((prev, index) => {
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

  // 比较 replacingRecordIds Set
  const replacingRecordIdsEqual = 
    prevProps.replacingRecordIds?.size === nextProps.replacingRecordIds?.size &&
    (prevProps.replacingRecordIds?.size === 0 || 
     Array.from(prevProps.replacingRecordIds || []).every(id => 
       nextProps.replacingRecordIds?.has(id)
     ));

  return (
    resultsEqual &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.hasSearched === nextProps.hasSearched &&
    prevProps.onReplaceSingle === nextProps.onReplaceSingle &&
    replacingRecordIdsEqual
  );
});