import * as openApi from '@teable/openapi';
import { useGlobalUrlParams } from '@/hooks/useGlobalUrlParams';
import {
  SearchMode,
  ISearchConfig,
  ISearchResult,
  ISearchParams,
  IRegexValidationResult,
  IDictionaryValidationResult,
  IField
} from '@/types';
import { replaceHandler } from './ReplaceHandler';

/**
 * Search algorithm interface
 */
interface ISearchAlgorithm {
  search(config: ISearchConfig): Promise<ISearchResult[]>;
  replaceSingle(tableId: string, result: ISearchResult): Promise<void>;
  replaceAll(tableId: string, results: ISearchResult[]): Promise<void>;
}

/**
 * Base search algorithm with common replace functionality
 */
abstract class BaseSearchAlgorithm implements ISearchAlgorithm {
  /**
   * 统一的单条记录替换方法
   */
  async replaceSingle(tableId: string, result: ISearchResult): Promise<void> {
    return replaceHandler.replaceSingle(tableId, result);
  }

  /**
   * 统一的批量替换方法
   */
  async replaceAll(tableId: string, results: ISearchResult[]): Promise<void> {
    return replaceHandler.replaceAll(tableId, results);
  }

  /**
   * 子类必须实现的搜索方法
   */
  abstract search(config: ISearchConfig): Promise<ISearchResult[]>;
}

/**
 * Simple search algorithm implementation
 */
class SimpleSearchAlgorithm extends BaseSearchAlgorithm {
  async search(config: ISearchConfig): Promise<ISearchResult[]> {
    const { tableId, fieldId, params } = config;
    const { searchText, replacementText } = params;

    console.log('🔍 简单搜索算法 - 输入参数:', {
      tableId,
      fieldId,
      searchText,
      replacementText,
      replacementTextType: typeof replacementText
    });

    if (!searchText) {
      console.log('⚠️ 简单搜索 - 搜索文本为空，返回空结果');
      return [];
    }

    try {
      // Get field information to map fieldId to fieldName
      const fieldsResponse = await openApi.getFields(tableId);
      const fields = fieldsResponse.data || [];
      const targetField = fields.find(f => f.id === fieldId);

      if (!targetField) {
        throw new Error(`Field with ID ${fieldId} not found`);
      }

      const fieldName = targetField.name;

      // Get table records
      const recordsResponse = await openApi.getRecords(tableId, {
        take: 1000, // Limit for performance
      });

      const results: ISearchResult[] = [];

      for (const record of recordsResponse.data.records) {
        const fieldValue = record.fields[fieldName]; // Use fieldName instead of fieldId
        if (fieldValue == null) {
          continue;
        }

        const stringValue = String(fieldValue);

        if (stringValue.includes(searchText)) {
          // Calculate the actual new value
          const actualNewValue = replacementText !== undefined ?
            stringValue.replace(new RegExp(searchText, 'g'), replacementText) :
            fieldValue;

          console.log('📝 简单搜索 - 匹配到记录:', {
            recordId: record.id,
            originalValue: stringValue,
            searchText,
            replacementText,
            actualNewValue,
            'newValue类型': typeof actualNewValue
          });

          results.push({
            recordId: record.id,
            recordName: record.name || record.id,
            fieldId,
            fieldName, // Use the actual field name
            originalValue: stringValue,
            newValue: actualNewValue,
            matchedText: searchText,
            replacement: replacementText,
            isModified: false, // 搜索阶段总是false，只有替换后才为true
          });
        }
      }

      console.log('✅ 简单搜索 - 完成搜索，返回结果数量:', results.length);
      return results;
    } catch (error) {
      throw new Error(`Simple search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Regex search algorithm implementation
 */
class RegexSearchAlgorithm extends BaseSearchAlgorithm {
  validateRegex(pattern: string): IRegexValidationResult {
    try {
      const regex = new RegExp(pattern);
      return {
        isValid: true,
        pattern: regex.source,
        flags: regex.flags,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Invalid regex pattern',
      };
    }
  }

  async search(config: ISearchConfig): Promise<ISearchResult[]> {
    const { tableId, fieldId, params } = config;
    const { regexPattern, replacementText } = params;

    console.log('🔍 正则搜索算法 - 输入参数:', {
      tableId,
      fieldId,
      regexPattern,
      replacementText,
      replacementTextType: typeof replacementText
    });

    if (!regexPattern) {
      console.log('⚠️ 正则搜索 - 正则模式为空，返回空结果');
      return [];
    }

    // Validate regex pattern
    const validation = this.validateRegex(regexPattern);
    if (!validation.isValid) {
      throw new Error(`Invalid regex pattern: ${validation.error}`);
    }

    try {
      // Get field information to map fieldId to fieldName
      const fieldsResponse = await openApi.getFields(tableId);
      const fields = fieldsResponse.data || [];
      const targetField = fields.find(f => f.id === fieldId);

      if (!targetField) {
        throw new Error(`Field with ID ${fieldId} not found`);
      }

      const fieldName = targetField.name;

      const regex = new RegExp(regexPattern, 'g');
      const recordsResponse = await openApi.getRecords(tableId, {
        take: 1000,
      });

      const results: ISearchResult[] = [];

      for (const record of recordsResponse.data.records) {
        const fieldValue = record.fields[fieldName]; // Use fieldName instead of fieldId
        if (fieldValue == null) continue;

        const stringValue = String(fieldValue);

        if (regex.test(stringValue)) {
          // Reset regex for next test
          regex.lastIndex = 0;

          // Calculate the actual new value
          const actualNewValue = replacementText !== undefined ?
            stringValue.replace(regex, replacementText) :
            stringValue;

          console.log('📝 正则搜索 - 匹配到记录:', {
            recordId: record.id,
            originalValue: stringValue,
            regexPattern,
            replacementText,
            actualNewValue,
            'newValue类型': typeof actualNewValue
          });

          results.push({
            recordId: record.id,
            recordName: record.name || record.id,
            fieldId,
            fieldName, // Use the actual field name
            originalValue: stringValue,
            newValue: actualNewValue,
            matchedText: regexPattern,
            replacement: replacementText,
            isModified: false, // 搜索阶段总是false，只有替换后才为true
          });
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Regex search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Dictionary search algorithm implementation
 */
class DictionarySearchAlgorithm extends BaseSearchAlgorithm {
  validateDictionary(dictionary: Record<string, string>): IDictionaryValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!dictionary || typeof dictionary !== 'object') {
      errors.push('Dictionary must be a valid object');
      return { isValid: false, errors, warnings, itemCount: 0 };
    }

    const entries = Object.entries(dictionary);

    if (entries.length === 0) {
      errors.push('Dictionary cannot be empty');
      return { isValid: false, errors, warnings, itemCount: 0 };
    }

    for (const [key, value] of entries) {
      if (typeof key !== 'string' || key.trim() === '') {
        errors.push('All dictionary keys must be non-empty strings');
      }
      if (typeof value !== 'string') {
        warnings.push(`Dictionary value for key "${key}" should be a string`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      itemCount: entries.length,
    };
  }

  async search(config: ISearchConfig): Promise<ISearchResult[]> {
    const { tableId, fieldId, params } = config;
    const { dictionary } = params;

    console.log('🔍 字典搜索算法 - 输入参数:', {
      tableId,
      fieldId,
      dictionary,
      dictionarySize: Object.keys(dictionary || {}).length
    });

    if (!dictionary) {
      console.log('⚠️ 字典搜索 - 字典为空，返回空结果');
      return [];
    }

    // Validate dictionary
    const validation = this.validateDictionary(dictionary);
    if (!validation.isValid) {
      throw new Error(`Invalid dictionary: ${validation.errors.join(', ')}`);
    }

    try {
      // Get field information to map fieldId to fieldName
      const fieldsResponse = await openApi.getFields(tableId);
      const fields = fieldsResponse.data || [];
      const targetField = fields.find(f => f.id === fieldId);

      if (!targetField) {
        throw new Error(`Field with ID ${fieldId} not found`);
      }

      const fieldName = targetField.name;

      const recordsResponse = await openApi.getRecords(tableId, {
        take: 1000,
      });

      const results: ISearchResult[] = [];

      for (const record of recordsResponse.data.records) {
        const fieldValue = record.fields[fieldName]; // Use fieldName instead of fieldId
        if (fieldValue == null) continue;

        const stringValue = String(fieldValue);

        if (dictionary.hasOwnProperty(stringValue)) {
          const replacement = dictionary[stringValue];

          console.log('📝 字典搜索 - 匹配到记录:', {
            recordId: record.id,
            originalValue: stringValue,
            replacement,
            'newValue类型': typeof replacement
          });

          results.push({
            recordId: record.id,
            recordName: record.name || record.id,
            fieldId,
            fieldName, // Use the actual field name
            originalValue: stringValue,
            newValue: replacement,
            matchedText: stringValue,
            replacement,
            isModified: false, // 搜索阶段总是false，只有替换后才为true
          });
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Dictionary search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async replaceSingle(tableId: string, result: ISearchResult): Promise<void> {
    return new SimpleSearchAlgorithm().replaceSingle(tableId, result);
  }

  async replaceAll(tableId: string, results: ISearchResult[]): Promise<void> {
    return new SimpleSearchAlgorithm().replaceAll(tableId, results);
  }
}

/**
 * Search algorithms registry
 */
export const searchAlgorithms: Record<SearchMode, ISearchAlgorithm> = {
  [SearchMode.SIMPLE]: new SimpleSearchAlgorithm(),
  [SearchMode.REGEX]: new RegexSearchAlgorithm(),
  [SearchMode.DICTIONARY]: new DictionarySearchAlgorithm(),
};

/**
 * Validation utilities
 */
export const validationUtils = {
  validateRegex: (pattern: string) => new RegexSearchAlgorithm().validateRegex(pattern),
  validateDictionary: (dictionary: Record<string, string>) =>
    new DictionarySearchAlgorithm().validateDictionary(dictionary),
};