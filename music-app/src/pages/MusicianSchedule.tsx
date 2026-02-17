
import React from 'react';
import { useAuth, useData } from '../App';
import { ScheduleStatus } from '../types';
import { Check, X, Calendar as CalendarIcon, Clock } from 'lucide-react';

const fromISODateString = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const MusicianSchedule: React.FC = () => {
  const { user } = useAuth();
  const { schedules, updateScheduleStatus } = useData();

  const mySchedules = schedules
    .filter(s => s.musicianId === user?.id)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-black italic tracking-tighter uppercase">My Commitments</h1>
        <p className="text-white/40 mt-1 uppercase text-xs tracking-[0.2em]">Manage your upcoming service availability</p>
      </header>

      <div className="grid gap-4">
        {mySchedules.map((item) => {
          const serviceDate = fromISODateString(item.date);
          return (
            <div 
              key={item.id} 
              className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-white/20 transition-all group"
            >
              <div className="flex items-center gap-8">
                <div className="bg-white/5 border border-white/10 p-5 rounded-3xl text-center min-w-[90px] group-hover:bg-white group-hover:text-black transition-all">
                  <p className="text-[10px] uppercase font-black opacity-50">{serviceDate.toLocaleDateString('en-US', { month: 'short' })}</p>
                  <p className="text-4xl font-black italic">{serviceDate.getDate()}</p>
                </div>
                <div>
                  <h3 className="text-xl font-bold">{item.role}</h3>
                  <div className="flex items-center gap-4 text-white/30 text-[10px] font-black uppercase tracking-widest mt-2">
                    <span className="flex items-center gap-1.5"><Clock size={12} /> 08:00 Call</span>
                    <span className="flex items-center gap-1.5"><CalendarIcon size={12} /> Sunday Service</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {item.status === ScheduleStatus.PENDING ? (
                  <>
                    <button 
                      onClick={() => updateScheduleStatus(item.id, ScheduleStatus.REJECTED)}
                      className="px-8 py-3 bg-white/5 border border-white/10 text-white/60 hover:text-red-400 hover:border-red-400/20 rounded-full text-xs font-black uppercase tracking-widest transition-all"
                    >
                      Decline
                    </button>
                    <button 
                      onClick={() => updateScheduleStatus(item.id, ScheduleStatus.ACCEPTED)}
                      className="px-10 py-3 bg-white text-black hover:scale-105 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    >
                      Accept
                    </button>
                  </>
                ) : (
                  <div className={`flex items-center gap-3 px-6 py-2.5 rounded-full border ${
                    item.status === ScheduleStatus.ACCEPTED 
                      ? 'border-green-500/30 bg-green-500/5 text-green-500' 
                      : 'border-red-500/30 bg-red-500/5 text-red-500'
                  }`}>
                    {item.status === ScheduleStatus.ACCEPTED ? <Check size={14} /> : <X size={14} />}
                    <span className="text-[10px] font-black uppercase tracking-widest">{item.status}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {mySchedules.length === 0 && (
          <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
            <p className="text-white/10 italic text-xl">No commitments scheduled.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MusicianSchedule;
