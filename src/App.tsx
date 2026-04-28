import * as React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { api } from './lib/api';
import { useEffect, useState } from 'react';

// Common
import ProtectedRoute from './components/common/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

// Modules
const LoginPage = React.lazy(() => import('./modules/auth/page'));
const DashboardPage = React.lazy(() => import('./modules/dashboard/page'));
const OrdersPage = React.lazy(() => import('./modules/orders/page'));
const SessionsPage = React.lazy(() => import('./modules/sessions/page'));
const FuelPage = React.lazy(() => import('./modules/fuel/page'));
const GPSPage = React.lazy(() => import('./modules/gps/page'));
const ProfilePage = React.lazy(() => import('./modules/profile/page'));

const PageLoader = () => (
  <div className="h-full w-full flex items-center justify-center p-20">
    <div className="w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      api.syncOffline();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        {!isOnline && (
          <div className="bg-amber-500 text-white text-center py-1 text-[10px] font-black uppercase tracking-widest sticky top-0 z-[60]">
            Đang ngoại tuyến • Dữ liệu sẽ được đồng bộ khi có mạng
          </div>
        )}
        
        <React.Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route path="/" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><AppLayout><OrdersPage /></AppLayout></ProtectedRoute>} />
            <Route path="/sessions" element={<ProtectedRoute><AppLayout><SessionsPage /></AppLayout></ProtectedRoute>} />
            <Route path="/fuel" element={<ProtectedRoute><AppLayout><FuelPage /></AppLayout></ProtectedRoute>} />
            <Route path="/gps" element={<ProtectedRoute><AppLayout><GPSPage /></AppLayout></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><AppLayout><ProfilePage /></AppLayout></ProtectedRoute>} />
          </Routes>
        </React.Suspense>
        
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}
