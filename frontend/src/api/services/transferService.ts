import { apiClient } from '../config/apiClient';

export interface StockTransfer {
  transfer_id: number;
  from_store_id: number;
  to_store_id: number;
  product_id: number;
  quantity: number;
  status: 'pending' | 'approved' | 'shipped' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at?: string;
  from_store_name?: string;
  to_store_name?: string;
  product_name?: string;
  category?: string;
}

export interface TransferCreate {
  from_store_id: number;
  to_store_id: number;
  product_id: number;
  quantity: number;
  notes?: string;
}

export const TransferService = {
  getTransfers: async (status?: string, store_id?: number): Promise<StockTransfer[]> => {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (store_id) params.store_id = String(store_id);
    const res = await apiClient.get('/transfers', { params });
    return res.data;
  },

  createTransfer: async (data: TransferCreate): Promise<StockTransfer> => {
    const res = await apiClient.post('/transfers', data);
    return res.data;
  },

  approveTransfer: async (id: number): Promise<void> => {
    await apiClient.patch(`/transfers/${id}/approve`);
  },

  cancelTransfer: async (id: number): Promise<void> => {
    await apiClient.patch(`/transfers/${id}/cancel`);
  },
};
