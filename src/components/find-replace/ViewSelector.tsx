import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@teable/ui-lib/dist/shadcn/ui/select';
import { Label } from '@teable/ui-lib/dist/shadcn/ui/label';
import {
  Sheet,
  ClipboardList as Form,
  LayoutGrid as Gallery,
  Kanban,
  Calendar,
} from '@teable/icons';
import { useViews, type IView } from '@/hooks/useViews';

interface IViewSelectorProps {
  selectedViewId?: string;
  onViewChange: (viewId: string) => void;
  disabled?: boolean;
}

export const ViewSelector: React.FC<IViewSelectorProps> = ({
  selectedViewId,
  onViewChange,
  disabled = false,
}) => {
  const { t } = useTranslation('common');

  // 获取视图数据
  const { data: views = [], isLoading, error } = useViews();

  // 处理视图选择变化
  const handleViewChange = (viewId: string) => {
    console.log('🎯 [ViewSelector] View selected:', {
      viewId,
      viewName: views.find(v => v.id === viewId)?.name,
      totalViews: views.length
    });
    onViewChange(viewId);
  };

  // 根据视图类型获取对应图标
  const getViewIcon = (viewType: string) => {
    const iconClassName = "w-4 h-4";

    switch (viewType) {
      case 'grid':
        return <Sheet className={iconClassName} />;
      case 'form':
        return <Form className={iconClassName} />;
      case 'gallery':
        return <Gallery className={iconClassName} />;
      case 'kanban':
        return <Kanban className={iconClassName} />;
      case 'gantt':
        return <Calendar className={iconClassName} />; // 使用 Calendar 图标代替 Component
      case 'calendar':
        return <Calendar className={iconClassName} />;
      default:
        return <Sheet className={iconClassName} />; // 默认使用 grid 图标
    }
  };

  // 如果正在加载或出错，显示加载状态
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label htmlFor="view-selector">{t('findReplace.view', 'View')}</Label>
        <Select disabled>
          <SelectTrigger id="view-selector">
            <SelectValue placeholder={t('findReplace.loadingViews', 'Loading views to narrow search scope...')} />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  // 如果获取视图失败，显示错误状态
  if (error) {
    return (
      <div className="space-y-2">
        <Label htmlFor="view-selector">{t('findReplace.view', 'View')}</Label>
        <Select disabled>
          <SelectTrigger id="view-selector">
            <SelectValue placeholder={t('findReplace.failedToLoadViews', 'Failed to load views')} />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  // 如果没有可用视图，显示空状态
  if (views.length === 0) {
    return (
      <div className="space-y-2">
        <Label htmlFor="view-selector">{t('findReplace.view', 'View')}</Label>
        <Select disabled>
          <SelectTrigger id="view-selector">
            <SelectValue placeholder={t('findReplace.noViewsAvailable', 'No views available for this table')} />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="view-selector">
        {t('findReplace.view', 'View')}
      </Label>
      <Select
        value={selectedViewId || ''}
        onValueChange={handleViewChange}
        disabled={disabled}
      >
        <SelectTrigger id="view-selector">
          <SelectValue placeholder={t('findReplace.viewSelectionPlaceholder', 'Select a view to narrow search scope')} />
        </SelectTrigger>
        <SelectContent>
          {views
            .filter((view: IView) => view.type !== 'component' && view.type !== 'form') // 过滤掉插件视图和表单视图
            .map((view: IView) => (
            <SelectItem key={view.id} value={view.id}>
              <div className="flex items-center gap-2">
                {getViewIcon(view.type)}
                {view.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        {t('findReplace.viewDescription', 'Select a view to limit search and replacement to a specific data range')}
      </p>
    </div>
  );
};

export default ViewSelector;