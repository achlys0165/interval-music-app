import React, { useState } from 'react';
import { useData } from '../App';
import { supabase } from '../lib/supabase';
import { PlusCircle, Search, Music, ChevronRight, Loader2, Save } from 'lucide-react';

// Define CHROMATIC_SCALE locally instead of importing from constants
const CHROMATIC_SCALE = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
];

const CATEGORIES = ['Worship', 'Choir', 'Special'] as const;

const AdminSongs: React.FC = () => {
  const { songs, addSong, loading } = useData();
  const [query, setQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state for new song
  const [newSong, setNewSong] = useState({ 
    title: '', 
    original_key: 'C', 
    category: 'Worship' as typeof CATEGORIES[number], 
    lyrics: '', 
    reference_url: '',
    tempo: ''
  });

  // Filter songs based on search query
  const filteredSongs = songs.filter(s => 
    s.title?.toLowerCase().includes(query.toLowerCase()) || 
    s.category?.toLowerCase().includes(query.toLowerCase()) ||
    s.original_key?.toLowerCase().includes(query.toLowerCase())
  );

  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSong.title || !newSong.original_key) return;
    
    setIsSubmitting(true);
    try {
      await addSong(newSong);
      // Reset form
      setNewSong({ 
        title: '', 
        original_key: 'C', 
        category: 'Worship', 
        lyrics: '', 
        reference_url: '',
        tempo: ''
      });
      setIsAdding(false);
    } catch (error) {
      console.error('Error adding song:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter uppercase">Vault Management</h1>
          <p className="text-white/40 mt-1 uppercase text-xs tracking-[0.2em]">Maintain the digital song repository</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-3 px-8 py-3 bg-white text-black font-black uppercase text-xs tracking-widest rounded-full hover:bg-white/90 transition-all shadow-xl"
        >
          {isAdding ? 'Cancel Entry' : <><PlusCircle size={16} /> New Repertoire</>}
        </button>
      </header>

      {isAdding && (
        <div className="bg-[#0a0a0a] border border-white/20 rounded-[2.5rem] p-8 animate-in fade-in slide-in-from-top-4 duration-500 shadow-2xl max-w-2xl mx-auto w-full">
           <h3 className="text-xl font-black italic mb-8">Register New Entry</h3>
           <form onSubmit={handleAddSong} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Song Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Way Maker" 
                  className="w-full bg-black border border-white/10 rounded-2xl py-4 px-5 text-sm outline-none focus:border-white/40 transition-all"
                  value={newSong.title}
                  onChange={(e) => setNewSong({...newSong, title: e.target.value})}
                  required 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Original Key</label>
                   <select 
                     className="w-full bg-black border border-white/10 rounded-2xl py-4 px-5 text-sm outline-none cursor-pointer"
                     value={newSong.original_key}
                     onChange={(e) => setNewSong({...newSong, original_key: e.target.value})}
                   >
                      {CHROMATIC_SCALE.map(k => <option key={k} value={k}>{k}</option>)}
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Category</label>
                   <select 
                     className="w-full bg-black border border-white/10 rounded-2xl py-4 px-5 text-sm outline-none cursor-pointer"
                     value={newSong.category}
                     onChange={(e) => setNewSong({...newSong, category: e.target.value as typeof CATEGORIES[number]})}
                   >
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                   </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Tempo (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. 76 BPM" 
                  className="w-full bg-black border border-white/10 rounded-2xl py-4 px-5 text-sm outline-none focus:border-white/40 transition-all"
                  value={newSong.tempo}
                  onChange={(e) => setNewSong({...newSong, tempo: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Reference URL (Optional)</label>
                <input 
                  type="url" 
                  placeholder="https://youtube.com/..." 
                  className="w-full bg-black border border-white/10 rounded-2xl py-4 px-5 text-sm outline-none focus:border-white/40 transition-all"
                  value={newSong.reference_url}
                  onChange={(e) => setNewSong({...newSong, reference_url: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Performance Sheet (Lyrics/Chords)</label>
                 <textarea 
                   rows={6} 
                   className="w-full bg-black border border-white/10 rounded-2xl py-4 px-5 text-sm outline-none focus:border-white/40 resize-none font-mono"
                   placeholder="[VERSE 1]&#10;G                 Em7&#10;The splendor of the King..."
                   value={newSong.lyrics}
                   onChange={(e) => setNewSong({...newSong, lyrics: e.target.value})}
                 />
              </div>

              <button 
                disabled={isSubmitting} 
                className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3"
              >
                 {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Finalize Archive</>}
              </button>
           </form>
        </div>
      )}

      <div className="space-y-6">
         <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-all" size={24} />
            <input 
              type="text" 
              placeholder="Filter vault contents..."
              className="w-full bg-[#0a0a0a] border-2 border-white/5 rounded-[2rem] py-6 pl-16 pr-8 text-xl focus:outline-none focus:border-white/20 transition-all placeholder:text-white/10"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
         </div>

         <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden">
            <div className="divide-y divide-white/5">
               {filteredSongs.slice().reverse().map(song => (
                 <div key={song.id} className="p-8 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                    <div className="flex items-center gap-6">
                       <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/30 group-hover:text-white transition-all">
                          <Music size={20} />
                       </div>
                       <div>
                          <p className="text-xl font-bold tracking-tight">{song.title}</p>
                          <p className="text-[10px] uppercase tracking-widest font-black text-white/20 mt-0.5">
                            {song.category} • Key: {song.original_key} {song.tempo && `• ${song.tempo}`}
                          </p>
                       </div>
                    </div>
                    <button className="p-3 bg-white/5 rounded-2xl text-white/20 group-hover:text-white group-hover:bg-white/10 transition-all">
                       <ChevronRight size={20} />
                    </button>
                 </div>
               ))}
            </div>
            {filteredSongs.length === 0 && (
              <div className="p-32 text-center text-white/10 italic">Library is empty or no matches found.</div>
            )}
         </div>
      </div>
    </div>
  );
};

export default AdminSongs;