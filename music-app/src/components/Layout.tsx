
import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Music, 
  Search, 
  Bell, 
  Settings, 
  LogOut,
  ShieldCheck,
  Menu,
  X,
  PlusCircle,
  Users
} from 'lucide-react';
import { useAuth } from '../App';
import { UserRole } from '../types';
const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Define navigation based on role
  const adminNav = [
    { name: 'Admin Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Team Schedule', path: '/schedule', icon: Calendar },
    { name: 'Song Vault', path: '/admin-songs', icon: PlusCircle },
    { name: 'Setlists', path: '/setlist', icon: Music },
    { name: 'Global Search', path: '/search', icon: Search },
    { name: 'Admin Feed', path: '/notifications', icon: Bell },
  ];

  const musicianNav = [
    { name: 'My Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'My Schedule', path: '/schedule', icon: Calendar },
    { name: 'Setlist Hub', path: '/setlist', icon: Music },
    { name: 'Search Library', path: '/search', icon: Search },
    { name: 'Notifications', path: '/notifications', icon: Bell },
  ];

  const navItems = user?.role === UserRole.ADMIN ? adminNav : musicianNav;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden relative">
      <aside 
        className={`
          ${isSidebarOpen ? 'w-64' : 'w-20'} 
          transition-all duration-300 ease-in-out border-r border-white/10 bg-[#050505] 
          flex flex-col h-full z-50 
          fixed lg:relative
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-6 flex items-center justify-between min-h-[64px] shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="min-w-[32px] w-8 h-8 bg-white flex items-center justify-center rounded shrink-0">
               <span className="text-black font-black text-xl italic leading-none">H</span>
            </div>
            <h1 className={`text-xl font-bold tracking-tighter text-white transition-all duration-150 whitespace-nowrap ${isSidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none hidden lg:block'}`}>
              {isSidebarOpen ? 'HIMIG' : ''}
            </h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-white/60">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 mt-4 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-3 py-3 rounded-lg transition-all group overflow-hidden ${
                  isActive 
                    ? 'bg-white text-black font-semibold shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="shrink-0">
                  <Icon size={20} />
                </div>
                <span className={`text-sm whitespace-nowrap transition-all duration-150 ${isSidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}>
                  {isSidebarOpen ? item.name : ''}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 shrink-0 space-y-2">
          <Link
            to="/settings"
            className={`flex items-center gap-4 px-3 py-3 rounded-lg transition-all text-white/60 hover:text-white hover:bg-white/5 ${location.pathname === '/settings' ? 'bg-white/5 text-white' : ''}`}
          >
            <Settings size={20} />
            <span className={`text-sm whitespace-nowrap transition-all duration-150 ${isSidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}>
              {isSidebarOpen ? 'Settings' : ''}
            </span>
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 px-3 py-3 w-full text-white/60 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/5 group overflow-hidden"
          >
            <div className="shrink-0">
              <LogOut size={20} />
            </div>
            <span className={`text-sm whitespace-nowrap transition-all duration-150 ${isSidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}>
              {isSidebarOpen ? 'Logout' : ''}
            </span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full min-w-0 bg-black">
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/50 backdrop-blur-md shrink-0 z-40">
           <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                className="text-white/60 hover:text-white transition-colors"
                aria-label="Toggle Sidebar"
              >
                <Menu size={24} />
              </button>
              <h2 className="text-sm font-black uppercase tracking-widest text-white/30 hidden sm:block">
                {user?.role === UserRole.ADMIN ? 'Administrator' : 'Musician'} • {location.pathname === '/' ? 'Home' : location.pathname.substring(1).replace('-', ' ')}
              </h2>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none">{user?.name}</p>
                <p className="text-[9px] text-white/20 uppercase tracking-widest mt-1">Himig Hub</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center text-sm font-black italic shrink-0 shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                {user?.name.charAt(0)}
              </div>
           </div>
        </header>
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      <div 
        className={`lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setIsSidebarOpen(false)}
      />
    </div>
  );
};

export default Layout;
