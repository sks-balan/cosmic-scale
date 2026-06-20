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

Controls: space = play/pause · ←/→ = seek · 0 = restart · drag the scrubber ·
`1m` / `2m` / `3m` set how long the whole film plays over · 🔊 toggles the
generated soundtrack.

The chrome stays minimal — only play/pause, the progress bar, and the sound
toggle are shown by default. **Hover** the control area to reveal everything
else (loop, replay, restart, the timecode, the length toggle, and the chapter
nav), lit by a silver spotlight centered on the cursor. The progress bar keeps
a fixed size — controls only fade, they never push it. To the left of play sit
a **loop** button (cycles play once → 3× → ∞ in place) and a **replay** button
(restart from the top); the length control is a single button that toggles
`1m → 2m → 3m` in place. Top-right, next to the sound toggle, a **full-screen**
button reveals on hover (with its own spotlight).

### Watch vs. explore

The film opens by playing through on its own (the *intro*). The moment you
pick a chapter, drag the scrubber, or it reaches the end, it hands you control
(*interactive*): playback pauses and you can explore at your own pace. The four
chapters group the seven scenes:

1. **Our Neighborhood** — title, every planet between Earth & Moon
2. **Our Star** — the Sun, the speed of light
3. **Giants & Distance** — Jupiter, the nearest star
4. **Closing**

Click a chapter (or its dot on the track) to jump to it; **Replay** plays just
the current chapter, then rests on its still.

## Structure

| File | Role |
| --- | --- |
| `index.html` | Entry point — loads React, Babel, and the TSX sources |
| `animations.tsx` | Timeline engine: `Stage`, `Sprite`, easing, scrubber, chapter nav |
| `bodies.tsx` | Celestial primitives: `Disc`, `Ring`, `Label`, `Counter`, `Starfield`, `Scene` |
| `scenes.tsx` | The seven fun-fact scenes |
| `audio.tsx` | Generative Web Audio soundtrack (`AudioTrack`) |
| `app.tsx` | Cue sheet + chapters + score + composition |

## Scenes

1. Title
2. Every planet fits between the Earth and the Moon
3. 1,300,000 Earths fit inside the Sun
4. Sunlight still takes 8m 20s to reach you
5. 1,300 Earths fit inside Jupiter
6. The nearest star is 40 trillion km away
7. Everything you know — one dot in the dark
