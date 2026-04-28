import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Package, Clock, Fuel, MapPin, Play, Square, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { api } from '@/lib/api';
import { motion } from 'motion/react';
import { sidebarConfig } from '@/config/sidebar';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [isWorking, setIsWorking] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const fetchDashboard = async () => {
      try {
        const data = await api.request('/driver/dashboard');
        setDashboardData(data);
        setIsWorking(data.isWorking);
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      }
    };

    fetchDashboard();
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const stats = [
    { label: 'Đơn hàng hôm nay', value: dashboardData?.orderCount ?? '...', icon: Package, color: 'text-blue-500' },
    { label: 'Tổng KM đã chạy', value: dashboardData?.totalKm?.toFixed(1) ?? '...', icon: MapPin, color: 'text-green-500' },
    { label: 'Chi phí xăng', value: dashboardData?.totalFuel ? `${(dashboardData.totalFuel / 1000).toFixed(0)}k` : '...', icon: Fuel, color: 'text-amber-500' },
  ];

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Xin chào, {user?.displayName}!</h1>
          <p className="text-slate-500 font-medium">Hôm nay bạn có {dashboardData?.orderCount ?? '...'} đơn hàng đang chờ xử lý.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => navigate('/sessions')}
            className={isWorking ? "bg-red-500 hover:bg-red-600" : "bg-sky-600"}
          >
            {isWorking ? <Square className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
            {isWorking ? "Kết thúc ca" : "Bắt đầu ca"}
          </Button>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden bg-white">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{stat.label}</p>
                  <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                </div>
                <div className={`p-4 rounded-2xl bg-slate-50 ${stat.color} group-hover:scale-110 transition-transform`}>
                  <stat.icon size={28} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>

      {/* Quick Menu */}
      <section className="hidden sm:block">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-extrabold text-slate-900 uppercase tracking-widest text-xs">Phím tắt nhanh</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sidebarConfig.filter(m => m.id !== 'dashboard').map((item, i) => (
            <motion.button
              key={item.id}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(item.path)}
              className="group p-6 bg-white border border-transparent hover:border-slate-200 shadow-sm rounded-3xl text-left transition-all"
            >
              <div className="w-12 h-12 bg-sky-600 text-white rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-6 transition-transform">
                <item.icon size={24} />
              </div>
              <h4 className="font-bold text-slate-900">{item.label}</h4>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                Chi tiết <ArrowRight size={10} />
              </p>
            </motion.button>
          ))}
        </div>
      </section>
    </div>
  );
}
