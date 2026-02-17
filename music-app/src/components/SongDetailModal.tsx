import React, { useState, useMemo } from 'react';
import { Song } from '../types';
import { X, Plus, Minus, RotateCcw, Copy, Music, ExternalLink } from 'lucide-react';
import Metronome from './Metronome';

// Define locally instead of importing from constants
const CHROMATIC_SCALE = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
];

interface SongDetailModalProps {
  song: Song | null;
  onClose: () => void;
}

const SongDetailModal: React.FC<SongDetailModalProps> = ({ song, onClose }) => {
  const [transposeOffset, setTransposeOffset] = useState(0);

  // Extract numeric BPM from tempo string (e.g., "76 BPM" -> 76)
  const songBpm = useMemo(() => {
    if (!song?.tempo) return 120;
    const match = song.tempo.match(/\d+/);
    return match ? parseInt(match[0]) : 120;
  }, [song]);

  const transposeChord = (chord: string, offset: number): string => {
    return chord.replace(/[A-G][b#]?/g, (match) => {
      const index = CHROMATIC_SCALE.indexOf(match);
      if (index === -1) {
        const flatMap: Record<string, string> = { 'Bb': 'A#', 'Eb': 'D#', 'Ab': 'G#', 'Db': 'C#', 'Gb': 'F#' };
        const mappedMatch = flatMap[match] || match;
        const mappedIndex = CHROMATIC_SCALE.indexOf(mappedMatch);
        if (mappedIndex === -1) return match;
        let newIndex = (mappedIndex + offset) % 12;
        while (newIndex < 0) newIndex += 12;
        return CHROMATIC_SCALE[newIndex];
      }
      let newIndex = (index + offset) % 12;
      while (newIndex < 0) newIndex += 12;
      return CHROMATIC_SCALE[newIndex];
    });
  };

  const transposedSheet = useMemo(() => {
    if (!song?.lyrics) return '';
    if (transposeOffset === 0) return song.lyrics;
    const chordRegex = /\b([A-G][b#]?(m|maj|min|aug|dim|sus|add|maj7|m7|7|6|9|11|13|b5|#5|#11)?(\/[A-G][b#]?)?)\b/g;
    return song.lyrics.split('\n').map(line => line.replace(chordRegex, (match) => transposeChord(match, transposeOffset))).join('\n');
  }, [song, transposeOffset]);

  const currentKey = useMemo(() => {
    if (!song) return 'C';
    const originalIndex = CHROMATIC_SCALE.indexOf(song.original_key);
    let newIndex = (originalIndex + transposeOffset) % 12;
    while (newIndex < 0) newIndex += 12;
    return CHROMATIC_SCALE[newIndex];
  }, [song, transposeOffset]);

  if (!song) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0a0a0a] border border-white/10 w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black">
          <div>
            <h2 className="text-2xl font-black italic tracking-tighter">{song.title}</h2>
            <p className="text-xs text-white/40 uppercase tracking-widest mt-1">
              {song.category} • Original Key: {song.original_key}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-3">
          <div className="p-6 border-b lg:border-b-0 lg:border-r border-white/5 bg-[#050505] flex flex-col gap-8">
            <div className="text-center space-y-4">
              <p className="text-[10px] uppercase font-black tracking-widest text-white/20">Current Key</p>
              <div className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center text-3xl font-black mx-auto shadow-2xl">
                {currentKey}
              </div>
              <div className="flex items-center justify-center gap-3">
                <button 
                  onClick={() => setTransposeOffset(prev => prev - 1)} 
                  className="p-2 border border-white/10 rounded-lg hover:bg-white hover:text-black transition-all"
                >
                  <Minus size={18} />
                </button>
                <span className="text-sm font-bold min-w-[40px]">
                  {transposeOffset > 0 ? `+${transposeOffset}` : transposeOffset}
                </span>
                <button 
                  onClick={() => setTransposeOffset(prev => prev + 1)} 
                  className="p-2 border border-white/10 rounded-lg hover:bg-white hover:text-black transition-all"
                >
                  <Plus size={18} />
                </button>
              </div>
              <button 
                onClick={() => setTransposeOffset(0)} 
                className="text-[10px] uppercase font-bold text-white/20 hover:text-white flex items-center gap-2 mx-auto pt-2"
              >
                <RotateCcw size={12} /> Reset to Original
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                <p className="text-[10px] uppercase font-black tracking-widest text-white/20">Resources</p>
                {song.reference_url ? (
                  <a 
                    href={song.reference_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center justify-between w-full p-3 bg-white text-black rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white/90 transition-all"
                  >
                    Open Reference <ExternalLink size={14} />
                  </a>
                ) : (
                  <p className="text-[10px] text-white/20 italic">No external link available.</p>
                )}
              </div>
            </div>

            <Metronome initialBpm={songBpm} songTitle={song.title} />
          </div>

          <div className="lg:col-span-2 p-8 bg-black/40 relative">
            <div className="flex items-center justify-between mb-6">
               <h3 className="font-bold flex items-center gap-2 italic uppercase">
                 <Music size={18} className="text-white/40" /> Performance Sheet
               </h3>
               <button 
                 onClick={() => navigator.clipboard.writeText(transposedSheet)} 
                 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:text-white text-white/30 transition-colors"
               >
                 <Copy size={12} /> Copy Transposed
               </button>
            </div>
            <div className="bg-[#050505] p-6 rounded-2xl border border-white/5 h-full min-h-[400px]">
              <pre className="font-mono text-sm leading-relaxed text-white/80 whitespace-pre-wrap">
                {transposedSheet || "No content."}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongDetailModal;