import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Calendar, Music, Search, Bell, 
  Settings, LogOut, Menu, X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Start closed on all devices
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // Only auto-open on desktop, keep closed on mobile
      if (!mobile) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Toggle sidebar with proper mobile handling
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  // Close sidebar (for mobile)
  const closeSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  // Different nav items for admin vs musician
  const getNavItems = () => {
    const isAdmin = user?.role === UserRole.ADMIN;
    
    const commonItems = [
      { name: isAdmin ? 'Admin Dashboard' : 'My Dashboard', path: isAdmin ? '/admin' : '/dashboard', icon: LayoutDashboard },
      { name: 'Schedule', path: '/schedule', icon: Calendar },
      { name: 'Setlists', path: '/setlist', icon: Music },
      { name: 'Search', path: '/search', icon: Search },
      { name: 'Notifications', path: '/notifications', icon: Bell },
    ];

    if (isAdmin) {
      return [
        ...commonItems,
        { name: 'Admin Panel', path: '/admin/panel', icon: LayoutDashboard },
        { name: 'Song Vault', path: '/admin/songs', icon: Music },
      ];
    }
    
    return commonItems;
  };

  const navItems = getNavItems();

  if (!user) {
    return (
      <div className="flex h-screen bg-black text-white items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden relative">
      {/* Mobile Overlay - Click to close */}
      {isSidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeSidebar}
          style={{ touchAction: 'none' }} // Prevent scrolling when overlay is open
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          transition-transform duration-300 ease-in-out
          border-r border-white/10 bg-[#050505] 
          flex flex-col h-full w-64
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Logo Section */}
        <div className="p-6 flex items-center justify-between min-h-[80px] shrink-0 border-b border-white/5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="min-w-[40px] w-10 h-10 bg-white flex items-center justify-center rounded-xl shrink-0">
               <span className="text-black font-black text-2xl italic leading-none">H</span>
            </div>
            <h1 className="text-xl font-black tracking-tighter text-white whitespace-nowrap">
              HIMIG
            </h1>
          </div>
          {/* Close button - visible on mobile when open */}
          <button 
            onClick={closeSidebar}
            className="lg:hidden text-white/60 hover:text-white p-2 hover:bg-white/10 rounded-lg"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-6 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeSidebar} // Close on mobile when clicking a link
                className={`
                  flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group
                  ${isActive 
                    ? 'bg-white text-black font-bold shadow-lg' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <div className="shrink-0 w-6 flex justify-center">
                  <Icon size={22} />
                </div>
                <span className="text-sm font-medium whitespace-nowrap">
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
            onClick={closeSidebar}
            className={`
              flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all
              ${location.pathname === '/settings' 
                ? 'bg-white/10 text-white' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
              }
            `}
          >
            <Settings size={22} className="shrink-0" />
            <span className="text-sm font-medium whitespace-nowrap">
              Settings
            </span>
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3.5 w-full text-white/60 hover:text-red-400 transition-colors rounded-xl hover:bg-red-400/10 group text-left"
          >
            <LogOut size={22} className="shrink-0" />
            <span className="text-sm font-medium whitespace-nowrap">
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-black relative overflow-hidden">
        {/* Header */}
        <header className="h-16 lg:h-20 border-b border-white/10 flex items-center justify-between px-4 lg:px-8 bg-black/50 backdrop-blur-md shrink-0 z-30">
           <div className="flex items-center gap-4">
              {/* Hamburger Button - Fixed click handler */}
              <button 
                onClick={toggleSidebar}
                className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg lg:hidden"
                aria-label="Toggle menu"
                type="button"
              >
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              
              {/* Desktop toggle (optional) */}
              <button 
                onClick={toggleSidebar}
                className="hidden lg:block text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                aria-label="Toggle sidebar"
              >
                <Menu size={24} />
              </button>

              <div className="hidden sm:block">
                <h2 className="text-xs font-black uppercase tracking-widest text-white/40">
                  {user?.role === UserRole.ADMIN ? 'Administrator' : 'Musician'}
                </h2>
                <p className="text-sm font-bold text-white capitalize">
                  {location.pathname === '/dashboard' || location.pathname === '/admin' 
                    ? 'Dashboard' 
                    : location.pathname.split('/').pop()?.replace(/-/g, ' ')}
                </p>
              </div>
           </div>
           
           <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none">{user?.name}</p>
                <p className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">
                  {user?.role === UserRole.ADMIN ? 'Admin Access' : 'Team Member'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white to-white/70 text-black flex items-center justify-center text-sm font-black italic shrink-0 shadow-lg">
                {user?.name?.charAt(0)}
              </div>
           </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-black">
          <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;