// 核心业务类型定义

/**
 * 排名配置接口
 */
export interface IRankingConfig {
  sourceColumnId: string;
  targetColumnId: string;
  sortDirection: 'asc' | 'desc';
  rankingMethod: 'standard' | 'dense';
  zeroValueHandling: 'skipZero' | 'includeZero';
  groupColumnId?: string; // 可选的分组字段ID
}

/**
 * 排名输入接口
 */
export interface IRankingInput {
  records: IRecordData[];
  sourceColumnId: string;
  sortDirection: 'asc' | 'desc';
  rankingMethod: 'standard' | 'dense';
  zeroValueHandling: 'skipZero' | 'includeZero';
}

/**
 * 分组排名输入接口
 */
export interface IGroupedRankingInput extends IRankingInput {
  groupColumnId?: string; // 可选的分组字段ID
}

/**
 * 排名结果接口
 */
export interface IRankingResult {
  recordId: string;
  rank: number;
}

/**
 * 分组排名结果接口
 */
export interface IGroupedRankingResult extends IRankingResult {
  groupValue?: string | number | boolean | null; // 分组值，支持常见字段类型
  groupName?: string; // 人类可读的分组名称
}

/**
 * 排名输出接口
 */
export interface IRankingOutput {
  results: IRankingResult[];
  processedCount: number;
  skippedCount: number;
}

/**
 * 分组排名输出接口
 */
export interface IGroupedRankingOutput {
  results: IGroupedRankingResult[];
  processedCount: number;
  skippedCount: number;
  groupCount: number; // 分组数量
}

/**
 * 记录数据接口
 */
export interface IRecordData {
  id: string;
  fields: Record<string, string | number | boolean | null | undefined>;
}

/**
 * 字段查找选项接口
 */
export interface IFieldLookupOptions {
  filter?: any;
  // 可以根据需要添加更多查找选项属性
}

/**
 * 扩展的字段类型接口，兼容Teable SDK
 */
export interface IField {
  id: string;
  name: string;
  type: string;
  cellValueType: string;
  isLookup?: boolean;
  isConditionalLookup?: boolean;
  isComputed?: boolean;
  isMultipleCellValue?: boolean;
  lookupOptions?: IFieldLookupOptions;
  // 其他可能的Teable字段属性
  options?: any;
  description?: string;
  // 向后兼容的属性
  isRollup?: boolean;
  isFormula?: boolean;
}

/**
 * UI字段信息接口，用于组件内部字段展示
 */
export interface IUIField {
  id: string;
  name: string;
  type: string;
  cellValueType: string;
  isComputed: boolean;
  isLookup: boolean;
  isConditionalLookup: boolean;
  isRollup: boolean;
  isMultipleCellValue: boolean;
  isConditionalField: boolean;
  lookupOptions?: IFieldLookupOptions;
  // 其他可选属性
  options?: any;
  description?: string;
}

/**
 * 字段选项接口
 */
export interface IFieldOption {
  id: string;
  name: string;
  type: string;
}

/**
 * 排名算法类型
 */
export type RankingMethod = 'standard' | 'dense';

/**
 * 排序方向类型
 */
export type SortDirection = 'asc' | 'desc';

/**
 * 0值处理策略类型
 */
export type ZeroValueHandling = 'skipZero' | 'includeZero';

/**
 * 排名计算状态类型
 */
export type RankingStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * 错误类型
 */
export interface IAppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * 排名执行结果类型
 */
export interface IRankingExecutionResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  groupCount?: number;
  error?: IAppError;
}

/**
 * Toast 通知类型
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * 组件 Props 类型
 */
export interface IBaseComponentProps {
  disabled?: boolean;
  className?: string;
}

/**
 * 选择器组件 Props 类型
 */
export interface ISelectorProps<T = string> extends IBaseComponentProps {
  value?: T;
  onValueChange: (value: T) => void;
  placeholder?: string;
  options: Array<{
    value: T;
    label: string;
    disabled?: boolean;
  }>;
}

/**
 * URL 参数类型
 */
export interface IUrlParams {
  lang: 'en' | 'zh';
  baseId: string;
  pluginInstallId: string;
  positionId: string;
  positionType: string;
  pluginId: string;
  theme: 'light' | 'dark';
  tableId?: string; // 在实际使用中 tableId 是必需的
  viewId?: string;
  dashboardId?: string;
  recordId?: string;
  shareId?: string;
}

/**
 * API 响应基础类型
 */
export interface IApiResponse<T = unknown> {
  data: T;
  success: boolean;
  message?: string;
}

/**
 * 分页参数类型
 */
export interface IPaginationParams {
  take?: number;
  skip?: number;
}

/**
 * 排序参数类型
 */
export interface ISortParams {
  fieldId: string;
  order: 'asc' | 'desc';
}

/**
 * 记录查询参数类型
 */
export interface IRecordQueryParams extends IPaginationParams {
  viewId?: string;
  orderBy?: ISortParams[];
  projection?: string[];
  fieldKeyType?: 'id' | 'name';
}

// ===== 查找替换相关类型定义 =====

/**
 * 搜索模式枚举
 */
export enum SearchMode {
  SIMPLE = 'simple',
  REGEX = 'regex',
  DICTIONARY = 'dictionary'
}

/**
 * 搜索参数接口
 */
export interface ISearchParams {
  searchText?: string;
  regexPattern?: string;
  dictionary?: Record<string, string>;
  replacementText?: string;
  caseSensitive?: boolean;
  wholeWord?: boolean;
}

/**
 * 搜索结果项接口
 */
export interface ISearchResult {
  recordId: string;
  recordName?: string;
  fieldId: string;
  fieldName: string;
  originalValue: string | number | boolean | null;
  newValue: string | number | boolean | null;
  matchedText?: string; // 匹配到的具体文本
  replacement?: string; // 替换后的文本
  isModified: boolean; // 是否发生了变化
}

/**
 * 搜索结果统计接口
 */
export interface ISearchStats {
  totalRecords: number;
  matchedRecords: number;
  totalMatches: number;
  replacedCount: number;
}

/**
 * 查找替换状态接口
 */
export interface IFindReplaceState {
  mode: SearchMode;
  selectedField?: string;
  searchParams: ISearchParams;
  searchResults: ISearchResult[];
  searchStats: ISearchStats;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
  hasReplaced: boolean;
}

/**
 * 替换操作选项接口
 */
export interface IReplaceOptions {
  confirmBeforeReplace?: boolean;
  caseSensitive?: boolean;
  wholeWord?: boolean;
  preserveCase?: boolean;
}

/**
 * 批量替换项接口
 */
export interface IBatchReplaceItem {
  recordId: string;
  fieldId: string;
  oldValue: string | number | boolean | null;
  newValue: string | number | boolean | null;
}

/**
 * 批量替换结果接口
 */
export interface IBatchReplaceResult {
  success: boolean;
  replacedCount: number;
  failedCount: number;
  errors: Array<{
    recordId: string;
    error: string;
  }>;
}

/**
 * 搜索算法配置接口
 */
export interface ISearchConfig {
  tableId: string;
  mode: SearchMode;
  fieldId: string;
  params: ISearchParams;
  options?: IReplaceOptions; // 使其可选，提高兼容性
}

/**
 * 字典验证结果接口
 */
export interface IDictionaryValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  itemCount: number;
}

/**
 * 正则表达式验证结果接口
 */
export interface IRegexValidationResult {
  isValid: boolean;
  error?: string;
  pattern?: string;
  flags?: string;
}

/**
 * 查找替换操作历史接口
 */
export interface IFindReplaceHistory {
  id: string;
  timestamp: Date;
  mode: SearchMode;
  fieldId: string;
  fieldName: string;
  searchParams: ISearchParams;
  resultsCount: number;
  replacedCount: number;
}

/**
 * 分页信息接口
 */
export interface IPaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * 查找替换组件Props接口
 */
export interface IFindReplaceComponentProps extends IBaseComponentProps {
  tableId: string;
  onResultChange?: (results: ISearchResult[]) => void;
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
}