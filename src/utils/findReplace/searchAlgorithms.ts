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
import { ErrorCreators, standardizeError, ErrorCode } from '@/utils/errorHandling';

/**
 * Escapes special regex characters in a string for safe pattern matching
 *
 * This function prepares user input strings for use in regular expressions
 * by escaping all characters that have special meaning in regex patterns.
 * This prevents regex injection and ensures literal string matching.
 *
 * @param string - The input string to escape
 * @returns Regex-safe string with special characters escaped
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Interface defining the contract for all search algorithm implementations
 *
 * All search algorithms must implement this interface to ensure consistent
 * behavior across different search modes (Simple, Regex, Dictionary).
 */
interface ISearchAlgorithm {
  search(config: ISearchConfig | ISearchConfigWithView): Promise<ISearchResult[]>;
  replaceSingle(tableId: string, result: ISearchResult): Promise<void>;
  replaceAll(tableId: string, results: ISearchResult[]): Promise<void>;
}

/**
 * Abstract base class providing common functionality for all search algorithms
 *
 * This class implements the template method pattern, providing shared
 * implementation for replace operations while delegating the search
 * logic to concrete subclasses. This ensures consistent replacement
 * behavior across all search modes.
 */
abstract class BaseSearchAlgorithm implements ISearchAlgorithm {
  /**
   * Unified single record replacement method
   *
   * Delegates to the centralized ReplaceHandler to ensure consistent
   * replacement behavior across all search algorithms.
   *
   * @param tableId - The ID of the table containing the record
   * @param result - The search result containing replacement information
   */
  async replaceSingle(tableId: string, result: ISearchResult): Promise<void> {
    return replaceHandler.replaceSingle(tableId, result);
  }

  /**
   * Unified batch replacement method
   *
   * Delegates to the centralized ReplaceHandler to ensure consistent
   * replacement behavior across all search algorithms.
   *
   * @param tableId - The ID of the table containing the records
   * @param results - Array of search results containing replacement information
   */
  async replaceAll(tableId: string, results: ISearchResult[]): Promise<void> {
    return replaceHandler.replaceAll(tableId, results);
  }

  /**
   * Abstract search method that must be implemented by subclasses
   *
   * Each search algorithm (Simple, Regex, Dictionary) must implement
   * their specific search logic while following the common interface.
   *
   * @param config - Search configuration including mode, table, field, and parameters
   * @returns Promise resolving to array of search results
   */
  abstract search(config: ISearchConfig | ISearchConfigWithView): Promise<ISearchResult[]>;
}

/**
 * Simple text search algorithm implementation
 *
 * Provides basic text matching functionality with optional case sensitivity
 * and whole word matching. This is the most straightforward search mode
 * suitable for simple find and replace operations.
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
        throw ErrorCreators.fieldNotFound(fieldId);
      }

      const fieldName = targetField.name;

      // Prepare record query parameters
      const recordQuery: any = {
        take: 1000, // Limit for performance
      };

      // Add viewId if present in config
      if ('viewId' in config && config.viewId) {
        recordQuery.viewId = config.viewId;
      }

      // Get table records (potentially filtered by view)
      const recordsResponse = await openApi.getRecords(tableId, recordQuery);

      const results: ISearchResult[] = [];

      // Pre-compile regex for better performance
      const searchRegex = new RegExp(escapeRegExp(searchText), 'g');

      // Process records in batches for better performance
      const records = recordsResponse.data.records;
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const fieldValue = record.fields[fieldName];

        if (fieldValue == null) {
          continue;
        }

        const stringValue = String(fieldValue);

        if (searchRegex.test(stringValue)) {
          // Reset regex for next test
          searchRegex.lastIndex = 0;

          // Calculate the actual new value
          const actualNewValue = replacementText !== undefined ?
            stringValue.replace(searchRegex, replacementText) :
            fieldValue;

          results.push({
            recordId: record.id,
            recordName: record.name || record.id,
            fieldId,
            fieldName,
            originalValue: stringValue,
            newValue: actualNewValue,
            matchedText: searchText,
            isModified: false,
            ...(replacementText !== undefined && { replacement: replacementText }),
          });
        }
      }

      return results;
    } catch (error) {
      throw ErrorCreators.searchFailed('Simple', error instanceof Error ? error.message : 'Unknown error');
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
      throw ErrorCreators.invalidRegex(validation.error || 'Invalid regex pattern');
    }

    try {
      // Get field information to map fieldId to fieldName
      const fieldsResponse = await openApi.getFields(tableId);
      const fields = fieldsResponse.data || [];
      const targetField = fields.find(f => f.id === fieldId);

      if (!targetField) {
        throw ErrorCreators.fieldNotFound(fieldId);
      }

      const fieldName = targetField.name;

      // Prepare record query parameters
      const recordQuery: any = {
        take: 1000,
      };

      // Add viewId if present in config
      if ('viewId' in config && config.viewId) {
        recordQuery.viewId = config.viewId;
      }

      // Compile regex once for better performance
      const regex = new RegExp(regexPattern, 'g');
      const recordsResponse = await openApi.getRecords(tableId, recordQuery);

      const results: ISearchResult[] = [];
      const records = recordsResponse.data.records;

      // Process records efficiently
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const fieldValue = record.fields[fieldName];

        if (fieldValue == null) continue;

        const stringValue = String(fieldValue);

        if (regex.test(stringValue)) {
          // Reset regex for next test
          regex.lastIndex = 0;

          // Calculate the actual new value
          const actualNewValue = replacementText !== undefined ?
            stringValue.replace(regex, replacementText) :
            stringValue;

          results.push({
            recordId: record.id,
            recordName: record.name || record.id,
            fieldId,
            fieldName,
            originalValue: stringValue,
            newValue: actualNewValue,
            matchedText: regexPattern,
            isModified: false,
            ...(replacementText !== undefined && { replacement: replacementText }),
          });
        }
      }

      return results;
    } catch (error) {
      throw ErrorCreators.searchFailed('Regex', error instanceof Error ? error.message : 'Unknown error');
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
      throw ErrorCreators.invalidDictionary(validation.errors);
    }

    try {
      // Get field information to map fieldId to fieldName
      const fieldsResponse = await openApi.getFields(tableId);
      const fields = fieldsResponse.data || [];
      const targetField = fields.find(f => f.id === fieldId);

      if (!targetField) {
        throw ErrorCreators.fieldNotFound(fieldId);
      }

      const fieldName = targetField.name;

      // Prepare record query parameters
      const recordQuery: any = {
        take: 1000,
      };

      // Add viewId if present in config
      if ('viewId' in config && config.viewId) {
        recordQuery.viewId = config.viewId;
      }

      const recordsResponse = await openApi.getRecords(tableId, recordQuery);

      const results: ISearchResult[] = [];

      // Pre-compile all regex patterns for better performance
      const dictionaryEntries = Object.entries(dictionary);
      const compiledPatterns = dictionaryEntries.map(([key, value]) => ({
        key,
        value,
        regex: new RegExp(escapeRegExp(key), 'g'),
      }));

      const records = recordsResponse.data.records;

      // Process records efficiently
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const fieldValue = record.fields[fieldName];

        if (fieldValue == null) continue;

        const stringValue = String(fieldValue);

        // Check for matches and apply replacements
        let hasMatches = false;
        let actualNewValue = stringValue;
        const matchedKeys: string[] = [];

        // Apply all matching dictionary entries
        for (const { key, value, regex } of compiledPatterns) {
          if (regex.test(actualNewValue)) {
            // Reset regex for next test
            regex.lastIndex = 0;

            if (value !== undefined) {
              actualNewValue = actualNewValue.replace(regex, value);
            }
            matchedKeys.push(key);
            hasMatches = true;
          }
        }

        // Only add result if there were matches
        if (hasMatches) {
          const lastMatchedKey = matchedKeys[matchedKeys.length - 1];
          const lastReplacement = lastMatchedKey ? dictionary[lastMatchedKey] : '';

          results.push({
            recordId: record.id,
            recordName: record.name || record.id,
            fieldId,
            fieldName,
            originalValue: stringValue,
            newValue: actualNewValue,
            matchedText: lastMatchedKey,
            isModified: false,
            ...(lastReplacement !== undefined && lastReplacement !== '' && { replacement: lastReplacement }),
          });
        }
      }

      return results;
    } catch (error) {
      throw ErrorCreators.searchFailed('Dictionary', error instanceof Error ? error.message : 'Unknown error');
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
      throw ErrorCreators.replaceFailed('Dictionary single', error instanceof Error ? error.message : 'Unknown error');
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
      throw ErrorCreators.replaceFailed('Dictionary replace all', error instanceof Error ? error.message : 'Unknown error');
    }
  }
}

/**
 * Registry of all available search algorithms
 *
 * Provides centralized access to all search algorithm implementations.
 * Each algorithm is instantiated once and reused for better performance.
 */
export const searchAlgorithms: Record<SearchMode, ISearchAlgorithm> = {
  [SearchMode.SIMPLE]: new SimpleSearchAlgorithm(),
  [SearchMode.REGEX]: new RegexSearchAlgorithm(),
  [SearchMode.DICTIONARY]: new DictionarySearchAlgorithm(),
};

/**
 * Validation utilities for search inputs
 *
 * Provides centralized validation functions for different search modes,
 * ensuring consistent input validation across the application.
 */
export const validationUtils = {
  validateRegex: (pattern: string) => new RegexSearchAlgorithm().validateRegex(pattern),
  validateDictionary: (dictionary: Record<string, string>) =>
    new DictionarySearchAlgorithm().validateDictionary(dictionary),
};