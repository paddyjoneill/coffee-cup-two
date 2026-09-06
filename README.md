# Out of Office

A playful coffee-cup throwing game built with React, TypeScript, Three.js, React Three Fiber, and Drei.

## Play

Run `npm install` and `npm run dev`, then open the local URL printed by Vite.

Press Space, tap the scene, or use the orange button three times to lock direction, trajectory, and power. The camera follows the thrown cup. Clear the school and land past the green boundary to win. Press R to reset. How to play pauses the simulation. Sound can be enabled with the speaker button.

The scene uses original procedural 3D models: an office worker, furnished third-floor office, school with clock tower, trees, fences, and neighbourhood. No external model downloads are required. Fonts use Google Fonts with local fallbacks.

## Validate

- `npm run build` — TypeScript and production build.
- `npm run lint` — source linting.
- `node --experimental-strip-types --test tests/physics.test.ts` — win, miss, collision, and trajectory tests (Node 22.6+).

Physics uses analytical ballistic positions sampled at up to 120 Hz for collision detection. There is no wind. Roofs and school walls use geometric collision volumes. Best distance is kept for the current session.

Optional browser WebMCP tools expose current game state and the same tap/restart controls. Browsers without WebMCP use the normal UI.
