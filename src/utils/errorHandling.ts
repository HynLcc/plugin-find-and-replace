/**
 * Centralized error handling utilities for the Find and Replace plugin
 * Provides consistent error creation, handling, and user feedback patterns
 */

import { IAppError } from '@/types';

/**
 * Standard error types for better error categorization
 */
export enum ErrorType {
  VALIDATION = 'validation',
  NETWORK = 'network',
  NOT_FOUND = 'not_found',
  PERMISSION = 'permission',
  ALGORITHM = 'algorithm',
  UNKNOWN = 'unknown'
}

/**
 * Standard error codes for consistent error identification
 */
export enum ErrorCode {
  // Field errors
  FIELD_NOT_FOUND = 'FIELD_NOT_FOUND',

  // Search algorithm errors
  ALGORITHM_NOT_FOUND = 'ALGORITHM_NOT_FOUND',
  INVALID_REGEX = 'INVALID_REGEX',
  INVALID_DICTIONARY = 'INVALID_DICTIONARY',
  SEARCH_FAILED = 'SEARCH_FAILED',

  // Replace errors
  NO_RESULTS_TO_REPLACE = 'NO_RESULTS_TO_REPLACE',
  REPLACE_FAILED = 'REPLACE_FAILED',
  REPLACE_ALL_FAILED = 'REPLACE_ALL_FAILED',

  // Validation errors
  SEARCH_TEXT_REQUIRED = 'SEARCH_TEXT_REQUIRED',
  REGEX_PATTERN_REQUIRED = 'REGEX_PATTERN_REQUIRED',
  DICTIONARY_REQUIRED = 'DICTIONARY_REQUIRED',

  // Configuration errors
  TABLE_ID_REQUIRED = 'TABLE_ID_REQUIRED',
  NO_TABLE_OR_FIELD = 'NO_TABLE_OR_FIELD',

  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Creates a standardized application error with proper structure
 *
 * @param code - Standard error code from ErrorCode enum
 * @param message - Human-readable error message
 * @param type - Error type categorization (defaults to UNKNOWN)
 * @param details - Additional error context and metadata
 * @returns Formatted IAppError object consistent across the application
 */
export function createAppError(
  code: ErrorCode,
  message: string,
  type: ErrorType = ErrorType.UNKNOWN,
  details?: Record<string, unknown>
): IAppError {
  return {
    code,
    message,
    type,
    details
  };
}

/**
 * Converts unknown errors (from catch blocks) to standardized application errors
 *
 * This function handles the common pattern of catching unknown errors and converting
 * them to consistent IAppError objects. It intelligently maps common error messages
 * to appropriate error codes for better categorization.
 *
 * @param error - The unknown error from a catch block (could be Error, string, or any type)
 * @param fallbackMessage - Default message if error cannot be processed (defaults to generic message)
 * @returns Standardized IAppError with appropriate code and message
 */
export function standardizeError(error: unknown, fallbackMessage = 'An unexpected error occurred'): IAppError {
  if (error instanceof Error) {
    // Try to map common error messages to standard codes
    if (error.message.includes('Field with ID') && error.message.includes('not found')) {
      return createAppError(
        ErrorCode.FIELD_NOT_FOUND,
        error.message,
        ErrorType.NOT_FOUND
      );
    }

    if (error.message.includes('Search algorithm not found')) {
      return createAppError(
        ErrorCode.ALGORITHM_NOT_FOUND,
        error.message,
        ErrorType.ALGORITHM
      );
    }

    if (error.message.includes('Invalid regex pattern')) {
      return createAppError(
        ErrorCode.INVALID_REGEX,
        error.message,
        ErrorType.VALIDATION
      );
    }

    if (error.message.includes('Invalid dictionary')) {
      return createAppError(
        ErrorCode.INVALID_DICTIONARY,
        error.message,
        ErrorType.VALIDATION
      );
    }

    return createAppError(
      ErrorCode.UNKNOWN_ERROR,
      error.message,
      ErrorType.UNKNOWN
    );
  }

  return createAppError(
    ErrorCode.UNKNOWN_ERROR,
    fallbackMessage,
    ErrorType.UNKNOWN
  );
}

/**
 * Defines the operational context where an error occurred
 * Used to provide context-appropriate error messages to users
 */
export type ErrorContext = 'search' | 'replace' | 'validation' | 'api' | 'general';

/**
 * Converts technical error messages to user-friendly messages based on context
 *
 * This function transforms technical error codes and messages into
 * user-friendly text appropriate for the specific operation context.
 *
 * @param error - The standardized application error
 * @param context - The operational context where the error occurred
 * @returns User-friendly error message suitable for display in UI
 */
export function getUserFriendlyMessage(error: IAppError, context: ErrorContext = 'general'): string {
  // Context-specific message formatting
  const contextPrefix = {
    search: 'Search operation failed',
    replace: 'Replace operation failed',
    validation: 'Validation failed',
    api: 'API request failed',
    general: 'Operation failed'
  };

  const prefix = contextPrefix[context];

  // Return code-specific messages if available, otherwise use the error message
  switch (error.code) {
    case ErrorCode.FIELD_NOT_FOUND:
      return `${prefix}: Selected field not found in the table`;

    case ErrorCode.ALGORITHM_NOT_FOUND:
      return `${prefix}: Search mode is not supported`;

    case ErrorCode.INVALID_REGEX:
      return `${prefix}: Regular expression pattern is invalid`;

    case ErrorCode.INVALID_DICTIONARY:
      return `${prefix}: Dictionary data is invalid`;

    case ErrorCode.NO_RESULTS_TO_REPLACE:
      return 'No matching results found to replace';

    case ErrorCode.SEARCH_TEXT_REQUIRED:
      return 'Please enter text to search for';

    case ErrorCode.REGEX_PATTERN_REQUIRED:
      return 'Please enter a regular expression pattern';

    case ErrorCode.DICTIONARY_REQUIRED:
      return 'Please provide dictionary data for this search mode';

    case ErrorCode.NO_TABLE_OR_FIELD:
      return 'Please select a field to search in';

    default:
      return error.message || `${prefix}: ${error.message}`;
  }
}

/**
 * Utility function to throw standardized errors with guaranteed never return type
 *
 * This is a convenience function that creates and throws an error in one step.
 * The 'never' return type ensures TypeScript understands this function
 * always throws and never returns normally.
 *
 * @param code - Standard error code from ErrorCode enum
 * @param message - Human-readable error message
 * @param type - Error type categorization (defaults to UNKNOWN)
 * @param details - Additional error context and metadata
 * @throws IAppError - Always throws the created error
 */
export function throwError(
  code: ErrorCode,
  message: string,
  type: ErrorType = ErrorType.UNKNOWN,
  details?: Record<string, unknown>
): never {
  throw createAppError(code, message, type, details);
}

/**
 * Convenience functions for creating common application errors
 *
 * These functions provide semantic shortcuts for creating frequently-used
 * error types with appropriate codes, messages, and contextual information.
 * Each function includes relevant error details for debugging and logging.
 */
export const ErrorCreators = {
  fieldNotFound: (fieldId: string) => createAppError(
    ErrorCode.FIELD_NOT_FOUND,
    `Field with ID ${fieldId} not found`,
    ErrorType.NOT_FOUND,
    { fieldId }
  ),

  algorithmNotFound: (mode: string) => createAppError(
    ErrorCode.ALGORITHM_NOT_FOUND,
    `Search algorithm not found for mode: ${mode}`,
    ErrorType.ALGORITHM,
    { mode }
  ),

  invalidRegex: (error: string) => createAppError(
    ErrorCode.INVALID_REGEX,
    `Invalid regex pattern: ${error}`,
    ErrorType.VALIDATION,
    { patternError: error }
  ),

  invalidDictionary: (errors: string[]) => createAppError(
    ErrorCode.INVALID_DICTIONARY,
    `Invalid dictionary: ${errors.join(', ')}`,
    ErrorType.VALIDATION,
    { errors }
  ),

  searchFailed: (mode: string, originalError: string) => createAppError(
    ErrorCode.SEARCH_FAILED,
    `${mode} search failed: ${originalError}`,
    ErrorType.ALGORITHM,
    { mode, originalError }
  ),

  replaceFailed: (context: string, originalError: string) => createAppError(
    ErrorCode.REPLACE_FAILED,
    `${context} replace failed: ${originalError}`,
    ErrorType.ALGORITHM,
    { context, originalError }
  )
};