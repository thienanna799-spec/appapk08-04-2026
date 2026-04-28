import { LayoutDashboard, Package, Clock, Fuel, MapPin, User } from 'lucide-react';

export const sidebarConfig = [
  { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard, path: '/' },
  { id: 'orders', label: 'Đơn hàng', icon: Package, path: '/orders' },
  { id: 'sessions', label: 'Ca làm việc', icon: Clock, path: '/sessions' },
  { id: 'fuel', label: 'Đổ xăng', icon: Fuel, path: '/fuel' },
  { id: 'gps', label: 'Vị trí', icon: MapPin, path: '/gps' },
  { id: 'profile', label: 'Hồ sơ', icon: User, path: '/profile' },
];
