import { storage } from './storage';
import { auth } from './firebase';

// ==================== LOCAL API (DriverGo Backend — port 5000) ====================
// Used for: sessions, fuel, GPS, local profile
const isProductionOrCapacitor =
  typeof window !== 'undefined' && (
    window.location.protocol === 'file:' ||
    window.location.protocol === 'capacitor:' ||
    window.location.hostname === ''
  );

const LOCAL_API_BASE = isProductionOrCapacitor
  ? (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
  : '/api';

// ==================== GEP API (Order Management System — gepoder.click) ====================
// Used for: auth, orders, delivery proofs
const GEP_API_BASE = import.meta.env.VITE_GEP_API_URL || 'https://gepoder.click/api';

// JWT token from GEP (stored in localStorage after login)
const GEP_TOKEN_KEY = 'gep_jwt_token';

function getGepToken(): string | null {
  return localStorage.getItem(GEP_TOKEN_KEY);
}

function setGepToken(token: string) {
  localStorage.setItem(GEP_TOKEN_KEY, token);
}

function clearGepToken() {
  localStorage.removeItem(GEP_TOKEN_KEY);
}

// ==================== Shared request logic ====================
async function makeRequest(baseUrl: string, endpoint: string, tokenGetter: () => Promise<string | null> | string | null, options: RequestInit = {}) {
  const token = await tokenGetter();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error('Session expired');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// ==================== LOCAL API (DriverGo backend) ====================
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
    clearGepToken();
  },

  async request(endpoint: string, options: RequestInit = {}) {
    try {
      return await makeRequest(LOCAL_API_BASE, endpoint, () => this.getToken(), options);
    } catch (error) {
      if (error instanceof TypeError && options.method === 'POST' && !endpoint.includes('/auth')) {
        try {
          await storage.addAction(endpoint, JSON.parse(options.body as string));
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

// ==================== GEP API (Orders & Auth) ====================
export const gepApi = {
  /**
   * Login to GEP: Firebase idToken → GEP JWT
   * This registers the driver in GEP automatically (status: active)
   */
  async login(firebaseIdToken: string): Promise<{ token: string; user: any }> {
    const resp = await fetch(`${GEP_API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: firebaseIdToken }),
    });

    const json = await resp.json();
    if (!resp.ok) {
      throw new Error(json?.message || `GEP login failed (${resp.status})`);
    }

    const data = json?.data || json;
    if (data.token) {
      setGepToken(data.token);
    }
    return data;
  },

  /** Check if we have a valid GEP JWT */
  isLoggedIn(): boolean {
    return !!getGepToken();
  },

  /** Clear GEP JWT */
  logout() {
    clearGepToken();
  },

  /** Make request to GEP API with JWT token */
  async request(endpoint: string, options: RequestInit = {}) {
    const result = await makeRequest(GEP_API_BASE, endpoint, getGepToken, options);
    // GEP wraps responses in { success, data } — unwrap
    return result?.data !== undefined ? result.data : result;
  },
};
