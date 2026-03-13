import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Episode } from './types';

interface AudioContextType {
  currentEpisode: Episode | null;
  isPlaying: boolean;
  playEpisode: (episode: Episode) => void;
  togglePlay: () => void;
  progress: number;
  duration: number;
  seek: (time: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "auto";
      
      audioRef.current.addEventListener('timeupdate', () => {
        setProgress(audioRef.current?.currentTime || 0);
      });

      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current?.duration || 0);
      });

      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        setProgress(0);
      });

      audioRef.current.addEventListener('error', (e) => {
        const error = (e.target as HTMLAudioElement).error;
        console.error("Audio error details:", {
          code: error?.code,
          message: error?.message,
          src: audioRef.current?.src
        });
        setIsPlaying(false);
        alert("Erro ao carregar o áudio. Verifique se o link é válido e público.");
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const getDirectUrl = (url: string) => {
    if (url.includes('drive.google.com')) {
      const driveIdMatch = url.match(/\/d\/(.+?)\//) || url.match(/id=(.+?)(&|$)/);
      if (driveIdMatch && driveIdMatch[1]) {
        // Using docs.google.com/uc?export=open&id= which is often better for streaming
        return `https://docs.google.com/uc?export=open&id=${driveIdMatch[1]}`;
      }
    }
    return url;
  };

  const playEpisode = async (episode: Episode) => {
    if (currentEpisode?.id === episode.id) {
      togglePlay();
      return;
    }

    if (audioRef.current) {
      try {
        if (!episode.audioUrl) {
          throw new Error("Audio URL is missing");
        }
        
        const directUrl = getDirectUrl(episode.audioUrl);
        
        audioRef.current.pause();
        audioRef.current.src = directUrl;
        audioRef.current.load();
        
        setCurrentEpisode(episode);
        setIsPlaying(true);
        
        // Wait for a bit to ensure the browser has started loading the new source
        // This can help with "no supported source" errors on rapid changes
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await audioRef.current.play();
      } catch (error) {
        console.error("Playback failed:", error);
        setIsPlaying(false);
      }
    }
  };

  const togglePlay = async () => {
    if (audioRef.current && currentEpisode) {
      try {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          setIsPlaying(true);
          await audioRef.current.play();
        }
      } catch (error) {
        console.error("Toggle play failed:", error);
        setIsPlaying(false);
      }
    }
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  return (
    <AudioContext.Provider value={{ currentEpisode, isPlaying, playEpisode, togglePlay, progress, duration, seek }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useAudio must be used within AudioProvider');
  return context;
};
