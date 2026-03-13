import React from 'react';
import { useAudio } from '../AudioContext';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AudioPlayer: React.FC = () => {
  const { currentEpisode, isPlaying, togglePlay, progress, duration, seek } = useAudio();

  if (!currentEpisode) return null;

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(Number(e.target.value));
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="fixed bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800 px-4 py-3 z-50"
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 items-center gap-4">
          {/* Episode Info */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-zinc-800 rounded-lg flex-shrink-0 overflow-hidden">
              <img 
                src={`https://picsum.photos/seed/${currentEpisode.id}/100/100`} 
                alt={currentEpisode.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0">
              <h4 className="text-white text-sm font-medium truncate">{currentEpisode.title}</h4>
              <p className="text-zinc-500 text-xs truncate">Max Podcast</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-6 text-zinc-400">
              <button className="hover:text-white transition-colors"><SkipBack size={20} /></button>
              <button 
                onClick={togglePlay}
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform"
              >
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
              </button>
              <button className="hover:text-white transition-colors"><SkipForward size={20} /></button>
            </div>
            
            <div className="w-full flex items-center gap-3 text-[10px] font-mono text-zinc-500">
              <span>{formatTime(progress)}</span>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={progress}
                onChange={handleSeek}
                className="flex-1 h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-white"
              />
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume / Extra */}
          <div className="hidden md:flex items-center justify-end gap-3 text-zinc-400">
            <Volume2 size={18} />
            <div className="w-24 h-1 bg-zinc-800 rounded-full">
              <div className="w-2/3 h-full bg-zinc-400 rounded-full"></div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
