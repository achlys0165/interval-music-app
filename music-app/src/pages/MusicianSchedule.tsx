import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { ScheduleStatus, Schedule } from '../types';
import { Check, X, Calendar as CalendarIcon, Clock, Music, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const fromISODateString = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const MusicianSchedule: React.FC = () => {
  const { user } = useAuth();
  const { schedules, updateScheduleStatus } = useData();
  const navigate = useNavigate();
  const [declineModal, setDeclineModal] = useState<{ open: boolean; scheduleId: string | null }>({
    open: false,
    scheduleId: null
  });
  const [declineReason, setDeclineReason] = useState('');

  const mySchedules = schedules
    .filter((s: Schedule) => s.musician_id === user?.id)
    .sort((a: Schedule, b: Schedule) => a.date.localeCompare(b.date));

  const handleDecline = async () => {
    if (!declineModal.scheduleId || !declineReason.trim()) return;
    
    try {
      await updateScheduleStatus(declineModal.scheduleId, ScheduleStatus.REJECTED, declineReason);
      setDeclineModal({ open: false, scheduleId: null });
      setDeclineReason('');
    } catch (error) {
      console.error('Error declining schedule:', error);
    }
  };

  const handleViewSetlist = (date: string) => {
    navigate(`/setlist?date=${date}`);
  };

  return (
    <div className="space-y-10 max-w-4xl mx-auto px-4">
      <header>
        <h1 className="text-3xl font-black italic tracking-tighter uppercase">My Commitments</h1>
        <p className="text-white/40 mt-1 uppercase text-xs tracking-[0.2em]">Manage your upcoming service availability</p>
      </header>

      <div className="grid gap-4">
        {mySchedules.map((item: Schedule) => {
          const serviceDate = fromISODateString(item.date);
          const isPast = serviceDate < new Date();
          
          return (
            <div 
              key={item.id} 
              onClick={() => !isPast && handleViewSetlist(item.date)}
              className={`bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-white/20 transition-all group ${!isPast ? 'cursor-pointer' : 'opacity-60'}`}
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
                  {!isPast && (
                    <p className="text-[10px] text-white/40 mt-2 flex items-center gap-1 group-hover:text-white/60 transition-colors">
                      <Music size={10} /> View Setlist <ChevronRight size={10} />
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                {item.status === ScheduleStatus.PENDING ? (
                  <>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeclineModal({ open: true, scheduleId: item.id });
                      }}
                      className="px-8 py-3 bg-white/5 border border-white/10 text-white/60 hover:text-red-400 hover:border-red-400/20 rounded-full text-xs font-black uppercase tracking-widest transition-all"
                    >
                      Decline
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        updateScheduleStatus(item.id, ScheduleStatus.ACCEPTED);
                      }}
                      className="px-10 py-3 bg-white text-black hover:scale-105 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    >
                      Accept
                    </button>
                  </>
                ) : (
                  <div className={`flex flex-col items-end gap-2`}>
                    <div className={`flex items-center gap-3 px-6 py-2.5 rounded-full border ${
                      item.status === ScheduleStatus.ACCEPTED 
                        ? 'border-green-500/30 bg-green-500/5 text-green-500' 
                        : 'border-red-500/30 bg-red-500/5 text-red-500'
                    }`}>
                      {item.status === ScheduleStatus.ACCEPTED ? <Check size={14} /> : <X size={14} />}
                      <span className="text-[10px] font-black uppercase tracking-widest">{item.status}</span>
                    </div>
                    {item.status === ScheduleStatus.REJECTED && item.decline_reason && (
                      <p className="text-[10px] text-white/40 italic max-w-[200px] text-right">
                        "{item.decline_reason}"
                      </p>
                    )}
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

      {/* Decline Reason Modal */}
      {declineModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 max-w-md w-full">
            <h3 className="text-xl font-black italic mb-2">Decline Schedule</h3>
            <p className="text-white/40 text-sm mb-6">Please provide a reason for declining this assignment.</p>
            
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="e.g., I have a family event, I'm out of town, etc."
              className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-white/20 focus:border-white/30 outline-none resize-none mb-6"
              rows={4}
              autoFocus
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeclineModal({ open: false, scheduleId: null });
                  setDeclineReason('');
                }}
                className="flex-1 py-3 border border-white/10 text-white/60 rounded-full text-xs font-black uppercase tracking-widest hover:border-white/30 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDecline}
                disabled={!declineReason.trim()}
                className="flex-1 py-3 bg-red-500 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-red-400 transition-all disabled:opacity-50"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicianSchedule;