import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../App';
import { UserRole, ScheduleStatus } from '../types';
import { supabase } from '../lib/supabase';
import { 
  UserPlus, 
  PlusCircle, 
  CheckCircle, 
  ChevronRight, 
  Loader2, 
  Calendar, 
  Music, 
  Users, 
  AlertCircle,
  Clock
} from 'lucide-react';

const ROLES = [
  'Keys',
  'Synth',
  'Drums',
  'Bass',
  'Rhythm Guitar',
  'Lead Guitar',
  'Vocals (Lead)',
  'Vocals (Backing)'
];

const CATEGORIES = ['Worship', 'Choir', 'Special'] as const;

const toISODateString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const AdminPanel: React.FC = () => {
  const { songs, setlists, schedules, addSong, assignMusician, updateSetlist, loading } = useData();
  const [activeTab, setActiveTab] = useState<'roster' | 'assign' | 'planner' | 'songs'>('roster');
  
  // State for musicians (fetched from Supabase)
  const [musicians, setMusicians] = useState<any[]>([]);
  const [musiciansLoading, setMusiciansLoading] = useState(false);
  
  // Form States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSong, setNewSong] = useState({ 
    title: '', 
    original_key: 'C', 
    category: 'Worship' as typeof CATEGORIES[number], 
    lyrics: '', 
    reference_url: '',
    tempo: ''
  });
  
  const [newAssignment, setNewAssignment] = useState({ 
    musicianId: '', 
    date: '', 
    role: '', 
    songIds: [] as string[] 
  });
  
  // Filtering States
  const nextSundays = useMemo(() => {
    const sundays = [];
    const date = new Date();
    date.setDate(date.getDate() + (7 - date.getDay()) % 7);
    for (let i = 0; i < 5; i++) {
      sundays.push(toISODateString(new Date(date)));
      date.setDate(date.getDate() + 7);
    }
    return sundays;
  }, []);

  const [selectedRosterDate, setSelectedRosterDate] = useState(nextSundays[0]);
  const [plannerDate, setPlannerDate] = useState('');
  const [plannerSongs, setPlannerSongs] = useState<string[]>([]);

  // Fetch musicians from Supabase
  useEffect(() => {
    const fetchMusicians = async () => {
      setMusiciansLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'musician');
      
      if (!error && data) {
        setMusicians(data);
      }
      setMusiciansLoading(false);
    };
    fetchMusicians();
  }, []);

  // Computed Roster for the selected Sunday
  const currentSundayRoster = useMemo(() => {
    return schedules.filter(s => s.date === selectedRosterDate);
  }, [schedules, selectedRosterDate]);

  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addSong(newSong);
      setNewSong({ 
        title: '', 
        original_key: 'C', 
        category: 'Worship', 
        lyrics: '', 
        reference_url: '',
        tempo: ''
      });
    } catch (error) {
      console.error('Error adding song:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignment.musicianId || !newAssignment.date || !newAssignment.role) return;
    
    setIsSubmitting(true);
    try {
      await assignMusician(newAssignment);
      setNewAssignment({ musicianId: '', date: '', role: '', songIds: [] });
    } catch (error) {
      console.error('Error assigning musician:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveSetlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plannerDate) return;
    
    setIsSubmitting(true);
    try {
      await updateSetlist({ date: plannerDate, song_ids: plannerSongs });
    } catch (error) {
      console.error('Error saving setlist:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSongInPlanner = (id: string) => {
    setPlannerSongs(prev => 
      prev.includes(id) 
        ? prev.filter(sid => sid !== id) 
        : [...prev, id]
    );
  };

  if (loading || musiciansLoading) {
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
          <h1 className="text-3xl font-bold italic tracking-tighter uppercase">Command Center</h1>
          <p className="text-white/40 mt-1 uppercase text-xs tracking-[0.2em]">Music Ministry Master Dashboard</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="text-right">
              <p className="text-[10px] uppercase font-black tracking-widest text-white/20">System Status</p>
              <div className="text-xs font-bold text-green-500 flex items-center gap-2 justify-end">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Operational
              </div>
           </div>
        </div>
      </header>

      <div className="flex gap-4 border-b border-white/5 pb-px overflow-x-auto no-scrollbar">
        {[
          { id: 'roster', label: 'Sunday Roster', icon: Users },
          { id: 'assign', label: 'Assign Duty', icon: UserPlus },
          { id: 'planner', label: 'Setlist Hub', icon: Calendar },
          { id: 'songs', label: 'Library Management', icon: PlusCircle }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'border-white text-white' : 'border-transparent text-white/20 hover:text-white/40'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          {activeTab === 'roster' && (
            <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 space-y-6">
               <h3 className="font-bold text-sm italic uppercase tracking-widest flex items-center gap-2 text-white/40">
                 <Calendar size={16} /> Date Context
               </h3>
               <div className="space-y-3">
                 {nextSundays.map(date => {
                   const isSelected = selectedRosterDate === date;
                   return (
                     <button 
                       key={date}
                       onClick={() => setSelectedRosterDate(date)}
                       className={`w-full text-left p-4 rounded-2xl border transition-all ${
                         isSelected ? 'bg-white text-black border-white shadow-xl' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                       }`}
                     >
                       <p className="text-[9px] uppercase font-black tracking-tighter opacity-60">
                         {new Date(date).toLocaleDateString(undefined, { weekday: 'long' })}
                       </p>
                       <p className="font-black text-lg">
                         {new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                       </p>
                     </button>
                   );
                 })}
               </div>
            </div>
          )}

          {activeTab === 'assign' && (
            <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 space-y-6">
               <h3 className="font-bold text-lg italic flex items-center gap-2"><UserPlus size={20} /> Create Assignment</h3>
               <form onSubmit={handleAssign} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Select Musician</label>
                    <select 
                      className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-sm" 
                      value={newAssignment.musicianId} 
                      onChange={(e) => setNewAssignment({...newAssignment, musicianId: e.target.value})} 
                      required
                    >
                       <option value="">Choose musician...</option>
                       {musicians.map(u => (
                         <option key={u.id} value={u.id}>{u.name}</option>
                       ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Service Date</label>
                    <select 
                      className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-sm" 
                      value={newAssignment.date} 
                      onChange={(e) => setNewAssignment({...newAssignment, date: e.target.value})} 
                      required
                    >
                       <option value="">Select a Sunday...</option>
                       {nextSundays.map(date => <option key={date} value={date}>{date}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Role/Position</label>
                    <select 
                      className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-sm" 
                      value={newAssignment.role} 
                      onChange={(e) => setNewAssignment({...newAssignment, role: e.target.value})} 
                      required
                    >
                       <option value="">Select role...</option>
                       {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                  </div>
                  <button 
                    disabled={isSubmitting} 
                    className="w-full py-4 bg-white text-black rounded-xl font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Dispatch Assignment'}
                  </button>
               </form>
            </div>
          )}

          {activeTab === 'planner' && (
            <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 space-y-6">
              <h3 className="font-bold text-lg italic flex items-center gap-2"><Music size={20} /> Repertoire Planning</h3>
              <form onSubmit={handleSaveSetlist} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Service Date</label>
                  <select 
                    className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-sm" 
                    value={plannerDate} 
                    onChange={(e) => {
                      setPlannerDate(e.target.value);
                      const existing = setlists.find(s => s.date === e.target.value);
                      setPlannerSongs(existing?.song_ids || []);
                    }} 
                    required
                  >
                    <option value="">Select Sunday...</option>
                    {nextSundays.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Song Selection</label>
                  <div className="max-h-48 overflow-y-auto space-y-1 pr-2">
                    {songs.map(s => (
                      <button 
                        type="button" 
                        key={s.id} 
                        onClick={() => toggleSongInPlanner(s.id)} 
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-between transition-colors ${
                          plannerSongs.includes(s.id) ? 'bg-white text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'
                        }`}
                      >
                        {s.title}
                        {plannerSongs.includes(s.id) && <CheckCircle size={14} />}
                      </button>
                    ))}
                  </div>
                </div>
                <button 
                  disabled={isSubmitting || !plannerDate} 
                  className="w-full py-4 bg-white text-black rounded-xl font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Lock Setlist'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'songs' && (
            <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 space-y-6">
              <h3 className="font-bold text-lg italic flex items-center gap-2"><PlusCircle size={20} /> New Repertoire</h3>
              <form onSubmit={handleAddSong} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Song Metadata</label>
                  <input 
                    type="text" 
                    placeholder="Title" 
                    className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-sm" 
                    value={newSong.title} 
                    onChange={(e) => setNewSong({...newSong, title: e.target.value})} 
                    required 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <select 
                    className="bg-black border border-white/10 rounded-xl py-3 px-4 text-sm" 
                    value={newSong.original_key} 
                    onChange={(e) => setNewSong({...newSong, original_key: e.target.value})}
                  >
                    <option value="">Key...</option>
                    {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                  <select 
                    className="bg-black border border-white/10 rounded-xl py-3 px-4 text-sm" 
                    value={newSong.category} 
                    onChange={(e) => setNewSong({...newSong, category: e.target.value as typeof CATEGORIES[number]})}
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <button 
                  disabled={isSubmitting} 
                  className="w-full py-4 bg-white text-black rounded-xl font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Add to Vault'}
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="lg:col-span-3">
           <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden min-h-[600px] shadow-sm">
              {activeTab === 'roster' ? (
                <div className="flex flex-col h-full">
                   <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                      <div>
                        <h2 className="text-2xl font-black italic tracking-tighter">Master Roster</h2>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mt-1">
                          Lineup for {selectedRosterDate}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black italic">{currentSundayRoster.length}</p>
                        <p className="text-[9px] uppercase tracking-widest text-white/20">Positions Filled</p>
                      </div>
                   </div>
                   
                   <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 gap-6 content-start">
                      {ROLES.map(role => {
                        const assignment = currentSundayRoster.find(s => s.role === role);
                        const musician = assignment?.musician;
                        
                        return (
                          <div 
                            key={role} 
                            className={`p-6 rounded-3xl border transition-all ${
                              assignment 
                                ? 'bg-white/[0.03] border-white/10' 
                                : 'border-dashed border-white/5 bg-transparent opacity-40'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <p className="text-[10px] uppercase font-black tracking-widest text-white/20">{role}</p>
                                {musician ? (
                                  <div className="flex items-center gap-3 mt-2">
                                    <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center font-black italic">
                                      {musician.name?.charAt(0)}
                                    </div>
                                    <div>
                                      <p className="font-bold text-lg">{musician.name}</p>
                                      <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest mt-0.5 ${
                                        assignment.status === ScheduleStatus.ACCEPTED ? 'text-green-500' :
                                        assignment.status === ScheduleStatus.REJECTED ? 'text-red-500' :
                                        'text-yellow-500 animate-pulse'
                                      }`}>
                                        {assignment.status === ScheduleStatus.ACCEPTED && <CheckCircle size={10} />}
                                        {assignment.status === ScheduleStatus.REJECTED && <AlertCircle size={10} />}
                                        {assignment.status === ScheduleStatus.PENDING && <Clock size={10} />}
                                        {assignment.status}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="font-bold text-white/20 italic mt-2">Unassigned Position</p>
                                )}
                              </div>
                              
                              {!assignment && (
                                <button 
                                  onClick={() => { 
                                    setActiveTab('assign'); 
                                    setNewAssignment(prev => ({ ...prev, role, date: selectedRosterDate })); 
                                  }}
                                  className="p-2 border border-white/5 rounded-xl hover:bg-white hover:text-black transition-all"
                                >
                                  <PlusCircle size={18} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                   </div>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                   <div className="p-8 border-b border-white/5 bg-white/[0.01]">
                      <h2 className="text-2xl font-black italic tracking-tighter">
                        {activeTab === 'songs' ? 'Vault Overview' : activeTab === 'assign' ? 'Current Assignments' : 'Setlist History'}
                      </h2>
                   </div>
                   
                   {activeTab === 'assign' && schedules.slice().reverse().map(s => (
                     <div key={s.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-6">
                           <div className="text-center w-12">
                             <p className="text-[9px] uppercase font-black text-white/20">
                               {new Date(s.date).toLocaleDateString('en-US', { month: 'short' })}
                             </p>
                             <p className="text-2xl font-black italic">{new Date(s.date).getDate()}</p>
                           </div>
                           <div className="w-px h-8 bg-white/5" />
                           <div>
                              <p className="font-bold text-lg">{s.musician?.name || 'Unknown'}</p>
                              <p className="text-[10px] uppercase font-bold text-white/40 tracking-widest">{s.role}</p>
                           </div>
                        </div>
                        <span className={`text-[10px] px-3 py-1.5 rounded-full font-black border tracking-widest uppercase ${
                          s.status === ScheduleStatus.ACCEPTED ? 'border-green-500/20 text-green-500 bg-green-500/5' :
                          s.status === ScheduleStatus.REJECTED ? 'border-red-500/20 text-red-500 bg-red-500/5' :
                          'border-yellow-500/20 text-yellow-500 bg-yellow-500/5'
                        }`}>
                          {s.status}
                        </span>
                     </div>
                   ))}

                   {activeTab === 'songs' && songs.slice().reverse().map(song => (
                     <div key={song.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                       <div>
                         <p className="font-bold text-lg">{song.title}</p>
                         <p className="text-[10px] uppercase text-white/30 font-bold tracking-widest">
                           {song.category} • {song.original_key}
                         </p>
                       </div>
                       <button className="p-3 text-white/10 group-hover:text-white transition-colors">
                         <ChevronRight size={18} />
                       </button>
                     </div>
                   ))}

                   {activeTab === 'planner' && setlists.slice().reverse().map(sl => (
                     <div key={sl.id} className="p-8 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-6">
                           <div className="p-3 bg-white/5 rounded-2xl">
                             <Music size={20} />
                           </div>
                           <div>
                              <p className="text-xl font-bold">
                                {new Date(sl.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                              </p>
                              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-white/30">
                                {sl.song_ids?.length || 0} Songs Loaded
                              </p>
                           </div>
                        </div>
                        <button 
                          onClick={() => { 
                            setPlannerDate(sl.date); 
                            setPlannerSongs(sl.song_ids || []); 
                          }} 
                          className="p-3 bg-white/5 hover:bg-white hover:text-black rounded-xl transition-all"
                        >
                           <Calendar size={18} />
                        </button>
                     </div>
                   ))}
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;