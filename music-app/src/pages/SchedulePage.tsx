
import React from 'react';
import { useAuth, useData } from '../App';
import { ScheduleStatus } from '../types';
import { Check, X, Calendar as CalendarIcon, Clock } from 'lucide-react';

/**
 * Utility to parse YYYY-MM-DD string as a local Date object at midnight
 */
const fromISODateString = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const SchedulePage: React.FC = () => {
  const { user } = useAuth();
  const { schedules, updateScheduleStatus } = useData();

  const mySchedules = schedules
    .filter(s => s.musician_id === user?.id)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold italic tracking-tighter">MINISTRY SCHEDULE</h1>
        <p className="text-white/40 mt-1 uppercase text-xs tracking-[0.2em]">Manage your upcoming service commitments</p>
      </header>

      <div className="grid gap-4">
        {mySchedules.map((item) => {
          const serviceDate = fromISODateString(item.date);
          return (
            <div 
              key={item.id} 
              className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-white/20 transition-colors"
            >
              <div className="flex items-center gap-6">
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center min-w-[80px]">
                  <p className="text-[10px] text-white/30 uppercase font-black">{serviceDate.toLocaleDateString('en-US', { month: 'short' })}</p>
                  <p className="text-3xl font-bold">{serviceDate.getDate()}</p>
                  <p className="text-[10px] text-white/30 uppercase mt-1">{serviceDate.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold">{item.role}</h3>
                  <div className="flex items-center gap-3 text-white/40 text-xs mt-1 italic">
                    <span className="flex items-center gap-1"><Clock size={12} /> 08:00 AM Call Time</span>
                    <span className="flex items-center gap-1"><CalendarIcon size={12} /> Sunday Service</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {item.status === ScheduleStatus.PENDING ? (
                  <>
                    <button 
                      onClick={() => updateScheduleStatus(item.id, ScheduleStatus.REJECTED)}
                      className="px-6 py-2.5 bg-transparent border border-white/10 text-white/60 hover:text-white hover:bg-white/5 rounded-full text-xs font-semibold transition-all"
                    >
                      Unable to Serve
                    </button>
                    <button 
                      onClick={() => updateScheduleStatus(item.id, ScheduleStatus.ACCEPTED)}
                      className="px-8 py-2.5 bg-white text-black hover:bg-white/90 rounded-full text-xs font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    >
                      Accept Duty
                    </button>
                  </>
                ) : (
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                    item.status === ScheduleStatus.ACCEPTED 
                      ? 'border-green-500/30 bg-green-500/5 text-green-500' 
                      : 'border-red-500/30 bg-red-500/5 text-red-500'
                  }`}>
                    {item.status === ScheduleStatus.ACCEPTED ? <Check size={14} /> : <X size={14} />}
                    <span className="text-xs font-bold uppercase tracking-widest">{item.status}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {mySchedules.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
            <p className="text-white/20 italic">No scheduled duties found. Check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchedulePage;
