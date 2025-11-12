'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@teable/ui-lib';
import { Input } from '@teable/ui-lib';
import { Label } from '@teable/ui-lib';
import { Badge } from '@teable/ui-lib';
import { Button } from '@teable/ui-lib';
import { Check, X, Play, Copy } from 'lucide-react';

interface RegexTesterProps {
  pattern: string;
  replacementText: string;
  onPatternChange: (pattern: string) => void;
  onReplacementChange: (replacement: string) => void;
}

interface TestResult {
  input: string;
  matches: string[] | null;
  replaced: string;
  groups: string[];
}

// 这些名称将在组件内部通过 t() 函数进行国际化
const getCommonPatterns = (t: (key: string, defaultValue?: string) => string) => [
  { name: t('findReplace.regexPatternEmail', '邮箱地址'), pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}' },
  { name: t('findReplace.regexPatternPhone', '手机号码'), pattern: '1[3-9]\\d{9}' },
  { name: t('findReplace.regexPatternNumber', '数字'), pattern: '\\d+' },
  { name: t('findReplace.regexPatternChinese', '中文字符'), pattern: '[\\u4e00-\\u9fa5]+' },
  { name: t('findReplace.regexPatternURL', 'URL链接'), pattern: 'https?://[^\\s]+' },
  { name: t('findReplace.regexPatternIPv4', 'IPv4地址'), pattern: '\\b(?:[0-9]{1,3}\\.){3}[0-9]{1,3}\\b' },
];

export function RegexTester({
  pattern,
  replacementText,
  onPatternChange,
  onReplacementChange,
}: RegexTesterProps) {
  const { t } = useTranslation('common');
  const [testText, setTestText] = useState(t('findReplace.regexDefaultTestText', '这是测试文本：abc123@example.com，手机号13812345678，数字456，网址https://example.com'));
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!pattern) {
      setIsValid(true);
      setError('');
      return;
    }

    try {
      new RegExp(pattern);
      setIsValid(true);
      setError('');
    } catch (err) {
      setIsValid(false);
      // 将常见的英文错误信息翻译为中文
      let errorMessage = err instanceof Error ? err.message : '正则表达式语法错误';

      // 常见错误信息翻译 - 先检查具体错误，再检查通用错误
      if (errorMessage.includes('Unterminated group')) {
        errorMessage = t('findReplace.regexErrorUnterminatedGroup', '未终止的分组');
      } else if (errorMessage.includes('Nothing to repeat')) {
        errorMessage = t('findReplace.regexErrorNothingToRepeat', '无内容可重复');
      } else if (errorMessage.includes('Unterminated character class')) {
        errorMessage = t('findReplace.regexErrorUnterminatedClass', '未终止的字符类');
      } else if (errorMessage.includes('Unmatched parenthesis')) {
        errorMessage = t('findReplace.regexErrorUnmatchedParen', '未匹配的括号');
      } else if (errorMessage.includes('Bad escape')) {
        errorMessage = t('findReplace.regexErrorBadEscape', '无效的转义字符');
      } else if (errorMessage.includes('Unterminated string')) {
        errorMessage = t('findReplace.regexErrorUnterminatedString', '未终止的字符串');
      } else if (errorMessage.includes('Invalid regular expression')) {
        errorMessage = t('findReplace.regexErrorInvalidRegex', '无效的正则表达式');
      }

      setError(errorMessage);
    }
  }, [pattern, t]);

  const handleTest = () => {
    if (!pattern || !isValid) return;

    try {
      const regex = new RegExp(pattern, 'g');
      const matches = [...testText.matchAll(regex)];

      const groups = matches.map(match =>
        match.slice(1).filter(group => group !== undefined).join(', ')
      ).filter(group => group.length > 0);

      const replaced = testText.replace(regex, replacementText);

      setTestResult({
        input: testText,
        matches: matches.map(m => m[0]),
        replaced,
        groups
      });
    } catch (err) {
      console.error('Test error:', err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // 可以添加复制成功的提示
    });
  };

  const useCommonPattern = (commonPattern: string) => {
    onPatternChange(commonPattern);
  };

  const commonPatterns = getCommonPatterns(t);

  return (
    <Card className="mt-2">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          {t('findReplace.regexTesterTitle', '正则表达式测试工具')}
          {isValid ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <X className="w-4 h-4 text-red-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 错误提示 */}
        {!isValid && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            {t('findReplace.regexSyntaxError', '正则表达式语法错误')}：{error}
          </div>
        )}

        {/* 常用正则模式 */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">{t('findReplace.regexCommonPatterns', '常用模式')}：</Label>
          <div className="flex flex-wrap gap-1">
            {commonPatterns.map((item, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => useCommonPattern(item.pattern)}
                className="text-xs h-6 px-2"
              >
                {item.name}
              </Button>
            ))}
          </div>
        </div>

        {/* 测试文本 */}
        <div className="space-y-2">
          <Label htmlFor="test-text" className="text-xs font-medium">
            {t('findReplace.regexTestText', '测试文本')}：
          </Label>
          <textarea
            id="test-text"
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            className="w-full p-2 text-xs border rounded resize-none"
            rows={3}
            placeholder={t('findReplace.regexTestTextPlaceholder', '输入要测试的文本...')}
          />
        </div>

        {/* 测试按钮 */}
        <Button
          onClick={handleTest}
          disabled={!pattern || !isValid}
          size="sm"
          className="w-full"
        >
          <Play className="w-3 h-3 mr-1" />
          {t('findReplace.regexTestButton', '测试正则表达式')}
        </Button>

        {/* 测试结果 */}
        {testResult && (
          <div className="space-y-3">
            {/* 匹配结果 */}
            {testResult.matches && testResult.matches.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs font-medium">{t('findReplace.regexMatchResults', '匹配结果')}：</Label>
                <div className="flex flex-wrap gap-1">
                  {testResult.matches.map((match, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {match}
                    </Badge>
                  ))}
                </div>
                {testResult.groups.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {t('findReplace.regexCaptureGroups', '捕获组')}：{testResult.groups.join(' | ')}
                  </div>
                )}
              </div>
            )}

            {/* 替换结果 */}
            {replacementText !== undefined && (
              <div className="space-y-1">
                <Label className="text-xs font-medium">{t('findReplace.regexReplaceResults', '替换结果')}：</Label>
                <div className="p-2 bg-muted rounded text-xs">
                  {testResult.replaced}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(testResult.replaced)}
                  className="text-xs"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  {t('findReplace.regexCopyResult', '复制结果')}
                </Button>
              </div>
            )}

            {/* 无匹配 */}
            {testResult.matches && testResult.matches.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-2">
                {t('findReplace.regexNoMatches', '未找到匹配项')}
              </div>
            )}
          </div>
        )}

        {/* 正则说明 */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>• {t('findReplace.regexHelpFlags', '支持的标记')}：g ({t('findReplace.regexHelpGlobal', '全局')}), i ({t('findReplace.regexHelpIgnoreCase', '忽略大小写')}), m ({t('findReplace.regexHelpMultiline', '多行')})</div>
          <div>• {t('findReplace.regexHelpGroups', '使用括号 () 创建捕获组')}：(\d+) {t('findReplace.regexHelpGroupsExample', '匹配数字')}</div>
          <div>• {t('findReplace.regexHelpReplace', '使用 $1, $2 引用捕获组进行替换')}</div>
          <div>• {t('findReplace.regexHelpClasses', '常用字符类')}：\d {t('findReplace.regexHelpDigits', '数字')}, \w {t('findReplace.regexHelpAlphanum', '字母数字')}, \s {t('findReplace.regexHelpSpace', '空白')}, . {t('findReplace.regexHelpAny', '任意字符')}</div>
          <div>• {t('findReplace.regexHelpQuantifiers', '量词')}：* {t('findReplace.regexHelpZeroOrMore', '0个或多个')}, + {t('findReplace.regexHelpOneOrMore', '1个或多个')}, ? {t('findReplace.regexHelpZeroOrOne', '0个或1个')}, {{n}} {t('findReplace.regexHelpExactlyN', '恰好n个')}</div>
        </div>
      </CardContent>
    </Card>
  );
}