# Cosmic Scale

A 60-second sprite-based animation of fun facts about the distance and size of
celestial bodies. Monochrome, Helvetica, circles-as-worlds, kinetic typography.

Built as a build-free TypeScript/TSX project: React + Babel transpile the `.tsx`
sources directly in the browser via a registered `typescript` + `react` preset.

## Run

Open `index.html` in any modern browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000/
```

Controls: space = play/pause · ←/→ = seek · 0 = restart · drag the scrubber.

## Structure

| File | Role |
| --- | --- |
| `index.html` | Entry point — loads React, Babel, and the TSX sources |
| `animations.tsx` | Timeline engine: `Stage`, `Sprite`, easing, scrubber |
| `bodies.tsx` | Celestial primitives: `Disc`, `Ring`, `Label`, `Counter`, `Starfield`, `Scene` |
| `scenes.tsx` | The seven fun-fact scenes |
| `app.tsx` | Cue sheet + composition |

## Scenes

1. Title
2. Every planet fits between the Earth and the Moon
3. 1,300,000 Earths fit inside the Sun
4. Sunlight still takes 8m 20s to reach you
5. 1,300 Earths fit inside Jupiter
6. The nearest star is 40 trillion km away
7. Everything you know — one dot in the dark
