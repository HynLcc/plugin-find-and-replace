'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@teable/ui-lib';
import { Label } from '@teable/ui-lib';
import { Badge } from '@teable/ui-lib';
import { Alert, AlertDescription } from '@teable/ui-lib/dist/shadcn/ui/alert';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import { validationUtils } from '@/utils/findReplace/searchAlgorithms';

interface RegexModeInputProps {
  pattern: string;
  replaceText: string;
  onPatternChange: (value: string) => void;
  onReplaceTextChange: (value: string) => void;
}

/**
 * Regex mode input component for regular expression search and replace
 *
 * This component provides regex input fields with validation and usage hints.
 */
export function RegexModeInput({
  pattern,
  replaceText,
  onPatternChange,
  onReplaceTextChange,
}: RegexModeInputProps) {
  const { t } = useTranslation('common');
  const [validation, setValidation] = useState(validationUtils.validateRegex(pattern));

  // Validate regex when pattern changes
  useEffect(() => {
    const result = validationUtils.validateRegex(pattern);
    setValidation(result);
  }, [pattern]);

  const isValid = validation.isValid;
  const showValidation = (pattern || '').length > 0;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="regex-pattern">
          {t('findReplace.regexPattern', 'Regex Pattern')}
        </Label>
        <Input
          id="regex-pattern"
          type="text"
          value={pattern}
          onChange={(e) => onPatternChange(e.target.value)}
          placeholder={t('findReplace.regularExpressionPlaceholder', 'Enter regular expression...')}
          className={showValidation && !isValid ? 'border-destructive' : ''}
        />

        {showValidation && (
          <div className="flex items-center gap-2">
            {isValid ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
            <span className={`text-xs ${isValid ? 'text-green-600' : 'text-destructive'}`}>
              {isValid
                ? t('findReplace.regularExpressionValid', 'Valid regular expression pattern')
                : validation.error || t('findReplace.regularExpressionInvalid', 'Invalid regular expression pattern')
              }
            </span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="regex-replace">
          {t('findReplace.replaceText', 'Replace With')}
        </Label>
        <Input
          id="regex-replace"
          type="text"
          value={replaceText}
          onChange={(e) => onReplaceTextChange(e.target.value)}
          placeholder={t('findReplace.regularExpressionReplacePlaceholder', 'Enter replacement text (use $1, $2 for groups)...')}
        />
      </div>

      {/* Regex usage hints */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium text-sm">
              {t('findReplace.regexTips', 'Regex Tips:')}
            </p>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">
                \d - {t('findReplace.regexDigits', 'digits')}
              </Badge>
              <Badge variant="outline" className="text-xs">
                \w - {t('findReplace.regexWordChars', 'word characters')}
              </Badge>
              <Badge variant="outline" className="text-xs">
                . - {t('findReplace.regexAnyChar', 'any character')}
              </Badge>
              <Badge variant="outline" className="text-xs">
                * - {t('findReplace.regexZeroOrMore', 'zero or more')}
              </Badge>
              <Badge variant="outline" className="text-xs">
                + - {t('findReplace.regexOneOrMore', 'one or more')}
              </Badge>
              <Badge variant="outline" className="text-xs">
                $1 - {t('findReplace.regexGroup1', 'capture group 1')}
              </Badge>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}