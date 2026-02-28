import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Bell, CheckCircle2, Circle, AlertCircle, Info, Calendar } from 'lucide-react';

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const { notifications, markNotificationsRead, refreshData } = useData();

  // Auto-refresh notifications when page loads
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Filter notifications for current user
  const myNotifications = notifications.filter((n: any) => n.user_id === user?.id);

  console.log('Current user:', user?.id);
  console.log('All notifications:', notifications);
  console.log('My notifications:', myNotifications);

  const getIcon = (message: string) => {
    const msg = message.toLowerCase();
    if (msg.includes('accepted')) return <CheckCircle2 size={18} className="text-green-500" />;
    if (msg.includes('rejected')) return <AlertCircle size={18} className="text-red-500" />;
    if (msg.includes('assigned')) return <Calendar size={18} className="text-blue-500" />;
    return <Info size={18} className="text-white/40" />;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold italic tracking-tighter uppercase">Activity Feed</h1>
          <p className="text-white/40 mt-1 uppercase text-xs tracking-[0.2em]">
            {myNotifications.filter((n: any) => !n.read).length} unread notifications
          </p>
        </div>
        {myNotifications.some((n: any) => !n.read) && (
          <button 
            onClick={markNotificationsRead}
            className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 hover:text-white flex items-center gap-2 border border-white/10 px-6 py-3 rounded-full transition-all bg-white/5 hover:bg-white/10"
          >
            Mark All Read
          </button>
        )}
      </header>

      <div className="space-y-4">
        {myNotifications.length > 0 ? (
          myNotifications
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map((notif: any) => (
              <div 
                key={notif.id}
                className={`p-6 border-2 rounded-[2rem] transition-all flex items-start gap-6 relative overflow-hidden group ${
                  notif.read ? 'bg-black border-white/5 text-white/40 opacity-70' : 'bg-[#080808] border-white/10 text-white shadow-xl'
                }`}
              >
                {!notif.read && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-white"></div>}

                <div className={`shrink-0 p-4 rounded-3xl ${notif.read ? 'bg-white/5' : 'bg-white/10 group-hover:scale-110 transition-transform duration-500'}`}>
                  {getIcon(notif.message)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4 mb-2">
                     <p className="text-[10px] uppercase tracking-widest font-black text-white/20">
                       {new Date(notif.created_at).toLocaleDateString(undefined, { 
                         month: 'short', 
                         day: 'numeric', 
                         hour: '2-digit', 
                         minute: '2-digit' 
                       })}
                     </p>
                     {!notif.read && (
                       <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white/40">
                         <Circle className="fill-white text-white" size={6} /> New
                       </span>
                     )}
                  </div>
                  <p className={`text-lg font-bold leading-tight tracking-tight ${notif.read ? 'line-through decoration-white/10' : ''}`}>
                    {notif.message}
                  </p>
                </div>
              </div>
            ))
        ) : (
          <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center">
            <Bell className="text-white/5 mb-6" size={64} />
            <p className="text-white/20 italic text-lg">No notifications found.</p>
            <p className="text-white/10 text-[10px] uppercase tracking-widest mt-2">Check back later</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;