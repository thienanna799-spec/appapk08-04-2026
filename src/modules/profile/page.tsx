import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  User, Mail, Phone, Car, CreditCard, MapPin, Shield, 
  LogOut, Save, Pencil, X, CheckCircle2, Clock
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { profileService, type UserProfile, type UpdateProfileData } from './profile.service';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  // Editable form state
  const [form, setForm] = useState<UpdateProfileData>({
    phone: '',
    vehicle_type: '',
    license_plate: '',
    working_area: '',
  });

  useEffect(() => {
    // Wait for Firebase auth to be ready before calling API
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadProfile(user);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadProfile = async (firebaseUser: any) => {
    try {
      console.log('[Profile] Loading profile for user:', firebaseUser.uid, firebaseUser.email);
      const data = await profileService.getProfile();
      console.log('[Profile] API response:', data);
      setProfile(data);
      setForm({
        phone: data.phone || '',
        vehicle_type: data.vehicle_type || '',
        license_plate: data.license_plate || '',
        working_area: data.working_area || '',
      });
    } catch (error: any) {
      console.error('[Profile] API call failed:', error?.message || error);
      // Fallback: use Firebase user data directly
      setProfile({
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || '',
        phone: null,
        photoURL: firebaseUser.photoURL || null,
        role: 'driver',
        status: 'active',
        isActive: true,
        vehicle_type: null,
        license_plate: null,
        working_area: null,
        last_login: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      toast.error('Kết nối API thất bại: ' + (error?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await profileService.updateProfile(form);
      setProfile(result.user);
      setEditing(false);
      toast.success('Cập nhật hồ sơ thành công!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Lỗi khi cập nhật hồ sơ');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      toast.error('Lỗi khi đăng xuất');
    }
  };

  const handleCancel = () => {
    if (profile) {
      setForm({
        phone: profile.phone || '',
        vehicle_type: profile.vehicle_type || '',
        license_plate: profile.license_plate || '',
        working_area: profile.working_area || '',
      });
    }
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="h-48 bg-slate-100 rounded-[2.5rem] animate-pulse" />
        <div className="h-64 bg-slate-100 rounded-[2.5rem] animate-pulse" />
        <div className="h-48 bg-slate-100 rounded-[2.5rem] animate-pulse" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 text-center text-slate-400">
        Không tìm thấy thông tin tài khoản
      </div>
    );
  }

  const roleLabels: Record<string, string> = {
    driver: 'Tài xế',
    admin: 'Quản trị viên',
    staff: 'Nhân viên',
    super_admin: 'Super Admin',
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Hồ sơ</h1>
        <p className="text-slate-500 font-medium">Quản lý thông tin tài khoản của bạn</p>
      </header>

      {/* Profile Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden">
          {/* Avatar Banner */}
          <div className="h-28 bg-gradient-to-r from-sky-600 to-blue-700 relative">
            <div className="absolute -bottom-10 left-8">
              <div className="w-20 h-20 rounded-2xl bg-white shadow-xl border-4 border-white overflow-hidden flex items-center justify-center">
                {profile.photoURL ? (
                  <img 
                    src={profile.photoURL} 
                    alt={profile.name || ''} 
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <User className="text-slate-400" size={36} />
                )}
              </div>
            </div>
            {/* Edit toggle */}
            <div className="absolute top-4 right-4">
              {!editing ? (
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl gap-1.5"
                  onClick={() => setEditing(true)}
                >
                  <Pencil size={14} /> Chỉnh sửa
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl gap-1.5"
                  onClick={handleCancel}
                >
                  <X size={14} /> Hủy
                </Button>
              )}
            </div>
          </div>

          <CardContent className="pt-14 pb-8 px-8 space-y-6">
            {/* Name & Role */}
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-900">{profile.name || 'Chưa đặt tên'}</h2>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-sky-600 bg-sky-50 px-3 py-1 rounded-full">
                  <Shield size={12} />
                  {roleLabels[profile.role] || profile.role}
                </span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                  profile.isActive 
                    ? 'text-green-600 bg-green-50' 
                    : 'text-red-600 bg-red-50'
                }`}>
                  <CheckCircle2 size={12} />
                  {profile.isActive ? 'Hoạt động' : 'Ngưng hoạt động'}
                </span>
              </div>
            </div>

            {/* Email — Read-only */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Mail size={12} /> Email
              </label>
              <div className="h-12 bg-slate-50 rounded-xl px-4 flex items-center text-slate-500 font-medium border border-slate-100">
                {profile.email}
              </div>
            </div>

            {/* Phone — Editable */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Phone size={12} /> Số điện thoại
              </label>
              {editing ? (
                <Input 
                  value={form.phone} 
                  onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="VD: 0901234567"
                  className="h-12 rounded-xl bg-white border-sky-200 focus:border-sky-500 font-medium"
                />
              ) : (
                <div className="h-12 bg-slate-50 rounded-xl px-4 flex items-center text-slate-700 font-medium border border-slate-100">
                  {profile.phone || <span className="text-slate-400 italic">Chưa cập nhật</span>}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Driver Info Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden">
          <div className="h-16 bg-slate-900 flex items-center px-8">
            <Car className="text-white mr-3" size={20} />
            <h3 className="text-white font-black text-sm uppercase tracking-widest">Thông tin phương tiện</h3>
          </div>

          <CardContent className="p-8 space-y-5">
            {/* Vehicle Type */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Car size={12} /> Loại xe
              </label>
              {editing ? (
                <Input 
                  value={form.vehicle_type} 
                  onChange={(e) => setForm(f => ({ ...f, vehicle_type: e.target.value }))}
                  placeholder="VD: Xe tải 1.5 tấn"
                  className="h-12 rounded-xl bg-white border-sky-200 focus:border-sky-500 font-medium"
                />
              ) : (
                <div className="h-12 bg-slate-50 rounded-xl px-4 flex items-center text-slate-700 font-medium border border-slate-100">
                  {profile.vehicle_type || <span className="text-slate-400 italic">Chưa cập nhật</span>}
                </div>
              )}
            </div>

            {/* License Plate */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <CreditCard size={12} /> Biển số xe
              </label>
              {editing ? (
                <Input 
                  value={form.license_plate} 
                  onChange={(e) => setForm(f => ({ ...f, license_plate: e.target.value }))}
                  placeholder="VD: 51A-12345"
                  className="h-12 rounded-xl bg-white border-sky-200 focus:border-sky-500 font-medium"
                />
              ) : (
                <div className="h-12 bg-slate-50 rounded-xl px-4 flex items-center text-slate-700 font-medium border border-slate-100">
                  {profile.license_plate || <span className="text-slate-400 italic">Chưa cập nhật</span>}
                </div>
              )}
            </div>

            {/* Working Area */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <MapPin size={12} /> Khu vực hoạt động
              </label>
              {editing ? (
                <Input 
                  value={form.working_area} 
                  onChange={(e) => setForm(f => ({ ...f, working_area: e.target.value }))}
                  placeholder="VD: Quận 1, Quận 3 - HCM"
                  className="h-12 rounded-xl bg-white border-sky-200 focus:border-sky-500 font-medium"
                />
              ) : (
                <div className="h-12 bg-slate-50 rounded-xl px-4 flex items-center text-slate-700 font-medium border border-slate-100">
                  {profile.working_area || <span className="text-slate-400 italic">Chưa cập nhật</span>}
                </div>
              )}
            </div>

            {/* Save Button */}
            {editing && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full h-14 rounded-2xl text-base font-black bg-sky-600 text-white shadow-xl shadow-sky-600/20 active:scale-95 transition-all"
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2" size={18} /> Lưu thay đổi
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Account Info Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock size={14} />
                <span>Đăng nhập lần cuối: {profile.last_login 
                  ? new Date(profile.last_login).toLocaleString('vi-VN') 
                  : 'N/A'
                }</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock size={14} />
                <span>Ngày tạo: {new Date(profile.createdAt).toLocaleString('vi-VN')}</span>
              </div>
            </div>

            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full h-14 rounded-2xl text-base font-bold text-red-500 border-2 border-red-100 hover:bg-red-50 hover:border-red-200 transition-all gap-2"
            >
              <LogOut size={18} /> Đăng xuất
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
