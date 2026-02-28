import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Calendar, Music, Search, Bell, 
  Settings, LogOut, ShieldCheck, Menu, X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext'; // FIXED: Correct import path
import { UserRole } from '../types';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const adminNav = [
    { name: 'Admin Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Team Schedule', path: '/schedule', icon: Calendar },
    { name: 'Song Vault', path: '/admin-songs', icon: Music },
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

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Debug: Check if user data is loading
  if (!user) {
    return (
      <div className="flex h-screen bg-black text-white items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      {/* Sidebar - Fixed positioning with proper z-index */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          transition-all duration-300 ease-in-out
          border-r border-white/10 bg-[#050505] 
          flex flex-col h-full
          ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full lg:w-20 lg:translate-x-0'}
        `}
      >
        {/* Logo Section */}
        <div className="p-6 flex items-center justify-between min-h-[64px] shrink-0 border-b border-white/5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="min-w-[32px] w-8 h-8 bg-white flex items-center justify-center rounded shrink-0">
               <span className="text-black font-black text-xl italic leading-none">H</span>
            </div>
            <h1 className={`text-xl font-bold tracking-tighter text-white whitespace-nowrap transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 lg:opacity-0'}`}>
              HIMIG
            </h1>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="lg:hidden text-white/60 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-4 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => isMobile && setIsSidebarOpen(false)}
                className={`
                  flex items-center gap-4 px-3 py-3 rounded-xl transition-all group overflow-hidden
                  ${isActive 
                    ? 'bg-white text-black font-semibold shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <div className="shrink-0 w-5 flex justify-center">
                  <Icon size={20} />
                </div>
                <span className={`text-sm whitespace-nowrap transition-all duration-300 ${isSidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 w-0'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-white/10 shrink-0 space-y-2">
          <Link
            to="/settings"
            onClick={() => isMobile && setIsSidebarOpen(false)}
            className={`
              flex items-center gap-4 px-3 py-3 rounded-xl transition-all
              ${location.pathname === '/settings' 
                ? 'bg-white/10 text-white' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
              }
            `}
          >
            <Settings size={20} className="shrink-0" />
            <span className={`text-sm whitespace-nowrap transition-all duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
              Settings
            </span>
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 px-3 py-3 w-full text-white/60 hover:text-red-400 transition-colors rounded-xl hover:bg-red-400/5 group"
          >
            <LogOut size={20} className="shrink-0" />
            <span className={`text-sm whitespace-nowrap transition-all duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-black relative">
        {/* Header */}
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/50 backdrop-blur-md shrink-0 z-40">
           <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
                aria-label="Toggle Sidebar"
              >
                <Menu size={24} />
              </button>
              <div className="hidden sm:block">
                <h2 className="text-sm font-black uppercase tracking-widest text-white/30">
                  {user?.role === UserRole.ADMIN ? 'Administrator' : 'Musician'}
                </h2>
                <p className="text-[10px] text-white/20 uppercase tracking-widest">
                  {location.pathname === '/' ? 'Dashboard' : location.pathname.substring(1).replace(/-/g, ' ')}
                </p>
              </div>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none">{user?.name}</p>
                <p className="text-[9px] text-white/20 uppercase tracking-widest mt-1">
                  {user?.role === UserRole.ADMIN ? 'Admin Access' : 'Team Member'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center text-sm font-black italic shrink-0 shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                {user?.name?.charAt(0)}
              </div>
           </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;