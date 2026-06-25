// Type declarations for YouTube IFrame Player API
interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  mute(): void;
  unMute(): void;
  setVolume(volume: number): void;
  getVolume(): number;
  getPlayerState(): number;
  destroy(): void;
  addEventListener(event: string, listener: (event: any) => void): void;
}

interface YTPlayerVars {
  autoplay?: number;
  mute?: number;
  loop?: number;
  controls?: number;
  modestbranding?: number;
  rel?: number;
  showinfo?: number;
  iv_load_policy?: number;
  disablekb?: number;
  fs?: number;
  playsinline?: number;
  playlist?: string;
  [key: string]: any;
}

interface YTPlayerOptions {
  height?: string | number;
  width?: string | number;
  videoId?: string;
  playerVars?: YTPlayerVars;
  events?: {
    onReady?: (event: any) => void;
    onStateChange?: (event: any) => void;
    onError?: (event: any) => void;
  };
}

interface YTPlayerConstructor {
  new (element: HTMLElement | string, options: YTPlayerOptions): YTPlayer;
}

interface YTAPI {
  Player: YTPlayerConstructor;
  PlayerState: {
    UNSTARTED: number;
    BUFFERING: number;
    CUED: number;
    PLAYING: number;
    PAUSED: number;
    ENDED: number;
  };
}

interface Window {
  YT: YTAPI;
  onYouTubeIframeAPIReady: () => void;
}