import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Camera as CameraIcon, Clock, MapPin, Play, Square, History, Image as ImageIcon } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { gpsService } from '@/lib/gps';
import { toast } from 'sonner';
import { sessionsService } from './services/sessions.service';
import { api } from '@/lib/api';
import { motion } from 'motion/react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export default function SessionsPage() {
  const [activeSession, setActiveSession] = useState<any>(null);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [km, setKm] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (auth.currentUser) {
          const [session, history] = await Promise.all([
            sessionsService.getActiveSession(auth.currentUser.uid),
            api.request('/driver/sessions').catch(() => []),
          ]);
          setActiveSession(session);
          setSessionHistory(Array.isArray(history) ? history : []);
        }
      } catch (error) {
        console.error("Failed to fetch session data:", error);
        toast.error("Không thể tải ca làm việc. Vui lòng thử lại.");
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleTakePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });
      if (image.dataUrl) {
        setPhotoUrl(image.dataUrl);
        toast.success('Đã chụp ảnh đồng hồ');
      }
    } catch (err) {
      console.warn('Camera action aborted or failed', err);
    }
  };

  const handleCheckIn = async () => {
    if (!km) return toast.error('Vui lòng nhập số KM hiện tại');
    setLoading(true);
    try {
      const pos = await gpsService.getCurrentPosition();
      await sessionsService.checkIn(auth.currentUser!.uid, Number(km), {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      });
      const session = await sessionsService.getActiveSession(auth.currentUser!.uid);
      setActiveSession(session);
      setKm('');
      setPhotoUrl(null);
      toast.success('Đã bắt đầu ca làm việc');
      gpsService.startTracking(false);
    } catch (error) {
      toast.error('Lỗi khi check-in');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!km) return toast.error('Vui lòng nhập số KM kết thúc');
    setLoading(true);
    try {
      const pos = await gpsService.getCurrentPosition();
      await sessionsService.checkOut(activeSession.id, Number(km), {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      });
      setActiveSession(null);
      setKm('');
      setPhotoUrl(null);
      toast.success('Đã kết thúc ca làm việc');
      gpsService.stopTracking();
      // Refresh history
      const history = await api.request('/driver/sessions').catch(() => []);
      setSessionHistory(Array.isArray(history) ? history : []);
    } catch (error) {
      toast.error('Lỗi khi check-out');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Hôm nay';
    if (days === 1) return 'Hôm qua';
    return `${days} ngày trước`;
  };

  if (initialLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Ca làm việc</h1>
        <p className="text-slate-500 font-medium">Báo cáo thời gian và lộ trình di chuyển</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
        >
          <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden">
            <div className={`h-24 flex items-center px-8 text-white ${activeSession ? 'bg-red-500' : 'bg-sky-600'}`}>
              <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md mr-4">
                {activeSession ? <Clock size={24} /> : <Play size={24} />}
              </div>
              <div>
                <h3 className="text-xl font-black">{activeSession ? 'Đang trong ca' : 'Bắt đầu ca mới'}</h3>
                <p className="text-white/50 text-xs font-bold uppercase tracking-widest">
                  {activeSession ? 'Ca làm việc đang diễn ra' : 'Sẵn sàng làm việc'}
                </p>
              </div>
            </div>

            <CardContent className="p-10 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Công tơ mét (km)</label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder={activeSession ? "KM kết thúc..." : "KM bắt đầu..."}
                      value={km}
                      onChange={(e) => setKm(e.target.value)}
                      className="h-16 text-2xl font-black bg-slate-50 border-none rounded-2xl pl-12"
                    />
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  </div>
                </div>

                {photoUrl ? (
                  <div className="relative rounded-2xl overflow-hidden h-32 border-2 border-slate-200">
                    <img src={photoUrl} alt="Odometer" className="w-full h-full object-cover" />
                    <Button 
                      onClick={handleTakePhoto}
                      className="absolute bottom-2 right-2 rounded-xl bg-black/50 backdrop-blur-md hover:bg-black/70 text-white" 
                      size="sm"
                    >
                      <CameraIcon size={16} className="mr-2" /> Chụp lại
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={handleTakePhoto}
                    variant="outline" 
                    className="w-full h-16 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-bold gap-2 hover:bg-slate-50"
                  >
                    <CameraIcon size={20} /> Chụp ảnh đồng hồ
                  </Button>
                )}
              </div>

              <Button
                onClick={activeSession ? handleCheckOut : handleCheckIn}
                disabled={loading}
                className={`w-full h-16 rounded-2xl text-lg font-black shadow-xl transition-all active:scale-95 ${
                  activeSession 
                    ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' 
                    : 'bg-sky-600 hover:bg-slate-800 shadow-sky-600/20'
                }`}
              >
                {loading ? 'Đang xử lý...' : activeSession ? 'Kết thúc ca' : 'Bắt đầu ca'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 uppercase tracking-widest text-xs">Thông tin hiện tại</h3>
            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">Online</div>
          </div>

          <div className="space-y-4">
            <div className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-slate-50 p-3 rounded-2xl text-slate-400">
                  <MapPin size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Vị trí GPS</p>
                  <p className="text-sm font-bold text-slate-900 truncate max-w-[150px]">Đang theo dõi...</p>
                </div>
              </div>
              <div className="flex gap-1">
                {[1,2,3].map(i => <div key={i} className="w-1 h-3 bg-slate-200 rounded-full animate-pulse" />)}
              </div>
            </div>

            <div className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-slate-50 p-3 rounded-2xl text-slate-400">
                  <History size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Hoạt động gần đây</p>
                  <p className="text-sm font-bold text-slate-900">Lịch sử ca làm việc</p>
                </div>
              </div>
              <div className="space-y-2">
                {sessionHistory.filter(s => s.checkOutTime).slice(0, 5).map((s, i) => (
                  <div key={s.id || i} className="flex items-center justify-between py-3 border-t border-slate-50">
                    <span className="text-xs text-slate-400 font-medium">{formatDate(s.checkInTime)}</span>
                    <span className="text-xs font-bold text-slate-900">
                      {s.endKm && s.startKm ? `+${(s.endKm - s.startKm).toFixed(1)} KM` : 'N/A'}
                    </span>
                  </div>
                ))}
                {sessionHistory.filter(s => s.checkOutTime).length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-3">Chưa có lịch sử</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
