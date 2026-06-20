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

function CosmicFilm() {
  return (
    <React.Fragment>
      <Starfield opacity={0.9} />
      {CUES.map(({ start, end, Comp }, i) => (
        <Scene key={i} start={start} end={end}>
          {(ctx: SceneCtx) => <Comp {...ctx} />}
        </Scene>
      ))}
      <AudioTrack score={SCORE} />
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
         chapters={CHAPTERS}
         background="#0a0a0a" persistKey="cosmic" autoplay={!prefersReducedMotion}>
    <CosmicFilm />
  </Stage>
);
