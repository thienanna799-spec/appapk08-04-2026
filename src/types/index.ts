export type Role = 'super_admin' | 'admin' | 'staff' | 'driver';

export interface User {
  uid: string;
  email: string;
  name: string;
  role: Role;
  photoURL?: string;
  phone?: string;
  vehicleInfo?: string;
  isActive: boolean;
  createdAt: any;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  status: 'pending' | 'shipping' | 'completed' | 'cancelled';
  assignedDriverId?: string;
  pickupPhoto?: string;
  deliveryPhoto?: string;
  signature?: string;
  pickupLocation?: { lat: number; lng: number };
  deliveryLocation?: { lat: number; lng: number };
  createdAt: any;
  updatedAt: any;
}

export interface WorkSession {
  id: string;
  driverId: string;
  checkInTime: any;
  checkOutTime?: any;
  startKm: number;
  endKm?: number;
  totalKm?: number;
  startLocation: { lat: number; lng: number };
  endLocation?: { lat: number; lng: number };
  vehiclePhoto?: string;
}

export interface FuelLog {
  id: string;
  driverId: string;
  amount: number;
  fuelVideo?: string;
  photoPrice?: string;
  location: { lat: number; lng: number };
  timestamp: any;
}
