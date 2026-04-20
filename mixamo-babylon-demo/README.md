# Mixamo Babylon Demo

This project is a TypeScript + Babylon.js example for:

- loading a `glb` character model from Sketchfab
- loading a `glb` animation asset from Mixamo
- retargeting the Mixamo animation onto the loaded character

## Asset convention

Current assets detected in this workspace:

- Character: `public/assets/models/furina-unpacked/source/genshin_impact_-_furina (1).glb`
- Action source: `public/assets/animations/walking-glb-inspect/scene.gltf`
- Legacy action left in place: `public/assets/animations/Hip Hop Dancing.fbx`

## Notes about the assets

- The character model should be a rigged `glb`.
- The Mixamo file should be a `glb` or `gltf` export containing animation data.
- The current configured action is a Sketchfab humanoid `gltf` with an embedded walk cycle.
- Best case: both assets use compatible bone names.
- If bone names differ, edit `src/config.ts` and extend `mapNodeNames`.

## Run

```bash
npm install
npm run dev
```

## Retargeting

The demo uses Babylon.js `AnimatorAvatar.retargetAnimationGroup(...)`.

If the animation does not move the character correctly:

- inspect the character bone names
- inspect the Mixamo transform node names
- update `rootNodeName`
- update `groundReferenceNodeName`
- expand `mapNodeNames` in `src/config.ts`
