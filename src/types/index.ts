// 核心业务类型定义

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
 * 错误类型
 */
export interface IAppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
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
  dictionary: Record<string, string>;
  searchResults: ISearchResult[];
  searchStats: ISearchStats;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
  hasReplaced: boolean;
  replacingRecordIds: Set<string>;
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

// ===== 视图相关类型定义 =====

/**
 * 视图接口
 */
export interface IView {
  id: string;
  name: string;
  type: string;
  description?: string;
  filter?: any;
  sort?: any;
  group?: any;
  columnMeta?: Record<string, any>;
  createdTime?: string;
  lastModifiedTime?: string;
  order?: number;
  isLocked?: boolean;
}

/**
 * 视图选择器Props接口
 */
export interface IViewSelectorProps extends IBaseComponentProps {
  selectedViewId?: string;
  onViewChange: (viewId: string) => void;
  disabled?: boolean;
}

/**
 * 扩展的查找替换状态接口，包含视图信息
 */
export interface IFindReplaceStateWithView extends IFindReplaceState {
  selectedViewId?: string; // 当前选择的视图ID，undefined或'all'表示所有视图
  viewFilterActive: boolean; // 是否启用视图筛选
}

/**
 * 扩展的搜索配置接口，包含视图信息
 */
export interface ISearchConfigWithView extends ISearchConfig {
  viewId?: string; // 可选的视图ID，用于在特定视图中搜索
}

/**
 * 视图搜索结果接口
 */
export interface IViewSearchResult {
  viewId: string;
  viewName: string;
  results: ISearchResult[];
  stats: ISearchStats;
}