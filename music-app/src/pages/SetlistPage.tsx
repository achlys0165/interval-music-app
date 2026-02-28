import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Music, Filter, ExternalLink, Plus, X, Check, Calendar } from 'lucide-react';
import SongDetailModal from '../components/SongDetailModal';
import { Song, UserRole } from '../types';

const SetlistPage: React.FC = () => {
  const { user } = useAuth();
  const { songs, setlists, updateSetlist, loading } = useData();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string | 'All'>('All');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN;

  // Generate next 8 Sundays
  const nextSundays = useMemo(() => {
    const sundays = [];
    const date = new Date();
    date.setDate(date.getDate() + (7 - date.getDay()) % 7);
    if (date.getTime() < new Date().getTime()) {
      date.setDate(date.getDate() + 7);
    }
    for (let i = 0; i < 8; i++) {
      const d = new Date(date);
      sundays.push(d.toISOString().split('T')[0]);
      date.setDate(date.getDate() + 7);
    }
    return sundays;
  }, []);

  // Get current setlist for selected date
  const currentSetlist = useMemo(() => {
    if (!selectedDate) return null;
    return setlists.find(s => s.date === selectedDate);
  }, [setlists, selectedDate]);

  // Get songs for selected date
  const dateSongs = useMemo(() => {
    if (!currentSetlist) return [];
    return songs.filter(s => currentSetlist.song_ids.includes(s.id));
  }, [currentSetlist, songs]);

  // Filtered songs for admin selection
  const filteredSongs = useMemo(() => {
    if (!isEditing || !isAdmin) return [];
    return songs.filter(song => {
      if (activeCategory === 'All') return true;
      return song.category === activeCategory;
    });
  }, [songs, activeCategory, isEditing, isAdmin]);

  const handleEdit = () => {
    if (!isAdmin) return;
    setSelectedSongs(currentSetlist?.song_ids || []);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!isAdmin || !selectedDate) return;
    setIsSaving(true);
    try {
      await updateSetlist({ date: selectedDate, song_ids: selectedSongs });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving setlist:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSong = (songId: string) => {
    setSelectedSongs(prev => 
      prev.includes(songId) 
        ? prev.filter(id => id !== songId)
        : [...prev, songId]
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

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
          <h1 className="text-3xl font-bold italic tracking-tighter">SUNDAY SETLISTS</h1>
          <p className="text-white/40 mt-1 uppercase text-xs tracking-[0.2em]">
            {isAdmin ? 'Plan and manage service setlists' : 'View upcoming service setlists'}
          </p>
        </div>
        
        {/* Date Selector */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={14} />
            <select 
              className="bg-[#0a0a0a] border border-white/10 rounded-full py-2 pl-9 pr-8 text-xs appearance-none focus:outline-none cursor-pointer text-white"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setIsEditing(false);
              }}
            >
              <option value="">Select Sunday...</option>
              {nextSundays.map(d => (
                <option key={d} value={d}>{formatDate(d)}</option>
              ))}
            </select>
          </div>
          
          {isAdmin && selectedDate && !isEditing && (
            <button 
              onClick={handleEdit}
              className="px-6 py-2 bg-white text-black rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white/90 transition-all"
            >
              Edit Setlist
            </button>
          )}
          
          {isAdmin && isEditing && (
            <div className="flex gap-2">
              <button 
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-white/20 text-white/60 rounded-full text-xs font-bold uppercase tracking-widest hover:border-white/40 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-white text-black rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white/90 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? 'Saving...' : <><Check size={12} /> Save</>}
              </button>
            </div>
          )}
        </div>
      </header>

      {!selectedDate ? (
        <div className="py-20 text-center text-white/20 border-2 border-dashed border-white/5 rounded-3xl">
          <Calendar size={48} className="mx-auto mb-4 opacity-20" />
          <p className="italic">Select a Sunday to view the setlist.</p>
        </div>
      ) : isEditing && isAdmin ? (
        // Admin Edit Mode
        <div className="space-y-6">
          <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/5">
            {['All', 'Worship', 'Choir', 'Special'].map(cat => (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2 rounded-full text-xs font-bold transition-all uppercase tracking-widest whitespace-nowrap ${activeCategory === cat ? 'bg-white text-black' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSongs.map(song => {
              const isSelected = selectedSongs.includes(song.id);
              return (
                <button
                  key={song.id}
                  onClick={() => toggleSong(song.id)}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                    isSelected 
                      ? 'bg-white text-black border-white' 
                      : 'bg-[#0a0a0a] border-white/10 hover:border-white/30 text-white'
                  }`}
                >
                  <div>
                    <p className="font-bold">{song.title}</p>
                    <p className="text-[10px] uppercase tracking-widest opacity-60 mt-1">
                      {song.category} • {song.original_key}
                    </p>
                  </div>
                  {isSelected && <Check size={18} />}
                </button>
              );
            })}
          </div>

          {filteredSongs.length === 0 && (
            <div className="py-12 text-center text-white/20">
              <p>No songs available. Add songs in the Song Vault first.</p>
            </div>
          )}

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4">
              Selected ({selectedSongs.length})
            </h3>
            {selectedSongs.length === 0 ? (
              <p className="text-white/20 italic text-sm">No songs selected yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedSongs.map(songId => {
                  const song = songs.find(s => s.id === songId);
                  if (!song) return null;
                  return (
                    <span 
                      key={songId} 
                      className="px-3 py-1.5 bg-white text-black rounded-full text-xs font-bold flex items-center gap-2"
                    >
                      {song.title}
                      <button 
                        onClick={() => toggleSong(songId)}
                        className="hover:text-red-500"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        // View Mode (Musician & Admin)
        <div className="space-y-6">
          {dateSongs.length === 0 ? (
            <div className="py-20 text-center text-white/20 border-2 border-dashed border-white/5 rounded-3xl">
              <Music size={48} className="mx-auto mb-4 opacity-20" />
              <p className="italic">No songs planned for this service yet.</p>
              {isAdmin && (
                <button 
                  onClick={handleEdit}
                  className="mt-4 px-6 py-2 bg-white/10 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-all"
                >
                  Create Setlist
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dateSongs.map((song, index) => (
                <div 
                  key={song.id} 
                  onClick={() => setSelectedSong(song)}
                  className="group bg-[#0a0a0a] border border-white/10 p-6 rounded-2xl hover:border-white/40 hover:bg-white/[0.02] transition-all relative overflow-hidden cursor-pointer"
                >
                   <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-black italic text-white/20">{index + 1}</span>
                        <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white group-hover:text-black transition-all">
                            <Music size={18} />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {song.reference_url && (
                          <a 
                            href={song.reference_url} 
                            target="_blank" 
                            rel="noreferrer" 
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 text-white/30 hover:text-white transition-colors"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 border border-white/10 px-2 py-1 rounded">
                            Key: {song.original_key}
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
          )}
        </div>
      )}

      <SongDetailModal song={selectedSong} onClose={() => setSelectedSong(null)} />
    </div>
  );
};

export default SetlistPage;