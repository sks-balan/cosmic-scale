# CLAUDE.md — Cosmic Scale

Context for AI agents (and humans) working on this repo.

## What this is
A 60-second, build-free sprite animation about the scale of the cosmos.
Monochrome, Helvetica, circles-as-celestial-bodies + kinetic typography.
Runs by opening `Cosmic Scale.html` — no bundler, no install, no npm.

## How it runs (important)
There is **no build step**. React 18 (UMD) and Babel Standalone are loaded from
unpkg with pinned versions + integrity hashes. The `.tsx` files are transpiled
**in the browser** via a Babel preset registered in `Cosmic Scale.html`:

```js
Babel.registerPreset('tsx', {
  presets: [
    [Babel.availablePresets.typescript, { allExtensions: true, isTSX: true }],
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
| `animations.tsx` | Timeline engine: `Stage`, `Sprite`, `useTime`/`useSprite`, `Easing`, `interpolate`, `animate`, `clamp`, scrubber/playback. Reusable starter — avoid gratuitous edits. |
| `bodies.tsx` | Visual primitives + palette tokens (`INK/DIM/SOFT/FAINT`, `FONT`): `Disc`, `Ring`, `Label`, `Kicker`, `Counter`, `DashLine`, `Tick`, `Starfield`, `Scene`. |
| `scenes.tsx` | The seven scene components + `Head` (staggered headline). Each scene reads `localTime` from its `<Scene>`. |
| `app.tsx` | `CUES` cue sheet (start/end per scene), `ScreenLabel` (timestamp for comments), mounts `<Stage>`. |
| `Cosmic Scale.html` | Entry point + Babel TSX preset registration. |

## Authoring conventions
- Canvas is fixed **1920×1080**; `Stage` auto-scales to the viewport. Use absolute px coords against that canvas.
- Animate from `localTime` (seconds since a scene started). Helper: `env(t, t0, dur)` clamps a 0→1 ramp; `eo(...)` is the eased version. Easing lib is `Easing.*`.
- Timeline total is **60s**, defined by `<Stage duration={60}>` and the windows in `CUES`. To retime a scene, edit its `CUES` entry **and** the internal `t0` offsets.
- Palette is strictly monochrome grays on `#0a0a0a`. Don't introduce hues.
- Bodies are CSS circles (`Disc`), never SVG illustration.

## Good next tasks
- Rename `Cosmic Scale.html` → `index.html` for a clean GitHub Pages URL.
- Add a 9:16 vertical variant (swap `Stage` width/height + reflow scene coords).
- Persisted playhead lives in `localStorage` under `cosmic:t`.

## Don't
- Don't add a build system or convert to ES modules unless explicitly asked — it
  would break the zero-install promise.
- Don't unpin the React/Babel versions or drop the integrity hashes.
