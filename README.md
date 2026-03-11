# Racing Kit for React Three Fiber

> Important: this project is based on KenneyNL's Godot Starter Kit Racing.
>
> Original repo: https://github.com/KenneyNL/Starter-Kit-Racing
> Twitter / X: https://x.com/KenneyNL

This project is a small racing sandbox built with React, Vite, `three` `0.182+`, and `@react-three/fiber` v10 alpha. It ships with a drivable truck, keyboard controls, smoke VFX, engine and skid audio, runtime physics switching, and a WebGPU-ready render pipeline.

## Includes

- Arcade-style driving with `WASD` or arrow keys
- Three physics backends: `bounce`, `crashcat`, and `rapier`
- Wheel smoke particles during drifts
- Engine and skid sounds with browser audio unlock handling
- GLB-based vehicle and environment assets
- Live handling tweaks through Leva controls
- R3F v10 + WebGPU-oriented post-processing

## Getting started

```bash
bun install
bun run dev
```

Other scripts:

```bash
bun run build
bun run preview
bun run lint
```

## Controls

| Key                                  | Action          |
| ------------------------------------ | --------------- |
| <kbd>W</kbd> / <kbd>ArrowUp</kbd>    | Accelerate      |
| <kbd>S</kbd> / <kbd>ArrowDown</kbd>  | Brake / reverse |
| <kbd>A</kbd> / <kbd>ArrowLeft</kbd>  | Steer left      |
| <kbd>D</kbd> / <kbd>ArrowRight</kbd> | Steer right     |

Notes:

- Click `Activate Audio` once to enable engine and skid sounds.
- Use the on-screen `Bounce`, `Crashcat`, and `Rapier` buttons to switch physics engines.

## Project structure

- `src/App.tsx` mounts the canvas, audio unlock button, and physics backend switcher.
- `src/components/PlayerController.tsx` handles input, camera follow, wheel animation, drift smoke, and vehicle audio.
- `src/physics/*` contains the shared physics interface and the three backend implementations.
- `src/components/floor.tsx` adds the large ground plane collider and floor model.
- `src/components/Road.tsx` contains an optional generated road model with a triangle-mesh collider.
- `src/components/postprocessing.tsx` sets up the WebGPU post-processing pipeline.
- `src/audio/vehicleAudio.ts` manages looping engine and skid audio.
- `public/models/*` stores the GLB assets.
- `public/audio/*` stores the sound files.
- `public/textures/*` stores the vehicle palette and smoke texture.

## How to customize

### 1. Change the default physics backend

The current backend is selected in `src/App.tsx` and persisted in `localStorage` under `physics-backend`.

If you want a different default, change this fallback:

```ts
() => (localStorage.getItem("physics-backend") as PhysicsBackend) || "crashcat";
```

### 2. Tune the driving feel

Open the Leva panel while the app is running. `src/components/PlayerController.tsx` exposes live controls for:

- vehicle collider radius
- drive torque
- steering speed
- steering smoothing
- body settle height
- mass, friction, restitution
- linear and angular damping

This is the fastest way to iterate on handling before changing code.

### 3. Add or replace the track

Right now the live scene uses the floor component. There is also a generated road component in `src/components/Road.tsx`, but it is not mounted by default.

To add the included road asset, import `{ Model as Road }` from `src/components/Road.tsx` and render `<Road />` inside `PhysicsProvider` in `src/App.tsx`.

To use your own track:

1. Put your `.glb` file in `public/models/`.
2. Generate or update a React component for it with `gltfjsx`.
3. Create a collider from the mesh geometry, like `src/components/Road.tsx` does with `createTriangleMeshFromGeometry`.
4. Mount that component inside the physics provider so the collider is registered with the active backend.

### 4. Replace the car model

The current vehicle component is `src/Vehicle-truck-yellow.tsx`, generated from `public/models/vehicle-truck-yellow.glb`.

If you swap the model, keep the same logical parts wired into `PlayerController`:

- `body`
- `wheel-front-left`
- `wheel-front-right`
- `wheel-back-left`
- `wheel-back-right`

If your source mesh names differ, map them to the existing `meshRefs` API in the generated vehicle component so steering, wheel spin, body lean, smoke, and audio behavior still line up.

### 5. Change the sounds

Replace these files to keep the current audio setup:

- `public/audio/engine.ogg`
- `public/audio/skid.ogg`

If you want different behavior, edit `src/audio/vehicleAudio.ts` to change playback rate, volume curves, or drift thresholds.

## R3F / WebGPU notes

- The app uses `@react-three/fiber` `10.0.0-alpha.2`.
- The scene loop and post-processing currently use `@react-three/fiber/webgpu`.
- `Canvas` is mounted with `renderer={{ forceWebGL: false }}`, so browser support for newer renderer features matters.
- Vehicle materials use `MeshStandardNodeMaterial` and TSL texture nodes.

## Credits

Built on the pmndrs stack: React Three Fiber, Drei, and Three.js.

Some generated asset components include source and attribution comments directly in the corresponding `.tsx` files.
