import * as openApi from '@teable/openapi';
import {
  SearchMode,
  ISearchConfig,
  ISearchResult,
  IRegexValidationResult,
  IDictionaryValidationResult,
  ISearchConfigWithView
} from '@/types';
import { replaceHandler } from './ReplaceHandler';

/**
 * Search algorithm interface
 */
interface ISearchAlgorithm {
  search(config: ISearchConfig | ISearchConfigWithView): Promise<ISearchResult[]>;
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
  abstract search(config: ISearchConfig | ISearchConfigWithView): Promise<ISearchResult[]>;
}

/**
 * Simple search algorithm implementation
 */
class SimpleSearchAlgorithm extends BaseSearchAlgorithm {
  async search(config: ISearchConfig | ISearchConfigWithView): Promise<ISearchResult[]> {
    const { tableId, fieldId, params } = config;
    const { searchText, replacementText } = params;

    if (!searchText) {
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

      // Prepare record query parameters
      const recordQuery: any = {
        take: 1000, // Limit for performance
      };

      // Add viewId if present in config
      if ('viewId' in config && config.viewId) {
        recordQuery.viewId = config.viewId;
        console.log('🔍 [SimpleSearch] Using view filter:', {
          viewId: config.viewId,
          fullQuery: recordQuery,
          tableId,
          fieldId
        });
      } else {
        console.log('🔍 [SimpleSearch] No view filter applied - searching all records');
      }

      // Get table records (potentially filtered by view)
      const recordsResponse = await openApi.getRecords(tableId, recordQuery);
      console.log('📊 [SimpleSearch] API response:', {
        recordsCount: recordsResponse.data.records.length,
        hasViewId: !!recordQuery.viewId,
        viewId: recordQuery.viewId
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
            (fieldValue as string | number | boolean | null);

          const result: ISearchResult = {
            recordId: record.id,
            recordName: record.name || record.id,
            fieldId,
            fieldName,
            originalValue: stringValue,
            newValue: actualNewValue,
            matchedText: searchText,
            isModified: false,
          };

          if (replacementText !== undefined) {
            result.replacement = replacementText;
          }

          results.push(result);
        }
      }

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

  async search(config: ISearchConfig | ISearchConfigWithView): Promise<ISearchResult[]> {
    const { tableId, fieldId, params } = config;
    const { regexPattern, replacementText } = params;

    if (!regexPattern) {
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

      // Prepare record query parameters
      const recordQuery: any = {
        take: 1000,
      };

      // Add viewId if present in config
      if ('viewId' in config && config.viewId) {
        recordQuery.viewId = config.viewId;
        console.log('🔍 [RegexSearch] Using view filter:', {
          viewId: config.viewId,
          fullQuery: recordQuery,
          tableId,
          fieldId,
          regexPattern
        });
      } else {
        console.log('🔍 [RegexSearch] No view filter applied - searching all records');
      }

      const regex = new RegExp(regexPattern, 'g');
      const recordsResponse = await openApi.getRecords(tableId, recordQuery);
      console.log('📊 [RegexSearch] API response:', {
        recordsCount: recordsResponse.data.records.length,
        hasViewId: !!recordQuery.viewId,
        viewId: recordQuery.viewId,
        regexPattern
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

          const regexResult: ISearchResult = {
            recordId: record.id,
            recordName: record.name || record.id,
            fieldId,
            fieldName,
            originalValue: stringValue,
            newValue: actualNewValue,
            matchedText: regexPattern,
            isModified: false,
          };

          if (replacementText !== undefined) {
            regexResult.replacement = replacementText;
          }

          results.push(regexResult);
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

    const entries = Object.entries(dictionary || {});

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

  async search(config: ISearchConfig | ISearchConfigWithView): Promise<ISearchResult[]> {
    const { tableId, fieldId, params } = config;
    const { dictionary } = params;

    if (!dictionary) {
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

      // Prepare record query parameters
      const recordQuery: any = {
        take: 1000,
      };

      // Add viewId if present in config
      if ('viewId' in config && config.viewId) {
        recordQuery.viewId = config.viewId;
        console.log('🔍 [DictionarySearch] Using view filter:', {
          viewId: config.viewId,
          fullQuery: recordQuery,
          tableId,
          fieldId,
          dictionaryKeys: Object.keys(dictionary || {})
        });
      } else {
        console.log('🔍 [DictionarySearch] No view filter applied - searching all records');
      }

      const recordsResponse = await openApi.getRecords(tableId, recordQuery);
      console.log('📊 [DictionarySearch] API response:', {
        recordsCount: recordsResponse.data.records.length,
        hasViewId: !!recordQuery.viewId,
        viewId: recordQuery.viewId,
        dictionarySize: Object.keys(dictionary || {}).length
      });

      const results: ISearchResult[] = [];

      for (const record of recordsResponse.data.records) {
        const fieldValue = record.fields[fieldName]; // Use fieldName instead of fieldId
        if (fieldValue == null) continue;

        const stringValue = String(fieldValue);

        // 检查字典中所有键，替换所有匹配项
        let actualNewValue = stringValue;
        let matchedKeys: string[] = [];

        // 对字典中的每个键，检查是否在字符串中存在
        for (const key of Object.keys(dictionary)) {
          if (actualNewValue.includes(key)) {
            const replacement = dictionary[key];
            if (replacement !== undefined) {
              actualNewValue = actualNewValue.replace(new RegExp(key, 'g'), replacement);
            }
            matchedKeys.push(key);
          }
        }

        const matchedKey = matchedKeys.length > 0 ? matchedKeys[matchedKeys.length - 1] : undefined;
        const replacement = matchedKey ? dictionary[matchedKey] : '';

        if (matchedKeys.length > 0) {
          const dictResult: ISearchResult = {
            recordId: record.id,
            recordName: record.name || record.id,
            fieldId,
            fieldName,
            originalValue: stringValue,
            newValue: actualNewValue,
            isModified: false,
          };

          if (matchedKey !== undefined) {
            dictResult.matchedText = matchedKey;
          }

          if (replacement !== undefined && replacement !== '') {
            dictResult.replacement = replacement;
          }

          results.push(dictResult);
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Dictionary search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async replaceSingle(tableId: string, result: ISearchResult): Promise<void> {
    if (result.replacement === undefined || result.matchedText === undefined) return;

    try {
      await openApi.updateRecord(tableId, result.recordId, {
        record: {
          fields: {
            [result.fieldName]: result.newValue,
          },
        },
      });
    } catch (error) {
      throw new Error(`Dictionary single replace failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async replaceAll(tableId: string, results: ISearchResult[]): Promise<void> {
    if (results.length === 0) return;

    try {
      // 批量替换：逐个更新记录
      for (const result of results) {
        if (result.replacement !== undefined && result.matchedText !== undefined) {
          await this.replaceSingle(tableId, result);
        }
      }
    } catch (error) {
      throw new Error(`Dictionary replace all failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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