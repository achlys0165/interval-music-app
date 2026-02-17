import React, { useState, useMemo } from 'react';
import { useData } from '../App';
import { UserRole, ScheduleStatus } from '../types';
import { supabase } from '../lib/supabase';
import { 
  UserPlus, Calendar, ChevronRight, Loader2, 
  CheckCircle, AlertCircle, Clock, Plus
} from 'lucide-react';

const ROLES = [
  'Keys', 'Synth', 'Drums', 'Bass', 
  'Rhythm Guitar', 'Lead Guitar', 
  'Vocals (Lead)', 'Vocals (Backing)'
];

const toISODateString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const AdminSchedule: React.FC = () => {
  const { schedules, assignMusician, loading } = useData();
  const [musicians, setMusicians] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newAssignment, setNewAssignment] = useState({ 
    musicianId: '', 
    date: '', 
    role: '', 
    songIds: [] as string[] 
  });

  // Fetch musicians from Supabase
  React.useEffect(() => {
    const fetchMusicians = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'musician');
      
      if (!error && data) {
        setMusicians(data);
      }
    };
    fetchMusicians();
  }, []);

  const nextSundays = useMemo(() => {
    const sundays = [];
    const date = new Date();
    date.setDate(date.getDate() + (7 - date.getDay()) % 7);
    for (let i = 0; i < 6; i++) {
      sundays.push(toISODateString(new Date(date)));
      date.setDate(date.getDate() + 7);
    }
    return sundays;
  }, []);

  const [selectedDate, setSelectedDate] = useState(nextSundays[0]);

  const sundayAssignments = useMemo(() => {
    return schedules.filter(s => s.date === selectedDate);
  }, [schedules, selectedDate]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignment.musicianId || !newAssignment.date || !newAssignment.role) return;
    
    setIsSubmitting(true);
    try {
      await assignMusician(newAssignment);
      setNewAssignment({ musicianId: '', date: '', role: '', songIds: [] });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-white/40 text-center py-20">Loading...</div>;
  }

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-black italic tracking-tighter uppercase">Team Orchestration</h1>
        <p className="text-white/40 mt-1 uppercase text-xs tracking-[0.2em]">Coordinate musician assignments across Sundays</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Date Selection */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-white/30 flex items-center gap-2 px-1">
                <Calendar size={14} /> Select Sunday
              </h3>
              <div className="space-y-2">
                {nextSundays.map(date => {
                   const isSelected = selectedDate === date;
                   const count = schedules.filter(s => s.date === date).length;
                   return (
                     <button 
                       key={date}
                       onClick={() => setSelectedDate(date)}
                       className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${
                         isSelected ? 'bg-white text-black border-white shadow-xl' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                       }`}
                     >
                       <div>
                         <p className="text-[10px] uppercase font-black opacity-60">
                           {new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                         </p>
                         <p className="font-black text-sm tracking-tight">Lord's Day Service</p>
                       </div>
                       {count > 0 && (
                         <span className={`text-[10px] font-black px-2 py-1 rounded-md ${isSelected ? 'bg-black text-white' : 'bg-white/10 text-white'}`}>
                            {count}
                         </span>
                       )}
                     </button>
                   );
                })}
              </div>
           </div>

           {/* Quick Assignment Form */}
           <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 space-y-6">
              <h3 className="font-bold text-lg italic flex items-center gap-2"><UserPlus size={20} /> Assign Duty</h3>
              <form onSubmit={handleAssign} className="space-y-4">
                 <div className="space-y-2">
                   <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Musician</label>
                   <select 
                     className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-sm"
                     value={newAssignment.musicianId}
                     onChange={(e) => setNewAssignment({...newAssignment, musicianId: e.target.value})}
                     required
                   >
                      <option value="">Choose...</option>
                      {musicians.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                   </select>
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Date</label>
                   <select 
                     className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-sm"
                     value={newAssignment.date}
                     onChange={(e) => setNewAssignment({...newAssignment, date: e.target.value})}
                     required
                   >
                      <option value="">Select...</option>
                      {nextSundays.map(date => <option key={date} value={date}>{date}</option>)}
                   </select>
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Position</label>
                   <select 
                     className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-sm"
                     value={newAssignment.role}
                     onChange={(e) => setNewAssignment({...newAssignment, role: e.target.value})}
                     required
                   >
                      <option value="">Select...</option>
                      {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                   </select>
                 </div>
                 <button 
                   disabled={isSubmitting} 
                   className="w-full py-4 bg-white text-black rounded-xl font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 shadow-lg"
                 >
                   {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Dispatch Task'}
                 </button>
              </form>
           </div>
        </div>

        {/* Detailed Lineup for Sunday */}
        <div className="lg:col-span-3 space-y-4">
           <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden min-h-[600px] shadow-sm flex flex-col">
              <div className="p-8 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                 <div>
                    <h2 className="text-2xl font-black italic tracking-tighter">Lineup Oversight</h2>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mt-1">Service: {selectedDate}</p>
                 </div>
                 <div className="flex items-center gap-3">
                   <span className="text-3xl font-black italic">{sundayAssignments.length}</span>
                   <span className="text-[10px] uppercase font-bold text-white/20 tracking-widest">Active Duties</span>
                 </div>
              </div>

              <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 gap-4 content-start overflow-y-auto">
                 {ROLES.map(role => {
                    const assignment = sundayAssignments.find(s => s.role === role);
                    const musician = assignment?.musician;
                    return (
                      <div 
                        key={role} 
                        className={`p-6 rounded-[2rem] border transition-all flex items-center justify-between group ${
                          assignment ? 'bg-white/[0.03] border-white/10' : 'border-dashed border-white/5 opacity-30 hover:opacity-100 hover:bg-white/[0.01]'
                        }`}
                      >
                         <div className="space-y-1">
                            <p className="text-[10px] uppercase font-black tracking-widest text-white/20">{role}</p>
                            {musician ? (
                              <div className="flex items-center gap-3 mt-2">
                                <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-black italic text-xs">
                                  {musician.name?.charAt(0)}
                                </div>
                                <p className="font-bold text-lg">{musician.name}</p>
                              </div>
                            ) : (
                              <p className="font-bold text-white/20 italic mt-2">Open Position</p>
                            )}
                         </div>

                         {assignment ? (
                           <div className={`flex flex-col items-end gap-1 px-4 py-2 rounded-2xl border ${
                              assignment.status === ScheduleStatus.ACCEPTED ? 'border-green-500/20 text-green-500 bg-green-500/5' :
                              assignment.status === ScheduleStatus.REJECTED ? 'border-red-500/20 text-red-500 bg-red-500/5' :
                              'border-yellow-500/20 text-yellow-500 bg-yellow-500/5'
                           }`}>
                              <span className="text-[10px] font-black uppercase tracking-widest">{assignment.status}</span>
                              {assignment.status === ScheduleStatus.ACCEPTED ? <CheckCircle size={14} /> : 
                               assignment.status === ScheduleStatus.REJECTED ? <AlertCircle size={14} /> : <Clock size={14} className="animate-pulse" />}
                           </div>
                         ) : (
                           <button 
                            onClick={() => setNewAssignment({ ...newAssignment, role, date: selectedDate })}
                            className="p-3 border border-white/5 rounded-2xl hover:bg-white hover:text-black transition-all"
                           >
                              <Plus size={20} />
                           </button>
                         )}
                      </div>
                    );
                 })}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSchedule;