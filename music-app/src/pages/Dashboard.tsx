
import React, { useState, useMemo } from 'react';
import { useAuth, useData } from '../App';
import { ScheduleStatus, Schedule } from '../types';
import { Calendar as CalendarIcon, Music, ChevronRight, Search, ChevronLeft, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Utility to convert a local Date object to YYYY-MM-DD string without timezone shifts
 */
const toISODateString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Utility to parse YYYY-MM-DD string as a local Date object at midnight
 */
const fromISODateString = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { schedules } = useData();
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get all schedules for the current user that aren't rejected
  const mySchedules = useMemo(() => 
    schedules.filter(s => s.musician_id === user?.id && s.status !== ScheduleStatus.REJECTED),
    [schedules, user?.id]
  );

  // Future duties only - using local midnight comparison
  const upcomingDuties = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return mySchedules.filter(s => {
      const scheduleDate = fromISODateString(s.date);
      return scheduleDate.getTime() >= today.getTime();
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [mySchedules]);

  const upcomingCount = upcomingDuties.length;
  const nextDuty = upcomingDuties[0];

  // Calendar Logic
  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    
    const calendarDays = [];
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(null);
    }
    for (let i = 1; i <= days; i++) {
      calendarDays.push(new Date(year, month, i));
    }
    return calendarDays;
  }, [currentMonth]);

  const changeMonth = (offset: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  const getScheduleForDate = (date: Date): Schedule | undefined => {
    const dateStr = toISODateString(date);
    return mySchedules.find(s => s.date === dateStr);
  };

  return (
    <div className="space-y-8 md:space-y-10">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Welcome, {user?.name.split(' ')[0]}</h1>
        <p className="text-white/40 mt-1 text-sm md:text-base italic">"Serve the Lord with gladness; come before Him with joyful songs."</p>
      </header>

      {/* Main Stat Card - Interactive Sync with Schedule */}
      <div className="max-w-md">
        <button 
          onClick={() => setShowCalendar(!showCalendar)}
          className={`w-full text-left bg-[#0a0a0a] border p-6 rounded-3xl transition-all group relative overflow-hidden ${showCalendar ? 'border-white ring-1 ring-white/20' : 'border-white/10 hover:border-white/30'}`}
        >
          {upcomingCount > 0 && (
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl -mr-16 -mt-16 rounded-full group-hover:bg-white/10 transition-all"></div>
          )}

          <div className="flex items-center justify-between mb-8">
             <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-white group-hover:text-black transition-all">
               <CalendarIcon size={24} />
             </div>
             <div className="flex items-center gap-2">
               <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Live Sync</span>
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
             </div>
          </div>
          
          <div className="flex items-end justify-between relative z-10">
            <div>
              <div className="flex items-baseline gap-2">
                <p className="text-6xl font-black italic tracking-tighter transition-transform group-active:scale-95">{upcomingCount}</p>
                <p className="text-xs text-white/40 uppercase font-bold tracking-widest pb-1">Total</p>
              </div>
              <p className="text-xs text-white uppercase font-bold tracking-widest mt-2">Upcoming Duties</p>
              
              {nextDuty && (
                <div className="mt-4 flex flex-col gap-1 border-l border-white/20 pl-4 py-1">
                  <p className="text-[10px] uppercase tracking-widest text-white/40 font-black">Next Service</p>
                  <p className="text-sm font-bold">
                    {fromISODateString(nextDuty.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {nextDuty.role}
                  </p>
                </div>
              )}
            </div>
            
            <div className={`p-2 rounded-full border border-white/10 transition-all ${showCalendar ? 'rotate-90 bg-white text-black scale-110' : 'group-hover:translate-x-1'}`}>
              <ChevronRight size={24} />
            </div>
          </div>
        </button>
      </div>

      {/* Expandable Calendar View */}
      {showCalendar && (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 md:p-8 animate-in fade-in slide-in-from-top-4 duration-500 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="font-black italic uppercase tracking-[0.2em] flex items-center gap-2">
                <CalendarIcon size={18} className="text-white/40" />
                Service Roadmap
              </h3>
              <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest mt-1">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => changeMonth(-1)} className="p-2.5 hover:bg-white hover:text-black rounded-xl transition-all border border-white/5"><ChevronLeft size={18} /></button>
              <button onClick={() => changeMonth(1)} className="p-2.5 hover:bg-white hover:text-black rounded-xl transition-all border border-white/5"><ChevronRight size={18} /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 md:gap-4">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className={`text-center text-[10px] font-black py-2 ${i === 0 ? 'text-red-500/40' : 'text-white/20'}`}>{day}</div>
            ))}
            {daysInMonth.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} className="aspect-square" />;
              
              const schedule = getScheduleForDate(date);
              const isToday = new Date().toDateString() === date.toDateString();
              const isSunday = date.getDay() === 0;

              return (
                <div 
                  key={i} 
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl border transition-all duration-300 group/day ${
                    schedule 
                      ? 'bg-white text-black border-white shadow-[0_0_25px_rgba(255,255,255,0.15)] scale-[1.02]' 
                      : isToday 
                        ? 'border-white/40 text-white' 
                        : isSunday 
                          ? 'border-white/10 text-white/60 bg-white/[0.03]' 
                          : 'border-transparent text-white/20 hover:border-white/10'
                  }`}
                >
                  <span className={`text-sm font-black ${schedule ? 'mb-1' : ''}`}>{date.getDate()}</span>
                  
                  {schedule && (
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="w-1 h-1 bg-black rounded-full" />
                      <span className="text-[7px] uppercase font-black tracking-tighter text-black/60 hidden sm:block">
                        {schedule.role}
                      </span>
                    </div>
                  )}

                  {schedule && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest opacity-0 pointer-events-none group-hover/day:opacity-100 transition-opacity z-20 whitespace-nowrap shadow-xl">
                      {schedule.role}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-10 pt-8 border-t border-white/5 flex flex-wrap gap-x-8 gap-y-4">
             <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-white rounded-lg shadow-[0_0_8px_white]"></div>
                <p className="text-[10px] uppercase font-black tracking-widest text-white/40">Assigned Duty</p>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-4 h-4 border border-white/20 rounded-lg"></div>
                <p className="text-[10px] uppercase font-black tracking-widest text-white/40">Today</p>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-white/[0.03] border border-white/10 rounded-lg"></div>
                <p className="text-[10px] uppercase font-black tracking-widest text-white/40">Lord's Day (Sunday)</p>
             </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold flex items-center gap-2 italic text-sm tracking-widest">
              <CalendarIcon size={16} /> SERVICE LOG
            </h3>
            <Link to="/schedule" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white flex items-center gap-1 transition-colors">
              Manage All <ChevronRight size={12} />
            </Link>
          </div>
          <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-sm">
            {mySchedules.length > 0 ? (
              <div className="divide-y divide-white/5">
                {mySchedules.slice(0, 3).map((s) => (
                  <div key={s.id} className="p-5 md:p-6 flex items-center justify-between hover:bg-white/[0.02] transition-all group/item">
                    <div className="flex items-center gap-4 md:gap-6">
                      <div className="text-center w-10 md:w-12 shrink-0">
                         <p className="text-[10px] text-white/40 uppercase font-black">
                           {fromISODateString(s.date).toLocaleDateString('en-US', { month: 'short' })}
                         </p>
                         <p className="text-2xl font-black italic group-hover/item:scale-110 transition-transform">
                           {fromISODateString(s.date).getDate()}
                         </p>
                      </div>
                      <div className="h-10 w-px bg-white/10 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-base truncate">{s.role}</p>
                        <div className="flex items-center gap-1 text-[10px] text-white/30 uppercase tracking-widest font-bold mt-0.5">
                           <MapPin size={10} /> Sanctuary • 08:30 AM
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 ml-4 flex items-center gap-3">
                      <span className={`text-[9px] px-3 py-1 rounded-full uppercase font-black tracking-widest border ${
                        s.status === ScheduleStatus.ACCEPTED ? 'border-green-500/30 text-green-500 bg-green-500/5 shadow-[0_0_10px_rgba(34,197,94,0.1)]' : 
                        s.status === ScheduleStatus.PENDING ? 'border-yellow-500/30 text-yellow-500 bg-yellow-500/5' : 
                        'border-red-500/30 text-red-500 bg-red-500/5'
                      }`}>
                        {s.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-16 text-center text-white/20 flex flex-col items-center gap-4">
                <CalendarIcon size={32} className="opacity-10" />
                <p className="italic text-sm">No assignments on record.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold flex items-center gap-2 italic px-2 text-sm tracking-widest uppercase">
             MINISTRY TOOLS
          </h3>
          <div className="space-y-3">
             {[
               { name: 'Browse Setlists', desc: 'Current Sunday repertoire', icon: Music, path: '/setlist' },
               { name: 'Search Music', desc: 'Transpose and learn', icon: Search, path: '/search' },
             ].map((action, i) => (
               <Link 
                key={i} 
                to={action.path}
                className="flex items-center gap-4 p-5 bg-[#0a0a0a] border border-white/10 rounded-3xl hover:border-white hover:bg-white/5 transition-all group"
               >
                 <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-black group-hover:text-white transition-all shrink-0">
                    <action.icon size={20} />
                 </div>
                 <div className="min-w-0">
                   <p className="text-sm font-bold truncate group-hover:translate-x-1 transition-transform">{action.name}</p>
                   <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold truncate mt-0.5">{action.desc}</p>
                 </div>
               </Link>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
