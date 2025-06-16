import React, { createContext, useContext, useRef } from 'react';

interface SoundContextType {
  playHover: () => void;
  playClick: () => void;
  playSuccess: () => void;
}

const SoundContext = createContext<SoundContextType | null>(null);

export const useSounds = () => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSounds must be used within a SoundProvider');
  }
  return context;
};

interface SoundProviderProps {
  children: React.ReactNode;
}

export const SoundProvider: React.FC<SoundProviderProps> = ({ children }) => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const createBeep = (frequency: number, duration: number, volume: number = 0.1) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const audioContext = audioContextRef.current;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  };

  const playHover = () => {
    try {
      createBeep(800, 0.1, 0.05);
    } catch (error) {
      // Silent fail if audio context is not available
    }
  };

  const playClick = () => {
    try {
      createBeep(1200, 0.15, 0.08);
    } catch (error) {
      // Silent fail if audio context is not available
    }
  };

  const playSuccess = () => {
    try {
      createBeep(600, 0.2, 0.1);
      setTimeout(() => createBeep(800, 0.2, 0.1), 100);
    } catch (error) {
      // Silent fail if audio context is not available
    }
  };

  return (
    <SoundContext.Provider value={{ playHover, playClick, playSuccess }}>
      {children}
    </SoundContext.Provider>
  );
};

export default SoundProvider;
