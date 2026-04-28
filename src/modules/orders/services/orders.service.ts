import { api } from '@/lib/api';

export const ordersService = {
  // Get orders with status dang_giao (assigned to driver)
  async getList() {
    return await api.request('/driver/orders');
  },

  // Get order detail by ID
  async getDetail(orderId: string) {
    return await api.request(`/driver/orders/${orderId}`);
  },

  // Get order items (product list)
  async getItems(orderId: string) {
    return await api.request(`/driver/orders/${orderId}/items`);
  },

  // Upload delivery proof (photo/video)
  async uploadProof(orderId: string, data: { fileUrl: string; fileType: string; note?: string }) {
    return await api.request(`/driver/orders/${orderId}/proof`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Mark delivery as completed
  async completeDelivery(orderId: string) {
    return await api.request(`/driver/orders/${orderId}/complete`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  // Mark delivery as failed
  async failDelivery(orderId: string, reason: string) {
    return await api.request(`/driver/orders/${orderId}/fail`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
};
