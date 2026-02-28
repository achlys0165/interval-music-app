import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { PlusCircle, Search, Music, Loader2, Save } from 'lucide-react';

const CHROMATIC_SCALE = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
];

const CATEGORIES = ['Worship', 'Choir', 'Special'] as const;

const AdminSongs: React.FC = () => {
  const { songs, addSong, loading } = useData();
  const [query, setQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newSong, setNewSong] = useState({ 
    title: '', 
    original_key: 'C', 
    category: 'Worship' as typeof CATEGORIES[number], 
    lyrics: '', 
    reference_url: '',
    tempo: ''
  });

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header>
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter uppercase">Song Vault</h1>
          <p className="text-white/40 mt-1 uppercase text-xs tracking-[0.2em]">Manage the digital song repository</p>
        </div>
      </header>

      {/* Add Song Form */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 max-w-2xl">
         <h3 className="text-xl font-black italic mb-8 flex items-center gap-3">
           <PlusCircle size={24} /> Add New Song
         </h3>
         <form onSubmit={handleAddSong} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Song Title</label>
              <input 
                type="text" 
                placeholder="e.g. Way Maker" 
                className="w-full bg-black border border-white/10 rounded-2xl py-4 px-5 text-sm outline-none focus:border-white/40 transition-all text-white"
                value={newSong.title}
                onChange={(e) => setNewSong({...newSong, title: e.target.value})}
                required 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Original Key</label>
                 <select 
                   className="w-full bg-black border border-white/10 rounded-2xl py-4 px-5 text-sm outline-none cursor-pointer text-white"
                   value={newSong.original_key}
                   onChange={(e) => setNewSong({...newSong, original_key: e.target.value})}
                 >
                    {CHROMATIC_SCALE.map(k => <option key={k} value={k}>{k}</option>)}
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Category</label>
                 <select 
                   className="w-full bg-black border border-white/10 rounded-2xl py-4 px-5 text-sm outline-none cursor-pointer text-white"
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
                className="w-full bg-black border border-white/10 rounded-2xl py-4 px-5 text-sm outline-none focus:border-white/40 transition-all text-white"
                value={newSong.tempo}
                onChange={(e) => setNewSong({...newSong, tempo: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Reference URL (Optional)</label>
              <input 
                type="url" 
                placeholder="https://youtube.com/..." 
                className="w-full bg-black border border-white/10 rounded-2xl py-4 px-5 text-sm outline-none focus:border-white/40 transition-all text-white"
                value={newSong.reference_url}
                onChange={(e) => setNewSong({...newSong, reference_url: e.target.value})}
              />
            </div>

            <div className="space-y-2">
               <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Lyrics/Chords</label>
               <textarea 
                 rows={6} 
                 className="w-full bg-black border border-white/10 rounded-2xl py-4 px-5 text-sm outline-none focus:border-white/40 resize-none font-mono text-white"
                 placeholder="[VERSE 1]&#10;G                 Em7&#10;The splendor of the King..."
                 value={newSong.lyrics}
                 onChange={(e) => setNewSong({...newSong, lyrics: e.target.value})}
               />
            </div>

            <button 
              disabled={isSubmitting} 
              className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-white/90 transition-all disabled:opacity-50"
            >
               {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Add to Vault</>}
            </button>
         </form>
      </div>

      {/* Song List */}
      <div className="space-y-6">
         <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-all" size={24} />
            <input 
              type="text" 
              placeholder="Search songs..."
              className="w-full bg-[#0a0a0a] border-2 border-white/5 rounded-[2rem] py-6 pl-16 pr-8 text-xl focus:outline-none focus:border-white/20 transition-all placeholder:text-white/10 text-white"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
         </div>

         <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden">
            <div className="divide-y divide-white/5">
               {filteredSongs.slice().reverse().map(song => (
                 <div key={song.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                    <div className="flex items-center gap-6">
                       <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/30 group-hover:text-white transition-all">
                          <Music size={20} />
                       </div>
                       <div>
                          <p className="text-xl font-bold tracking-tight text-white">{song.title}</p>
                          <p className="text-[10px] uppercase tracking-widest font-black text-white/20 mt-0.5">
                            {song.category} • Key: {song.original_key} {song.tempo && `• ${song.tempo}`}
                          </p>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
            {filteredSongs.length === 0 && (
              <div className="p-32 text-center text-white/10 italic">No songs found.</div>
            )}
         </div>
      </div>
    </div>
  );
};

export default AdminSongs;