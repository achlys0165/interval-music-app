
import React, { useState, useMemo } from 'react';
import { useData } from '../App';
import { Search as SearchIcon, ExternalLink, Music } from 'lucide-react';
import SongDetailModal from '../components/SongDetailModal';
import { Song } from '../types';

const SearchPage: React.FC = () => {
  const { songs } = useData();
  const [query, setQuery] = useState('');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  const filteredSongs = useMemo(() => {
    return songs.filter(s => 
      s.title.toLowerCase().includes(query.toLowerCase()) || 
      s.category.toLowerCase().includes(query.toLowerCase()) ||
      s.original_key.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, songs]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold italic tracking-tighter">SONG LIBRARY</h1>
        <p className="text-white/40 mt-1 uppercase text-xs tracking-[0.2em]">Search across our entire musical repository</p>
      </header>

      <div className="space-y-6">
        <div className="relative group">
           <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" size={24} />
           <input 
            type="text" 
            placeholder="Type song title, key, or category..."
            className="w-full bg-[#0a0a0a] border-2 border-white/5 rounded-[2rem] py-6 pl-16 pr-8 text-xl focus:outline-none focus:border-white/20 focus:bg-white/[0.03] transition-all placeholder:text-white/10 font-medium"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
           />
        </div>

        <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.3em] text-white/30">
                <th className="px-8 py-4 font-black">Title</th>
                <th className="px-8 py-4 font-black">Category</th>
                <th className="px-8 py-4 font-black">Org. Key</th>
                <th className="px-8 py-4 font-black text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredSongs.map(song => (
                <tr 
                  key={song.id} 
                  className="group hover:bg-white/[0.02] transition-colors cursor-pointer"
                  onClick={() => setSelectedSong(song)}
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white group-hover:bg-white/10 transition-all">
                          <Music size={18} />
                       </div>
                       <span className="font-bold text-lg group-hover:translate-x-1 transition-transform inline-block">{song.title}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                     <span className="text-xs text-white/40">{song.category}</span>
                  </td>
                  <td className="px-8 py-6">
                     <span className="text-sm font-mono text-white/60">{song.original_key}</span>
                  </td>
                  <td className="px-8 py-6 text-right">
                     <button className="p-2 text-white/20 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                        <ExternalLink size={18} />
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredSongs.length === 0 && (
            <div className="p-20 text-center">
              <p className="text-white/20 italic">No songs found in the library matching "{query}".</p>
            </div>
          )}
        </div>
      </div>

      <SongDetailModal 
        song={selectedSong} 
        onClose={() => setSelectedSong(null)} 
      />
    </div>
  );
};

export default SearchPage;
