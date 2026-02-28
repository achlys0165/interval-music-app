import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Music, ExternalLink, Plus, X, Check, Calendar } from 'lucide-react';
import SongDetailModal from '../components/SongDetailModal';
import CalendarPicker from '../components/CalendarPicker';
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
      weekday: 'long',
      month: 'long', 
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
      </header>

      {/* Date Selection with Calendar */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6">
        <div className="flex flex-col md:flex-row gap-6 items-end">
          <div className="w-full md:w-80">
            <CalendarPicker
              label="Select Service Date"
              selectedDate={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                setIsEditing(false);
              }}
            />
          </div>
          
          {isAdmin && selectedDate && !isEditing && (
            <button 
              onClick={handleEdit}
              className="px-8 py-4 bg-white text-black rounded-xl font-black uppercase text-xs tracking-widest hover:bg-white/90 transition-all"
            >
              {currentSetlist ? 'Edit Setlist' : 'Create Setlist'}
            </button>
          )}
          
          {isAdmin && isEditing && (
            <div className="flex gap-3">
              <button 
                onClick={() => setIsEditing(false)}
                className="px-6 py-4 border border-white/20 text-white/60 rounded-xl font-black uppercase text-xs tracking-widest hover:border-white/40 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-8 py-4 bg-white text-black rounded-xl font-black uppercase text-xs tracking-widest hover:bg-white/90 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? 'Saving...' : <><Check size={14} /> Save Setlist</>}
              </button>
            </div>
          )}
        </div>
      </div>

      {!selectedDate ? (
        <div className="py-20 text-center text-white/20 border-2 border-dashed border-white/5 rounded-3xl">
          <Calendar size={48} className="mx-auto mb-4 opacity-20" />
          <p className="italic">Select a date to view the setlist.</p>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSongs.map(song => {
              const isSelected = selectedSongs.includes(song.id);
              return (
                <button
                  key={song.id}
                  onClick={() => toggleSong(song.id)}
                  className={`p-5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                    isSelected 
                      ? 'bg-white text-black border-white' 
                      : 'bg-[#0a0a0a] border-white/10 hover:border-white/30 text-white'
                  }`}
                >
                  <div>
                    <p className="font-bold text-lg">{song.title}</p>
                    <p className="text-[10px] uppercase tracking-widest opacity-60 mt-1">
                      {song.category} • {song.original_key}
                    </p>
                  </div>
                  {isSelected && <Check size={20} />}
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
              Selected Songs ({selectedSongs.length})
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
                      className="px-4 py-2 bg-white text-black rounded-full text-sm font-bold flex items-center gap-2"
                    >
                      {song.title}
                      <button 
                        onClick={() => toggleSong(songId)}
                        className="hover:text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        // View Mode
        <div className="space-y-6">
          <h2 className="text-xl font-black italic">
            {formatDate(selectedDate)}
          </h2>
          
          {dateSongs.length === 0 ? (
            <div className="py-20 text-center text-white/20 border-2 border-dashed border-white/5 rounded-3xl">
              <Music size={48} className="mx-auto mb-4 opacity-20" />
              <p className="italic">No songs planned for this service yet.</p>
              {isAdmin && (
                <button 
                  onClick={handleEdit}
                  className="mt-4 px-6 py-3 bg-white/10 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-all"
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