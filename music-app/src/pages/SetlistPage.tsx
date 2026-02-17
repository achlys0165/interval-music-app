
import React, { useState } from 'react';
import { useData } from '../App';
import { Music, Filter, ExternalLink } from 'lucide-react';
import SongDetailModal from '../components/SongDetailModal';
import { Song } from '../types';

const SetlistPage: React.FC = () => {
  const { songs, setlists } = useData();
  const [selectedDate, setSelectedDate] = useState<string | 'All'>('All');
  const [activeCategory, setActiveCategory] = useState<string | 'All'>('All');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  const dates = Array.from(new Set(setlists.map(s => s.date))).sort();

  const filteredSongs = songs.filter(song => {
    const categoryMatch = activeCategory === 'All' || song.category === activeCategory;
    const scheduleMatch = selectedDate === 'All' || setlists.find(s => s.date === selectedDate)?.songIds.includes(song.id);
    return categoryMatch && scheduleMatch;
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold italic tracking-tighter">SUNDAY SETLISTS</h1>
          <p className="text-white/40 mt-1 uppercase text-xs tracking-[0.2em]">Planned repertoire for the month ahead</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={14} />
                <select 
                  className="bg-[#0a0a0a] border border-white/10 rounded-full py-2 pl-9 pr-8 text-xs appearance-none focus:outline-none cursor-pointer"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                >
                    <option value="All">All Service Dates</option>
                    {dates.map(d => (
                        <option key={d} value={d}>{new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</option>
                    ))}
                </select>
            </div>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/5">
        {['All', 'Worship', 'Choir', 'Special'].map(cat => (
          <button 
            key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-6 py-2 rounded-full text-xs font-bold transition-all uppercase tracking-widest whitespace-nowrap ${activeCategory === cat ? 'bg-white text-black' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSongs.map(song => (
          <div 
            key={song.id} 
            onClick={() => setSelectedSong(song)}
            className="group bg-[#0a0a0a] border border-white/10 p-6 rounded-2xl hover:border-white/40 hover:bg-white/[0.02] transition-all relative overflow-hidden cursor-pointer"
          >
             <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white group-hover:text-black transition-all">
                    <Music size={18} />
                </div>
                <div className="flex gap-2">
                  {song.referenceUrl && (
                    <a 
                      href={song.referenceUrl} target="_blank" rel="noreferrer" 
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 text-white/30 hover:text-white transition-colors"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 border border-white/10 px-2 py-1 rounded">
                      Key: {song.originalKey}
                  </span>
                </div>
             </div>
             <h3 className="text-lg font-bold group-hover:translate-x-1 transition-transform">{song.title}</h3>
             <div className="flex items-center gap-3 mt-4">
                <span className="text-[10px] text-white/40 uppercase tracking-widest px-2 py-1 bg-white/5 rounded">{song.category}</span>
                {song.tempo && <span className="text-[10px] text-white/40 uppercase tracking-widest px-2 py-1 bg-white/5 rounded">Tempo: {song.tempo}</span>}
             </div>
          </div>
        ))}
      </div>

      {filteredSongs.length === 0 && (
        <div className="py-20 text-center text-white/20 border-2 border-dashed border-white/5 rounded-3xl">
          <p className="italic">No songs planned for this service yet.</p>
        </div>
      )}

      <SongDetailModal song={selectedSong} onClose={() => setSelectedSong(null)} />
    </div>
  );
};

export default SetlistPage;
