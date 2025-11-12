import { useQuery } from '@tanstack/react-query';
import { openApi } from '@/lib/api';
import { useGlobalUrlParams } from './useGlobalUrlParams';
import type { IView } from '@/types';

/**
 * Hook to get all views for a table
 */
export function useViews() {
  // 使用现有的 useGlobalUrlParams 来获取 tableId
  const { tableId } = useGlobalUrlParams();

  return useQuery({
    queryKey: ['views', tableId],
    queryFn: async () => {
      if (!tableId) {
        console.log('useViews: No tableId available');
        return [];
      }

      console.log('useViews: Fetching views for tableId:', tableId);

      try {
        const result = await openApi.getViewList(tableId);
        console.log('useViews: Got views result:', result.data);
        return (result.data || []) as IView[];
      } catch (error) {
        console.error('useViews: Failed to fetch views:', error);
        return [];
      }
    },
    enabled: !!tableId,
    staleTime: 5 * 60 * 1000, // 5分钟
    cacheTime: 10 * 60 * 1000, // 10分钟
    retry: 2,
  });
}

// Re-export IView type for convenience
export type { IView } from '@/types';