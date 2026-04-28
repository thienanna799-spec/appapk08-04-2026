import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Signal, SignalHigh, WifiOff } from 'lucide-react';
import { gpsService } from '@/lib/gps';
import { motion } from 'motion/react';

export default function GPSPage() {
  const [gpsStatus, setGpsStatus] = useState<'tracking' | 'idle' | 'off'>('idle');
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const pos = await gpsService.getCurrentPosition();
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      } catch (e) {
        console.error("No GPS access");
      }
    };
    init();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Định vị GPS</h1>
        <p className="text-slate-500 font-medium">Trạng thái kết nối và vị trí thiết bị</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="border-none shadow-xl bg-sky-600 rounded-[2.5rem] overflow-hidden text-white">
            <CardContent className="p-10 space-y-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Trạng thái cảm biến</p>
                  <h3 className="text-2xl font-black text-green-400 flex items-center gap-2">
                    <SignalHigh size={24} /> Hoạt động tốt
                  </h3>
                </div>
                <div className="w-16 h-16 rounded-3xl bg-slate-800 flex items-center justify-center">
                  <Navigation className="text-white fill-white/20" size={32} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-400">Độ chính xác</span>
                  <span className="font-mono text-green-400">± 4.5m</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-400">Tần suất làm mới</span>
                  <span className="font-mono text-white">20s / lần</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden h-full">
            <CardContent className="p-10 space-y-8 flex flex-col h-full justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Tọa độ hiện tại</p>
                {location ? (
                  <div className="space-y-2">
                    <p className="font-mono text-lg font-medium text-slate-900 bg-slate-50 p-4 rounded-2xl">
                      LAT: {location.lat.toFixed(6)}
                    </p>
                    <p className="font-mono text-lg font-medium text-slate-900 bg-slate-50 p-4 rounded-2xl">
                      LNG: {location.lng.toFixed(6)}
                    </p>
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-2">
                    <MapPin size={24} />
                    <span className="text-sm font-bold">Đang tải tọa độ...</span>
                  </div>
                )}
              </div>
              
              <Button variant="outline" className="w-full h-16 rounded-2xl border-2 font-bold text-slate-500 gap-2">
                 Cập nhật vị trí thủ công
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
