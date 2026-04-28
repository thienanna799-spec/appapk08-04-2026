import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { api } from '@/lib/api';
import { Capacitor } from '@capacitor/core';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handle redirect result (for mobile WebView where popup is blocked)
  useEffect(() => {
    getRedirectResult(auth).then(async (result) => {
      if (result?.user) {
        await handleUserAfterAuth(result.user);
        navigate('/');
      }
    }).catch((error) => {
      console.error('Redirect result error:', error);
    });
  }, []);

  const handleUserAfterAuth = async (user: any) => {
    try {
      // Verify user via backend API (MySQL) — replaces Firestore getDoc/setDoc
      await api.request('/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ photoURL: user.photoURL }),
      });
      toast.success('Chào mừng trở lại!');
    } catch (error) {
      console.error('Auth verify error:', error);
      toast.error('Lỗi xác thực. Vui lòng thử lại.');
      await auth.signOut();
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // Detect if running inside Capacitor native app
      const isNative = Capacitor.isNativePlatform();
      
      if (isNative) {
        // Use redirect for mobile WebView (popup is blocked)
        await signInWithRedirect(auth, googleProvider);
        // After redirect, the useEffect above will handle the result
      } else {
        // Use popup for web browser (faster UX)
        const result = await signInWithPopup(auth, googleProvider);
        await handleUserAfterAuth(result.user);
        navigate('/');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      // If popup is blocked, fall back to redirect
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectError) {
          console.error('Redirect fallback error:', redirectError);
          toast.error('Đăng nhập thất bại. Vui lòng thử lại.');
        }
      } else {
        toast.error('Đăng nhập thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-slate-200 to-slate-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-none shadow-2xl bg-white/70 backdrop-blur-xl overflow-hidden">
          <div className="h-2 bg-sky-600" />
          <CardHeader className="text-center space-y-6 pb-12 pt-10">
            <div className="mx-auto bg-sky-600 text-white p-5 rounded-3xl w-fit shadow-2xl rotate-3">
              <LogIn size={40} />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-4xl font-extrabold tracking-tighter text-slate-900">DriverGo</CardTitle>
              <CardDescription className="text-slate-500 font-medium">
                Hệ thống quản trị vận tải thông minh
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pb-12 px-8">
            <Button 
              onClick={handleGoogleLogin} 
              disabled={loading}
              className="w-full h-16 text-lg font-bold bg-white text-slate-900 border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-400 transition-all rounded-2xl shadow-sm gap-4"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
              {loading ? 'Đang chuẩn bị...' : 'Tiếp tục với Google'}
            </Button>
            <div className="mt-10 flex items-center justify-center gap-4 opacity-30">
              <div className="h-px bg-sky-600 flex-1" />
              <p className="text-[10px] uppercase tracking-[0.3em] font-black text-slate-900">Driver Only</p>
              <div className="h-px bg-sky-600 flex-1" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
