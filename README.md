# Dead Signal

Null X Interactive corridor survival. Hold a 2D facility hallway while hostiles come through the bay doors. Between waves, spend credits in the armory on guns and patch-ups.

This is the working app (TanStack Start + canvas), not a single HTML file.

## Run

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (port 8080).

## Play

- **A / D** or arrows: walk left and right. The operator faces with a horizontal flip, never upside down.
- **Mouse**: aim and fire
- **R**: reload
- **Space**: pulse kick
- **E** or **B**: open the armory after a wave
- **1-4**: switch owned guns

You start with the Pulse Pistol. Scatter Blaster, Needle SMG, and Rail Lance unlock from the rack. Field Patch and Trauma Kit seal vitals.

## Layout

```
src/game/          canvas engine, hallway, shop, characters
src/components/    HUD, armory overlay, touch controls
src/routes/        app shell
public/            icons and share images
```
