import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Music, ExternalLink, Plus, X, Check, Calendar } from 'lucide-react';
import SongDetailModal from '../components/SongDetailModal';
import CalendarPicker from '../components/CalendarPicker';
import { Song, UserRole, SetlistCategory, SetlistSongItem } from '../types';

const SETLIST_CATEGORIES: SetlistCategory[] = ['Worship', 'Choir', 'Special', 'Prelude', 'Offertory', 'Communion', 'Recessional', 'Postlude'];

interface SetlistSongWithData extends SetlistSongItem {
  song?: Song;
}

const SetlistPage: React.FC = () => {
  const { user } = useAuth();
  const { songs, setlists, updateSetlist, loading } = useData();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string | 'All'>('All');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSongs, setSelectedSongs] = useState<SetlistSongItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [categoryForNextSong, setCategoryForNextSong] = useState<SetlistCategory>('Worship');

  const isAdmin = user?.role === UserRole.ADMIN;

  // Get current setlist for selected date
  const currentSetlist = useMemo(() => {
    if (!selectedDate) return null;
    return setlists.find(s => s.date === selectedDate);
  }, [setlists, selectedDate]);

  // Get songs for selected date with their service-specific categories
  const dateSongs = useMemo(() => {
    if (!currentSetlist) return [];
    
    return (currentSetlist.song_ids as (string | SetlistSongItem)[])
      .map((item: string | SetlistSongItem, index: number) => {
        const songId = typeof item === 'string' ? item : item.song_id;
        const song = songs.find(s => s.id === songId);
        if (!song) return null;
        
        return {
          ...song,
          service_category: typeof item === 'string' ? (song.category as SetlistCategory) : item.category_for_service,
          order: typeof item === 'string' ? index : item.order
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .sort((a, b) => a.order - b.order);
  }, [currentSetlist, songs]);

  // Group songs by their service category
  const groupedSongs = useMemo(() => {
    const grouped: Record<string, typeof dateSongs> = {};
    SETLIST_CATEGORIES.forEach(cat => {
      grouped[cat] = dateSongs.filter(s => s.service_category === cat);
    });
    return grouped;
  }, [dateSongs]);

  // Filtered songs for admin selection (from vault)
  const filteredSongs = useMemo(() => {
    if (!isEditing || !isAdmin) return [];
    return songs.filter(song => {
      // Don't show already selected songs
      if (selectedSongs.some(s => s.song_id === song.id)) return false;
      
      if (activeCategory === 'All') return true;
      return song.category === activeCategory;
    });
  }, [songs, activeCategory, isEditing, isAdmin, selectedSongs]);

  const handleEdit = () => {
    if (!isAdmin) return;
    // Convert existing setlist to new format if needed
    const existing: SetlistSongItem[] = (currentSetlist?.song_ids || [])
      .map((item: string | SetlistSongItem, index: number) => {
        if (typeof item === 'string') {
          const song = songs.find(s => s.id === item);
          return {
            song_id: item,
            category_for_service: (song?.category as SetlistCategory) || 'Worship',
            order: index
          };
        }
        return item as SetlistSongItem;
      });
    setSelectedSongs(existing);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!isAdmin || !selectedDate) return;
    setIsSaving(true);
    try {
      // Save with category info
      await updateSetlist({ 
        date: selectedDate, 
        song_ids: selectedSongs.map(s => ({
          song_id: s.song_id,
          category_for_service: s.category_for_service,
          order: s.order
        }))
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving setlist:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const addSong = (songId: string) => {
    const newItem: SetlistSongItem = {
      song_id: songId,
      category_for_service: categoryForNextSong,
      order: selectedSongs.filter(s => s.category_for_service === categoryForNextSong).length
    };
    setSelectedSongs([...selectedSongs, newItem]);
  };

  const removeSong = (songId: string, category: SetlistCategory) => {
    const newSelected = selectedSongs.filter(s => !(s.song_id === songId && s.category_for_service === category));
    // Recalculate orders for affected category
    const recalculated = newSelected.map(s => {
      if (s.category_for_service === category) {
        const sameCategory = newSelected.filter(x => x.category_for_service === category);
        const newOrder = sameCategory.findIndex(x => x.song_id === s.song_id);
        return { ...s, order: newOrder };
      }
      return s;
    });
    setSelectedSongs(recalculated);
  };

  const moveSong = (songId: string, category: SetlistCategory, direction: 'up' | 'down') => {
    const categorySongs = selectedSongs.filter(s => s.category_for_service === category);
    const currentIndex = categorySongs.findIndex(s => s.song_id === songId);
    
    if (
      (direction === 'up' && currentIndex === 0) || 
      (direction === 'down' && currentIndex === categorySongs.length - 1)
    ) return;

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const currentItem = categorySongs[currentIndex];
    const swapItem = categorySongs[swapIndex];

    if (!currentItem || !swapItem) return;

    const newSelected = selectedSongs.map(s => {
      if (s.song_id === currentItem.song_id && s.category_for_service === category) {
        return { ...s, order: swapItem.order };
      }
      if (s.song_id === swapItem.song_id && s.category_for_service === category) {
        return { ...s, order: currentItem.order };
      }
      return s;
    });
    
    setSelectedSongs(newSelected);
  };

  const changeSongCategory = (songId: string, oldCategory: SetlistCategory, newCategory: SetlistCategory) => {
    const newSelected = selectedSongs.map(s => {
      if (s.song_id === songId && s.category_for_service === oldCategory) {
        return {
          ...s,
          category_for_service: newCategory,
          order: selectedSongs.filter(x => x.category_for_service === newCategory).length
        };
      }
      return s;
    });
    setSelectedSongs(newSelected);
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
    <div className="space-y-8 max-w-7xl mx-auto px-4">
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
          <div className="w-full md:w-80 flex-shrink-0">
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
        // Admin Edit Mode with Category Assignment
        <div className="space-y-6">
          {/* Category selector for next song */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-4">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-3 block">
              Category for Next Song
            </label>
            <div className="flex flex-wrap gap-2">
              {SETLIST_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryForNextSong(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                    categoryForNextSong === cat
                      ? 'bg-white text-black'
                      : 'bg-black border border-white/10 text-white/60 hover:border-white/30'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Vault filters */}
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Available Songs */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-white/40">
                Song Vault ({filteredSongs.length})
              </h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {filteredSongs.map(song => (
                  <button
                    key={song.id}
                    onClick={() => addSong(song.id)}
                    className="w-full p-4 bg-[#0a0a0a] border border-white/10 rounded-xl hover:border-white/30 hover:bg-white/[0.02] transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white">{song.title}</p>
                        <p className="text-[10px] uppercase text-white/40 mt-1">
                          Vault: {song.category} • Key: {song.original_key}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-white/30 uppercase">
                          Add as {categoryForNextSong}
                        </span>
                        <Plus size={18} className="text-white/40 group-hover:text-white" />
                      </div>
                    </div>
                  </button>
                ))}
                {filteredSongs.length === 0 && (
                  <p className="text-white/20 text-center py-8 italic">No songs available</p>
                )}
              </div>
            </div>

            {/* Selected Setlist - Grouped by Category */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-white/40">
                Selected Songs ({selectedSongs.length})
              </h3>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {SETLIST_CATEGORIES.map(category => {
                  const categorySongs = selectedSongs
                    .filter(s => s.category_for_service === category)
                    .sort((a, b) => a.order - b.order);
                  
                  if (categorySongs.length === 0) return null;

                  return (
                    <div key={category} className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-4">
                      <h4 className="text-[10px] uppercase font-black text-white/40 tracking-widest mb-3 flex items-center justify-between">
                        {category}
                        <span className="bg-white/10 px-2 py-1 rounded-full">{categorySongs.length}</span>
                      </h4>
                      <div className="space-y-2">
                        {categorySongs.map((item, idx) => {
                          const song = songs.find(s => s.id === item.song_id);
                          if (!song) return null;
                          
                          return (
                            <div 
                              key={`${item.song_id}-${category}`}
                              className="flex items-center gap-2 p-3 bg-black border border-white/5 rounded-xl group"
                            >
                              <div className="flex flex-col gap-1">
                                <button 
                                  onClick={() => moveSong(item.song_id, category, 'up')}
                                  disabled={idx === 0}
                                  className="text-white/20 hover:text-white disabled:opacity-10 text-xs"
                                >
                                  ▲
                                </button>
                                <button 
                                  onClick={() => moveSong(item.song_id, category, 'down')}
                                  disabled={idx === categorySongs.length - 1}
                                  className="text-white/20 hover:text-white disabled:opacity-10 text-xs"
                                >
                                  ▼
                                </button>
                              </div>
                              
                              <span className="text-lg font-black italic text-white/20 w-6 text-center">
                                {idx + 1}
                              </span>
                              
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm truncate text-white">{song.title}</p>
                                <p className="text-[10px] text-white/40">
                                  {song.original_key} • {song.tempo || 'No tempo'}
                                </p>
                              </div>

                              {/* Category changer */}
                              <select
                                value={category}
                                onChange={(e) => changeSongCategory(item.song_id, category, e.target.value as SetlistCategory)}
                                className="bg-black border border-white/10 rounded-lg text-[10px] uppercase py-1 px-2 text-white/60 focus:border-white/30 outline-none"
                              >
                                {SETLIST_CATEGORIES.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>

                              <button
                                onClick={() => removeSong(item.song_id, category)}
                                className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors text-white/40"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                
                {selectedSongs.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl">
                    <p className="text-white/20 italic text-sm">No songs selected yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // View Mode - Grouped by Service Category
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
            <div className="space-y-8">
              {SETLIST_CATEGORIES.map(category => {
                const categorySongs = groupedSongs[category];
                if (categorySongs.length === 0) return null;

                return (
                  <div key={category} className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-white/40 border-b border-white/10 pb-2">
                      {category}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categorySongs.map((song, index) => (
                        <div 
                          key={song.id} 
                          onClick={() => setSelectedSong(song)}
                          className="group bg-[#0a0a0a] border border-white/10 p-5 rounded-2xl hover:border-white/40 hover:bg-white/[0.02] transition-all relative overflow-hidden cursor-pointer"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-xl font-black italic text-white/20">{index + 1}</span>
                              <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white group-hover:text-black transition-all">
                                <Music size={16} />
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
                                {song.original_key}
                              </span>
                            </div>
                          </div>
                          <h3 className="text-base font-bold group-hover:translate-x-1 transition-transform truncate">{song.title}</h3>
                          <div className="flex items-center gap-2 mt-3">
                            <span className="text-[10px] text-white/40 uppercase tracking-widest px-2 py-1 bg-white/5 rounded">
                              Vault: {song.category}
                            </span>
                            {song.tempo && (
                              <span className="text-[10px] text-white/40 uppercase tracking-widest px-2 py-1 bg-white/5 rounded">
                                {song.tempo}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <SongDetailModal song={selectedSong} onClose={() => setSelectedSong(null)} />
    </div>
  );
};

export default SetlistPage;