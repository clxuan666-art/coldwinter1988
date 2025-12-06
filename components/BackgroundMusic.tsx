import React, { useEffect, useRef } from 'react';

interface BackgroundMusicProps {
  isPlaying: boolean;
  mood: 'normal' | 'suspense';
  volume?: number;
}

interface NoteEvent {
  note: number; // Frequency
  duration: number; // In seconds
  type?: 'square' | 'triangle' | 'sawtooth';
}

export const BackgroundMusic: React.FC<BackgroundMusicProps> = ({ isPlaying, mood, volume = 0.1 }) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const timerIDRef = useRef<number | null>(null);
  const currentNoteIndexRef = useRef<number>(0);
  
  // Define themes
  // Normal: Melancholy, Winter, 80s, slower (Triangle/Sine)
  // Suspense: Fast, Dissonant, Horror (Sawtooth/Square)
  
  // Helper to get frequency from note name (simplified)
  const N = {
    C2: 65.41, D2: 73.42, Eb2: 77.78, E2: 82.41, F2: 87.31, Gb2: 92.50, G2: 98.00, Ab2: 103.83, A2: 110.00, Bb2: 116.54, B2: 123.47,
    C3: 130.81, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61, G3: 196.00, Ab3: 207.65, A3: 220.00, Bb3: 233.08, B3: 246.94,
    C4: 261.63, E4: 329.63, G4: 392.00,
    X: 0 // Rest
  };

  // 1988 Cold Night Theme (Normal) - ~60s loop feel via repetition
  // Style: Melodic, lonely. Uses Triangle wave for "flute/pad" feel.
  const normalSequence: NoteEvent[] = [
    // Bar 1 (Cm)
    { note: N.C3, duration: 0.5, type: 'triangle' }, { note: N.G3, duration: 0.5, type: 'triangle' }, { note: N.Eb3, duration: 1.0, type: 'triangle' },
    { note: N.C3, duration: 0.5, type: 'triangle' }, { note: N.G2, duration: 0.5, type: 'triangle' }, { note: N.C3, duration: 1.0, type: 'triangle' },
    // Bar 2 (Ab)
    { note: N.Ab2, duration: 0.5, type: 'triangle' }, { note: N.Eb3, duration: 0.5, type: 'triangle' }, { note: N.C3, duration: 1.0, type: 'triangle' },
    { note: N.Ab2, duration: 0.5, type: 'triangle' }, { note: N.C3, duration: 0.5, type: 'triangle' }, { note: N.Eb3, duration: 1.0, type: 'triangle' },
    // Bar 3 (Bb)
    { note: N.Bb2, duration: 0.5, type: 'triangle' }, { note: N.F3, duration: 0.5, type: 'triangle' }, { note: N.D3, duration: 1.0, type: 'triangle' },
    { note: N.Bb2, duration: 0.5, type: 'triangle' }, { note: N.D3, duration: 0.5, type: 'triangle' }, { note: N.F3, duration: 1.0, type: 'triangle' },
    // Bar 4 (G7) - Tension resolve
    { note: N.G2, duration: 0.5, type: 'triangle' }, { note: N.D3, duration: 0.5, type: 'triangle' }, { note: N.B2, duration: 1.0, type: 'triangle' },
    { note: N.G2, duration: 0.5, type: 'triangle' }, { note: N.B2, duration: 0.5, type: 'triangle' }, { note: N.D3, duration: 1.0, type: 'triangle' },
     // Repeat with slight variation (Higher Octave hint)
    { note: N.C4, duration: 1.0, type: 'triangle' }, { note: N.G3, duration: 0.5, type: 'triangle' }, { note: N.Eb3, duration: 0.5, type: 'triangle' },
    { note: N.C3, duration: 2.0, type: 'triangle' },
    { note: N.Ab3, duration: 1.0, type: 'triangle' }, { note: N.Eb3, duration: 0.5, type: 'triangle' }, { note: N.C3, duration: 0.5, type: 'triangle' },
    { note: N.Ab2, duration: 2.0, type: 'triangle' },
  ];

  // Suspense Theme - Urgent, Dissonant, Fast
  // Style: Horror, Chase. Uses Sawtooth/Square.
  const suspenseSequence: NoteEvent[] = [
    { note: N.C2, duration: 0.2, type: 'sawtooth' }, { note: N.C2, duration: 0.2, type: 'sawtooth' },
    { note: N.Gb2, duration: 0.4, type: 'sawtooth' }, // Tritone
    { note: N.C2, duration: 0.2, type: 'sawtooth' }, { note: N.C2, duration: 0.2, type: 'sawtooth' },
    { note: N.Eb2, duration: 0.4, type: 'sawtooth' },
    { note: N.C2, duration: 0.2, type: 'sawtooth' }, { note: N.C2, duration: 0.2, type: 'sawtooth' },
    { note: N.Gb2, duration: 0.2, type: 'sawtooth' }, { note: N.F2, duration: 0.2, type: 'sawtooth' }, { note: N.Eb2, duration: 0.2, type: 'sawtooth' },
    { note: N.C2, duration: 0.2, type: 'sawtooth' }, 
  ];

  useEffect(() => {
    if (isPlaying && audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    } else if (!isPlaying && audioContextRef.current?.state === 'running') {
      audioContextRef.current.suspend();
    }
  }, [isPlaying]);

  // Reset index when mood changes to start fresh on the new theme
  useEffect(() => {
    currentNoteIndexRef.current = 0;
  }, [mood]);

  useEffect(() => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContextClass();
    audioContextRef.current = audioCtx;

    const lookahead = 25.0;
    const scheduleAheadTime = 0.1;

    const playNote = (noteEvent: NoteEvent, time: number) => {
      if (noteEvent.note === 0) return;

      const osc = audioCtx.createOscillator();
      osc.type = noteEvent.type || 'square';
      osc.frequency.value = noteEvent.note;

      // Filter
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      // Suspense is brighter (open filter), Normal is darker (closed filter)
      filter.frequency.value = mood === 'suspense' ? 2000 : 600; 

      const gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(0, time);
      
      if (mood === 'normal') {
          // Softer attack for normal
          gainNode.gain.linearRampToValueAtTime(volume, time + 0.1);
          gainNode.gain.linearRampToValueAtTime(volume * 0.7, time + noteEvent.duration - 0.1);
          gainNode.gain.exponentialRampToValueAtTime(0.01, time + noteEvent.duration);
      } else {
          // Hard attack for suspense
          gainNode.gain.linearRampToValueAtTime(volume * 1.2, time + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(0.01, time + noteEvent.duration * 0.8);
      }

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start(time);
      osc.stop(time + noteEvent.duration);
    };

    const scheduleNote = () => {
      const currentTime = audioCtx.currentTime;

      // Determine which sequence to play
      const currentSequence = mood === 'suspense' ? suspenseSequence : normalSequence;
      // Suspense plays faster
      const tempoMultiplier = mood === 'suspense' ? 0.6 : 1.2; 

      while (nextNoteTimeRef.current < currentTime + scheduleAheadTime) {
        if (isPlaying) {
            const noteData = currentSequence[currentNoteIndexRef.current];
            const noteDuration = noteData.duration * tempoMultiplier;
            
            playNote(noteData, nextNoteTimeRef.current);
            
            nextNoteTimeRef.current += noteDuration;
            
            currentNoteIndexRef.current++;
            if (currentNoteIndexRef.current >= currentSequence.length) {
              currentNoteIndexRef.current = 0;
            }
        } else {
            nextNoteTimeRef.current = currentTime + 0.1;
        }
      }
      
      timerIDRef.current = window.setTimeout(scheduleNote, lookahead);
    };

    nextNoteTimeRef.current = audioCtx.currentTime + 0.1;
    scheduleNote();

    return () => {
      if (timerIDRef.current) clearTimeout(timerIDRef.current);
      audioCtx.close();
    };
  }, [mood, isPlaying]); // Re-run effect if mood changes to rebuild context/params slightly or reset timing

  return null;
};