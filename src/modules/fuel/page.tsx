import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Camera, Fuel as FuelIcon, Receipt, Video } from 'lucide-react';
import { gpsService } from '@/lib/gps';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export default function FuelPage() {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');

  const handleSubmit = async () => {
    if (!amount) return toast.error('Vui lòng nhập số tiền');
    setLoading(true);

    try {
      const pos = await gpsService.getCurrentPosition();
      
      await api.request('/driver/fuel', {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(amount),
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      });

      toast.success('Gửi báo cáo đổ xăng thành công');
      setAmount('');
    } catch (error) {
      toast.error('Lỗi khi gửi báo cáo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Nhiên liệu</h1>
        <p className="text-slate-500 font-medium">Báo cáo chi phí đổ xăng</p>
      </header>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden">
          <div className="h-24 bg-amber-500 flex items-center px-8 text-white">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md mr-4">
              <FuelIcon size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black">Báo cáo mới</h3>
              <p className="text-white/80 text-xs font-bold uppercase tracking-widest">
                Ghi nhận chi phí xăng xe
              </p>
            </div>
          </div>

          <CardContent className="p-10 space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Số tiền (VNĐ)</label>
              <Input
                type="number"
                placeholder="VD: 500000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-16 text-2xl font-black bg-slate-50 border-none rounded-2xl px-6"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-16 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 font-bold gap-2">
                <Receipt className="text-amber-500" /> Chụp hóa đơn
              </Button>
              <Button variant="outline" className="h-16 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 font-bold gap-2">
                <Video className="text-amber-500" /> Quay video
              </Button>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full h-16 rounded-2xl text-lg font-black bg-sky-600 text-white shadow-xl shadow-sky-600/20 active:scale-95 transition-all"
            >
              {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
