import { api } from '@/lib/api';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  photoURL: string | null;
  role: string;
  status: string;
  isActive: boolean;
  vehicle_type: string | null;
  license_plate: string | null;
  working_area: string | null;
  last_login: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileData {
  phone?: string;
  vehicle_type?: string;
  license_plate?: string;
  working_area?: string;
}

export const profileService = {
  async getProfile(): Promise<UserProfile> {
    return await api.request('/me');
  },

  async updateProfile(data: UpdateProfileData): Promise<{ status: string; user: UserProfile }> {
    return await api.request('/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
