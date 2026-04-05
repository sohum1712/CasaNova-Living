import axios, { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import { dispatchAuthRequired } from '@/lib/authEvents';
import * as demo from '@/data/demoData';

export const apiConfig = {
  baseURL: import.meta.env.VITE_API_BASE_URL || `${window.location.origin}/api`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
};

export const apiClient: AxiosInstance = axios.create(apiConfig);

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const url = error.config?.url || '';
    const skipLogout =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/stores-public') ||
      url.includes('/auth/me') ||
      url.includes('/auth/forgot-password') ||
      url.includes('/auth/reset-password');

    if (error.response?.status === 401 && !skipLogout) {
      useAuthStore.getState().logout();
      dispatchAuthRequired();
    }
    return Promise.reject(error);
  }
);

export function handleApiError(error: AxiosError): string {
  const data = error.response?.data as { detail?: string; message?: string };
  return data?.detail || data?.message || error.message || 'An unexpected error occurred';
}

const rawQuery = async <T>(
  url: string,
  empty: T,
  method: 'GET' | 'POST' = 'GET',
  data?: unknown
): Promise<T> => {
  try {
    const response = await apiClient({ url: `/${url}`, method, data });
    return response.data as T;
  } catch (error) {
    console.warn(`API ${url}:`, (error as AxiosError).message);
    return empty;
  }
};

export const aiApi = {
  getRecommendations: async () =>
    demo.withDemoFallback(
      await rawQuery<unknown[]>('ai/recommendations', []),
      demo.demoAiRecommendations
    ),
  getAnomalies: async () =>
    demo.withDemoFallback(
      await rawQuery<unknown[]>('ai/anomalies', []),
      demo.demoAiAnomalies
    ),
  conversationalQuery: async (query: string) => {
    const live = await rawQuery<{ answer?: string; data_points?: unknown[] }>(
      'ai/query',
      { answer: '', data_points: [] },
      'POST',
      { query }
    );
    if (live?.answer && String(live.answer).trim()) return live;
    return { ...demo.demoAiQuery, answer: `${demo.demoAiQuery.answer} (Demo)` };
  },
};

export const analyticsApi = {
  getSalesTrend: async (days = 30) =>
    demo.withDemoFallback(
      await rawQuery<unknown[]>(`analytics/sales-trend?days=${days}`, []),
      demo.demoSalesTrend
    ),
  getCategoryPerformance: async () =>
    demo.withDemoFallback(
      await rawQuery<unknown[]>('analytics/category-performance', []),
      demo.demoCategoryPerformance
    ),
  getInventoryHealth: async () =>
    demo.withDemoFallback(
      await rawQuery<unknown[]>('analytics/inventory-health', []),
      demo.demoInventoryHealth
    ),
  getStoreComparison: async () =>
    demo.withDemoFallback(
      await rawQuery<unknown[]>('analytics/store-comparison', []),
      demo.demoStoreComparison
    ),
};

export const storesApi = {
  getAll: () => rawQuery<unknown[]>('stores', []),
  create: (data: unknown) => apiClient.post('/stores', data),
};

export const inventoryApi = {
  getAll: (storeId?: string) =>
    rawQuery<unknown[]>(`inventory${storeId ? `?store_id=${storeId}` : ''}`, []),
  getProducts: async () =>
    demo.withDemoFallback(await rawQuery<unknown[]>('products', []), demo.demoProducts),
  createProduct: (data: unknown) => apiClient.post('/products', data),
};

export const transferApi = {
  getAll: async () =>
    demo.withDemoFallback(await rawQuery<unknown[]>('transfers', []), demo.demoTransfers),
  create: (data: unknown) => apiClient.post('/transfers', data),
  approve: (id: number) => apiClient.patch(`/transfers/${id}/approve`),
};

export const posApi = {
  checkout: (data: unknown) => apiClient.post('/pos/checkout', data),
};
