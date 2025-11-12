'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Textarea } from '@teable/ui-lib';
import { Label } from '@teable/ui-lib';
import { Button } from '@teable/ui-lib';
import { Badge } from '@teable/ui-lib';
import { Alert, AlertDescription } from '@teable/ui-lib/dist/shadcn/ui/alert';
import { CheckCircle, AlertCircle, Info, Download, Upload } from 'lucide-react';
import { validationUtils } from '@/utils/findReplace/searchAlgorithms';

interface DictionaryModeInputProps {
  dictionary: Record<string, string>;
  onDictionaryChange: (dictionary: Record<string, string>) => void;
}

/**
 * Dictionary mode input component for dictionary-based search and replace
 *
 * This component provides JSON input fields for dictionary-based search and replace
 * with validation and import/export functionality.
 */
export function DictionaryModeInput({
  dictionary,
  onDictionaryChange,
}: DictionaryModeInputProps) {
  const { t } = useTranslation('common');
  const [jsonInput, setJsonInput] = useState(JSON.stringify(dictionary, null, 2));
  const [validation, setValidation] = useState(validationUtils.validateDictionary(dictionary));

  // Validate dictionary when it changes
  useEffect(() => {
    try {
      const parsed = JSON.parse(jsonInput);
      const result = validationUtils.validateDictionary(parsed);
      setValidation(result);
    } catch {
      setValidation({
        isValid: false,
        errors: [t('findReplace.invalidJson', 'Invalid JSON format')],
        warnings: [],
        itemCount: 0,
      });
    }
  }, [jsonInput, t]);

  // Update JSON input when dictionary changes from external source
  useEffect(() => {
    setJsonInput(JSON.stringify(dictionary, null, 2));
  }, [dictionary]);

  const handleJsonChange = (value: string) => {
    setJsonInput(value);

    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object' && parsed !== null) {
        onDictionaryChange(parsed);
      }
    } catch {
      // Don't update dictionary if JSON is invalid
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(dictionary, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'find-replace-dictionary.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            const parsed = JSON.parse(content);
            if (typeof parsed === 'object' && parsed !== null) {
              setJsonInput(JSON.stringify(parsed, null, 2));
              onDictionaryChange(parsed);
            }
          } catch (error) {
            // Handle invalid JSON
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const isValid = validation.isValid;
  const itemCount = Object.keys(dictionary || {}).length;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="dictionary-json">
            {t('findReplace.dictionaryJson', 'Dictionary JSON')}
          </Label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={itemCount === 0}
            >
              <Download className="h-4 w-4 mr-1" />
              {t('findReplace.export', 'Export')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleImport}
            >
              <Upload className="h-4 w-4 mr-1" />
              {t('findReplace.import', 'Import')}
            </Button>
          </div>
        </div>
        <Textarea
          id="dictionary-json"
          value={jsonInput}
          onChange={(e) => handleJsonChange(e.target.value)}
          placeholder={t('findReplace.dictionaryPlaceholder', 'Enter JSON: {"find": "replace", "hello": "world"}')}
          rows={8}
          className={`font-mono text-sm ${!isValid && (jsonInput || '').trim() ? 'border-destructive' : ''}`}
        />

        {/* Validation status and stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {(jsonInput || '').trim() && (
              <>
                {isValid ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
                <span className={`text-xs ${isValid ? 'text-green-600' : 'text-destructive'}`}>
                  {isValid
                    ? t('findReplace.dictionaryValid', 'Valid dictionary ({{count}} items)', { count: itemCount })
                    : validation.errors.join(', ') || t('findReplace.dictionaryInvalid', 'Invalid dictionary format')
                  }
                </span>
              </>
            )}
          </div>

          {itemCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {itemCount} {t('findReplace.items', 'items')}
            </Badge>
          )}
        </div>

        {/* Validation warnings */}
        {isValid && validation.warnings.length > 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium text-sm">
                  {t('findReplace.warnings', 'Warnings:')}
                </p>
                {validation.warnings.map((warning, index) => (
                  <p key={index} className="text-xs">
                    • {warning}
                  </p>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Format hints */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium text-sm">
              {t('findReplace.dictionaryFormat', 'Format Example:')}
            </p>
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
{`{
  "find_text_1": "replace_text_1",
  "find_text_2": "replace_text_2",
  "hello": "hi",
  "world": "universe"
}`}
            </pre>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}