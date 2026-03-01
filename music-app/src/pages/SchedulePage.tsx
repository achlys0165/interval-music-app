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

const SchedulePage: React.FC = () => {
  const { user } = useAuth();
  const { schedules, updateScheduleStatus } = useData();
  const navigate = useNavigate();
  
  // Decline modal state
  const [declineModal, setDeclineModal] = useState<{ 
    open: boolean; 
    scheduleId: string | null;
    role: string;
    date: string;
  }>({
    open: false,
    scheduleId: null,
    role: '',
    date: ''
  });
  const [declineReason, setDeclineReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mySchedules = schedules
    .filter((s: Schedule) => s.musician_id === user?.id)
    .sort((a: Schedule, b: Schedule) => a.date.localeCompare(b.date));

  const openDeclineModal = (schedule: Schedule) => {
    setDeclineModal({
      open: true,
      scheduleId: schedule.id,
      role: schedule.role,
      date: schedule.date
    });
    setDeclineReason('');
  };

  const handleDecline = async () => {
    if (!declineModal.scheduleId || !declineReason.trim()) return;
    
    setIsSubmitting(true);
    try {
      await updateScheduleStatus(
        declineModal.scheduleId, 
        ScheduleStatus.REJECTED, 
        declineReason.trim()
      );
      setDeclineModal({ open: false, scheduleId: null, role: '', date: '' });
      setDeclineReason('');
    } catch (error) {
      console.error('Error declining schedule:', error);
      alert('Failed to decline schedule. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccept = async (scheduleId: string) => {
    try {
      await updateScheduleStatus(scheduleId, ScheduleStatus.ACCEPTED);
    } catch (error) {
      console.error('Error accepting schedule:', error);
      alert('Failed to accept schedule. Please try again.');
    }
  };

  const handleViewSetlist = (date: string) => {
    navigate(`/setlist?date=${date}`);
  };

  const closeModal = () => {
    setDeclineModal({ open: false, scheduleId: null, role: '', date: '' });
    setDeclineReason('');
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold italic tracking-tighter">MINISTRY SCHEDULE</h1>
        <p className="text-white/40 mt-1 uppercase text-xs tracking-[0.2em]">Manage your upcoming service commitments</p>
      </header>

      <div className="grid gap-4">
        {mySchedules.map((item: Schedule) => {
          const serviceDate = fromISODateString(item.date);
          const isPast = serviceDate < new Date();
          const isPending = item.status === ScheduleStatus.PENDING;
          
          return (
            <div 
              key={item.id} 
              className={`bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-white/20 transition-all ${!isPast ? 'cursor-pointer' : ''} ${isPast ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center gap-6">
                {/* Clickable date block - Click to view setlist */}
                <div 
                  onClick={() => !isPast && handleViewSetlist(item.date)}
                  className={`bg-white/5 border border-white/10 p-4 rounded-xl text-center min-w-[80px] transition-all ${!isPast ? 'cursor-pointer hover:bg-white hover:text-black' : ''}`}
                >
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
                  {/* View Setlist link */}
                  {!isPast && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewSetlist(item.date);
                      }}
                      className="text-[10px] text-white/40 mt-2 flex items-center gap-1 hover:text-white/60 transition-colors"
                    >
                      <Music size={10} /> View Setlist <ChevronRight size={10} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isPending ? (
                  <>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeclineModal(item);
                      }}
                      className="px-6 py-2.5 bg-transparent border border-white/10 text-white/60 hover:text-red-400 hover:border-red-400/20 rounded-full text-xs font-semibold transition-all"
                    >
                      Unable to Serve
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAccept(item.id);
                      }}
                      className="px-8 py-2.5 bg-white text-black hover:bg-white/90 rounded-full text-xs font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    >
                      Accept Duty
                    </button>
                  </>
                ) : (
                  <div className={`flex flex-col items-end gap-2`}>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                      item.status === ScheduleStatus.ACCEPTED 
                        ? 'border-green-500/30 bg-green-500/5 text-green-500' 
                        : 'border-red-500/30 bg-red-500/5 text-red-500'
                    }`}>
                      {item.status === ScheduleStatus.ACCEPTED ? <Check size={14} /> : <X size={14} />}
                      <span className="text-xs font-bold uppercase tracking-widest">{item.status}</span>
                    </div>
                    {/* Show decline reason if rejected */}
                    {item.status === ScheduleStatus.REJECTED && item.decline_reason && (
                      <div className="text-right max-w-[250px]">
                        <p className="text-[9px] text-white/30 uppercase tracking-wider mb-0.5">Reason:</p>
                        <p className="text-[11px] text-white/50 italic">"{item.decline_reason}"</p>
                      </div>
                    )}
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

      {/* Decline Reason Modal */}
      {declineModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 max-w-md w-full">
            <h3 className="text-xl font-black italic mb-2">Decline Assignment</h3>
            <p className="text-white/40 text-sm mb-6">
              You are declining: <span className="text-white font-bold">{declineModal.role}</span> on{' '}
              <span className="text-white font-bold">{declineModal.date}</span>
            </p>
            
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2 block">
              Reason for declining *
            </label>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="e.g., I have a family event, I'm out of town, feeling unwell, etc."
              className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-white/20 focus:border-white/30 outline-none resize-none mb-2"
              rows={4}
              autoFocus
              required
            />
            <p className="text-[10px] text-white/30 mb-6">
              * This reason will be shared with the admin team
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={closeModal}
                disabled={isSubmitting}
                className="flex-1 py-3 border border-white/10 text-white/60 rounded-full text-xs font-black uppercase tracking-widest hover:border-white/30 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDecline}
                disabled={!declineReason.trim() || isSubmitting}
                className="flex-1 py-3 bg-red-500 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-red-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Submitting...' : 'Decline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulePage;