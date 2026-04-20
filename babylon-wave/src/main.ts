import "./style.css";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Engine } from "@babylonjs/core/Engines/engine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Scalar } from "@babylonjs/core/Maths/math.scalar";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Scene } from "@babylonjs/core/scene";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root not found");
}

app.innerHTML = `
  <div class="scene-shell">
    <canvas class="wave-canvas"></canvas>
    <section class="hud">
      <p class="eyebrow">Babylon.js + TypeScript</p>
      <h1>3D Cube Wave</h1>
      <p class="lead">
        Move the pointer across the surface to push a local ripple through the field.
      </p>
    </section>
  </div>
`;

const canvas = document.querySelector<HTMLCanvasElement>(".wave-canvas");

if (!canvas) {
  throw new Error("Canvas element not found");
}

const engine = new Engine(canvas, true, {
  antialias: true,
  preserveDrawingBuffer: true,
  stencil: true,
});

const scene = new Scene(engine);
scene.clearColor = new Color4(0.03, 0.05, 0.09, 1);

const camera = new ArcRotateCamera(
  "camera",
  -Math.PI / 4,
  1.08,
  48,
  new Vector3(0, 0, 0),
  scene,
);
camera.lowerRadiusLimit = 20;
camera.upperRadiusLimit = 64;
camera.lowerBetaLimit = 0.55;
camera.upperBetaLimit = 1.35;
camera.wheelDeltaPercentage = 0.01;
camera.panningSensibility = 0;
camera.attachControl(canvas, true);

const hemiLight = new HemisphericLight("hemi", new Vector3(0.3, 1, 0.2), scene);
hemiLight.intensity = 0.8;
hemiLight.groundColor = new Color3(0.02, 0.02, 0.04);

const keyLight = new DirectionalLight("sun", new Vector3(-0.45, -1, -0.3), scene);
keyLight.position = new Vector3(18, 30, 18);
keyLight.intensity = 1.6;

const cubeMaterial = new StandardMaterial("cube-material", scene);
cubeMaterial.diffuseColor = new Color3(0.2, 0.72, 1);
cubeMaterial.specularColor = new Color3(0.9, 1, 1);
cubeMaterial.emissiveColor = new Color3(0.05, 0.14, 0.24);

const floorMaterial = new StandardMaterial("floor-material", scene);
floorMaterial.diffuseColor = new Color3(0.02, 0.04, 0.06);
floorMaterial.emissiveColor = new Color3(0.03, 0.06, 0.09);

const floor = MeshBuilder.CreateGround(
  "floor",
  { width: 80, height: 80, subdivisions: 1 },
  scene,
);
floor.material = floorMaterial;
floor.position.y = -0.05;
floor.receiveShadows = true;

const interactionPlane = MeshBuilder.CreateGround(
  "interaction-plane",
  { width: 120, height: 120, subdivisions: 1 },
  scene,
);
interactionPlane.visibility = 0;
interactionPlane.isPickable = true;
interactionPlane.position.y = 0;

const sourceBox = MeshBuilder.CreateBox(
  "source-box",
  { width: 0.82, depth: 0.82, height: 1 },
  scene,
);
sourceBox.material = cubeMaterial;
sourceBox.isVisible = false;

const gridSize = 32;
const spacing = 1.18;
const half = ((gridSize - 1) * spacing) / 2;

const cubes: InstancedMesh[] = [];
const anchors: Vector3[] = [];

for (let x = 0; x < gridSize; x += 1) {
  for (let z = 0; z < gridSize; z += 1) {
    const px = x * spacing - half;
    const pz = z * spacing - half;
    const cube = sourceBox.createInstance(`cube-${x}-${z}`);
    cube.position.set(px, 0.3, pz);
    cube.scaling.y = 0.6;
    cubes.push(cube);
    anchors.push(new Vector3(px, 0, pz));
  }
}

const pointerTarget = new Vector3(999, 0, 999);
const pointerPosition = new Vector3(999, 0, 999);

const updatePointerTarget = () => {
  const pick = scene.pick(
    scene.pointerX,
    scene.pointerY,
    (mesh) => mesh === interactionPlane,
  );

  if (pick?.hit && pick.pickedPoint) {
    pointerTarget.copyFrom(pick.pickedPoint);
    return;
  }

  pointerTarget.set(999, 0, 999);
};

canvas.addEventListener("pointermove", updatePointerTarget);
canvas.addEventListener("pointerleave", () => {
  pointerTarget.set(999, 0, 999);
});

scene.onBeforeRenderObservable.add(() => {
  const t = performance.now() * 0.0012;

  pointerPosition.x += (pointerTarget.x - pointerPosition.x) * 0.12;
  pointerPosition.y += (pointerTarget.y - pointerPosition.y) * 0.12;
  pointerPosition.z += (pointerTarget.z - pointerPosition.z) * 0.12;

  for (let i = 0; i < cubes.length; i += 1) {
    const cube = cubes[i];
    const anchor = anchors[i];

    const radial = Math.sqrt(anchor.x * anchor.x + anchor.z * anchor.z);
    const baseWave =
      Math.sin(radial * 0.7 - t * 2.6) * 0.5 +
      Math.cos((anchor.x - anchor.z) * 0.32 - t * 1.5) * 0.22;

    const pointerDistance = Vector3.Distance(anchor, pointerPosition);
    const pointerFalloff = Math.exp(-pointerDistance * 0.24);
    const pointerWave =
      Math.sin(pointerDistance * 1.15 - t * 5.4) * pointerFalloff * 1.8;

    const combinedHeight = Scalar.Clamp(0.52 + baseWave + pointerWave, 0.12, 3.8);

    cube.scaling.y = combinedHeight;
    cube.position.y = combinedHeight * 0.5;
  }
});

engine.runRenderLoop(() => {
  scene.render();
});

window.addEventListener("resize", () => {
  engine.resize();
});
