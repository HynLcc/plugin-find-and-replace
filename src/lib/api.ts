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

// 初始化API配置
export function configureApi() {
  axios.defaults.baseURL = getApiBaseUrl();

  // 请求拦截器：动态处理认证头
  axios.interceptors.request.use((config) => {
    // 同域情况：清除Authorization，依赖cookie
    if (!isCrossOrigin) {
      delete config.headers.Authorization;
    }
    // 跨域情况：保留Authorization header
    return config;
  });

  // 响应拦截器：处理token过期
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 && isCrossOrigin) {
        console.warn('Token expired, please refresh');
        clearAuthToken();
      }
      return Promise.reject(error);
    }
  );
}

// 设置认证token
export function setAuthToken(token: string) {
  if (isCrossOrigin) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
}

// 清除认证token
export function clearAuthToken() {
  delete axios.defaults.headers.common['Authorization'];
}

// 重新配置API
export function reconfigureApi() {
  axios.defaults.baseURL = getApiBaseUrl();
}

export { openApi };