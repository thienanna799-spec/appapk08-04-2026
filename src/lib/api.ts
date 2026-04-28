import { storage } from './storage';
import { auth } from './firebase';

// In dev: use relative '/api' which goes through Vite proxy to port 5000
// In production/Capacitor APK: use absolute URL from VITE_API_URL env variable
// Detection: Capacitor WebView uses 'file:' protocol or 'capacitor://' scheme
const isProductionOrCapacitor = 
  typeof window !== 'undefined' && (
    window.location.protocol === 'file:' ||
    window.location.protocol === 'capacitor:' ||
    window.location.hostname === ''
  );

const API_BASE = isProductionOrCapacitor
  ? (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
  : '/api';

export const api = {
  async getToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (user) {
      try {
        return await user.getIdToken();
      } catch {
        return null;
      }
    }
    return null;
  },

  logout() {
    auth.signOut();
  },

  async request(endpoint: string, options: RequestInit = {}) {
    const token = await this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> || {}),
    };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      if (response.status === 401 || response.status === 403) {
        // Don't auto-logout for profile/auth endpoints
        if (!endpoint.includes('/me') && !endpoint.includes('/auth')) {
          this.logout();
        }
        throw new Error('Session expired');
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      // If network error on POST, queue for offline sync
      if (error instanceof TypeError && options.method === 'POST' && !endpoint.includes('/auth')) {
        try {
          await storage.addAction(endpoint, JSON.parse(options.body as string));
          console.log('Request queued for offline sync:', endpoint);
        } catch (e) {
          console.error('Failed to queue offline action:', e);
        }
      }
      throw error;
    }
  },

  async syncOffline() {
    const actions = await storage.getActions();
    if (actions.length === 0) return;

    console.log(`Syncing ${actions.length} offline actions...`);
    for (const action of actions) {
      try {
        await this.request(action.type, {
          method: 'POST',
          body: JSON.stringify(action.payload),
        });
        if (action.id) await storage.removeAction(action.id);
      } catch (err) {
        console.error('Failed to sync action:', action.type, err);
        break;
      }
    }
  }
};
