// bodies.tsx — monochrome celestial primitives for the Cosmic Scale film (TypeScript).
// Exports to window: FONT, INK, DIM, SOFT, FAINT, fmtNum, Disc, Ring, Label,
//   Kicker, Counter, DashLine, Tick, Starfield, Scene.

declare const React: any;
declare const Sprite: any;
declare const useTime: () => number;
declare function clamp(v: number, min: number, max: number): number;

interface SceneCtx {
  localTime: number;
  progress: number;
  duration: number;
  visible?: boolean;
}

const FONT  = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const INK   = '#f3f2ec';   // near-white
const DIM   = '#9a9a94';   // mid gray
const SOFT  = '#c9c8c2';   // light gray
const FAINT = '#3a3a37';   // dark gray (rings, lines)

// ── formatting ──────────────────────────────────────────────────────────────
interface FmtOpts { commas?: boolean; decimals?: number; }
function fmtNum(n: number, { commas = true, decimals = 0 }: FmtOpts = {}): string {
  const v = Number(n);
  const fixed = v.toFixed(decimals);
  if (!commas) return fixed;
  const [int, dec] = fixed.split('.');
  const withC = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return dec != null ? `${withC}.${dec}` : withC;
}

// ── Disc: a filled circle, optional glow + outline ───────────────────────────
interface DiscProps {
  cx: number; cy: number; r: number;
  fill?: string; opacity?: number;
  glow?: number; glowColor?: string;
  ring?: boolean; ringColor?: string; ringWidth?: number;
  shadowInset?: boolean;
}
function Disc({ cx, cy, r, fill = INK, opacity = 1, glow = 0, glowColor,
               ring = false, ringColor = FAINT, ringWidth = 1.5, shadowInset = false }: DiscProps) {
  if (r <= 0 || opacity <= 0) return null;
  const gc = glowColor || 'rgba(243,242,236,0.55)';
  const boxShadow = glow > 0
    ? `0 0 ${glow}px ${glow * 0.35}px ${gc}${shadowInset ? ', inset 0 0 ' + (r * 0.9) + 'px rgba(0,0,0,0.45)' : ''}`
    : (shadowInset ? `inset 0 0 ${r * 0.9}px rgba(0,0,0,0.45)` : 'none');
  return (
    <div style={{
      position: 'absolute',
      left: cx - r, top: cy - r,
      width: r * 2, height: r * 2,
      borderRadius: '50%',
      background: ring ? 'transparent' : fill,
      border: ring ? `${ringWidth}px solid ${ringColor}` : 'none',
      opacity,
      boxShadow,
      willChange: 'transform, opacity',
    }} />
  );
}

// ── Ring: thin outline circle (orbits, scale references) ─────────────────────
interface RingProps {
  cx: number; cy: number; r: number;
  color?: string; width?: number; opacity?: number; dashed?: boolean;
}
function Ring({ cx, cy, r, color = FAINT, width = 1.5, opacity = 1, dashed = false }: RingProps) {
  if (r <= 0 || opacity <= 0) return null;
  return (
    <div style={{
      position: 'absolute',
      left: cx - r, top: cy - r,
      width: r * 2, height: r * 2,
      borderRadius: '50%',
      border: `${width}px ${dashed ? 'dashed' : 'solid'} ${color}`,
      opacity,
    }} />
  );
}

// ── Label: tracked Helvetica text, positioned by anchor ──────────────────────
type Align = 'left' | 'center' | 'right';
interface LabelProps {
  x: number; y: number; text: React.ReactNode;
  size?: number; color?: string; weight?: number;
  align?: Align; track?: string; opacity?: number;
  upper?: boolean; lh?: number; maxWidth?: number;
}
function Label({ x, y, text, size = 17, color = DIM, weight = 500, align = 'center',
                track = '0.18em', opacity = 1, upper = true, lh = 1.25, maxWidth }: LabelProps) {
  const tx = align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0';
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      transform: `translateX(${tx})`,
      textAlign: align,
      fontFamily: FONT, fontSize: size, fontWeight: weight,
      letterSpacing: track, color, opacity,
      textTransform: upper ? 'uppercase' : 'none',
      lineHeight: lh, whiteSpace: maxWidth ? 'normal' : 'pre',
      maxWidth, willChange: 'opacity',
    }}>
      {text}
    </div>
  );
}

// ── Kicker: tiny eyebrow label with a leading bullet ─────────────────────────
interface KickerProps {
  x: number; y: number; text: string;
  color?: string; opacity?: number; align?: Align;
}
function Kicker({ x, y, text, color = DIM, opacity = 1, align = 'center' }: KickerProps) {
  const tx = align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0';
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      transform: `translateX(${tx})`,
      display: 'flex', alignItems: 'center', gap: 12,
      fontFamily: FONT, fontSize: 16, fontWeight: 600,
      letterSpacing: '0.34em', color, opacity, textTransform: 'uppercase',
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span>{text}</span>
    </div>
  );
}

// ── Counter: formatted number (value supplied per-frame) ─────────────────────
interface CounterProps {
  x: number; y: number; value: number;
  size?: number; weight?: number; color?: string; align?: Align;
  suffix?: string; prefix?: string; track?: string; opacity?: number;
  decimals?: number; commas?: boolean;
}
function Counter({ x, y, value, size = 120, weight = 700, color = INK, align = 'center',
                  suffix = '', prefix = '', track = '-0.02em', opacity = 1, decimals = 0,
                  commas = true }: CounterProps) {
  const tx = align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0';
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      transform: `translateX(${tx})`,
      fontFamily: FONT, fontSize: size, fontWeight: weight,
      letterSpacing: track, color, opacity,
      fontVariantNumeric: 'tabular-nums', whiteSpace: 'pre',
      lineHeight: 1, willChange: 'opacity',
    }}>
      {prefix}{fmtNum(value, { commas, decimals })}{suffix}
    </div>
  );
}

// ── DashLine: a straight measurement line ────────────────────────────────────
interface DashLineProps {
  x1: number; y1: number; x2: number; y2: number;
  color?: string; opacity?: number; width?: number; dash?: string;
}
function DashLine({ x1, y1, x2, y2, color = FAINT, opacity = 1, width = 1.5, dash = '7 7' }: DashLineProps) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  return (
    <div style={{
      position: 'absolute', left: x1, top: y1,
      width: len, height: 0,
      transform: `rotate(${ang}deg)`, transformOrigin: '0 0',
      borderTop: `${width}px dashed ${color}`,
      opacity,
    }} />
  );
}

// ── Tick: small end-cap for measurement lines ────────────────────────────────
interface TickProps { x: number; y: number; h?: number; color?: string; opacity?: number; }
function Tick({ x, y, h = 16, color = FAINT, opacity = 1 }: TickProps) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y - h / 2,
      width: 0, height: h, borderLeft: `1.5px solid ${color}`, opacity,
    }} />
  );
}

// ── Starfield: seeded, faintly twinkling dots (continuity layer) ─────────────
interface Star { x: number; y: number; r: number; base: number; phase: number; speed: number; }
function mulberry32(a: number): () => number {
  return function (): number {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const _stars: Star[] = (() => {
  const rnd = mulberry32(20260619);
  const arr: Star[] = [];
  for (let i = 0; i < 140; i++) {
    arr.push({
      x: rnd() * 1920, y: rnd() * 1080,
      r: 0.6 + rnd() * 1.7,
      base: 0.06 + rnd() * 0.5,
      phase: rnd() * Math.PI * 2,
      speed: 0.4 + rnd() * 1.1,
    });
  }
  return arr;
})();
function Starfield({ opacity = 1 }: { opacity?: number }) {
  const t = useTime();
  return (
    <div style={{ position: 'absolute', inset: 0, opacity, pointerEvents: 'none' }}>
      {_stars.map((s, i) => {
        const tw = s.base * (0.55 + 0.45 * Math.sin(t * s.speed + s.phase));
        return (
          <div key={i} style={{
            position: 'absolute', left: s.x - s.r, top: s.y - s.r,
            width: s.r * 2, height: s.r * 2, borderRadius: '50%',
            background: INK, opacity: tw,
          }} />
        );
      })}
    </div>
  );
}

// ── Scene: time-windowed wrapper with a clean fade envelope ───────────────────
interface SceneProps {
  start: number; end: number; fade?: number;
  children: React.ReactNode | ((ctx: SceneCtx) => React.ReactNode);
}
function Scene({ start, end, fade = 0.55, children }: SceneProps) {
  return (
    <Sprite start={start} end={end}>
      {(ctx: SceneCtx) => {
        const { localTime, duration } = ctx;
        const o = clamp(Math.min(localTime / fade, (duration - localTime) / fade), 0, 1);
        return (
          <div style={{ position: 'absolute', inset: 0, opacity: o }}>
            {typeof children === 'function' ? (children as (c: SceneCtx) => React.ReactNode)(ctx) : children}
          </div>
        );
      }}
    </Sprite>
  );
}

Object.assign(window, {
  FONT, INK, DIM, SOFT, FAINT,
  fmtNum, Disc, Ring, Label, Kicker, Counter, DashLine, Tick, Starfield, Scene,
});
