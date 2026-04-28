import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, MapPin, Clock, Camera, CheckCircle2, Phone, Search } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { gpsService } from '@/lib/gps';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { ordersService } from './services/orders.service';
import { Input } from '@/components/ui/input';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      const data = await ordersService.getList();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;
    
    // Initial fetch
    fetchOrders();

    // Poll every 15 seconds for updates (replaces Firestore onSnapshot)
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleStartDelivery = async (orderId: string) => {
    try {
      const pos = await gpsService.getCurrentPosition();
      await ordersService.startDelivery(orderId, auth.currentUser!.uid, { 
        lat: pos.coords.latitude, 
        lng: pos.coords.longitude 
      });
      toast.success('Đã bắt đầu giao đơn hàng');
      setSelectedOrder(null);
      gpsService.startTracking(true);
      fetchOrders(); // Refresh immediately
    } catch (error) {
      toast.error('Lỗi khi bắt đầu giao hàng');
    }
  };

  const handleCompleteDelivery = async (orderId: string) => {
    try {
      const pos = await gpsService.getCurrentPosition();
      await ordersService.completeDelivery(orderId, { 
        lat: pos.coords.latitude, 
        lng: pos.coords.longitude 
      });
      toast.success('Đơn hàng đã hoàn thành!');
      setSelectedOrder(null);
      gpsService.startTracking(false);
      fetchOrders(); // Refresh immediately
    } catch (error) {
      toast.error('Lỗi khi hoàn thành đơn hàng');
    }
  };

  const filteredOrders = orders.filter(o => 
    o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id?.toString().includes(searchTerm)
  );

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Đơn hàng</h1>
          <p className="text-slate-500 font-medium">Quản lý các đơn hàng được chỉ định</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Tìm kiếm đơn hàng..." 
            className="pl-10 rounded-xl bg-white border-slate-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-40 bg-slate-100 rounded-3xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredOrders.map((order) => (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Card 
                  className="border-none shadow-sm hover:shadow-xl transition-all cursor-pointer group bg-white overflow-hidden rounded-3xl"
                  onClick={() => setSelectedOrder(order)}
                >
                  <CardContent className="p-0">
                    <div className="p-5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="bg-slate-100 p-3 rounded-2xl text-slate-900 group-hover:rotate-6 transition-transform">
                          <Package size={24} />
                        </div>
                        <Badge className={cn(
                          "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest",
                          order.status === 'pending' ? "bg-slate-100 text-slate-600" :
                          order.status === 'shipping' ? "bg-blue-500 text-white" :
                          "bg-green-500 text-white"
                        )}>
                          {order.status === 'pending' ? 'Chờ lấy' : 
                           order.status === 'shipping' ? 'Đang giao' : 'Hoàn thành'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <h3 className="text-xl font-black text-slate-900">{order.customerName || 'Đơn hàng #' + String(order.id).slice(-4)}</h3>
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <MapPin size={14} className="text-slate-400" />
                          <span className="truncate">{order.address}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="px-5 py-3 bg-slate-50 flex items-center justify-between border-t border-slate-100">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                        <Clock size={12} />
                        Hạn: {order.deadline || 'N/A'}
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 text-xs font-bold gap-1 rounded-lg">
                        Chi tiết <ArrowRight size={12} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setSelectedOrder(null)}
            />
            <motion.div
              layoutId={selectedOrder.id}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="h-32 bg-sky-600 flex items-center px-10">
                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md text-white mr-6">
                  <Package size={32} />
                </div>
                <div className="text-white">
                  <h2 className="text-3xl font-black">Chi tiết đơn</h2>
                  <p className="text-white/50 text-sm font-medium">#{selectedOrder.id}</p>
                </div>
              </div>

              <div className="p-10 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Khách hàng</p>
                    <p className="text-xl font-bold">{selectedOrder.customerName || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Số điện thoại</p>
                    <p className="text-xl font-bold">{selectedOrder.customerPhone || 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-1 border-l-4 border-sky-600 pl-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Địa chỉ giao hàng</p>
                  <p className="text-lg font-medium text-slate-600">{selectedOrder.address}</p>
                </div>

                <div className="flex gap-3 pt-6">
                  {selectedOrder.status === 'pending' ? (
                    <Button 
                      className="flex-1 h-16 rounded-2xl text-lg font-black bg-sky-600 shadow-xl shadow-sky-600/20"
                      onClick={() => handleStartDelivery(selectedOrder.id)}
                    >
                      <Camera className="mr-2" /> Bắt đầu giao
                    </Button>
                  ) : selectedOrder.status === 'shipping' ? (
                    <Button 
                      className="flex-1 h-16 rounded-2xl text-lg font-black bg-green-600 hover:bg-green-700 shadow-xl shadow-green-600/20"
                      onClick={() => handleCompleteDelivery(selectedOrder.id)}
                    >
                      <CheckCircle2 className="mr-2" /> Hoàn thành
                    </Button>
                  ) : null}
                  
                  <Button variant="outline" className="h-16 w-16 rounded-2xl border-2 shrink-0">
                    <Phone className="text-slate-600" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
const ArrowRight = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>;
