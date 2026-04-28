import { Geolocation } from '@capacitor/geolocation';

let trackingInterval: any = null;
let lastPosition: GeolocationPosition | null = null;

// Lazy import api to avoid circular dependency
let apiModule: any = null;
async function getApi() {
  if (!apiModule) {
    apiModule = await import('./api');
  }
  return apiModule.api;
}

export const gpsService = {
  startTracking(hasOrders: boolean = false) {
    if (trackingInterval) clearInterval(trackingInterval);

    const intervalTime = hasOrders ? 20000 : 90000; // 20s or 90s

    trackingInterval = setInterval(() => {
      this.getCurrentPosition()
        .then(async (pos) => {
          lastPosition = pos;
          try {
            const api = await getApi();
            await api.request('/driver/gps', {
              method: 'POST',
              body: JSON.stringify({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                isWorking: true,
              }),
            });
          } catch (err) {
            console.error('Failed to log GPS:', err);
          }
        })
        .catch(err => console.error('GPS Tracking error:', err));
    }, intervalTime);

    console.log(`GPS Tracking started (interval: ${intervalTime}ms)`);
  },

  stopTracking() {
    if (trackingInterval) {
      clearInterval(trackingInterval);
      trackingInterval = null;
    }
    console.log('GPS Tracking stopped');
  },

  async getCurrentPosition(): Promise<any> {
    try {
      // Use Native Capacitor Geolocation first
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });
      return { coords: { latitude: pos.coords.latitude, longitude: pos.coords.longitude } };
    } catch (nativeErr) {
      console.warn("Native GPS Failed, falling back to Web/Fake:", nativeErr);
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve({ coords: { latitude: 10.762622, longitude: 106.660172 } });
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, (err) => {
          console.warn("Web GPS Failed, using fallback coords:", err);
          resolve({ coords: { latitude: 10.762622, longitude: 106.660172 } });
        }, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });
    }
  },

  getLastPosition() {
    return lastPosition;
  },

  isTracking() {
    return !!trackingInterval;
  }
};
