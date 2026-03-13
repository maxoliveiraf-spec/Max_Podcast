import React from 'react';
import { Episode } from '../types';
import { useAudio } from '../AudioContext';
import { Play, Pause, Clock, Calendar, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EpisodeCardProps {
  episode: Episode;
}

export const EpisodeCard: React.FC<EpisodeCardProps> = ({ episode }) => {
  const { currentEpisode, isPlaying, playEpisode } = useAudio();
  const isCurrent = currentEpisode?.id === episode.id;

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: episode.title,
        text: episode.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };

  return (
    <div className="group bg-zinc-900/40 border border-zinc-800/50 hover:border-zinc-700 rounded-2xl p-4 transition-all duration-300">
      <div className="flex gap-5">
        <div className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-xl overflow-hidden bg-zinc-800">
          <img 
            src={`https://picsum.photos/seed/${episode.id}/300/300`} 
            alt={episode.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <button
            onClick={() => playEpisode(episode)}
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black shadow-xl">
              {isCurrent && isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
            </div>
          </button>
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3 text-[10px] font-medium text-zinc-500 uppercase tracking-widest">
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                <span>{episode.createdAt?.toDate ? format(episode.createdAt.toDate(), "dd 'de' MMM, yyyy", { locale: ptBR }) : 'Recent'}</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                <span>{episode.duration ? `${Math.floor(episode.duration / 60)} min` : 'Podcast'}</span>
              </span>
            </div>
            <button 
              onClick={handleShare}
              className="text-zinc-500 hover:text-white transition-colors p-1"
            >
              <Share2 size={16} />
            </button>
          </div>
          
          <h3 className="text-white text-lg md:text-xl font-bold mb-2 group-hover:text-emerald-400 transition-colors line-clamp-1">
            {episode.title}
          </h3>
          <p className="text-zinc-400 text-sm line-clamp-2 leading-relaxed">
            {episode.description}
          </p>
        </div>
      </div>
    </div>
  );
};

export const EpisodeList: React.FC<{ episodes: Episode[] }> = ({ episodes }) => {
  return (
    <div className="space-y-4">
      {episodes.map((episode) => (
        <EpisodeCard key={episode.id} episode={episode} />
      ))}
      {episodes.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-3xl">
          <p className="text-zinc-500">Nenhum episódio encontrado.</p>
        </div>
      )}
    </div>
  );
};
