// audio.tsx — generative ambient score for the Cosmic Scale film (TypeScript).
// 100% synthesized at runtime via the Web Audio API: no sample files, no
// external assets, nothing copyrighted. A slow drone + pad whose harmony
// shifts per scene, sparse bell accents, and an algorithmic reverb for space.
//
// Exports to window: AudioTrack.
//
// The score reads film-time from the timeline, so it follows the scenes and
// stretches correctly when the film is played over 1 / 2 / 3 minutes.

declare const React: any;
declare const useTimeline: () => { time: number; duration: number; playing: boolean };
declare const INK: string;

interface ScoreStop {
  at: number;       // film-time (seconds) this harmony takes over
  root: number;     // drone fundamental (Hz)
  pad: number[];    // three sustained chord tones (Hz)
  notes: number[];  // pool the sparse melody draws from (Hz)
}

// ── tiny synthesis helpers ───────────────────────────────────────────────────
function makeReverbIR(ctx: any, seconds = 2.6, decay = 2.2): any {
  const rate = ctx.sampleRate;
  const len = Math.max(1, Math.floor(rate * seconds));
  const buf = ctx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
}

function makeNoise(ctx: any, seconds = 2): any {
  const rate = ctx.sampleRate;
  const len = Math.floor(rate * seconds);
  const buf = ctx.createBuffer(1, len, rate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function osc(ctx: any, type: string, freq: number): any {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  return o;
}

// ── AudioTrack ────────────────────────────────────────────────────────────────
interface AudioTrackProps { score: ScoreStop[]; level?: number; }

function AudioTrack({ score, level = 0.2 }: AudioTrackProps) {
  const { time, playing } = useTimeline();

  const [enabled, setEnabled] = React.useState<boolean>(() => {
    try { return localStorage.getItem('cosmic:audio') === '1'; } catch { return false; }
  });

  // graph + scheduler live in a ref so re-renders never rebuild the audio
  const S = React.useRef<any>(null);

  // active harmony index from film-time (scenes are contiguous)
  let idx = 0;
  for (let i = 0; i < score.length; i++) if (time >= score[i].at) idx = i;
  const idxRef = React.useRef<number>(0);
  idxRef.current = idx;

  // Build the audio graph once, on first enable (inside a user gesture).
  const ensureGraph = React.useCallback(() => {
    if (S.current) return S.current;
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    const ctx = new AC();

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    // algorithmic reverb send
    const reverb = ctx.createConvolver();
    reverb.buffer = makeReverbIR(ctx);
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.5;
    reverb.connect(reverbGain);
    reverbGain.connect(master);

    const sc = score[idxRef.current];

    // drone: fundamental + a fifth, lightly detuned, mostly dry
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.32;
    droneGain.connect(master);
    droneGain.connect(reverb);
    const d1 = osc(ctx, 'sine', sc.root);
    const d2 = osc(ctx, 'sine', sc.root * 1.5);
    d2.detune.value = 4;
    d1.connect(droneGain); d2.connect(droneGain);
    d1.start(); d2.start();

    // pad: three sustained chord tones through a soft lowpass, into reverb
    const padLP = ctx.createBiquadFilter();
    padLP.type = 'lowpass'; padLP.frequency.value = 1300; padLP.Q.value = 0.4;
    padLP.connect(master); padLP.connect(reverb);
    const padGain = ctx.createGain();
    padGain.gain.value = 0.13;
    padGain.connect(padLP);
    const pads = sc.pad.map((f: number) => {
      const o = osc(ctx, 'triangle', f);
      o.connect(padGain); o.start();
      return o;
    });

    // faint filtered-noise "air"
    const noise = ctx.createBufferSource();
    noise.buffer = makeNoise(ctx, 2); noise.loop = true;
    const nbp = ctx.createBiquadFilter();
    nbp.type = 'bandpass'; nbp.frequency.value = 820; nbp.Q.value = 0.7;
    const nGain = ctx.createGain(); nGain.gain.value = 0.018;
    noise.connect(nbp); nbp.connect(nGain); nGain.connect(reverb); nGain.connect(master);
    noise.start();

    // sparse bell accents are summed here
    const arpGain = ctx.createGain();
    arpGain.gain.value = 0.9;
    arpGain.connect(master); arpGain.connect(reverb);

    S.current = { ctx, master, droneGain, d1, d2, pads, padGain, arpGain, reverb, nextNote: 0, step: 0, sched: null };
    return S.current;
  }, [score]);

  // sparse melody, self-scheduled on the audio clock (robust to scrubbing)
  const playNote = React.useCallback((st: any, when: number) => {
    if (Math.random() < 0.22) return; // breathe
    const notes = score[idxRef.current].notes;
    st.step = (st.step + 1) % notes.length;
    let f = notes[st.step];
    if (Math.random() < 0.25) f *= 2; // occasional sparkle an octave up
    const o = osc(st.ctx, 'sine', f);
    const g = st.ctx.createGain();
    o.connect(g); g.connect(st.arpGain);
    const a = 0.02, peak = 0.06, decay = 2.6;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(peak, when + a);
    g.gain.exponentialRampToValueAtTime(0.0006, when + a + decay);
    o.start(when);
    o.stop(when + a + decay + 0.05);
  }, [score]);

  const startSched = React.useCallback((st: any) => {
    if (st.sched) return;
    st.nextNote = st.ctx.currentTime + 0.15;
    st.sched = setInterval(() => {
      const ct = st.ctx.currentTime;
      while (st.nextNote < ct + 0.2) {
        playNote(st, st.nextNote);
        st.nextNote += 1.5 + Math.random() * 0.8; // ~1.5–2.3s apart
      }
    }, 50);
  }, [playNote]);

  const stopSched = (st: any) => { if (st && st.sched) { clearInterval(st.sched); st.sched = null; } };

  // Glide drone + pad to the active scene's harmony.
  React.useEffect(() => {
    const st = S.current;
    if (!st) return;
    const sc = score[idx];
    const ct = st.ctx.currentTime, tc = 0.9;
    st.d1.frequency.setTargetAtTime(sc.root, ct, tc);
    st.d2.frequency.setTargetAtTime(sc.root * 1.5, ct, tc);
    st.pads.forEach((o: any, i: number) => o.frequency.setTargetAtTime(sc.pad[i % sc.pad.length], ct, tc));
  }, [idx, score]);

  // Enable / play-state → fade master, run or stop the scheduler.
  React.useEffect(() => {
    if (!enabled) {
      const st = S.current;
      if (st) { st.master.gain.setTargetAtTime(0, st.ctx.currentTime, 0.25); stopSched(st); }
      return;
    }
    const st = ensureGraph();
    if (st.ctx.resume) st.ctx.resume();
    const audible = playing;
    st.master.gain.setTargetAtTime(audible ? level : 0, st.ctx.currentTime, 0.3);
    if (audible) startSched(st); else stopSched(st);
  }, [enabled, playing, level, ensureGraph, startSched]);

  // If sound was on from a previous visit, the page load isn't a user
  // gesture — resume the context on the first interaction.
  React.useEffect(() => {
    if (!enabled) return;
    const st = S.current;
    if (!st || st.ctx.state === 'running') return;
    const resume = () => { try { st.ctx.resume(); } catch {} cleanup(); };
    const cleanup = () => {
      window.removeEventListener('pointerdown', resume);
      window.removeEventListener('keydown', resume);
    };
    window.addEventListener('pointerdown', resume);
    window.addEventListener('keydown', resume);
    return cleanup;
  }, [enabled, playing]);

  React.useEffect(() => {
    try { localStorage.setItem('cosmic:audio', enabled ? '1' : '0'); } catch {}
  }, [enabled]);

  // Tear down on unmount.
  React.useEffect(() => () => {
    const st = S.current;
    if (st) { stopSched(st); try { st.ctx.close(); } catch {} }
  }, []);

  return (
    <button
      onClick={() => setEnabled((e: boolean) => !e)}
      aria-pressed={enabled}
      aria-label={enabled ? 'Mute soundtrack' : 'Play soundtrack'}
      title={enabled ? 'Mute soundtrack' : 'Play soundtrack'}
      style={{
        position: 'absolute', top: 32, right: 32,
        width: 48, height: 48, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: enabled ? 'rgba(243,242,236,0.12)' : 'rgba(243,242,236,0.04)',
        border: `1px solid rgba(243,242,236,${enabled ? 0.32 : 0.16})`,
        color: INK, opacity: enabled ? 0.95 : 0.6,
        cursor: 'pointer', zIndex: 5, padding: 0,
        transition: 'background 160ms, opacity 160ms, border-color 160ms',
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
        {enabled ? (
          <React.Fragment>
            <path d="M16.5 8.5a5 5 0 0 1 0 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M19 6a8 8 0 0 1 0 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </React.Fragment>
        ) : (
          <path d="M16.5 9.5l5 5m0-5l-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        )}
      </svg>
    </button>
  );
}

Object.assign(window, { AudioTrack });
