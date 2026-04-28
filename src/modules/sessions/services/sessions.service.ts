import { api } from '@/lib/api';

export const sessionsService = {
  async getActiveSession(driverId: string) {
    return await api.request('/driver/sessions/active');
  },

  async checkIn(driverId: string, startKm: number, location: { lat: number, lng: number }) {
    return await api.request('/driver/sessions/check-in', {
      method: 'POST',
      body: JSON.stringify({ startKm, lat: location.lat, lng: location.lng }),
    });
  },

  async checkOut(sessionId: string, endKm: number, location: { lat: number, lng: number }) {
    return await api.request('/driver/sessions/check-out', {
      method: 'POST',
      body: JSON.stringify({ sessionId, endKm, lat: location.lat, lng: location.lng }),
    });
  }
};
