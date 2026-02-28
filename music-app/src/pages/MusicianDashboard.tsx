import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { ScheduleStatus, Schedule } from '../types';
import { Calendar as CalendarIcon, Music, ChevronRight, Search, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const toISODateString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const fromISODateString = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const MusicianDashboard: React.FC = () => {
  const { user } = useAuth();
  const { schedules } = useData();
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const mySchedules = useMemo(() => 
    schedules.filter((s: Schedule) => s.musician_id === user?.id && s.status !== ScheduleStatus.REJECTED),
    [schedules, user?.id]
  );

  const upcomingDuties = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return mySchedules.filter((s: Schedule) => {
      const scheduleDate = fromISODateString(s.date);
      return scheduleDate.getTime() >= today.getTime();
    }).sort((a: Schedule, b: Schedule) => a.date.localeCompare(b.date));
  }, [mySchedules]);

  const upcomingCount = upcomingDuties.length;
  const nextDuty = upcomingDuties[0];

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    
    const calendarDays = [];
    for (let i = 0; i < firstDay; i++) calendarDays.push(null);
    for (let i = 1; i <= days; i++) calendarDays.push(new Date(year, month, i));
    return calendarDays;
  }, [currentMonth]);

  const changeMonth = (offset: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  const getScheduleForDate = (date: Date): Schedule | undefined => {
    const dateStr = toISODateString(date);
    return mySchedules.find((s: Schedule) => s.date === dateStr);
  };

  return (
    <div className="space-y-8 md:space-y-10">
      <header>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase italic">Welcome, {user?.name.split(' ')[0]}</h1>
        <p className="text-white/40 mt-1 text-sm md:text-base italic">"Serve the Lord with gladness; come before Him with joyful songs."</p>
      </header>

      <div className="max-w-md">
        <button 
          onClick={() => setShowCalendar(!showCalendar)}
          className={`w-full text-left bg-[#0a0a0a] border p-8 rounded-[2.5rem] transition-all group relative overflow-hidden ${showCalendar ? 'border-white ring-1 ring-white/20' : 'border-white/10 hover:border-white/30'}`}
        >
          {upcomingCount > 0 && (
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl -mr-16 -mt-16 rounded-full group-hover:bg-white/10 transition-all"></div>
          )}
          <div className="flex items-center justify-between mb-8">
             <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-white group-hover:text-black transition-all">
               <CalendarIcon size={24} />
             </div>
             <div className="flex items-center gap-2">
               <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Sync Live</span>
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
             </div>
          </div>
          <div className="flex items-end justify-between relative z-10">
            <div>
              <div className="flex items-baseline gap-2">
                <p className="text-6xl font-black italic tracking-tighter">{upcomingCount}</p>
                <p className="text-xs text-white/40 uppercase font-bold tracking-widest pb-1">Duties</p>
              </div>
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

      {showCalendar && (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 animate-in fade-in slide-in-from-top-4 duration-500 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="font-black italic uppercase tracking-[0.2em] flex items-center gap-2">
                <CalendarIcon size={18} className="text-white/40" /> Performance Roadmap
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
          <div className="grid grid-cols-7 gap-3">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className={`text-center text-[10px] font-black py-2 text-white/20`}>{day}</div>
            ))}
            {daysInMonth.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} className="aspect-square" />;
              const schedule = getScheduleForDate(date);
              const isSunday = date.getDay() === 0;
              return (
                <div 
                  key={i} 
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl border transition-all ${
                    schedule ? 'bg-white text-black border-white shadow-xl scale-[1.02]' : 
                    isSunday ? 'border-white/10 bg-white/[0.03]' : 'border-transparent text-white/20 hover:border-white/10'
                  }`}
                >
                  <span className="text-sm font-black">{date.getDate()}</span>
                  {schedule && <span className="text-[7px] uppercase font-black text-black/60 hidden sm:block mt-1">{schedule.role}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-black italic text-sm tracking-widest uppercase flex items-center gap-2">
              <CalendarIcon size={16} className="text-white/20" /> Assigned Duties
            </h3>
            <Link to="/schedule" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">Manage All</Link>
          </div>
          <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden">
            {mySchedules.length > 0 ? (
              <div className="divide-y divide-white/5">
                {mySchedules.slice(0, 4).map((s: Schedule) => (
                  <div key={s.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-all group">
                    <div className="flex items-center gap-6">
                      <div className="text-center w-10">
                         <p className="text-[10px] text-white/20 uppercase font-black">{fromISODateString(s.date).toLocaleDateString('en-US', { month: 'short' })}</p>
                         <p className="text-2xl font-black italic">{fromISODateString(s.date).getDate()}</p>
                      </div>
                      <div className="h-10 w-px bg-white/10" />
                      <div>
                        <p className="font-bold text-lg">{s.role}</p>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest font-black mt-0.5">Sanctuary Service</p>
                      </div>
                    </div>
                    <span className={`text-[9px] px-3 py-1.5 rounded-full uppercase font-black tracking-widest border ${
                      s.status === ScheduleStatus.ACCEPTED ? 'border-green-500/20 text-green-500 bg-green-500/5' : 'border-yellow-500/20 text-yellow-500 bg-yellow-500/5'
                    }`}>
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-20 text-center text-white/20 italic">No assignments.</div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-black italic text-sm tracking-widest uppercase px-2 flex items-center gap-2">
             <Music size={16} className="text-white/20" /> Musician Tools
          </h3>
          <div className="grid gap-3">
             {[
               { name: 'Browse Setlists', icon: Music, path: '/setlist' },
               { name: 'Search Library', icon: Search, path: '/search' },
             ].map((action, i) => (
               <Link key={i} to={action.path} className="flex items-center gap-4 p-6 bg-[#0a0a0a] border border-white/10 rounded-[2rem] hover:border-white transition-all group">
                 <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-white group-hover:text-black transition-all"><action.icon size={20} /></div>
                 <p className="text-sm font-black uppercase tracking-widest">{action.name}</p>
               </Link>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicianDashboard;