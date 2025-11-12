import * as openApi from '@teable/openapi';
import { ISearchResult } from '@/types';

/**
 * 统一的替换处理器
 * 负责处理所有搜索模式的数据替换操作
 */
export class ReplaceHandler {
  /**
   * 单条记录替换
   * @param tableId 表格ID
   * @param result 搜索结果
   */
  async replaceSingle(tableId: string, result: ISearchResult): Promise<void> {
    if (result.replacement === undefined) return;

    try {
      await openApi.updateRecord(tableId, result.recordId, {
        record: {
          fields: {
            [result.fieldName]: result.newValue,
          },
        },
      });
    } catch (error) {
      throw new Error(`Single replace failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 批量替换记录
   * @param tableId 表格ID
   * @param results 搜索结果列表
   */
  async replaceAll(tableId: string, results: ISearchResult[]): Promise<void> {
    // 准备批量更新数据
    const recordsToUpdate = results
      .filter(result => result.replacement !== undefined) // 允许空字符串作为有效替换
      .map(result => ({
        id: result.recordId,
        fields: {
          [result.fieldName]: result.newValue,
        },
      }));

    if (recordsToUpdate.length === 0) {
      return;
    }

    try {
      // 使用批量更新API
      await openApi.updateRecords(tableId, {
        records: recordsToUpdate,
      });
    } catch (error) {
      throw new Error(`Batch replace failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// 单例模式，避免重复创建实例
export const replaceHandler = new ReplaceHandler();