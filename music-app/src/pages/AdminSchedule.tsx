import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { ScheduleStatus } from '../types';
import { turso } from '../lib/turso';
import { 
  UserPlus, CheckCircle, AlertCircle, Clock, 
  Plus, X, Loader2, Users, Calendar as CalendarIcon
} from 'lucide-react';
import CalendarPicker from '../components/CalendarPicker';

const ROLES = [
  'Keys', 'Synth', 'Drums', 'Bass', 'Rhythm Guitar', 'Lead Guitar', 'Vocals (Lead)', 'Vocals (Backing)'
];

const toISODateString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const AdminSchedule: React.FC = () => {
  const { schedules, assignMusician, loading, refreshData } = useData();
  const [musicians, setMusicians] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [newAssignment, setNewAssignment] = useState({ 
    musician_id: '', 
    date: toISODateString(new Date()), // Default to today
    role: ''
  });

  const [selectedDate, setSelectedDate] = useState(toISODateString(new Date()));

  // Get assignments for selected date
  const dateAssignments = useMemo(() => {
    return schedules.filter(s => s.date === selectedDate);
  }, [schedules, selectedDate]);

  // Fetch musicians
  useEffect(() => {
    const fetchMusicians = async () => {
      try {
        const { rows } = await turso.execute({
          sql: 'SELECT id, name, instrument FROM users WHERE role = ?',
          args: ['musician']
        });
        setMusicians(rows);
      } catch (error) {
        console.error('Error fetching musicians:', error);
        setError('Failed to load musicians');
      }
    };
    fetchMusicians();
  }, []);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!newAssignment.musician_id || !newAssignment.date || !newAssignment.role) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await assignMusician(newAssignment);
      setSuccess('Musician assigned successfully!');
      setNewAssignment({ musician_id: '', date: toISODateString(new Date()), role: '' });
      setShowAssignForm(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Assignment error:', error);
      setError(error.message || 'Failed to create assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: ScheduleStatus) => {
    switch (status) {
      case ScheduleStatus.ACCEPTED:
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-500/30 bg-green-500/5 text-green-500 text-[10px] font-black uppercase tracking-widest">
            <CheckCircle size={12} /> Confirmed
          </div>
        );
      case ScheduleStatus.REJECTED:
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-500/30 bg-red-500/5 text-red-500 text-[10px] font-black uppercase tracking-widest">
            <AlertCircle size={12} /> Declined
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/5 text-yellow-500 text-[10px] font-black uppercase tracking-widest">
            <Clock size={12} className="animate-pulse" /> Pending
          </div>
        );
    }
  };

  // Get upcoming dates with assignments for the horizontal scroll
  const upcomingDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(toISODateString(d));
    }
    return dates;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter uppercase">Team Schedule</h1>
          <p className="text-white/40 mt-1 uppercase text-xs tracking-[0.2em]">Assign musicians to services</p>
        </div>
        <button 
          onClick={() => {
            setShowAssignForm(!showAssignForm);
            setError(null);
            setSuccess(null);
          }}
          className="flex items-center gap-3 px-6 py-3 bg-white text-black font-black uppercase text-xs tracking-widest rounded-full hover:bg-white/90 transition-all"
        >
          {showAssignForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Assign Musician</>}
        </button>
      </header>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-bold text-center">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-sm font-bold text-center">
          {success}
        </div>
      )}

      {/* Assignment Form with Calendar */}
      {showAssignForm && (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8">
          <h3 className="text-lg font-black italic mb-6 flex items-center gap-2">
            <UserPlus size={20} /> New Assignment
          </h3>
          <form onSubmit={handleAssign} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Musician</label>
              <select 
                className="w-full bg-black border border-white/10 rounded-xl py-4 px-4 text-sm text-white"
                value={newAssignment.musician_id} 
                onChange={(e) => setNewAssignment({...newAssignment, musician_id: e.target.value})} 
                required
              >
                <option value="">Select musician...</option>
                {musicians.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.instrument ? `(${u.instrument})` : ''}
                  </option>
                ))}
              </select>
            </div>
            
            {/* CALENDAR PICKER HERE */}
            <CalendarPicker
              label="Service Date"
              selectedDate={newAssignment.date}
              onSelect={(date) => setNewAssignment({...newAssignment, date})}
            />
            
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Role/Position</label>
              <select 
                className="w-full bg-black border border-white/10 rounded-xl py-4 px-4 text-sm text-white"
                value={newAssignment.role} 
                onChange={(e) => setNewAssignment({...newAssignment, role: e.target.value})} 
                required
              >
                <option value="">Select role...</option>
                {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>
            <div className="md:col-span-3">
              <button 
                type="submit"
                disabled={isSubmitting} 
                className="w-full py-4 bg-white text-black rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-white/90 transition-all disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Create Assignment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Date Selector with Calendar */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="w-full md:w-72">
            <CalendarPicker
              label="Select Service Date"
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
            />
          </div>
          
          <div className="flex-1">
            <h3 className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-3">
              Upcoming Dates
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {upcomingDates.slice(0, 14).map(date => {
                const isSelected = selectedDate === date;
                const count = schedules.filter(s => s.date === date).length;
                const d = new Date(date);
                
                return (
                  <button 
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`flex-shrink-0 text-center p-3 rounded-xl border transition-all min-w-[70px] ${
                      isSelected 
                        ? 'bg-white text-black border-white' 
                        : 'bg-black border-white/10 text-white hover:bg-white/5'
                    }`}
                  >
                    <p className={`text-[9px] uppercase font-black ${isSelected ? 'text-black/60' : 'text-white/40'}`}>
                      {d.toLocaleDateString('en-US', { month: 'short' })}
                    </p>
                    <p className="text-xl font-black italic">{d.getDate()}</p>
                    <p className={`text-[8px] uppercase font-bold mt-1 ${isSelected ? 'text-black/40' : 'text-white/20'}`}>
                      {count} assigned
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Roster Grid */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-black italic tracking-tighter flex items-center gap-2">
            <Users size={20} className="text-white/40" /> 
            Service Roster
          </h2>
          <span className="text-[10px] uppercase font-black text-white/40 tracking-widest">
            {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {ROLES.map(role => {
            const assignment = dateAssignments.find(s => s.role === role);
            const musician = assignment?.musician;

            return (
              <div 
                key={role} 
                className={`p-5 rounded-2xl border transition-all ${
                  assignment 
                    ? 'bg-white/[0.03] border-white/10' 
                    : 'border-dashed border-white/5 bg-transparent opacity-40'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-black tracking-widest text-white/20">{role}</p>
                    
                    {musician ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center font-black italic text-sm">
                          {musician.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-lg">{musician.name}</p>
                          {getStatusBadge(assignment.status)}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center text-white/20">
                          <Plus size={16} />
                        </div>
                        <p className="font-bold text-white/20 italic">Open Position</p>
                      </div>
                    )}
                  </div>

                  {!assignment && (
                    <button 
                      onClick={() => {
                        setNewAssignment({ musician_id: '', date: selectedDate, role });
                        setShowAssignForm(true);
                        setError(null);
                      }}
                      className="p-2 border border-white/10 rounded-lg hover:bg-white hover:text-black transition-all"
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminSchedule;