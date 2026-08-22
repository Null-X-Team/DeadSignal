# Dead Signal

Null X Interactive corridor survival. Hold a 2D facility hallway while hostiles come through the bay doors. Between waves, spend credits in the armory on guns and patch-ups.

Open `index.html` in a browser, or serve the folder with any static host.

## Play

- **A / D** or arrows: walk left and right. The operator faces the walk direction with a horizontal flip, not an upside-down spin.
- **Mouse**: aim and fire
- **R**: reload
- **Space**: pulse kick
- **E** or **B**: open the armory after a wave
- **1-4**: switch owned guns

You start with the Pulse Pistol. Scatter Blaster, Needle SMG, and Rail Lance unlock from the rack. Field Patch and Trauma Kit seal vitals. Mag crates refill reserve ammo.

Waves keep coming. After a clear there is a short armory window, then the next wave.

## Layout

```
index.html
css/style.css
js/catalog.js
js/audio.js
js/render.js
js/engine.js
js/main.js
```

No external assets. HUD icons are custom SVGs. Canvas draws the operator and hostiles with arms, legs, and a walk cycle.
