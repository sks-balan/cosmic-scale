// animations.tsx
// Reusable timeline animation engine (TypeScript).
// Exports (to window): Stage, Sprite, PlaybackBar, TextSprite, ImageSprite, RectSprite,
//   useTime, useTimeline, useSprite, Easing, interpolate, animate, clamp.
//
// Types are stripped at load time by Babel's TypeScript preset; this file is
// loaded in the browser via <script type="text/babel" data-presets="tsx">.

declare const React: any;

// ── Shared types ─────────────────────────────────────────────────────────────
type EaseFn = (t: number) => number;

interface TimelineState {
  time: number;
  duration: number;
  playing: boolean;
  setTime?: (updater: number | ((t: number) => number)) => void;
  setPlaying?: (updater: boolean | ((p: boolean) => boolean)) => void;
}

interface SpriteState {
  localTime: number;
  progress: number;
  duration: number;
  visible?: boolean;
}

type SpriteChildren =
  | React.ReactNode
  | ((ctx: SpriteState) => React.ReactNode);

// ── Easing functions (hand-rolled, Popmotion-style) ─────────────────────────
// All easings take t ∈ [0,1] and return eased t ∈ [0,1] (may overshoot for back/elastic).
const Easing: Record<string, EaseFn> = {
  linear: (t) => t,

  // Quad
  easeInQuad:    (t) => t * t,
  easeOutQuad:   (t) => t * (2 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  // Cubic
  easeInCubic:    (t) => t * t * t,
  easeOutCubic:   (t) => (--t) * t * t + 1,
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),

  // Quart
  easeInQuart:    (t) => t * t * t * t,
  easeOutQuart:   (t) => 1 - (--t) * t * t * t,
  easeInOutQuart: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t),

  // Expo
  easeInExpo:  (t) => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1))),
  easeOutExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  easeInOutExpo: (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    if (t < 0.5) return 0.5 * Math.pow(2, 20 * t - 10);
    return 1 - 0.5 * Math.pow(2, -20 * t + 10);
  },

  // Sine
  easeInSine:    (t) => 1 - Math.cos((t * Math.PI) / 2),
  easeOutSine:   (t) => Math.sin((t * Math.PI) / 2),
  easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,

  // Back (overshoot)
  easeOutBack: (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeInBack: (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  easeInOutBack: (t) => {
    const c1 = 1.70158, c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },

  // Elastic
  easeOutElastic: (t) => {
    const c4 = (2 * Math.PI) / 3;
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

// ── Core interpolation helpers ──────────────────────────────────────────────

// Clamp a value to [min, max]
const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));

// interpolate([0, 0.5, 1], [0, 100, 50], ease?) -> fn(t)
// Popmotion-style: linearly maps t across input keyframes to output values,
// with optional easing per segment (single fn or array of fns).
function interpolate(input: number[], output: number[], ease: EaseFn | EaseFn[] = Easing.linear): EaseFn {
  return (t: number): number => {
    if (t <= input[0]) return output[0];
    if (t >= input[input.length - 1]) return output[output.length - 1];
    for (let i = 0; i < input.length - 1; i++) {
      if (t >= input[i] && t <= input[i + 1]) {
        const span = input[i + 1] - input[i];
        const local = span === 0 ? 0 : (t - input[i]) / span;
        const easeFn = Array.isArray(ease) ? (ease[i] || Easing.linear) : ease;
        const eased = easeFn(local);
        return output[i] + (output[i + 1] - output[i]) * eased;
      }
    }
    return output[output.length - 1];
  };
}

interface AnimateOpts {
  from?: number;
  to?: number;
  start?: number;
  end?: number;
  ease?: EaseFn;
}

// animate({from, to, start, end, ease})(t) — simpler single-segment tween.
// Returns `from` before `start`, `to` after `end`.
function animate({ from = 0, to = 1, start = 0, end = 1, ease = Easing.easeInOutCubic }: AnimateOpts): EaseFn {
  return (t: number): number => {
    if (t <= start) return from;
    if (t >= end) return to;
    const local = (t - start) / (end - start);
    return from + (to - from) * ease(local);
  };
}

// ── Timeline context ────────────────────────────────────────────────────────

const TimelineContext = React.createContext<TimelineState>({ time: 0, duration: 10, playing: false });

const useTime = (): number => React.useContext(TimelineContext).time;
const useTimeline = (): TimelineState => React.useContext(TimelineContext);

// ── Sprite ──────────────────────────────────────────────────────────────────
// Renders children only when the playhead is inside [start, end]. Provides
// a sub-context with `localTime` (seconds since start) and `progress` (0..1).

const SpriteContext = React.createContext<SpriteState>({ localTime: 0, progress: 0, duration: 0 });
const useSprite = (): SpriteState => React.useContext(SpriteContext);

interface SpriteProps {
  start?: number;
  end?: number;
  children?: SpriteChildren;
  keepMounted?: boolean;
}

function Sprite({ start = 0, end = Infinity, children, keepMounted = false }: SpriteProps) {
  const { time } = useTimeline();
  const visible = time >= start && time <= end;
  if (!visible && !keepMounted) return null;

  const duration = end - start;
  const localTime = Math.max(0, time - start);
  const progress = duration > 0 && isFinite(duration)
    ? clamp(localTime / duration, 0, 1)
    : 0;

  const value: SpriteState = { localTime, progress, duration, visible };

  return (
    <SpriteContext.Provider value={value}>
      {typeof children === 'function' ? (children as (c: SpriteState) => React.ReactNode)(value) : children}
    </SpriteContext.Provider>
  );
}

// ── Sample sprite components ────────────────────────────────────────────────

interface TextSpriteProps {
  text: string;
  x?: number; y?: number;
  size?: number;
  color?: string;
  font?: string;
  weight?: number;
  entryDur?: number;
  exitDur?: number;
  entryEase?: EaseFn;
  exitEase?: EaseFn;
  align?: 'left' | 'center' | 'right';
  letterSpacing?: string;
}

// TextSprite: fades/slides text in on entry, holds, then fades out on exit.
function TextSprite({
  text,
  x = 0, y = 0,
  size = 48,
  color = '#111',
  font = 'Inter, system-ui, sans-serif',
  weight = 600,
  entryDur = 0.45,
  exitDur = 0.35,
  entryEase = Easing.easeOutBack,
  exitEase = Easing.easeInCubic,
  align = 'left',
  letterSpacing = '-0.01em',
}: TextSpriteProps) {
  const { localTime, duration } = useSprite();
  const exitStart = Math.max(0, duration - exitDur);

  let opacity = 1;
  let ty = 0;

  if (localTime < entryDur) {
    const t = entryEase(clamp(localTime / entryDur, 0, 1));
    opacity = t;
    ty = (1 - t) * 16;
  } else if (localTime > exitStart) {
    const t = exitEase(clamp((localTime - exitStart) / exitDur, 0, 1));
    opacity = 1 - t;
    ty = -t * 8;
  }

  const translateX = align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0';

  return (
    <div style={{
      position: 'absolute',
      left: x, top: y,
      transform: `translate(${translateX}, ${ty}px)`,
      opacity,
      fontFamily: font,
      fontSize: size,
      fontWeight: weight,
      color,
      letterSpacing,
      whiteSpace: 'pre',
      lineHeight: 1.1,
      willChange: 'transform, opacity',
    }}>
      {text}
    </div>
  );
}

interface ImageSpriteProps {
  src?: string;
  x?: number; y?: number;
  width?: number; height?: number;
  entryDur?: number;
  exitDur?: number;
  kenBurns?: boolean;
  kenBurnsScale?: number;
  radius?: number;
  fit?: string;
  placeholder?: { label?: string } | null;
}

// ImageSprite: scales + fades in; optional Ken Burns drift during hold.
function ImageSprite({
  src,
  x = 0, y = 0,
  width = 400, height = 300,
  entryDur = 0.6,
  exitDur = 0.4,
  kenBurns = false,
  kenBurnsScale = 1.08,
  radius = 12,
  fit = 'cover',
  placeholder = null,
}: ImageSpriteProps) {
  const { localTime, duration } = useSprite();
  const exitStart = Math.max(0, duration - exitDur);

  let opacity = 1;
  let scale = 1;

  if (localTime < entryDur) {
    const t = Easing.easeOutCubic(clamp(localTime / entryDur, 0, 1));
    opacity = t;
    scale = 0.96 + 0.04 * t;
  } else if (localTime > exitStart) {
    const t = Easing.easeInCubic(clamp((localTime - exitStart) / exitDur, 0, 1));
    opacity = 1 - t;
    scale = (kenBurns ? kenBurnsScale : 1) + 0.02 * t;
  } else if (kenBurns) {
    const holdSpan = exitStart - entryDur;
    const holdT = holdSpan > 0 ? (localTime - entryDur) / holdSpan : 0;
    scale = 1 + (kenBurnsScale - 1) * holdT;
  }

  const content = placeholder ? (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'repeating-linear-gradient(135deg, #e9e6df 0 10px, #dcd8cf 10px 20px)',
      color: '#6b6458',
      fontFamily: 'JetBrains Mono, ui-monospace, monospace',
      fontSize: 13,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
    }}>
      {placeholder.label || 'image'}
    </div>
  ) : (
    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: fit as any, display: 'block' }} />
  );

  return (
    <div style={{
      position: 'absolute',
      left: x, top: y,
      width, height,
      opacity,
      transform: `scale(${scale})`,
      transformOrigin: 'center',
      borderRadius: radius,
      overflow: 'hidden',
      willChange: 'transform, opacity',
    }}>
      {content}
    </div>
  );
}

interface RectSpriteProps {
  x?: number; y?: number;
  width?: number; height?: number;
  color?: string;
  radius?: number;
  entryDur?: number;
  exitDur?: number;
  render?: (ctx: SpriteState) => Record<string, any>;
}

// RectSprite: simple rectangle that animates position/size/color via props.
function RectSprite({
  x = 0, y = 0,
  width = 100, height = 100,
  color = '#111',
  radius = 8,
  entryDur = 0.4,
  exitDur = 0.3,
  render,
}: RectSpriteProps) {
  const spriteCtx = useSprite();
  const { localTime, duration } = spriteCtx;
  const exitStart = Math.max(0, duration - exitDur);

  let opacity = 1;
  let scale = 1;

  if (localTime < entryDur) {
    const t = Easing.easeOutBack(clamp(localTime / entryDur, 0, 1));
    opacity = clamp(localTime / entryDur, 0, 1);
    scale = 0.4 + 0.6 * t;
  } else if (localTime > exitStart) {
    const t = Easing.easeInQuad(clamp((localTime - exitStart) / exitDur, 0, 1));
    opacity = 1 - t;
    scale = 1 - 0.15 * t;
  }

  const overrides = render ? render(spriteCtx) : {};

  return (
    <div style={{
      position: 'absolute',
      left: x, top: y,
      width, height,
      background: color,
      borderRadius: radius,
      opacity,
      transform: `scale(${scale})`,
      transformOrigin: 'center',
      willChange: 'transform, opacity',
      ...overrides,
    }} />
  );
}

interface StageChapter { label: string; start: number; end: number; poster?: number }

interface StageProps {
  width?: number;
  height?: number;
  duration?: number;          // initial playback (wall-clock) length
  timelineDuration?: number;  // authored timeline length scenes are written against (defaults to `duration`)
  durations?: number[];       // selectable playback lengths; shows a length control in the bar
  chapters?: StageChapter[];  // named regions (authored seconds); shows chapter nav + track markers
  loopModes?: ('once' | 'three' | 'inf')[]; // cycle order for the loop button (shows it when set)
  background?: string;
  fps?: number;
  loop?: boolean;
  autoplay?: boolean;
  persistKey?: string;
  children?: React.ReactNode;
}

function Stage({
  width = 1280,
  height = 720,
  duration: baseDuration = 10,
  timelineDuration,
  durations,
  chapters,
  loopModes,
  background = '#f6f4ef',
  fps = 60,
  loop = true,
  autoplay = true,
  persistKey = 'animstage',
  children,
}: StageProps) {
  // Authored timeline length the scenes are written against — constant.
  const timeline = timelineDuration ?? baseDuration;

  // Playback (wall-clock) length — user-selectable when `durations` is given.
  const [duration, setDuration] = React.useState<number>(() => {
    try {
      const v = parseFloat(localStorage.getItem(persistKey + ':d') || '');
      if (durations && durations.indexOf(v) !== -1) return v;
    } catch {}
    return baseDuration;
  });

  const [time, setTime] = React.useState<number>(() => {
    try {
      const v = parseFloat(localStorage.getItem(persistKey + ':t') || '0');
      return isFinite(v) ? clamp(v, 0, duration) : 0;
    } catch { return 0; }
  });
  const [playing, setPlaying] = React.useState<boolean>(autoplay);
  const [hoverTime, setHoverTime] = React.useState<number | null>(null);
  const [scale, setScale] = React.useState<number>(1);

  // Flow state: 'intro' auto-plays from 0; any scrub, chapter pick, or reaching
  // the end hands control to the viewer ('interactive').
  const [mode, setMode] = React.useState<'intro' | 'interactive'>(autoplay ? 'intro' : 'interactive');

  // Minimal chrome: extra controls reveal on hover (and whenever paused).
  const [barHover, setBarHover] = React.useState<boolean>(false);

  // Loop behaviour at end of playback: once / 3× / infinite.
  const [loopMode, setLoopMode] = React.useState<'once' | 'three' | 'inf'>(
    () => (loopModes && loopModes.length ? loopModes[0] : (loop ? 'inf' : 'once'))
  );

  const stageRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLDivElement | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const lastTsRef = React.useRef<number | null>(null);
  const playUntilRef = React.useRef<number | null>(null); // wall-time to pause at (chapter replay)
  const loopModeRef = React.useRef(loopMode); loopModeRef.current = loopMode;
  const passesRef = React.useRef<number>(0); // completed passes in the current run
  const spotlightRef = React.useRef<HTMLDivElement | null>(null);

  // Persist playhead
  React.useEffect(() => {
    try { localStorage.setItem(persistKey + ':t', String(time)); } catch {}
  }, [time, persistKey]);

  // Persist the chosen playback length
  React.useEffect(() => {
    try { localStorage.setItem(persistKey + ':d', String(duration)); } catch {}
  }, [duration, persistKey]);

  // Change total length while holding the same point in the film.
  const changeDuration = React.useCallback((next: number) => {
    setTime((t: number) => (duration > 0 ? clamp(t * (next / duration), 0, next) : 0));
    setDuration(next);
  }, [duration]);

  // Auto-scale to fit viewport
  React.useEffect(() => {
    if (!stageRef.current) return;
    const el = stageRef.current;
    const measure = () => {
      const barH = chapters && chapters.length ? 86 : 44; // chrome height (chapter nav + bar)
      const s = Math.min(
        el.clientWidth / width,
        (el.clientHeight - barH) / height
      );
      setScale(Math.max(0.05, s));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [width, height, chapters]);

  // Animation loop
  React.useEffect(() => {
    if (!playing) {
      lastTsRef.current = null;
      return;
    }
    const step = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      setTime((t: number) => {
        let next = t + dt;
        // Section replay: stop exactly at the requested wall-time.
        const stopAt = playUntilRef.current;
        if (stopAt != null && next >= stopAt) {
          playUntilRef.current = null;
          setPlaying(false);
          return stopAt;
        }
        if (next >= duration) {
          const lm = loopModeRef.current;
          if (lm === 'inf') return next % duration;                       // loop forever
          passesRef.current += 1;
          if (lm === 'three' && passesRef.current < 3) return next % duration; // play 3× total
          passesRef.current = 0;
          setPlaying(false);
          if (chapters && chapters.length) {
            // Hand control to the viewer, resting on the closing chapter's
            // poster rather than a black frame.
            setMode('interactive');
            const last = chapters[chapters.length - 1];
            return last.poster != null
              ? clamp(last.poster * (duration / timeline), 0, duration)
              : duration;
          }
          return duration;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [playing, duration, loop, chapters, timeline]);

  // Keyboard: space = play/pause, ← → = seek
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement | null;
      if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA')) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setPlaying((p: boolean) => !p);
      } else if (e.code === 'ArrowLeft') {
        setTime((t: number) => clamp(t - (e.shiftKey ? 1 : 0.1), 0, duration));
      } else if (e.code === 'ArrowRight') {
        setTime((t: number) => clamp(t + (e.shiftKey ? 1 : 0.1), 0, duration));
      } else if (e.key === '0' || e.code === 'Home') {
        setTime(0);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [duration]);

  const displayTime = hoverTime != null ? hoverTime : time;

  // Stretch wall-clock time onto the authored timeline: a 60s film played
  // over 180s advances its `timeline` seconds three times slower. Scenes,
  // written against `timeline`, never change.
  const timeScale = duration > 0 ? timeline / duration : 1;
  const filmTime = displayTime * timeScale;

  const ctxValue = React.useMemo(
    () => ({ time: filmTime, duration: timeline, playing, setTime, setPlaying }),
    [filmTime, timeline, playing]
  );

  // ── Hybrid flow: scrubbing / chapter selection / section replay ─────────────
  // Convert authored (film) seconds to wall-clock at the current length.
  const toWall = React.useCallback(
    (filmSec: number) => clamp(filmSec * (duration / timeline), 0, duration),
    [duration, timeline]
  );

  // Seek by authored seconds and hand control to the viewer.
  const seekFilm = React.useCallback(
    (filmSec: number, opts: { play?: boolean; until?: number | null } = {}) => {
      playUntilRef.current = opts.until != null ? toWall(opts.until) : null;
      passesRef.current = 0;
      setMode('interactive');
      setTime(toWall(filmSec));
      setPlaying(!!opts.play);
    },
    [toWall]
  );

  // Dragging the scrub track (wall-clock) drops into interactive and pauses.
  const seekWall = React.useCallback((wt: number) => {
    playUntilRef.current = null;
    passesRef.current = 0;
    setMode('interactive');
    setTime(clamp(wt, 0, duration));
    setPlaying(false);
  }, [duration]);

  // Active chapter from the current authored time.
  let activeChapter = 0;
  if (chapters) {
    for (let i = 0; i < chapters.length; i++) {
      if (filmTime >= chapters[i].start - 0.001) activeChapter = i;
    }
  }

  const selectChapter = (i: number) => {
    const c = chapters![i];
    // Playing → continue playing from the chapter's start; paused → just move
    // the playhead to a representative still and stay paused.
    if (playing) seekFilm(c.start, { play: true });
    else seekFilm(c.poster != null ? c.poster : c.start, { play: false });
  };
  const replayChapter = () => {
    const c = chapters![activeChapter];
    seekFilm(c.start, { play: true, until: Math.max(c.start + 0.5, c.end - 0.7) });
  };

  // Loop button: cycle once → 3× → ∞ (in the configured order).
  const cycleLoop = () => {
    const order = (loopModes && loopModes.length ? loopModes : ['once', 'three', 'inf']) as ('once' | 'three' | 'inf')[];
    passesRef.current = 0;
    setLoopMode(order[(order.indexOf(loopMode) + 1) % order.length]);
  };
  // Replay button: restart from the top and play.
  const replayAll = () => { passesRef.current = 0; seekFilm(0, { play: true }); };

  // Controls are hidden by default and reveal only on hover of the chrome.
  const revealed = barHover;

  // Silver "spotlight" glow that tracks the cursor across the control area.
  const onChromeMove = React.useCallback((e: any) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (spotlightRef.current) {
      spotlightRef.current.style.background =
        `radial-gradient(260px 130px at ${x}px 60%, rgba(232,235,242,0.50), rgba(170,176,191,0.16) 42%, rgba(0,0,0,0) 72%)`;
    }
  }, []);

  const chapterMarks = chapters
    ? chapters
        .map((c, i) => ({ pct: timeline > 0 ? c.start / timeline : 0, index: i }))
        .filter((m) => m.pct > 0.002)
    : undefined;

  return (
    <div
      ref={stageRef}
      style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center',
        background: '#0a0a0a',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Canvas area — vertically centered in remaining space */}
      <div style={{
        flex: 1,
        width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        minHeight: 0,
      }}>
        <div
          ref={canvasRef}
          style={{
            width, height,
            background,
            position: 'relative',
            transform: `scale(${scale})`,
            transformOrigin: 'center',
            flexShrink: 0,
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            overflow: 'hidden',
          }}
        >
          <TimelineContext.Provider value={ctxValue}>
            {children}
          </TimelineContext.Provider>
        </div>
      </div>

      {/* Bottom chrome — controls reveal only on hover, with a silver spotlight */}
      <div
        onMouseEnter={() => setBarHover(true)}
        onMouseLeave={() => setBarHover(false)}
        onMouseMove={onChromeMove}
        style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}
      >
        {chapters && chapters.length > 0 && (
          <ChapterNav
            chapters={chapters}
            active={activeChapter}
            mode={mode}
            revealed={revealed}
            onSelect={selectChapter}
            onReplay={replayChapter}
          />
        )}

        {/* Playback bar — stacked below canvas, never overlapping */}
        <PlaybackBar
          time={displayTime}
          actualTime={time}
          duration={duration}
          durations={durations}
          onDurationChange={changeDuration}
          marks={chapterMarks}
          activeMark={activeChapter}
          onMark={selectChapter}
          revealed={revealed}
          loopMode={loopModes ? loopMode : undefined}
          onLoopCycle={cycleLoop}
          onReplayAll={replayAll}
          playing={playing}
          onPlayPause={() => setPlaying((p: boolean) => !p)}
          onReset={() => { passesRef.current = 0; setTime(0); }}
          onSeek={seekWall}
          onHover={(t: number | null) => setHoverTime(t)}
        />

        {/* Silver spotlight glow — follows the cursor, only while hovering */}
        <div
          ref={spotlightRef}
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            mixBlendMode: 'screen', opacity: revealed ? 1 : 0,
            transition: 'opacity 240ms ease', zIndex: 5,
          }}
        />
      </div>
    </div>
  );
}

// ── Playback bar ────────────────────────────────────────────────────────────

interface PlaybackBarProps {
  time: number;
  actualTime?: number;
  duration: number;
  durations?: number[];
  onDurationChange?: (d: number) => void;
  marks?: { pct: number; index: number }[];
  activeMark?: number;
  onMark?: (index: number) => void;
  revealed?: boolean;
  loopMode?: 'once' | 'three' | 'inf';
  onLoopCycle?: () => void;
  onReplayAll?: () => void;
  playing: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  onSeek: (t: number) => void;
  onHover: (t: number | null) => void;
}

function PlaybackBar({ time, duration, durations, onDurationChange, marks, activeMark, onMark, revealed = true, loopMode, onLoopCycle, onReplayAll, playing, onPlayPause, onReset, onSeek, onHover }: PlaybackBarProps) {
  const trackRef = React.useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = React.useState<boolean>(false);

  const timeFromEvent = React.useCallback((e: { clientX: number }) => {
    const rect = trackRef.current!.getBoundingClientRect();
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    return x * duration;
  }, [duration]);

  const onTrackMove = (e: any) => {
    if (!trackRef.current) return;
    const t = timeFromEvent(e);
    if (dragging) {
      onSeek(t);
    } else {
      onHover(t);
    }
  };

  const onTrackLeave = () => {
    if (!dragging) onHover(null);
  };

  const onTrackDown = (e: any) => {
    setDragging(true);
    const t = timeFromEvent(e);
    onSeek(t);
    onHover(null);
  };

  React.useEffect(() => {
    if (!dragging) return;
    const onUp = () => setDragging(false);
    const onMove = (e: MouseEvent) => {
      if (!trackRef.current) return;
      const t = timeFromEvent(e);
      onSeek(t);
    };
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mousemove', onMove);
    };
  }, [dragging, timeFromEvent, onSeek]);

  const pct = duration > 0 ? (time / duration) * 100 : 0;
  const fmt = (t: number): string => {
    const total = Math.max(0, t);
    const m = Math.floor(total / 60);
    const s = Math.floor(total % 60);
    const cs = Math.floor((total * 100) % 100);
    return `${String(m).padStart(1, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  };

  const mono = 'JetBrains Mono, ui-monospace, SFMono-Regular, monospace';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '8px 16px',
      background: 'rgba(20,20,20,0.92)',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      width: '100%',
      maxWidth: 680,
      alignSelf: 'center',

      borderRadius: 8,
      color: '#f6f4ef',
      fontFamily: 'Inter, system-ui, sans-serif',
      userSelect: 'none',
      flexShrink: 0,
    }}>
      {/* Left cluster — revealed on hover: loop · replay · restart.
          Reserves its width always so the scrub track never resizes. */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        opacity: revealed ? 1 : 0,
        pointerEvents: revealed ? 'auto' : 'none',
        transition: 'opacity 220ms ease',
      }}>
        {loopMode && onLoopCycle && <LoopButton mode={loopMode} onClick={onLoopCycle} />}
        {onReplayAll && (
          <IconButton onClick={onReplayAll} title="Replay from the start">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v5h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </IconButton>
        )}
        <IconButton onClick={onReset} title="Return to start (0)">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 2v10M12 2L5 7l7 5V2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
          </svg>
        </IconButton>
      </div>

      {/* Play / pause — always visible */}
      <IconButton onClick={onPlayPause} title="Play/pause (space)">
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="3" y="2" width="3" height="10" fill="currentColor"/>
            <rect x="8" y="2" width="3" height="10" fill="currentColor"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 2l9 5-9 5V2z" fill="currentColor"/>
          </svg>
        )}
      </IconButton>

      {/* Current time — revealed on hover (fixed width; track stays put) */}
      <div style={{
        fontFamily: mono,
        fontSize: 12,
        fontVariantNumeric: 'tabular-nums',
        width: 64, textAlign: 'right',
        color: '#f6f4ef',
        opacity: revealed ? 1 : 0,
        transition: 'opacity 220ms ease',
      }}>
        {fmt(time)}
      </div>

      {/* Scrub track */}
      <div
        ref={trackRef}
        onMouseMove={onTrackMove}
        onMouseLeave={onTrackLeave}
        onMouseDown={onTrackDown}
        style={{
          flex: 1,
          minWidth: 0,
          height: 22,
          position: 'relative',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center',
        }}
      >
        <div style={{
          position: 'absolute',
          left: 0, right: 0, height: 4,
          background: 'rgba(255,255,255,0.12)',
          borderRadius: 2,
        }}/>
        <div style={{
          position: 'absolute',
          left: 0, width: `${pct}%`, height: 4,
          background: 'rgba(246,244,239,0.85)',
          borderRadius: 2,
        }}/>
        {marks && marks.map((m) => (
          <div
            key={m.index}
            onMouseDown={(e: any) => { e.stopPropagation(); if (onMark) onMark(m.index); }}
            title="Jump to chapter"
            style={{
              position: 'absolute', left: `${m.pct * 100}%`, top: '50%',
              width: 8, height: 8, marginLeft: -4, marginTop: -4,
              borderRadius: '50%',
              background: m.index === activeMark ? '#fff' : 'rgba(246,244,239,0.5)',
              boxShadow: '0 0 0 2px rgba(20,20,20,0.92)',
              cursor: 'pointer', zIndex: 2,
            }}
          />
        ))}
        <div style={{
          position: 'absolute',
          left: `${pct}%`, top: '50%',
          width: 12, height: 12,
          marginLeft: -6, marginTop: -6,
          background: '#fff',
          borderRadius: 6,
          boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
          zIndex: 3,
        }}/>
      </div>

      {/* Total length — revealed on hover (toggle-in-place button) */}
      <div style={{
        display: 'flex', alignItems: 'center',
        opacity: revealed ? 1 : 0,
        pointerEvents: revealed ? 'auto' : 'none',
        transition: 'opacity 220ms ease',
      }}>
        {durations && durations.length > 0 && onDurationChange ? (
          <DurationToggle value={duration} options={durations} onChange={onDurationChange} />
        ) : (
          <div style={{
            fontFamily: mono,
            fontSize: 12,
            fontVariantNumeric: 'tabular-nums',
            width: 64, textAlign: 'left',
            color: 'rgba(246,244,239,0.55)',
          }}>
            {fmt(duration)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Loop button: cycle play-once / 3× / forever ──────────────────────────────

interface LoopButtonProps { mode: 'once' | 'three' | 'inf'; onClick: () => void; }

function LoopButton({ mode, onClick }: LoopButtonProps) {
  const count = mode === 'inf' ? '∞' : mode === 'three' ? '3' : '1';
  const active = mode !== 'once';
  const title = mode === 'inf'
    ? 'Looping forever — click to play once'
    : mode === 'three'
      ? 'Looping 3× — click to loop forever'
      : 'Plays once — click to loop 3×';
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      style={{
        position: 'relative', width: 30, height: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
        color: '#f6f4ef', opacity: active ? 1 : 0.72, cursor: 'pointer', padding: 0,
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path d="M17 2l3.5 3.5L17 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3 11.5V9.5a4 4 0 0 1 4-4h13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 22l-3.5-3.5L7 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21 12.5v2a4 4 0 0 1-4 4H3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span style={{
        position: 'absolute', right: 0, bottom: 0,
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        fontSize: 9, fontWeight: 700, lineHeight: 1, color: '#f6f4ef',
        background: 'rgba(20,20,20,0.96)', borderRadius: 3, padding: '1px 1px 0',
      }}>{count}</span>
    </button>
  );
}

// ── Chapter navigation: low-profile, monochrome scene index ──────────────────

interface ChapterNavProps {
  chapters: StageChapter[];
  active: number;
  mode: 'intro' | 'interactive';
  revealed?: boolean;
  onSelect: (i: number) => void;
  onReplay: () => void;
}

function ChapterNav({ chapters, active, mode, revealed = true, onSelect, onReplay }: ChapterNavProps) {
  const sans = "'Helvetica Neue', Helvetica, Arial, sans-serif";
  return (
    <div style={{
      width: '100%', maxWidth: 680, alignSelf: 'center', boxSizing: 'border-box',
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '6px 18px 10px', flexShrink: 0, userSelect: 'none',
      opacity: revealed ? 1 : 0,
      pointerEvents: revealed ? 'auto' : 'none',
      transition: 'opacity 220ms ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
        {chapters.map((c, i) => {
          const on = i === active;
          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              aria-current={on ? 'true' : undefined}
              title={`Go to “${c.label}”`}
              style={{
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 7,
                fontFamily: sans, fontSize: 11, fontWeight: on ? 700 : 500,
                letterSpacing: '0.18em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                color: on ? '#f6f4ef' : 'rgba(246,244,239,0.4)',
                transition: 'color 200ms',
              }}
            >
              <span style={{
                width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                background: on ? '#f6f4ef' : 'rgba(246,244,239,0.28)',
                transition: 'background 200ms',
              }} />
              {c.label}
            </button>
          );
        })}
      </div>
      <button
        onClick={onReplay}
        title="Replay this chapter from the start"
        aria-label="Replay this chapter"
        style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7,
          opacity: mode === 'interactive' ? 1 : 0,
          pointerEvents: mode === 'interactive' ? 'auto' : 'none',
          transition: 'opacity 240ms, background 160ms',
          background: 'rgba(246,244,239,0.06)',
          border: '1px solid rgba(246,244,239,0.18)', borderRadius: 6,
          padding: '5px 11px', cursor: 'pointer',
          fontFamily: sans, fontSize: 10.5, fontWeight: 600,
          letterSpacing: '0.16em', textTransform: 'uppercase', whiteSpace: 'nowrap',
          color: '#f6f4ef',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v5h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Replay
      </button>
    </div>
  );
}

// ── Length toggle: cycle 1m / 2m / 3m in place ───────────────────────────────

interface DurationToggleProps {
  value: number;
  options: number[];
  onChange: (d: number) => void;
}

function DurationToggle({ value, options, onChange }: DurationToggleProps) {
  const label = (secs: number): string =>
    secs % 60 === 0
      ? `${secs / 60}m`
      : `${Math.floor(secs / 60)}:${String(Math.round(secs % 60)).padStart(2, '0')}`;
  const cycle = () => onChange(options[(options.indexOf(value) + 1) % options.length]);
  return (
    <button
      onClick={cycle}
      title={`Length ${label(value)} — click to change`}
      aria-label={`Playback length ${label(value)}`}
      style={{
        minWidth: 34, height: 28, padding: '0 8px',
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        fontSize: 12, fontWeight: 600, letterSpacing: '0.04em',
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
        color: '#f6f4ef', cursor: 'pointer',
      }}
    >
      {label(value)}
    </button>
  );
}

interface IconButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  title?: string;
}

function IconButton({ children, onClick, title }: IconButtonProps) {
  const [hover, setHover] = React.useState<boolean>(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 28, height: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: hover ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 6,
        color: '#f6f4ef',
        cursor: 'pointer',
        padding: 0,
        transition: 'background 120ms',
      }}
    >
      {children}
    </button>
  );
}

Object.assign(window, {
  Easing, interpolate, animate, clamp,
  TimelineContext, useTime, useTimeline,
  Sprite, SpriteContext, useSprite,
  TextSprite, ImageSprite, RectSprite,
  Stage, PlaybackBar,
});
