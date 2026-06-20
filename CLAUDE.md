# CLAUDE.md — Cosmic Scale

Context for AI agents (and humans) working on this repo.

## What this is
A 60-second, build-free sprite animation about the scale of the cosmos.
Monochrome, Helvetica, circles-as-celestial-bodies + kinetic typography.
Runs by opening `index.html` — no bundler, no install, no npm.

## How it runs (important)
There is **no build step**. React 18 (UMD) and Babel Standalone are loaded from
unpkg with pinned versions + integrity hashes. The `.tsx` files are transpiled
**in the browser** via a Babel preset registered in `index.html`:

```js
Babel.registerPreset('tsx', {
  presets: [
    [Babel.availablePresets.typescript, { allExtensions: true, isTSX: true, onlyRemoveTypeImports: true }],
    Babel.availablePresets.react,
  ],
});
```

Each source is loaded with `<script type="text/babel" data-presets="tsx" src="...">`.
TypeScript types are **stripped, never checked** — there is no `tsc` in the loop.
Keep that in mind: annotations are for humans/editors, not enforcement.

## Cross-file sharing
Scripts don't share module scope. Each file ends with `Object.assign(window, {...})`
to publish its exports as globals; downstream files `declare const X: ...` at the
top to reference them. Load order matters and is fixed in the HTML:
`animations.tsx → bodies.tsx → scenes.tsx → app.tsx`.

## Files
| File | Role |
| --- | --- |
| `animations.tsx` | Timeline engine: `Stage`, `Sprite`, `useTime`/`useSprite`, `Easing`, `interpolate`, `animate`, `clamp`, scrubber/playback, `ChapterNav`. Reusable starter — avoid gratuitous edits. |
| `bodies.tsx` | Visual primitives + palette tokens (`INK/DIM/SOFT/FAINT`, `FONT`): `Disc`, `Ring`, `Label`, `Kicker`, `Counter`, `DashLine`, `Tick`, `Starfield`, `Scene`. |
| `scenes.tsx` | The seven scene components + `Head` (staggered headline). Each scene reads `localTime` from its `<Scene>`. |
| `audio.tsx` | `AudioTrack` — generative Web Audio soundtrack (synthesized, no files). Harmony follows film-time via `SCORE` in `app.tsx`. |
| `app.tsx` | `CUES` cue sheet, `CHAPTERS`, `SCORE`, `ScreenLabel`, mounts `<Stage>`. |
| `index.html` | Entry point + Babel TSX preset registration. |

## Authoring conventions
- Canvas is fixed **1920×1080**; `Stage` auto-scales to the viewport. Use absolute px coords against that canvas.
- Animate from `localTime` (seconds since a scene started). Helper: `env(t, t0, dur)` clamps a 0→1 ramp; `eo(...)` is the eased version. Easing lib is `Easing.*`.
- The **authored** timeline is **60s** (`Stage`'s `timelineDuration`), defined by the windows in `CUES` + each scene's internal `t0` offsets. To retime a scene, edit its `CUES` entry **and** the internal `t0` offsets — always in authored seconds.
- **Playback length is user-selectable** (`durations={[60,120,180]}` in `app.tsx`, surfaced as the `1m/2m/3m` control). The engine *time-stretches* the authored 60s onto the chosen wall-clock length — scene code never changes. Internally `time` advances in wall-clock; `Stage` maps it back to authored seconds before scenes see it, so everything (motion, twinkle, counters) slows uniformly.
- Palette is strictly monochrome grays on `#0a0a0a`. Don't introduce hues.
- Bodies are CSS circles (`Disc`), never SVG illustration.

## Playback flow (hybrid intro + chapters)
`Stage` runs a small state machine: **`intro`** auto-plays from 0; **`interactive`**
(scrub, chapter pick, or reaching the end) pauses and hands the viewer control —
the film never loops once `chapters` is set.
- `chapters={CHAPTERS}` (in `app.tsx`) defines named regions in authored seconds:
  `{ label, start, end, poster }`. `poster` is the still a chapter rests on when
  selected / at the end (chosen so the scene is fully revealed, not mid-fade).
- `ChapterNav` (label row + Replay) sits above the bar; chapter `start`s also show
  as dots on the scrub track. Selecting a chapter **preserves play state**:
  playing → continues from the chapter's `start`; paused → moves the playhead to
  the `poster` and stays paused. **Replay** plays `start → end-0.7` then
  auto-pauses (via `Stage`'s `playUntilRef`).
- All chapter times are **authored seconds**; `Stage` converts to wall-clock with
  `toWall`, so chapters work unchanged at any selected playback length.

## Chrome & controls (in `animations.tsx`)
- **Minimal by default**: only play/pause, the scrub track, and the mute toggle (in
  the canvas) are shown. `revealed = barHover` gates the rest — the left cluster
  (loop · replay · restart), timecode, length toggle, and `ChapterNav` — and reveal
  is **hover-only** (not on pause).
- **No reflow**: gated groups fade with `opacity` only (they keep their reserved
  width), so the scrub track never resizes when controls hide/show. Don't reintroduce
  `max-width`/`display` collapsing here.
- **Silver spotlight**: a `radial-gradient` layer with `mix-blend-mode: screen`
  (`spotlightRef`, updated via direct DOM writes — no per-move React render) glows
  the controls under the pointer on hover. Position uses **percent** coords
  (`at px% py%`) so it stays centered on the cursor in both axes and is
  scale-invariant inside the transformed canvas.
- **Corner controls** (`CornerControls` in `app.tsx`): a top-right cluster holding
  the always-on sound toggle (`AudioTrack`, now a flex item) plus a hover-revealed
  full-screen button, sharing the same cursor-centered spotlight. Full-screen toggles
  `document.documentElement.requestFullscreen()` / `exitFullscreen()`.
- **Toggle-in-place controls**: `LoopButton` cycles play-once / 3× / ∞ (badge), and
  `DurationToggle` cycles the `durations` in one button — both single buttons, not
  segmented rows. Loop behaviour is read in the rAF end-of-pass handler via
  `loopModeRef` + `passesRef`; **Replay** (`onReplayAll`) restarts from 0 and plays.

## Good next tasks
- Add a 9:16 vertical variant (swap `Stage` width/height + reflow scene coords).
- Persisted playhead lives in `localStorage` under `cosmic:t`.
- `prefers-reduced-motion: reduce` opens paused on the title card (see `app.tsx`);
  consider a "Reduce motion is on — press space to play" hint.

## Don't
- Don't add a build system or convert to ES modules unless explicitly asked — it
  would break the zero-install promise.
- Don't unpin the React/Babel versions or drop the integrity hashes.
