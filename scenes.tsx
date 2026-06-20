// scenes.tsx — the seven fun-fact scenes of the Cosmic Scale film (TypeScript).
// Each scene component receives { localTime, duration } from <Scene>.

declare const React: any;
declare const Easing: Record<string, (t: number) => number>;
declare function clamp(v: number, min: number, max: number): number;
declare const FONT: string;
declare const INK: string;
declare const DIM: string;
declare const SOFT: string;
declare const FAINT: string;
declare function fmtNum(n: number, opts?: { commas?: boolean; decimals?: number }): string;
declare const Disc: any;
declare const Ring: any;
declare const Label: any;
declare const Kicker: any;
declare const Counter: any;
declare const DashLine: any;
declare const Tick: any;

interface SceneCtx { localTime: number; duration: number; }
type Align = 'left' | 'center' | 'right';

const E = Easing;
const env = (t: number, t0: number, d = 0.5): number => clamp((t - t0) / d, 0, 1);
const eo  = (t: number, t0: number, d = 0.5): number => E.easeOutCubic(env(t, t0, d));
const mmss = (sec: number): string => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

// ── Head: staggered multi-line headline (lines may be strings or JSX) ─────────
interface HeadProps {
  x?: number; y: number; lines: React.ReactNode[];
  size?: number; weight?: number; color?: string; align?: Align;
  lh?: number; track?: string; t?: number; t0?: number;
  stagger?: number; up?: number; maxWidth?: number;
}
function Head({ x = 960, y, lines, size = 60, weight = 600, color = SOFT, align = 'center',
               lh = 1.14, track = '-0.012em', t = 0, t0 = 0, stagger = 0.13, up = 22, maxWidth }: HeadProps) {
  const tx = align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0';
  return (
    <div style={{
      position: 'absolute', left: x, top: y, transform: `translateX(${tx})`,
      textAlign: align, fontFamily: FONT, fontSize: size, fontWeight: weight,
      color, lineHeight: lh, letterSpacing: track,
      width: 'max-content', maxWidth: maxWidth || 1480, willChange: 'opacity',
    }}>
      {lines.map((ln, i) => {
        const p = eo(t, t0 + i * stagger, 0.6);
        return (
          <div key={i} style={{ opacity: p, transform: `translateY(${(1 - p) * up}px)`, willChange: 'transform, opacity' }}>
            {ln}
          </div>
        );
      })}
    </div>
  );
}
const HL = ({ children }: { children: React.ReactNode }) =>
  <span style={{ color: INK, fontWeight: 700 }}>{children}</span>;

// ════════════════════════════════════════════════════════════════════════════
// SCENE 1 — TITLE
// ════════════════════════════════════════════════════════════════════════════
function S1Title({ localTime: lt }: SceneCtx) {
  const dotR = 7 * E.easeOutBack(env(lt, 0.2, 0.7)) + 1.4 * Math.sin(lt * 2.4);
  const rings = [0, 1, 2].map((k) => {
    const p = env(lt, 0.5 + k * 0.6, 2.4);
    return { r: E.easeOutCubic(p) * 520, o: (1 - p) * 0.45, on: p > 0.001 && p < 1 };
  });
  const subO = env(lt, 1.7, 0.7);
  return (
    <React.Fragment>
      {rings.map((r, i) => r.on && <Ring key={i} cx={960} cy={372} r={r.r} color={INK} width={1.2} opacity={r.o} />)}
      <Disc cx={960} cy={372} r={Math.max(0, dotR)} fill={INK} glow={26} />
      <div style={{
        position: 'absolute', left: 960, top: 452, transform: 'translateX(-50%)',
        opacity: eo(lt, 1.0, 0.7),
        fontFamily: FONT, fontSize: 168, fontWeight: 800, letterSpacing: '-0.035em',
        color: INK, lineHeight: 1, whiteSpace: 'pre',
      }}>
        Cosmic Scale
      </div>
      <Label x={960} y={672} size={20} track="0.46em" color={DIM}
             text="NOTES ON DISTANCE & SIZE" opacity={subO} />
    </React.Fragment>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SCENE 2 — EVERY PLANET FITS BETWEEN EARTH & MOON
// ════════════════════════════════════════════════════════════════════════════
interface Planet { n: string; r: number; cx: number; fill: string; }
const PLANETS: Planet[] = [
  { n: 'MERCURY', r: 8,   cx: 366,  fill: DIM },
  { n: 'VENUS',   r: 20,  cx: 394,  fill: SOFT },
  { n: 'MARS',    r: 11,  cx: 425,  fill: DIM },
  { n: 'JUPITER', r: 229, cx: 665,  fill: INK },
  { n: 'SATURN',  r: 191, cx: 1086, fill: SOFT },
  { n: 'URANUS',  r: 83,  cx: 1360, fill: DIM },
  { n: 'NEPTUNE', r: 81,  cx: 1524, fill: SOFT },
];
function S2EarthMoon({ localTime: lt }: SceneCtx) {
  const cy = 560;
  const bob = Math.sin(lt * 0.7) * 4;
  const bodyO = env(lt, 0.1, 0.7);
  const measureO = env(lt, 0.7, 0.8);
  const settled = lt > 4.6;
  const spareO = env(lt, 5.6, 0.8);
  return (
    <React.Fragment>
      <Head t={lt} t0={0.4} y={86} size={54}
        lines={[<span key="a">Line up <HL>every planet</HL> in the solar system —</span>,
                <span key="b">they all fit between the <HL>Earth</HL> and the <HL>Moon</HL>.</span>]} />

      {/* measurement line, riding just above the planet row */}
      <Tick x={358} y={302} h={20} color={FAINT} opacity={measureO} />
      <Tick x={1605} y={302} h={20} color={FAINT} opacity={measureO} />
      <DashLine x1={358} y1={302} x2={1605} y2={302} color={FAINT} opacity={measureO} />
      <Label x={981} y={262} size={18} track="0.3em" color={DIM} text="384,400 KM" opacity={measureO} />

      <div style={{ position: 'absolute', inset: 0, transform: `translateY(${bob}px)` }}>
        {/* Earth + Moon anchors */}
        <Disc cx={300} cy={cy} r={58} fill={INK} opacity={bodyO} glow={10} />
        <Disc cx={1620} cy={cy} r={15} fill={SOFT} opacity={bodyO} />
        <Label x={300} y={cy + 92} size={17} track="0.28em" color={DIM} text="EARTH" opacity={bodyO} />
        <Label x={1620} y={cy + 38} size={15} track="0.24em" color={DIM} text="MOON" opacity={bodyO} />

        {/* planets streaming into the gap */}
        {PLANETS.map((p, i) => {
          const st = 2.0 + i * 0.22;
          const pr = E.easeOutCubic(env(lt, st, 0.85));
          if (pr <= 0) return null;
          const cx = -280 + (p.cx + 280) * pr;
          return <Disc key={p.n} cx={cx} cy={cy} r={p.r} fill={p.fill} opacity={clamp((lt - st) / 0.35, 0, 1)} />;
        })}
      </div>

      {settled && (
        <Label x={960} y={930} size={19} track="0.26em" color={DIM} opacity={spareO}
               text="…WITH THOUSANDS OF KILOMETRES TO SPARE" />
      )}
    </React.Fragment>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SCENE 3 — THE SUN
// ════════════════════════════════════════════════════════════════════════════
function S3Sun({ localTime: lt }: SceneCtx) {
  const grow = E.easeOutCubic(env(lt, 0.3, 1.6));
  const sunR = 30 + grow * 410 + Math.sin(lt * 1.1) * 4;
  const sunCx = 1280, sunCy = 540;
  const earthCx = sunCx - sunR - 42;
  const count = Math.round(1300000 * E.easeOutCubic(env(lt, 0.6, 2.6)));
  return (
    <React.Fragment>
      <Disc cx={sunCx} cy={sunCy} r={sunR} fill={INK} glow={120} glowColor="rgba(243,242,236,0.30)" shadowInset />
      {/* tiny Earth for scale, hugging the Sun's edge */}
      <Disc cx={earthCx} cy={540} r={6} fill={INK} opacity={env(lt, 1.6, 0.6)} glow={8} />
      <Label x={earthCx} y={566} size={14} track="0.22em" color={DIM} text="EARTH" opacity={env(lt, 1.9, 0.6)} />

      <Kicker x={160} y={300} align="left" text="OUR STAR — THE SUN" color={DIM} opacity={env(lt, 0.2, 0.6)} />
      <Counter x={150} y={336} align="left" value={count} size={132} weight={800} color={INK} />
      <Head x={150} y={500} align="left" t={lt} t0={1.2} size={44} color={SOFT}
            lines={['Earths would fit', 'inside the Sun.']} />
    </React.Fragment>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SCENE 4 — SPEED OF LIGHT
// ════════════════════════════════════════════════════════════════════════════
function S4Light({ localTime: lt }: SceneCtx) {
  const sunX = 250, earthX = 1660, y = 540;
  const p = E.easeInOutSine(env(lt, 1.0, 5.0));
  const photonX = sunX + 80 + (earthX - 80 - (sunX + 80)) * p;
  const seconds = p * 500; // 8 min 20 s
  const arrived = p >= 1;
  return (
    <React.Fragment>
      <Head t={lt} t0={0.3} y={104} size={52} color={SOFT}
        lines={[<span key="a">Light is the <HL>fastest thing there is</HL> —</span>,
                <span key="b">three hundred thousand kilometres a second.</span>]} />

      {/* path */}
      <DashLine x1={sunX + 70} y1={y} x2={earthX - 30} y2={y} color={FAINT} opacity={0.7} dash="2 10" />
      {/* travelled trail */}
      <div style={{
        position: 'absolute', left: sunX + 80, top: y - 1.5, height: 3,
        width: Math.max(0, photonX - (sunX + 80)),
        background: `linear-gradient(90deg, rgba(243,242,236,0) 0%, rgba(243,242,236,0.85) 100%)`,
        opacity: env(lt, 1.0, 0.4),
      }} />

      <Disc cx={sunX} cy={y} r={70} fill={INK} glow={70} glowColor="rgba(243,242,236,0.28)" shadowInset />
      <Label x={sunX} y={y + 96} size={15} track="0.24em" color={DIM} text="SUN" />
      <Disc cx={earthX} cy={y} r={26} fill={SOFT} opacity={1} glow={arrived ? 18 : 0} />
      <Label x={earthX} y={y + 52} size={15} track="0.24em" color={DIM} text="EARTH" />

      {/* photon */}
      <Disc cx={photonX} cy={y} r={7} fill={INK} glow={20} opacity={env(lt, 1.0, 0.3)} />

      {/* timer */}
      <div style={{
        position: 'absolute', left: 960, top: 760, transform: 'translateX(-50%)',
        textAlign: 'center', opacity: env(lt, 1.0, 0.5),
      }}>
        <div style={{ fontFamily: FONT, fontSize: 96, fontWeight: 800, color: INK, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
          {mmss(seconds)}
        </div>
        <div style={{ fontFamily: FONT, fontSize: 18, fontWeight: 600, letterSpacing: '0.3em', color: DIM, marginTop: 10 }}>
          {arrived ? 'TO CROSS A SINGLE SUNBEAM' : 'TRAVEL TIME, SUN → EARTH'}
        </div>
      </div>
    </React.Fragment>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SCENE 5 — JUPITER
// ════════════════════════════════════════════════════════════════════════════
interface JupPoint { x: number; y: number; d: number; k: number; }
interface JupData { cx: number; cy: number; R: number; dr: number; pts: JupPoint[]; }
const JUP: JupData = (() => {
  const cx = 1280, cy = 540, R = 300, step = 21, dr = 5.2;
  const pts: JupPoint[] = [];
  for (let gx = -R; gx <= R; gx += step) {
    for (let gy = -R; gy <= R; gy += step) {
      if (gx * gx + gy * gy <= (R - dr) * (R - dr)) {
        pts.push({ x: cx + gx, y: cy + gy, d: Math.hypot(gx, gy), k: 0 });
      }
    }
  }
  // deterministic shuffle by hashed key so fill looks organic
  pts.forEach((p) => { let h = Math.sin(p.x * 12.9898 + p.y * 78.233) * 43758.5453; p.k = h - Math.floor(h); });
  pts.sort((a, b) => a.k - b.k);
  return { cx, cy, R, dr, pts };
})();
function S5Jupiter({ localTime: lt }: SceneCtx) {
  const fillP = E.easeInOutSine(env(lt, 1.0, 4.6));
  const shown = Math.floor(fillP * JUP.pts.length);
  const count = Math.round(1300 * fillP);
  const bandO = env(lt, 0.5, 0.8) * 0.5;
  return (
    <React.Fragment>
      {/* Jupiter body */}
      <Disc cx={JUP.cx} cy={JUP.cy} r={JUP.R} fill={'#1c1c1a'} ring opacity={env(lt, 0.2, 0.6)} ringColor={SOFT} ringWidth={2} />
      <div style={{ position: 'absolute', left: JUP.cx - JUP.R, top: JUP.cy - JUP.R, width: JUP.R * 2, height: JUP.R * 2, borderRadius: '50%', overflow: 'hidden', opacity: env(lt, 0.2, 0.6) }}>
        <div style={{ position: 'absolute', inset: 0, background: '#161614' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: '34%', height: 26, background: 'rgba(243,242,236,0.05)', opacity: bandO * 2 }} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: '58%', height: 40, background: 'rgba(243,242,236,0.04)', opacity: bandO * 2 }} />
      </div>
      {/* filling earths */}
      {JUP.pts.slice(0, shown).map((p, i) => (
        <div key={i} style={{ position: 'absolute', left: p.x - JUP.dr, top: p.y - JUP.dr, width: JUP.dr * 2, height: JUP.dr * 2, borderRadius: '50%', background: i % 7 === 0 ? INK : SOFT, opacity: 0.9 }} />
      ))}

      <Kicker x={150} y={296} align="left" text="THE GIANT — JUPITER" color={DIM} opacity={env(lt, 0.2, 0.6)} />
      <Counter x={140} y={332} align="left" value={count} size={150} weight={800} color={INK} />
      <Head x={150} y={520} align="left" t={lt} t0={1.0} size={42} color={SOFT}
            lines={['Earths would fit', <span key="b">inside, <span style={{ color: DIM }}>by volume.</span></span>]} />
    </React.Fragment>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SCENE 6 — THE NEAREST STAR
// ════════════════════════════════════════════════════════════════════════════
function S6Nearest({ localTime: lt }: SceneCtx) {
  const sunX = 280, starX = 1640, y = 470;
  const km = Math.round(40000000000000 * E.easeOutCubic(env(lt, 1.4, 2.6)));
  const lineO = env(lt, 0.8, 0.8);
  const years = Math.round(50000000 * E.easeOutCubic(env(lt, 5.0, 2.4)));
  const punchO = env(lt, 4.8, 0.7);
  // marker barely creeps from the Sun
  const crawl = env(lt, 6.0, 4.0);
  const markerX = sunX + 10 + crawl * 26;
  return (
    <React.Fragment>
      <Kicker x={960} y={150} text="THE NEAREST STAR" color={DIM} opacity={env(lt, 0.2, 0.6)} />

      {/* the two suns, far apart */}
      <DashLine x1={sunX + 24} y1={y} x2={starX - 20} y2={y} color={FAINT} opacity={lineO} dash="3 12" />
      <Disc cx={sunX} cy={y} r={13} fill={INK} glow={22} />
      <Disc cx={starX} cy={y} r={10} fill={SOFT} glow={16} opacity={env(lt, 0.5, 0.8)} />
      <Label x={sunX} y={y + 40} size={14} track="0.24em" color={DIM} text="THE SUN" />
      <Label x={starX} y={y + 38} size={14} track="0.22em" color={DIM} text="PROXIMA CENTAURI" />
      {/* crawling probe */}
      <Disc cx={markerX} cy={y} r={3.5} fill={INK} opacity={env(lt, 6.0, 0.5)} />

      {/* the distance */}
      <Counter x={960} y={566} value={km} size={92} weight={800} color={INK} />
      <Label x={960} y={690} size={20} track="0.34em" color={DIM} text="KILOMETRES — 4.24 LIGHT-YEARS AWAY" opacity={env(lt, 1.6, 0.6)} />

      {/* the punchline */}
      <div style={{ position: 'absolute', left: 960, top: 812, transform: 'translateX(-50%)', textAlign: 'center', opacity: punchO }}>
        <div style={{ fontFamily: FONT, fontSize: 34, fontWeight: 600, color: SOFT, letterSpacing: '-0.01em' }}>
          Drive there at highway speed and you arrive in
        </div>
        <div style={{ fontFamily: FONT, fontSize: 64, fontWeight: 800, color: INK, letterSpacing: '-0.02em', marginTop: 12, fontVariantNumeric: 'tabular-nums' }}>
          {fmtNum(years)} years
        </div>
      </div>
    </React.Fragment>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SCENE 7 — CLOSING
// ════════════════════════════════════════════════════════════════════════════
interface ClusterDot { x: number; y: number; r: number; }
function S7Close({ localTime: lt }: SceneCtx) {
  const collapse = E.easeInOutCubic(env(lt, 0.4, 2.0));
  const cluster: ClusterDot[] = [
    { x: -260, y: -120, r: 30 }, { x: 220, y: -80, r: 46 }, { x: -120, y: 150, r: 22 },
    { x: 300, y: 140, r: 16 }, { x: -340, y: 40, r: 12 }, { x: 120, y: -200, r: 18 },
    { x: 60, y: 230, r: 10 },
  ];
  const dotR = 7 + 1.4 * Math.sin(lt * 2.2);
  return (
    <React.Fragment>
      {cluster.map((c, i) => {
        const cx = 960 + c.x * (1 - collapse);
        const cy = 372 + c.y * (1 - collapse);
        const r = c.r * (1 - collapse) + dotR * collapse;
        return <Disc key={i} cx={cx} cy={cy} r={Math.max(0, r)} fill={i % 2 ? SOFT : INK} opacity={0.85} glow={collapse > 0.8 ? 24 * collapse : 0} />;
      })}

      <Head t={lt} t0={2.2} y={500} size={64} stagger={1.1} color={SOFT}
        lines={[<span key="a">Everything you have ever known —</span>,
                <span key="b"><HL>one dot</HL>, in an ocean of dark.</span>]} />
      <Label x={960} y={300} size={17} track="0.34em" color={DIM} text="YOU ARE HERE" opacity={env(lt, 4.0, 0.8) * (1 - env(lt, 6.2, 0.6))} />
      <Label x={960} y={720} size={18} track="0.5em" color={DIM} text="COSMIC SCALE" opacity={env(lt, 4.6, 1.0)} />
    </React.Fragment>
  );
}

Object.assign(window, {
  Head, S1Title, S2EarthMoon, S3Sun, S4Light, S5Jupiter, S6Nearest, S7Close,
});
