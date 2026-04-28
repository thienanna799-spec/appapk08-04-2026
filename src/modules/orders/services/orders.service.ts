import { gepApi } from '@/lib/api';

export const ordersService = {
  // Get orders with status dang_giao (assigned to driver)
  async getList() {
    return await gepApi.request('/orders?status=dang_giao');
  },

  // Get order detail by ID
  async getDetail(orderId: string) {
    return await gepApi.request(`/orders/${orderId}`);
  },

  // Get order items (product list)
  async getItems(orderId: string) {
    return await gepApi.request(`/orders/${orderId}/items`);
  },

  // Upload delivery proof (photo/video as base64)
  async uploadProof(orderId: string, data: { fileUrl: string; fileType: string; fileName?: string; note?: string }) {
    return await gepApi.request(`/orders/${orderId}/delivery-proofs`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get existing delivery proofs
  async getProofs(orderId: string) {
    return await gepApi.request(`/orders/${orderId}/delivery-proofs`);
  },

  // Mark delivery as completed (requires ≥1 proof uploaded)
  async completeDelivery(orderId: string) {
    return await gepApi.request(`/orders/${orderId}/complete-delivery`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  // Mark delivery as failed
  async failDelivery(orderId: string, reason: string) {
    return await gepApi.request(`/orders/${orderId}/fail-delivery`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // Delete a proof (if uploaded wrong one)
  async deleteProof(orderId: string, proofId: string) {
    return await gepApi.request(`/orders/${orderId}/delivery-proofs/${proofId}`, {
      method: 'DELETE',
    });
  },
};
