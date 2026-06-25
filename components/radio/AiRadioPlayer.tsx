'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Radio, ExternalLink } from 'lucide-react';

const YT_VIDEO_ID = 'rdpKLZEOsws';

// Loading the YouTube IFrame API once globally
let apiReadyPromise: Promise<void> | null = null;
function ensureYouTubeAPI(): Promise<void> {
  if (typeof window.YT !== 'undefined' && window.YT.Player) {
    return Promise.resolve();
  }
  if (!apiReadyPromise) {
    apiReadyPromise = new Promise((resolve) => {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const first = document.getElementsByTagName('script')[0];
      first?.parentNode?.insertBefore(tag, first);
      (window as any).onYouTubeIframeAPIReady = () => resolve();
    });
  }
  return apiReadyPromise;
}

export function AiRadioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [muted, setMuted] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [isLive, setIsLive] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const volumeSnapshotRef = useRef(0.5);

  // Initialize YouTube player
  useEffect(() => {
    let player: any = null;

    ensureYouTubeAPI().then(() => {
      if (containerRef.current && !player) {
        player = new window.YT.Player(containerRef.current, {
          height: '200',
          width: '100%',
          videoId: YT_VIDEO_ID,
          playerVars: {
            autoplay: 0,
            mute: 1,
            loop: 1,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            disablekb: 1,
            fs: 0,
            playsinline: 1,
          },
          events: {
            onReady: () => {
              playerRef.current = player;
              setPlayerReady(true);
              setIsLive(true);
            },
            onStateChange: (event: any) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
              } else if (
                event.data === window.YT.PlayerState.PAUSED ||
                event.data === window.YT.PlayerState.ENDED
              ) {
                setIsPlaying(false);
              } else if (event.data === window.YT.PlayerState.BUFFERING) {
                // Still loading
              } else if (event.data === window.YT.PlayerState.CUED) {
                setIsLive(true);
              }
            },
            onError: () => {
              // Stream might be offline — still show the player
              setIsLive(true);
            },
          },
        });
      }
    });

    return () => {
      try { player?.destroy(); } catch {}
      playerRef.current = null;
    };
  }, []);

  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p || !playerReady) return;

    if (isPlaying) {
      p.pauseVideo();
    } else {
      p.playVideo();
    }
  }, [isPlaying, playerReady]);

  const toggleMute = useCallback(() => {
    const p = playerRef.current;
    if (!p || !playerReady) return;

    if (muted) {
      p.unMute();
      p.setVolume(volumeSnapshotRef.current * 100);
      setVolume(volumeSnapshotRef.current);
      setMuted(false);
    } else {
      volumeSnapshotRef.current = volume;
      p.mute();
      setMuted(true);
    }
  }, [muted, volume, playerReady]);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseFloat(e.target.value);
      const p = playerRef.current;
      if (!p || !playerReady) return;

      setVolume(v);
      p.setVolume(v * 100);
      if (muted && v > 0) {
        p.unMute();
        setMuted(false);
      }
    },
    [muted, playerReady]
  );

  const [showIframe, setShowIframe] = useState(false);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-primary/20 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-cyan-500/5">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.08)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center ${
                isLive && isPlaying ? 'animate-pulse-soft' : ''
              }`}
            >
              <Radio className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-xs font-bold tracking-wide">AI RADIO</span>
          </div>

          {/* Live indicator */}
          {isLive && (
            <div className="flex items-center gap-1.5">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isPlaying ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'
                }`}
              />
              <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">
                {isPlaying ? 'Live' : 'Paused'}
              </span>
            </div>
          )}
        </div>

        {/* YouTube embed — hidden but rendered */}
        <div className="relative rounded-xl overflow-hidden bg-black/40" style={{ height: showIframe ? '200px' : '200px' }}>
          <div ref={containerRef} className="w-full h-full" />

          {/* Click overlay to start */}
          {!showIframe && playerReady && (
            <button
              onClick={() => {
                setShowIframe(true);
                playerRef.current?.playVideo();
              }}
              className="absolute inset-0 flex items-center justify-center bg-black/60 hover:bg-black/40 transition-colors z-10 group cursor-pointer"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="h-14 w-14 rounded-full bg-primary/90 hover:bg-primary flex items-center justify-center transition-all group-hover:scale-105">
                  <Play className="h-6 w-6 text-primary-foreground ml-1" />
                </div>
                <span className="text-xs font-medium text-white/80">Listen live</span>
              </div>
            </button>
          )}

          {/* Small controller bar when playing */}
          {showIframe && (
            <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-2 pointer-events-none">
              <p className="text-[10px] text-white/70 font-medium truncate pointer-events-auto">
                AI Generated Music Radio — Synthwave, Lo-Fi, Chill & Ambient
              </p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            disabled={!playerReady}
            className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90 transition-colors flex items-center justify-center shrink-0 disabled:opacity-30"
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
            disabled={!playerReady}
            className="h-6 w-6 rounded-full hover:bg-accent/30 transition-colors flex items-center justify-center shrink-0 disabled:opacity-30"
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
            disabled={!playerReady}
            className="flex-1 h-1 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary
              bg-muted/30 accent-primary disabled:opacity-30"
            aria-label="Volume"
          />

          {/* Channel link */}
          <a
            href={`https://www.youtube.com/watch?v=${YT_VIDEO_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-6 w-6 rounded-full hover:bg-accent/30 transition-colors flex items-center justify-center shrink-0"
            title="Open on YouTube"
          >
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </a>
        </div>

        {/* Footer info */}
        <div className="text-[9px] text-muted-foreground/60 text-center leading-tight">
          AI-generated music — 24/7 stream by{' '}
          <a
            href="https://www.youtube.com/@DigitalDecibels"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary/70 hover:text-primary transition-colors underline underline-offset-2"
          >
            Digital Decibels
          </a>
        </div>
      </div>
    </div>
  );
}