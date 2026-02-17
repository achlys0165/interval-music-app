import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Play, Square, Volume2, Eye, Plus, Minus, Zap, Maximize2, 
  Minimize2, Sun, ChevronUp, ChevronDown, Edit2, Mic, 
  Check, X as CloseIcon
} from 'lucide-react';

interface MetronomeProps {
  initialBpm?: number;
  songTitle?: string;
}

type ViewMode = 'collapsed' | 'panel' | 'fullscreen';

const Metronome: React.FC<MetronomeProps> = ({ initialBpm = 120, songTitle }) => {
  const [bpm, setBpm] = useState(initialBpm);
  const [isEditingBpm, setIsEditingBpm] = useState(false);
  const [tempBpm, setTempBpm] = useState(bpm.toString());
  const [isPlaying, setIsPlaying] = useState(false);
  const [useSound, setUseSound] = useState(true);
  const [useVisual, setUseVisual] = useState(true);
  const [isFlashing, setIsFlashing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('collapsed');
  const [flashIntensity, setFlashIntensity] = useState(0.4); 

  const [isListening, setIsListening] = useState(false);
  const [detectedBpm, setDetectedBpm] = useState<number | null>(null);
  
  const audioContext = useRef<AudioContext | null>(null);
  const nextNoteTime = useRef(0);
  const timerID = useRef<number | null>(null);
  const lookahead = 25.0; 
  const scheduleAheadTime = 0.1; 
  const lastTapTime = useRef<number>(0);
  
  const micStream = useRef<MediaStream | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const detectionLoopReq = useRef<number | null>(null);
  const peaks = useRef<{ time: number; volume: number }[]>([]);
  
  const bpmRef = useRef(bpm);
  useEffect(() => {
    bpmRef.current = bpm;
    setTempBpm(bpm.toString());
  }, [bpm]);

  const initAudio = () => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContext.current.state === 'suspended') {
      audioContext.current.resume();
    }
  };

  const playClick = useCallback((time: number) => {
    if (!audioContext.current || !useSound) return;
    const osc = audioContext.current.createOscillator();
    const envelope = audioContext.current.createGain();
    osc.frequency.value = 880;
    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(1, time + 0.001);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    osc.connect(envelope);
    envelope.connect(audioContext.current.destination);
    osc.start(time);
    osc.stop(time + 0.05);
  }, [useSound]);

  const triggerVisual = useCallback(() => {
    if (!useVisual) return;
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 80);
  }, [useVisual]);

  const scheduler = useCallback(() => {
    if (!audioContext.current || !isPlaying) return;
    while (nextNoteTime.current < audioContext.current.currentTime + scheduleAheadTime) {
      const time = nextNoteTime.current;
      playClick(time);
      const delay = (time - audioContext.current.currentTime) * 1000;
      setTimeout(triggerVisual, Math.max(0, delay));
      const secondsPerBeat = 60.0 / bpmRef.current;
      nextNoteTime.current += secondsPerBeat;
    }
    timerID.current = window.setTimeout(scheduler, lookahead);
  }, [isPlaying, playClick, triggerVisual]);

  useEffect(() => {
    if (isPlaying) scheduler();
    return () => { if (timerID.current) clearTimeout(timerID.current); };
  }, [isPlaying, scheduler]);

  const toggleMetronome = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    initAudio();
    if (isPlaying) {
      if (timerID.current) clearTimeout(timerID.current);
      setIsPlaying(false);
      setIsFlashing(false);
    } else {
      nextNoteTime.current = audioContext.current!.currentTime + 0.05;
      setIsPlaying(true);
    }
  };

  const updateBpm = (val: number) => {
    const clamped = Math.min(Math.max(val, 20), 300);
    setBpm(clamped);
  };

  const startListening = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isListening) {
      stopListening();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStream.current = stream;
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = ctx.createMediaStreamSource(stream);
      const node = ctx.createAnalyser();
      node.fftSize = 2048;
      source.connect(node);
      analyser.current = node;
      setIsListening(true);
      peaks.current = [];
      
      const detectLoop = () => {
        if (!analyser.current) return;
        const data = new Uint8Array(analyser.current.frequencyBinCount);
        analyser.current.getByteTimeDomainData(data);
        let maxVal = 0;
        for (let i = 0; i < data.length; i++) {
          const val = Math.abs(data[i] - 128);
          if (val > maxVal) maxVal = val;
        }
        if (maxVal > 45) { 
          const now = Date.now();
          const lastPeak = peaks.current[peaks.current.length - 1];
          if (!lastPeak || now - lastPeak.time > 200) { 
            peaks.current.push({ time: now, volume: maxVal });
            if (peaks.current.length > 8) peaks.current.shift();
            if (peaks.current.length >= 4) {
              const intervals = [];
              for (let i = 1; i < peaks.current.length; i++) {
                intervals.push(peaks.current[i].time - peaks.current[i - 1].time);
              }
              const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
              const estBpm = Math.round(60000 / avgInterval);
              if (estBpm > 40 && estBpm < 250) setDetectedBpm(estBpm);
            }
          }
        }
        detectionLoopReq.current = requestAnimationFrame(detectLoop);
      };
      detectLoop();
    } catch (err) {
      console.error("Mic access denied", err);
    }
  };

  const stopListening = () => {
    if (detectionLoopReq.current) cancelAnimationFrame(detectionLoopReq.current);
    if (micStream.current) micStream.current.getTracks().forEach(t => t.stop());
    setIsListening(false);
    setDetectedBpm(null);
  };

  const handleBpmInputSubmit = () => {
    const val = parseInt(tempBpm);
    if (!isNaN(val)) updateBpm(val);
    else setTempBpm(bpm.toString());
    setIsEditingBpm(false);
  };

  const handleBpmInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleBpmInputSubmit();
    else if (e.key === 'Escape') { 
      setTempBpm(bpm.toString()); 
      setIsEditingBpm(false); 
    }
  };

  const GlobalFlash = () => {
    if (!useVisual) return null;
    return createPortal(
      <div 
        className={`fixed inset-0 z-[9999] pointer-events-none bg-white transition-opacity duration-150 ease-out ${isFlashing ? 'opacity-100' : 'opacity-0'}`}
        style={{ 
          opacity: isFlashing ? flashIntensity : 0,
          transition: isFlashing ? 'none' : 'opacity 150ms ease-out'
        }}
      />,
      document.body
    );
  };

  if (viewMode === 'collapsed') {
    return (
      <div className="mt-auto">
        <button 
          onClick={() => setViewMode('panel')}
          className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full transition-colors ${isPlaying ? 'bg-white animate-pulse shadow-[0_0_10px_white]' : 'bg-white/20'}`} />
            <div className="text-left">
              <p className="text-[10px] uppercase font-black tracking-widest text-white/40">Metronome</p>
              <p className="text-sm font-bold tracking-tighter">{bpm} BPM</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <div onClick={toggleMetronome} className="p-2 bg-white/10 rounded-lg hover:bg-white hover:text-black transition-colors">
               {isPlaying ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
             </div>
             <ChevronUp size={16} className="text-white/20 group-hover:text-white transition-colors" />
          </div>
        </button>
        <GlobalFlash />
      </div>
    );
  }

  return (
    <>
      <GlobalFlash />
      <div className={`${viewMode === 'fullscreen' ? 'fixed inset-0 z-[150] bg-black p-8' : 'bg-white/5 border border-white/10 rounded-2xl p-6'} flex flex-col gap-6 transition-all duration-300`}>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => { stopListening(); setViewMode('collapsed'); }} className="p-1.5 text-white/40 hover:text-white transition-colors">
              <ChevronDown size={viewMode === 'fullscreen' ? 24 : 18} />
            </button>
            <p className={`${viewMode === 'fullscreen' ? 'text-sm' : 'text-[10px]'} uppercase font-black tracking-widest text-white/40`}>
              Metronome Performance
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* REMOVED: AI Suggest BPM button */}
            <button onClick={() => setUseSound(!useSound)} className={`p-2 rounded-lg transition-colors ${useSound ? 'bg-white/10 text-white' : 'text-white/20'}`}>
              <Volume2 size={viewMode === 'fullscreen' ? 24 : 16} />
            </button>
            <button onClick={() => setUseVisual(!useVisual)} className={`p-2 rounded-lg transition-colors ${useVisual ? 'bg-white/10 text-white' : 'text-white/20'}`}>
              <Eye size={viewMode === 'fullscreen' ? 24 : 16} />
            </button>
            <button onClick={() => setViewMode(viewMode === 'fullscreen' ? 'panel' : 'fullscreen')} className="p-2 rounded-lg transition-colors bg-white/10 text-white">
              {viewMode === 'fullscreen' ? <Minimize2 size={24} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>

        <div className={`relative flex-1 flex flex-col items-center justify-center rounded-3xl overflow-hidden border border-white/5 group ${viewMode === 'fullscreen' ? 'bg-white/5' : 'bg-black/40 py-8'}`}>
          <div className="absolute inset-0 bg-white pointer-events-none" style={{ opacity: isFlashing && useVisual ? flashIntensity * 0.2 : 0, transition: isFlashing ? 'none' : 'opacity 150ms ease-out' }} />
          
          {isListening && (
            <div className="absolute top-6 flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-widest animate-bounce z-20">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> Listening to Rehearsal...
            </div>
          )}

          <div className="text-center z-10 select-none relative">
            {!isEditingBpm ? (
              <div className="cursor-pointer relative inline-block group" onClick={() => setIsEditingBpm(true)}>
                <span className={`${viewMode === 'fullscreen' ? 'text-[12rem] sm:text-[18rem]' : 'text-7xl'} font-black tracking-tighter italic leading-none block transition-all`}>
                  {bpm}
                </span>
                <div className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 transition-opacity flex items-center gap-2">
                   <Edit2 size={viewMode === 'fullscreen' ? 32 : 16} />
                   <span className="text-[10px] uppercase font-bold tracking-widest hidden sm:block">Edit</span>
                </div>
              </div>
            ) : (
              <div className="relative inline-block">
                <input
                  type="number" 
                  autoFocus 
                  className={`${viewMode === 'fullscreen' ? 'text-[12rem] sm:text-[18rem] w-[40rem]' : 'text-7xl w-48'} bg-transparent border-b-2 border-white/20 font-black tracking-tighter italic leading-none text-center outline-none transition-all`}
                  value={tempBpm} 
                  onChange={(e) => setTempBpm(e.target.value)} 
                  onBlur={handleBpmInputSubmit} 
                  onKeyDown={handleBpmInputKeyDown}
                />
                <button onClick={handleBpmInputSubmit} className="absolute -right-12 top-1/2 -translate-y-1/2 p-2 bg-white text-black rounded-full">
                  <Check size={20} />
                </button>
              </div>
            )}
            <span className={`${viewMode === 'fullscreen' ? 'text-2xl mt-4' : 'text-xs mt-2'} uppercase tracking-[0.3em] text-white/20 font-bold block`}>
              Tempo (BPM)
            </span>
            
            {detectedBpm && isListening && (
              <div className="mt-8 flex flex-col items-center gap-2">
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold flex items-center gap-2">
                  <Mic size={10} /> Live Detection Result
                </p>
                <div className="flex items-center gap-4">
                  <span className="text-5xl font-black italic text-white">{detectedBpm}</span>
                  <button 
                    onClick={() => { updateBpm(detectedBpm); stopListening(); }} 
                    className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                  >
                    <Check size={16} /> Apply Sync
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`space-y-6 ${viewMode === 'fullscreen' ? 'max-w-2xl mx-auto w-full' : ''}`}>
          <div className="space-y-2 px-1">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-white/20">
               <div className="flex items-center gap-2"><Sun size={12} /> Flash Intensity (0-100%)</div>
               <span className="text-white font-mono">{Math.round(flashIntensity * 100)}%</span>
            </div>
            <input type="range" min="0" max="1.0" step="0.01" value={flashIntensity} onChange={(e) => setFlashIntensity(parseFloat(e.target.value))} className="w-full accent-white h-2 bg-white/10 rounded-full appearance-none cursor-pointer" />
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => updateBpm(bpm - 1)} className={`${viewMode === 'fullscreen' ? 'h-24' : 'h-14'} flex-1 border border-white/10 rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center`}>
              <Minus size={viewMode === 'fullscreen' ? 32 : 20} />
            </button>
            <button onClick={toggleMetronome} className={`${viewMode === 'fullscreen' ? 'w-32 h-32' : 'w-20 h-20'} rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-white text-black scale-95 shadow-[0_0_30px_rgba(255,255,255,0.3)]' : 'bg-white/10 text-white hover:bg-white/20'}`}>
              {isPlaying ? <Square size={viewMode === 'fullscreen' ? 40 : 28} fill="currentColor" /> : <Play size={viewMode === 'fullscreen' ? 40 : 28} fill="currentColor" className="ml-1" />}
            </button>
            <button onClick={() => updateBpm(bpm + 1)} className={`${viewMode === 'fullscreen' ? 'h-24' : 'h-14'} flex-1 border border-white/10 rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center`}>
              <Plus size={viewMode === 'fullscreen' ? 32 : 20} />
            </button>
          </div>

          <div className="flex gap-2">
             <button 
              onClick={startListening} 
              className={`flex-1 ${viewMode === 'fullscreen' ? 'py-6' : 'py-4'} border border-white/10 rounded-2xl font-black uppercase tracking-widest flex flex-col items-center justify-center gap-1 transition-all ${isListening ? 'bg-white text-black' : 'bg-white/5 hover:bg-white/10'}`}
             >
               <div className="flex items-center gap-2">
                {isListening ? <CloseIcon size={14} /> : <Mic size={14} />} 
                <span>{isListening ? 'Stop' : 'Listen'}</span>
               </div>
               <span className="text-[8px] opacity-40 font-bold">Auto Detect</span>
             </button>
             <button 
              onClick={() => { 
                const now = Date.now(); 
                if (lastTapTime.current > 0) {
                  const diff = now - lastTapTime.current;
                  if (diff < 2000) updateBpm(Math.round(60000 / diff));
                }
                lastTapTime.current = now; 
              }} 
              className={`flex-[2] ${viewMode === 'fullscreen' ? 'py-6 text-sm' : 'py-4 text-[10px]'} bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:bg-white/90 active:scale-95 transition-all flex items-center justify-center gap-3`}
             >
               <Zap size={viewMode === 'fullscreen' ? 20 : 12} /> Tap Tempo Beat
             </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Metronome;