import { axios } from "@teable/openapi";
import * as openApi from "@teable/openapi";

/**
 * Interface for temporary token response from Teable plugin bridge
 */
export interface IGetTempTokenVo {
  accessToken: string;
  expiresTime: string;
}

const TEABLE_HOST = process.env.NEXT_PUBLIC_TEABLE_HOST;
const isCrossOrigin = !!TEABLE_HOST;

// 缓存当前token和刷新函数
let currentToken: string | null = null;
let tokenRefreshCallback: (() => Promise<string>) | null = null;

// 获取API基础URL
function getApiBaseUrl(): string {
  if (TEABLE_HOST) {
    return `${TEABLE_HOST.replace(/\/$/, '')}/api`;
  }

  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }

  return 'http://localhost:3000/api';
}

// 设置token刷新回调函数
export function setTokenRefreshCallback(callback: () => Promise<string>) {
  tokenRefreshCallback = callback;
}

// 初始化API配置
export function configureApi() {
  axios.defaults.baseURL = getApiBaseUrl();

  // 请求拦截器：每次请求前刷新token
  axios.interceptors.request.use(async (config) => {
    // 同域情况：清除Authorization，依赖cookie
    if (!isCrossOrigin) {
      delete config.headers.Authorization;
      return config;
    }

    // 跨域情况：每次请求前刷新token
    try {
      if (tokenRefreshCallback) {
        const freshToken = await tokenRefreshCallback();
        currentToken = freshToken;
        config.headers.Authorization = `Bearer ${freshToken}`;
      } else if (currentToken) {
        // 使用缓存的token
        config.headers.Authorization = `Bearer ${currentToken}`;
      }
    } catch (error) {
      console.error('Failed to refresh token before request:', error);
      // 继续请求，让响应拦截器处理错误
    }

    return config;
  });

  // 响应拦截器：处理token过期
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      // 如果是401错误且是跨域模式，尝试刷新token后重试
      if (error.response?.status === 401 && isCrossOrigin && error.config && !error.config._retry) {
        console.warn('Token expired, attempting to refresh and retry...');

        try {
          if (tokenRefreshCallback) {
            const freshToken = await tokenRefreshCallback();
            currentToken = freshToken;

            // 标记为已重试，避免无限循环
            error.config._retry = true;
            error.config.headers.Authorization = `Bearer ${freshToken}`;

            // 重新发送原始请求
            return axios(error.config);
          }
        } catch (refreshError) {
          console.error('Failed to refresh token for retry:', refreshError);
          clearAuthToken();
        }
      }

      return Promise.reject(error);
    }
  );
}

// 设置认证token
export function setAuthToken(token: string) {
  if (isCrossOrigin) {
    currentToken = token;
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
}

// 清除认证token
export function clearAuthToken() {
  currentToken = null;
  delete axios.defaults.headers.common['Authorization'];
}

// 获取当前token
export function getCurrentToken(): string | null {
  return currentToken;
}

// 重新配置API
export function reconfigureApi() {
  axios.defaults.baseURL = getApiBaseUrl();
}

export { openApi };