import { auth } from '@/lib/firebase';
import { User, LogOut, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

import { Link } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  return (
    <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between safe-area-pt h-[calc(4rem+env(safe-area-inset-top))] shrink-0">
      {/* Desktop View */}
      <div className="hidden lg:block">
        <h2 className="font-semibold text-slate-500 text-sm uppercase tracking-wider">Hệ thống điều phối</h2>
      </div>
      
      {/* Mobile View Logo (Top Left) */}
      <Link to="/" className="lg:hidden flex items-center gap-2">
        <img 
          src="/gep-logo.png" 
          alt="GEP" 
          className="w-20 h-10 object-contain"
        />
      </Link>
      
      <div className="flex items-center gap-4 ml-auto">
        <Button variant="ghost" size="icon" className="relative text-slate-400">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </Button>
        
        <div className="flex items-center gap-3 pl-4 border-l">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold leading-none">{user?.displayName || 'Tài xế'}</p>
            <p className="text-[10px] text-slate-400 mt-1">{user?.email}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border">
            {user?.photoURL ? <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" /> : <User size={16} />}
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-red-500">
            <LogOut size={18} />
          </Button>
        </div>
      </div>
    </header>
  );
}
