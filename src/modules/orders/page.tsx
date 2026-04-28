import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Package, MapPin, Clock, Camera, CheckCircle2, Phone, Search, 
  XCircle, Upload, ChevronRight, Loader2, AlertTriangle, ImageIcon
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { ordersService } from './services/orders.service';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  'cho_duyet': { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-700' },
  'da_duyet': { label: 'Đã duyệt', color: 'bg-blue-100 text-blue-700' },
  'dang_chuan_bi': { label: 'Đang soạn', color: 'bg-orange-100 text-orange-700' },
  'cho_xuat_kho': { label: 'Chờ xuất kho', color: 'bg-purple-100 text-purple-700' },
  'dang_giao': { label: 'Đang giao', color: 'bg-sky-500 text-white' },
  'hoan_thanh': { label: 'Hoàn thành', color: 'bg-green-500 text-white' },
  'huy': { label: 'Đã hủy', color: 'bg-red-100 text-red-700' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [failReason, setFailReason] = useState("");
  const [showFailDialog, setShowFailDialog] = useState(false);

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
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleSelectOrder = async (order: any) => {
    setSelectedOrder(order);
    try {
      const items = await ordersService.getItems(order.id);
      setOrderItems(Array.isArray(items) ? items : []);
    } catch {
      setOrderItems([]);
    }
  };

  const handleCompleteDelivery = async (orderId: string) => {
    setActionLoading(true);
    try {
      await ordersService.completeDelivery(orderId);
      toast.success('Đã xác nhận giao hàng thành công!');
      setSelectedOrder(null);
      fetchOrders();
    } catch (error: any) {
      toast.error(error?.message || 'Lỗi khi xác nhận giao hàng');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFailDelivery = async (orderId: string) => {
    if (!failReason.trim()) {
      toast.error('Vui lòng nhập lý do giao thất bại');
      return;
    }
    setActionLoading(true);
    try {
      await ordersService.failDelivery(orderId, failReason);
      toast.success('Đã báo giao hàng thất bại');
      setSelectedOrder(null);
      setShowFailDialog(false);
      setFailReason("");
      fetchOrders();
    } catch (error: any) {
      toast.error(error?.message || 'Lỗi khi báo giao thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadProof = async (orderId: string) => {
    // For now, use a placeholder — in production, integrate with Camera plugin
    try {
      await ordersService.uploadProof(orderId, {
        fileUrl: `proof_${Date.now()}.jpg`,
        fileType: 'image',
        note: 'Ảnh giao hàng',
      });
      toast.success('Đã upload chứng từ giao hàng');
    } catch (error: any) {
      toast.error(error?.message || 'Lỗi upload chứng từ');
    }
  };

  const filteredOrders = orders.filter(o =>
    o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customerAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatus = (status: string) => STATUS_MAP[status] || { label: status, color: 'bg-slate-100 text-slate-600' };

  const formatCurrency = (val: number) => {
    if (!val) return '0đ';
    return new Intl.NumberFormat('vi-VN').format(val) + 'đ';
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Đơn hàng</h1>
          <p className="text-slate-500 font-medium">Đơn hàng được giao từ hệ thống GEP</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            placeholder="Tìm đơn hàng..."
            className="pl-10 rounded-xl bg-white border-slate-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-44 bg-slate-100 rounded-3xl animate-pulse" />)}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package size={48} className="text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-400">Không có đơn hàng</h3>
          <p className="text-sm text-slate-400 mt-1">Chưa có đơn nào được giao cho bạn</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredOrders.map((order) => {
              const st = getStatus(order.status);
              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Card
                    className="border-none shadow-sm hover:shadow-xl transition-all cursor-pointer group bg-white overflow-hidden rounded-3xl"
                    onClick={() => handleSelectOrder(order)}
                  >
                    <CardContent className="p-0">
                      <div className="p-5 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="bg-slate-100 p-3 rounded-2xl text-slate-900 group-hover:rotate-6 transition-transform">
                            <Package size={24} />
                          </div>
                          <Badge className={cn("rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest", st.color)}>
                            {st.label}
                          </Badge>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">{order.code}</p>
                          <h3 className="text-xl font-black text-slate-900 truncate">{order.customerName || 'Khách hàng'}</h3>
                          <p className="text-sm text-slate-500 flex items-center gap-1">
                            <MapPin size={14} className="text-slate-400 shrink-0" />
                            <span className="truncate">{order.customerAddress || 'Chưa có địa chỉ'}</span>
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-sky-600">{order.quantity || 0} cuộn</span>
                          <span className="font-bold text-slate-900">{formatCurrency(order.totalRevenue)}</span>
                        </div>
                      </div>

                      <div className="px-5 py-3 bg-slate-50 flex items-center justify-between border-t border-slate-100">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                          <Clock size={12} />
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-400">
                          Chi tiết <ChevronRight size={14} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
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
              onClick={() => { setSelectedOrder(null); setShowFailDialog(false); }}
            />
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="h-28 bg-sky-600 flex items-center px-8">
                <div className="bg-white/10 p-3.5 rounded-2xl backdrop-blur-md text-white mr-5">
                  <Package size={28} />
                </div>
                <div className="text-white flex-1 min-w-0">
                  <h2 className="text-2xl font-black truncate">{selectedOrder.customerName}</h2>
                  <p className="text-white/50 text-xs font-bold uppercase tracking-widest">{selectedOrder.code}</p>
                </div>
              </div>

              <div className="p-8 space-y-6">
                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Khách hàng</p>
                    <p className="text-lg font-bold">{selectedOrder.customerName || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Điện thoại</p>
                    <p className="text-lg font-bold">{selectedOrder.customerPhone || 'N/A'}</p>
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-1 border-l-4 border-sky-600 pl-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Địa chỉ giao hàng</p>
                  <p className="text-base font-medium text-slate-600">{selectedOrder.customerAddress || 'N/A'}</p>
                </div>

                {/* Order Info */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 rounded-2xl p-4 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Số cuộn</p>
                    <p className="text-2xl font-black text-slate-900">{selectedOrder.quantity || 0}</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Giá trị</p>
                    <p className="text-lg font-black text-sky-600">{formatCurrency(selectedOrder.totalRevenue)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Trạng thái</p>
                    <Badge className={cn("mt-1", getStatus(selectedOrder.status).color)}>
                      {getStatus(selectedOrder.status).label}
                    </Badge>
                  </div>
                </div>

                {/* Items */}
                {orderItems.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Sản phẩm</p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {orderItems.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between items-center bg-slate-50 rounded-xl px-4 py-2.5">
                          <span className="text-sm font-medium text-slate-700 truncate flex-1">{item.productName || item.name}</span>
                          <span className="text-sm font-bold text-slate-900 ml-2">{item.quantity} {item.unit || 'cuộn'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Note */}
                {selectedOrder.note && (
                  <div className="bg-yellow-50 rounded-2xl p-4 text-sm text-yellow-800">
                    <span className="font-bold">Ghi chú:</span> {selectedOrder.note}
                  </div>
                )}

                {/* Actions */}
                {selectedOrder.status === 'dang_giao' && !showFailDialog && (
                  <div className="space-y-3 pt-2">
                    {/* Upload proof */}
                    <Button
                      onClick={() => handleUploadProof(selectedOrder.id)}
                      variant="outline"
                      className="w-full h-14 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 font-bold gap-2"
                    >
                      <Camera size={20} /> Chụp ảnh chứng từ giao hàng
                    </Button>

                    <div className="flex gap-3">
                      <Button
                        className="flex-1 h-14 rounded-2xl text-base font-black bg-green-600 hover:bg-green-700 shadow-xl shadow-green-600/20"
                        onClick={() => handleCompleteDelivery(selectedOrder.id)}
                        disabled={actionLoading}
                      >
                        {actionLoading ? <Loader2 className="animate-spin mr-2" size={20} /> : <CheckCircle2 className="mr-2" size={20} />}
                        Giao thành công
                      </Button>

                      <Button
                        variant="outline"
                        className="h-14 px-5 rounded-2xl border-2 border-red-200 text-red-600 font-bold"
                        onClick={() => setShowFailDialog(true)}
                      >
                        <XCircle size={20} />
                      </Button>

                      {selectedOrder.customerPhone && (
                        <a href={`tel:${selectedOrder.customerPhone}`}>
                          <Button variant="outline" className="h-14 w-14 rounded-2xl border-2 shrink-0">
                            <Phone className="text-slate-600" size={20} />
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Fail Delivery Dialog */}
                {showFailDialog && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3 pt-2"
                  >
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertTriangle size={20} />
                      <p className="font-bold">Báo giao hàng thất bại</p>
                    </div>
                    <Input
                      placeholder="Lý do giao thất bại..."
                      value={failReason}
                      onChange={(e) => setFailReason(e.target.value)}
                      className="h-14 rounded-2xl text-base"
                    />
                    <div className="flex gap-3">
                      <Button
                        className="flex-1 h-14 rounded-2xl font-bold bg-red-600 hover:bg-red-700"
                        onClick={() => handleFailDelivery(selectedOrder.id)}
                        disabled={actionLoading}
                      >
                        {actionLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                        Xác nhận thất bại
                      </Button>
                      <Button
                        variant="outline"
                        className="h-14 rounded-2xl font-bold"
                        onClick={() => { setShowFailDialog(false); setFailReason(""); }}
                      >
                        Hủy
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
