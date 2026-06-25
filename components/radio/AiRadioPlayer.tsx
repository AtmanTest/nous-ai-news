'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Radio } from 'lucide-react';

type RadioMode = 'ambient' | 'chill' | 'focus';

interface ModeConfig {
  label: string;
  emoji: string;
  baseFreq: number;
  chord: number[];   // semitone offsets from root
  filterFreq: number;
  lfoSpeed: number;
  reverbMix: number;
}

const MODES: Record<RadioMode, ModeConfig> = {
  ambient: {
    label: 'Ambient',
    emoji: '🌌',
    baseFreq: 55,      // A1
    chord: [0, 7, 12, 16, 19],  // A min7 add9
    filterFreq: 800,
    lfoSpeed: 0.15,
    reverbMix: 0.6,
  },
  chill: {
    label: 'Chill',
    emoji: '🌴',
    baseFreq: 65.41,   // C2
    chord: [0, 4, 7, 11, 14],   // Cmaj7 add9
    filterFreq: 1500,
    lfoSpeed: 0.25,
    reverbMix: 0.4,
  },
  focus: {
    label: 'Focus',
    emoji: '🧠',
    baseFreq: 130.81,  // C3
    chord: [0, 5, 7, 12],       // C power chord + octave
    filterFreq: 2000,
    lfoSpeed: 0.08,
    reverbMix: 0.3,
  },
};

export function AiRadioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [muted, setMuted] = useState(false);
  const [mode, setMode] = useState<RadioMode>('ambient');
  const [isLoaded, setIsLoaded] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const reverbRef = useRef<ConvolverNode | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const lfoGainRef = useRef<GainNode | null>(null);
  const animationRef = useRef<number>(0);

  // Build a simple impulse response for reverb
  const createReverbIR = useCallback((ctx: AudioContext, duration: number) => {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const buffer = ctx.createBuffer(2, length, sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }
    return buffer;
  }, []);

  const startAudio = useCallback(() => {
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    // Master volume
    const masterGain = ctx.createGain();
    masterGain.gain.value = volume;
    masterGain.connect(ctx.destination);
    masterGainRef.current = masterGain;

    // Reverb
    const convolver = ctx.createConvolver();
    convolver.buffer = createReverbIR(ctx, 2.5);
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = MODES[mode].reverbMix;
    convolver.connect(reverbGain);
    reverbGain.connect(masterGain);
    reverbRef.current = convolver;

    // Dry send
    const dryGain = ctx.createGain();
    dryGain.gain.value = 1 - MODES[mode].reverbMix * 0.5;
    dryGain.connect(masterGain);

    // LFO for gentle filter modulation (creates movement)
    const lfo = ctx.createOscillator();
    lfo.frequency.value = MODES[mode].lfoSpeed;
    lfo.type = 'sine';
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 300; // modulation depth in Hz
    lfo.connect(lfoGain);
    lfoRef.current = lfo;
    lfoGainRef.current = lfoGain;

    // Create oscillators for each chord note
    const config = MODES[mode];
    const oscs: OscillatorNode[] = [];
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = config.filterFreq;
    filter.Q.value = 1.0;

    lfoGain.connect(filter.frequency);

    config.chord.forEach((semitone, i) => {
      const freq = config.baseFreq * Math.pow(2, semitone / 12);
      const osc = ctx.createOscillator();

      // Different waveforms for texture
      if (i === 0) osc.type = 'sine';
      else if (i === 1) osc.type = 'triangle';
      else if (i === 2) osc.type = 'sine';
      else if (i === 3) osc.type = 'triangle';
      else osc.type = 'sine';

      osc.frequency.value = freq;

      // Individual volume with slight randomness for organic feel
      const voiceGain = ctx.createGain();
      voiceGain.gain.value = 0.06 + Math.random() * 0.03;
      voiceGain.gain.value *= (i === 0 || i === 2) ? 1.2 : 0.7;

      osc.connect(voiceGain);
      voiceGain.connect(filter);
      oscs.push(osc);

      // Slight detune for richness
      osc.detune.value = (Math.random() - 0.5) * 4;
    });

    filter.connect(dryGain);
    filter.connect(convolver);

    // Start all oscillators + LFO
    oscs.forEach(o => o.start());
    lfo.start();

    oscillatorsRef.current = oscs;
    setIsPlaying(true);
    setIsLoaded(true);
  }, [volume, mode, createReverbIR]);

  const stopAudio = useCallback(() => {
    oscillatorsRef.current.forEach(o => {
      try { o.stop(); o.disconnect(); } catch {}
    });
    try { lfoRef.current?.stop(); lfoRef.current?.disconnect(); } catch {}
    try { audioCtxRef.current?.close(); } catch {}
    oscillatorsRef.current = [];
    lfoRef.current = null;
    lfoGainRef.current = null;
    audioCtxRef.current = null;
    masterGainRef.current = null;
    reverbRef.current = null;
    setIsPlaying(false);
  }, []);

  // Change mode
  useEffect(() => {
    if (isPlaying) {
      stopAudio();
      setTimeout(() => startAudio(), 100);
    }
  }, [mode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      cancelAnimationFrame(animationRef.current);
    };
  }, [stopAudio]);

  const togglePlay = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      startAudio();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = muted ? 0 : v;
    }
  };

  const toggleMute = () => {
    setMuted(!muted);
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = muted ? volume : 0;
    }
  };

  const cycleMode = () => {
    const modes: RadioMode[] = ['ambient', 'chill', 'focus'];
    const next = (modes.indexOf(mode) + 1) % modes.length;
    setMode(modes[next]);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-primary/20 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-cyan-500/5">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.08)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center ${isPlaying ? 'animate-pulse-soft' : ''}`}>
              <Radio className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-xs font-bold tracking-wide">AI RADIO</span>
          </div>

          {/* Mode button */}
          <button
            onClick={cycleMode}
            className="text-[10px] px-2 py-1 rounded-full bg-background/50 border border-border/30 hover:bg-accent/20 transition-colors"
            title="Switch genre"
          >
            {MODES[mode].emoji} {MODES[mode].label}
          </button>
        </div>

        {/* Visualizer bar */}
        <div className="flex items-center gap-0.5 h-6">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 rounded-full transition-all duration-300 ${
                isPlaying
                  ? 'bg-gradient-to-t from-blue-500/40 to-cyan-400/60'
                  : 'bg-muted/20'
              }`}
              style={{
                height: isPlaying
                  ? `${20 + Math.sin(Date.now() / 1000 + i * 0.8) * 15 + Math.sin(i * 1.5) * 10}%`
                  : '20%',
                opacity: isPlaying ? 0.5 + Math.random() * 0.5 : 0.2,
              }}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90 transition-colors flex items-center justify-center shrink-0"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="h-3.5 w-3.5 text-primary-foreground" />
            ) : (
              <Play className="h-3.5 w-3.5 text-primary-foreground ml-0.5" />
            )}
          </button>

          <button
            onClick={toggleMute}
            className="h-6 w-6 rounded-full hover:bg-accent/30 transition-colors flex items-center justify-center shrink-0"
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? (
              <VolumeX className="h-3 w-3 text-muted-foreground" />
            ) : (
              <Volume2 className="h-3 w-3 text-muted-foreground" />
            )}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="flex-1 h-1 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary
              bg-muted/30 accent-primary"
            aria-label="Volume"
          />

          {/* Now playing indicator */}
          {isPlaying && (
            <span className="text-[9px] text-muted-foreground animate-pulse-soft whitespace-nowrap">
              LIVE · AI generated
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
