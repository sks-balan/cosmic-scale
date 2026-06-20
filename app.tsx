// app.tsx — composes the Cosmic Scale film and mounts it (TypeScript).

declare const React: any;
declare const ReactDOM: any;
declare const Stage: any;
declare const Scene: any;
declare const Starfield: any;
declare const useTime: () => number;
declare const S1Title: any;
declare const S2EarthMoon: any;
declare const S3Sun: any;
declare const S4Light: any;
declare const S5Jupiter: any;
declare const S6Nearest: any;
declare const S7Close: any;
declare const AudioTrack: any;

interface SceneCtx { localTime: number; duration: number; }
interface Cue { start: number; end: number; Comp: (ctx: SceneCtx) => any; }

// Scene cue sheet — windows in seconds across a 60s timeline.
const CUES: Cue[] = [
  { start: 0,  end: 6,  Comp: S1Title },
  { start: 6,  end: 16, Comp: S2EarthMoon },
  { start: 16, end: 25, Comp: S3Sun },
  { start: 25, end: 33, Comp: S4Light },
  { start: 33, end: 42, Comp: S5Jupiter },
  { start: 42, end: 53, Comp: S6Nearest },
  { start: 53, end: 60, Comp: S7Close },
];

// Four chapters grouping the seven scenes. `poster` is the still each chapter
// rests on when selected/at the end; times are authored (film) seconds.
const CHAPTERS = [
  { label: 'Our Neighborhood',  start: 0,  end: 16, poster: 12 },
  { label: 'Our Star',          start: 16, end: 33, poster: 22 },
  { label: 'Giants & Distance', start: 33, end: 53, poster: 40 },
  { label: 'Closing',           start: 53, end: 60, poster: 58 },
];

// Generative score, in the key of D — one harmony per scene, building an arc
// (D · D · A · Bm · G · Em) that resolves home to D at the close. `at` is
// film-time, so it tracks the scenes at any playback length. Synthesized in
// audio.tsx; no audio files.
const SCORE = [
  { at: 0,  root: 73.42,  pad: [146.83, 220.00, 329.63], notes: [293.66, 329.63, 440.00, 220.00] }, // D
  { at: 6,  root: 73.42,  pad: [146.83, 185.00, 220.00], notes: [293.66, 369.99, 440.00, 329.63] }, // D maj
  { at: 16, root: 110.00, pad: [220.00, 277.18, 329.63], notes: [440.00, 329.63, 554.37, 277.18] }, // A
  { at: 25, root: 123.47, pad: [123.47, 146.83, 185.00], notes: [293.66, 369.99, 246.94, 185.00] }, // B min
  { at: 33, root: 98.00,  pad: [196.00, 246.94, 293.66], notes: [392.00, 293.66, 246.94, 196.00] }, // G
  { at: 42, root: 82.41,  pad: [164.81, 196.00, 246.94], notes: [329.63, 392.00, 246.94, 164.81] }, // E min
  { at: 53, root: 73.42,  pad: [146.83, 220.00, 329.63], notes: [293.66, 220.00, 329.63, 369.99] }, // D resolve
];

// Writes a per-second timestamp onto the video root so comments can be
// anchored to an exact moment in the timeline.
function ScreenLabel() {
  const t = useTime();
  const sec = Math.floor(t);
  React.useEffect(() => {
    const root = document.getElementById('root');
    if (root) root.setAttribute('data-screen-label', `t=${sec}s`);
  }, [sec]);
  return null;
}

// Top-right corner cluster: a full-screen toggle (reveals on hover) sitting
// next to the always-on sound toggle, sharing a cursor-centered silver
// spotlight — matching the bottom chrome's hover behaviour.
function CornerControls({ children }: { children: React.ReactNode }) {
  const [hover, setHover] = React.useState(false);
  const [fs, setFs] = React.useState(false);
  const spotRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const onFs = () => setFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const toggleFs = () => {
    if (document.fullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen();
    } else {
      const req = document.documentElement.requestFullscreen;
      if (req) req.call(document.documentElement).catch(() => {});
    }
  };

  // Center the spotlight on the cursor (percent positions are scale-invariant).
  const onMove = (e: any) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = r.width ? ((e.clientX - r.left) / r.width) * 100 : 50;
    const py = r.height ? ((e.clientY - r.top) / r.height) * 100 : 50;
    if (spotRef.current) {
      spotRef.current.style.background =
        `radial-gradient(150px 150px at ${px}% ${py}%, rgba(232,235,242,0.5), rgba(170,176,191,0.16) 45%, rgba(0,0,0,0) 72%)`;
    }
  };

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onMouseMove={onMove}
      style={{ position: 'absolute', top: 32, right: 32, display: 'flex', alignItems: 'center', gap: 12, zIndex: 6 }}
    >
      <button
        onClick={toggleFs}
        aria-label={fs ? 'Exit full screen' : 'Full screen'}
        title={fs ? 'Exit full screen' : 'Full screen'}
        style={{
          flexShrink: 0,
          width: 48, height: 48, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(243,242,236,0.06)',
          border: '1px solid rgba(243,242,236,0.18)',
          color: '#f3f2ec',
          opacity: hover ? 0.9 : 0,
          pointerEvents: hover ? 'auto' : 'none',
          cursor: 'pointer', padding: 0,
          transition: 'opacity 220ms ease, background 160ms',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          {fs ? (
            <path d="M9 4v3a2 2 0 0 1-2 2H4M20 9h-3a2 2 0 0 1-2-2V4M4 15h3a2 2 0 0 1 2 2v3M15 20v-3a2 2 0 0 1 2-2h3"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <path d="M4 9V6a2 2 0 0 1 2-2h3M20 9V6a2 2 0 0 0-2-2h-3M4 15v3a2 2 0 0 0 2 2h3M20 15v3a2 2 0 0 1-2 2h-3"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          )}
        </svg>
      </button>
      {children}
      <div
        ref={spotRef}
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          mixBlendMode: 'screen', opacity: hover ? 1 : 0,
          transition: 'opacity 220ms ease', zIndex: 3,
        }}
      />
    </div>
  );
}

function CosmicFilm() {
  return (
    <React.Fragment>
      <Starfield opacity={0.9} />
      {CUES.map(({ start, end, Comp }, i) => (
        <Scene key={i} start={start} end={end}>
          {(ctx: SceneCtx) => <Comp {...ctx} />}
        </Scene>
      ))}
      <CornerControls>
        <AudioTrack score={SCORE} />
      </CornerControls>
      <ScreenLabel />
    </React.Fragment>
  );
}

// Respect the OS "reduce motion" setting: open on a still title card the
// viewer can play themselves, rather than autoplaying the film.
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

ReactDOM.createRoot(document.getElementById('root')).render(
  <Stage width={1920} height={1080}
         duration={60} timelineDuration={60} durations={[60, 120, 180]}
         chapters={CHAPTERS} loopModes={['once', 'three', 'inf']}
         background="#0a0a0a" persistKey="cosmic" autoplay={!prefersReducedMotion}>
    <CosmicFilm />
  </Stage>
);
