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
  <Stage width={1920} height={1080} duration={60} background="#0a0a0a"
         persistKey="cosmic" autoplay={!prefersReducedMotion}>
    <CosmicFilm />
  </Stage>
);
