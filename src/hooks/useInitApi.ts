import { usePluginBridge } from "@teable/sdk";
import { configureApi, setAuthToken, reconfigureApi, type IGetTempTokenVo } from "@/lib/api";
import { useEffect, useState } from "react";

const TEABLE_HOST = process.env.NEXT_PUBLIC_TEABLE_HOST;
const isCrossOrigin = !!TEABLE_HOST;

/**
 * Interface for URL parameters provided by Teable plugin environment
 */
interface IUrlParams {
  baseId?: string;
  tableId?: string;
  viewId?: string;
  dashboardId?: string;
  recordId?: string;
  shareId?: string;
}

/**
 * Hook for initializing Teable API connection with proper authentication and configuration.
 * 根据官方文档智能处理同域和跨域访问场景：
 * - 同域情况：依赖浏览器自动携带的cookie，无需额外认证
 * - 跨域情况：使用bridge.getSelfTempToken获取Bearer Token进行认证
 *
 * Responsibilities:
 * - Configure API client with base settings
 * - Detect same-origin vs cross-origin access
 * - Fetch authentication tokens only for cross-origin access
 * - Listen for URL parameter changes and reconfigure API accordingly
 * - Handle initialization errors gracefully
 * - Provide loading state and auth status for the application
 *
 * @returns {boolean} Boolean indicating whether API initialization is complete
 */
export const useInitApi = () => {
  const bridge = usePluginBridge();
  const [isInit, setIsInit] = useState(false);

  useEffect(() => {
    if (!bridge) {
      return;
    }

    /**
     * Initializes the API connection with proper authentication and configuration.
     * 根据同域/跨域智能选择认证方式，并设置API客户端。
     * Handles errors gracefully to prevent application hanging.
     */
    const initApi = async () => {
      try {
        // Configure API base settings first
        configureApi();

        console.log('API Mode:', isCrossOrigin ? 'Cross-Origin' : 'Same-Origin');
        if (TEABLE_HOST) {
          console.log('Teable Host:', TEABLE_HOST);
        }

        // 根据官方文档：不同域需要使用bridge中getSelfTempToken方法获取用户临时token
        if (isCrossOrigin) {
          try {
            const tokenResponse: IGetTempTokenVo = await bridge.getSelfTempToken();
            setAuthToken(tokenResponse.accessToken);

            // 检查token过期时间
            const expiresTime = new Date(tokenResponse.expiresTime);
            const now = new Date();
            const timeUntilExpiry = expiresTime.getTime() - now.getTime();

            console.log('Token expires at:', expiresTime);
            console.log('Time until expiry:', Math.floor(timeUntilExpiry / 1000 / 60), 'minutes');

            // 如果token即将在30分钟内过期，可以设置提醒
            if (timeUntilExpiry < 30 * 60 * 1000) {
              console.warn('Token will expire within 30 minutes');
            }
          } catch (error) {
            console.error('Failed to get temp token for cross-origin access:', error);
            // 在开发环境中，即使无法获取token也继续初始化
          }
        } else {
          console.log('Same-origin access detected, using cookie-based authentication');
        }

        setIsInit(true);
      } catch (error) {
        console.error('Failed to initialize API:', error);
        setIsInit(true); // 即使失败也设置为true以避免无限加载
      }
    };

    initApi();

    /**
     * Event handler for URL parameter changes from the Teable host.
     * Reconfigures the API to ensure it has the latest host configuration.
     *
     * @param {IUrlParams} urlParams - Updated URL parameters from Teable
     */
    const handleUrlParams = (_urlParams: IUrlParams) => {
      // Reconfigure API to get the latest host configuration
      reconfigureApi();
      console.log('API reconfigured after URL parameter change');
    };

    bridge.on('syncUrlParams', handleUrlParams);

    // Cleanup function to remove event listener
    return () => {
      bridge.removeListener('syncUrlParams', handleUrlParams);
    };
  }, [bridge]);

  return isInit;
};
