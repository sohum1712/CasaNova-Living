import { apiClient } from '../config/apiClient';

export interface CartItem {
  product_id: number;
  product_name: string;
  qty: number;
  unit_price: number;
}

export interface POSSession {
  session_id: number;
  store_id: number;
  cart: CartItem[];
  total: number;
  status: 'open' | 'paid' | 'cancelled';
  created_at: string;
  store_name?: string;
}

export interface DashboardKPI {
  total_inventory_value: number;
  total_products: number;
  low_stock_count: number;
  pending_transfers: number;
  todays_sales: number;
  store_id?: number;
}

export const POSService = {
  getSessions: async (store_id?: number): Promise<POSSession[]> => {
    const params: Record<string, string> = {};
    if (store_id) params.store_id = String(store_id);
    const res = await apiClient.get('/pos', { params });
    return res.data;
  },

  createSession: async (data: { store_id: number; cart: CartItem[]; total: number }): Promise<POSSession> => {
    const res = await apiClient.post('/pos', data);
    return res.data;
  },

  checkout: async (session_id: number): Promise<void> => {
    await apiClient.post(`/pos/${session_id}/checkout`);
  },

  getDashboardKPIs: async (store_id?: number): Promise<DashboardKPI> => {
    const params: Record<string, string> = {};
    if (store_id) params.store_id = String(store_id);
    const res = await apiClient.get('/pos/dashboard/kpis', { params });
    return res.data;
  },
};
