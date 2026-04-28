import { api } from '@/lib/api';

export const ordersService = {
  async getList() {
    return await api.request('/driver/orders');
  },

  async startDelivery(orderId: string, driverId: string, gps: { lat: number, lng: number }) {
    return await api.request(`/driver/orders/${orderId}/start`, {
      method: 'POST',
      body: JSON.stringify({ lat: gps.lat, lng: gps.lng }),
    });
  },

  async completeDelivery(orderId: string, gps: { lat: number, lng: number }) {
    return await api.request(`/driver/orders/${orderId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ lat: gps.lat, lng: gps.lng }),
    });
  }
};
