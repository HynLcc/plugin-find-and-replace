'use client';

import { useTranslation } from 'react-i18next';
import { ISearchResult } from '@/types';
import { Button } from '@teable/ui-lib';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@teable/ui-lib';
import { Badge } from '@teable/ui-lib';
import { Replace, CheckCircle } from 'lucide-react';

interface PreviewTableProps {
  results: ISearchResult[];
  onReplaceSingle: (recordId: string, fieldId: string) => Promise<void>;
}

/**
 * Preview table component for displaying search results
 *
 * This component shows search results in a table format with original content,
 * new content, and replace actions for each row.
 */
export function PreviewTable({
  results,
  onReplaceSingle,
}: PreviewTableProps) {
  const { t } = useTranslation('common');

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">
              {t('findReplace.tableHeaders.record', 'Record')}
            </TableHead>
            <TableHead className="w-[150px]">
              {t('findReplace.tableHeaders.field', 'Field')}
            </TableHead>
            <TableHead>
              {t('findReplace.tableHeaders.originalContent', 'Original Content')}
            </TableHead>
            <TableHead>
              {t('findReplace.tableHeaders.newContent', 'New Content')}
            </TableHead>
            <TableHead className="w-[100px] text-right">
              {t('findReplace.tableHeaders.actions', 'Actions')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result) => (
            <ResultRow
              key={`${result.recordId}-${result.fieldId}`}
              result={result}
              onReplaceSingle={onReplaceSingle}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

interface ResultRowProps {
  result: ISearchResult;
  onReplaceSingle: (recordId: string, fieldId: string) => Promise<void>;
}

/**
 * Individual result row component
 */
function ResultRow({ result, onReplaceSingle }: ResultRowProps) {
  const { t } = useTranslation('common');

  const handleReplace = async () => {
    if (!result.matchedText || result.isModified) {
      return;
    }
    await onReplaceSingle(result.recordId, result.fieldId);
  };

  const hasMatch = !!result.matchedText;
  const isModified = result.isModified;
  const showReplaceButton = hasMatch && !isModified;

  return (
    <TableRow className={hasMatch ? 'bg-muted/30' : ''}>
      <TableCell className="font-medium">
        <div className="flex flex-col">
          <span className="text-sm truncate" title={result.recordName}>
            {result.recordName || result.recordId}
          </span>
          <span className="text-xs text-muted-foreground">
            {result.recordId}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="text-sm truncate">{result.fieldName}</span>
          <span className="text-xs text-muted-foreground">
            {result.fieldId}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="max-w-xs">
          <div className="text-sm break-all">
            {formatCellValue(result.originalValue)}
          </div>
          {hasMatch && (
            <Badge variant="outline" className="mt-1 text-xs">
              {t('findReplace.matched', 'Matched')}
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="max-w-xs">
          {hasMatch ? (
            <div className="space-y-1">
              <div className="text-sm break-all font-medium text-green-700 dark:text-green-400">
                {formatCellValue(result.newValue)}
              </div>
              {isModified && (
                <div className="flex items-center text-xs text-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {t('findReplace.replaced', 'Replaced')}
                </div>
              )}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              {t('findReplace.noMatch', 'No match')}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        {showReplaceButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReplace}
          >
            <Replace className="w-4 h-4 mr-1" />
            {t('findReplace.replace', 'Replace')}
          </Button>
        )}
        {isModified && (
          <Badge variant="secondary" className="text-xs">
            {t('findReplace.done', 'Done')}
          </Badge>
        )}
      </TableCell>
    </TableRow>
  );
}

/**
 * Format cell value for display
 */
function formatCellValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'boolean') {
    return value ? 'True' : 'False';
  }

  if (typeof value === 'number') {
    return value.toLocaleString();
  }

  return String(value);
}