import "./style.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  AmbientLight,
  Box3,
  Group,
  LoadingManager,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
  ACESFilmicToneMapping,
  DirectionalLight,
  Fog,
  Object3D,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

gsap.registerPlugin(ScrollTrigger);

type Region =
  | "front"
  | "rear"
  | "left"
  | "right"
  | "roof"
  | "floor"
  | "core";

type Assembly =
  | "body"
  | "front"
  | "cabin"
  | "glass"
  | "wheelsFront"
  | "wheelsRear"
  | "rear";

type AssemblyWeights = Record<Assembly, number>;

type StageConfig = {
  camera: Vector3;
  target: Vector3;
  rotationY: number;
  lift: number;
  explode: number;
  assemblyWeights: AssemblyWeights;
};

type ExplodedPart = {
  object: Object3D;
  origin: Vector3;
  direction: Vector3;
  region: Region;
  assembly: Assembly;
  phase: number;
  spread: number;
  strength: number;
};

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root not found");
}

app.innerHTML = `
  <div class="page-shell">
    <div class="scene-layer">
      <canvas class="scene-canvas"></canvas>
      <div class="scene-glow"></div>
      <div class="loading-panel">
        <p class="loading-label">Loading Structure</p>
        <div class="loading-bar"><span class="loading-progress"></span></div>
      </div>
    </div>

    <main class="story">
      <section class="story-panel hero-panel">
        <div class="copy">
          <p class="kicker">Exploded Motion Study</p>
          <h1>Lamborghini, unfolded by scroll.</h1>
          <p class="lede">
            The model remains fixed in the viewport while the page reveals chassis,
            cabin, wheel architecture, and rear power volume as a continuous exploded view.
          </p>
        </div>
      </section>

      <section class="story-panel align-right">
        <div class="copy">
          <p class="eyebrow">01</p>
          <h2>Silhouette first</h2>
          <p>
            The opening frame keeps the car almost sealed, introducing only a slight tolerance
            gap so the whole object reads as a single precise form.
          </p>
        </div>
      </section>

      <section class="story-panel">
        <div class="copy">
          <p class="eyebrow">02</p>
          <h2>Front detail</h2>
          <p>
            The front section is isolated first. Only the nose-related pieces move forward,
            while the rest of the car stays nearly locked as a reference body.
          </p>
        </div>
      </section>

      <section class="story-panel align-right">
        <div class="copy">
          <p class="eyebrow">03</p>
          <h2>Cabin and glass</h2>
          <p>
            The camera then lifts over the shoulder line and reveals the upper structure,
            separating glazing and cabin-adjacent forms without disturbing the tail.
          </p>
        </div>
      </section>

      <section class="story-panel outro-panel">
        <div class="copy">
          <p class="eyebrow">04</p>
          <h2>Rear module</h2>
          <p>
            The final detail pass rotates to the rear, where only the tail volume and rear
            wheel zone step outward before the page resolves into the complete exploded view.
          </p>
          <p class="credit">
            Public model file used for this prototype:
            <a href="https://www.get3dmodels.com/vehicles/lamborghini-aventador%EF%B8%8F/" target="_blank" rel="noreferrer">
              Get 3D Models
            </a>
          </p>
        </div>
      </section>
    </main>
  </div>
`;

const canvas = document.querySelector<HTMLCanvasElement>(".scene-canvas");
const loadingPanel = document.querySelector<HTMLDivElement>(".loading-panel");
const loadingProgress = document.querySelector<HTMLSpanElement>(".loading-progress");
const panels = Array.from(document.querySelectorAll<HTMLElement>(".story-panel"));

if (!canvas || !loadingPanel || !loadingProgress) {
  throw new Error("Scene elements not found");
}

const scene = new Scene();
scene.fog = new Fog(0xf3ede3, 12, 28);

const camera = new PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 100);
const renderer = new WebGLRenderer({
  canvas,
  alpha: true,
  antialias: true,
});
renderer.outputColorSpace = SRGBColorSpace;
renderer.toneMapping = ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearAlpha(0);

const ambient = new AmbientLight(0xffffff, 1.6);
scene.add(ambient);

const keyLight = new DirectionalLight(0xffffff, 3.1);
keyLight.position.set(7, 9, 10);
scene.add(keyLight);

const rimLight = new DirectionalLight(0xffe4ba, 1.25);
rimLight.position.set(-8, 4, -6);
scene.add(rimLight);

const floor = new Mesh(
  new PlaneGeometry(26, 26),
  new MeshBasicMaterial({
    color: 0xb69b74,
    transparent: true,
    opacity: 0.09,
  }),
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -2.8;
scene.add(floor);

const stageState = { progress: 0 };
const pointer = new Vector2();

const carRig = new Group();
scene.add(carRig);

let carRoot: Group | null = null;
let parts: ExplodedPart[] = [];
let explodeDistance = 1.8;
let stages: StageConfig[] = [];

const isCompact = () => window.innerWidth < 900;
const assemblyWeights = (values: Partial<AssemblyWeights>): AssemblyWeights => ({
  body: 0,
  front: 0,
  cabin: 0,
  glass: 0,
  wheelsFront: 0,
  wheelsRear: 0,
  rear: 0,
  ...values,
});

const buildStagePresets = (): StageConfig[] => {
  if (isCompact()) {
    return [
      {
        camera: new Vector3(0, 2.4, 14.4),
        target: new Vector3(0, 0.6, 0),
        rotationY: 0.2,
        lift: 0,
        explode: 0.03,
        assemblyWeights: assemblyWeights({ body: 0.08 }),
      },
      {
        camera: new Vector3(7.4, 2.3, 10.7),
        target: new Vector3(0, 0.55, -0.78),
        rotationY: -0.1,
        lift: 0.08,
        explode: 0.44,
        assemblyWeights: assemblyWeights({
          body: 0.04,
          front: 1.12,
          wheelsFront: 0.28,
        }),
      },
      {
        camera: new Vector3(-4.9, 7.5, 8.9),
        target: new Vector3(0, 1.08, 0.1),
        rotationY: 0.18,
        lift: 0.2,
        explode: 0.48,
        assemblyWeights: assemblyWeights({
          body: 0.02,
          cabin: 0.62,
          glass: 1.22,
        }),
      },
      {
        camera: new Vector3(7.9, 5.8, -8.4),
        target: new Vector3(0.1, 0.82, 0.82),
        rotationY: 0.82,
        lift: 0.3,
        explode: 0.52,
        assemblyWeights: assemblyWeights({
          body: 0.04,
          rear: 1.08,
          wheelsRear: 0.36,
        }),
      },
      {
        camera: new Vector3(0, 8.7, 13.4),
        target: new Vector3(0, 0.6, 0),
        rotationY: Math.PI * 0.96,
        lift: 0.36,
        explode: 0.92,
        assemblyWeights: assemblyWeights({
          body: 0.08,
          front: 1,
          cabin: 0.68,
          glass: 1.02,
          wheelsFront: 0.92,
          wheelsRear: 0.96,
          rear: 1,
        }),
      },
    ];
  }

  return [
    {
      camera: new Vector3(-1.8, 2.3, 12.8),
      target: new Vector3(0, 0.45, 0),
      rotationY: 0.08,
      lift: 0,
      explode: 0.03,
      assemblyWeights: assemblyWeights({ body: 0.08 }),
    },
    {
      camera: new Vector3(9.6, 2, 9.8),
      target: new Vector3(0, 0.5, -0.9),
      rotationY: -0.12,
      lift: 0.08,
      explode: 0.44,
      assemblyWeights: assemblyWeights({
        body: 0.04,
        front: 1.14,
        wheelsFront: 0.26,
      }),
    },
    {
      camera: new Vector3(-5.4, 8.1, 8.5),
      target: new Vector3(0, 1.12, 0.12),
      rotationY: 0.16,
      lift: 0.18,
      explode: 0.48,
      assemblyWeights: assemblyWeights({
        body: 0.02,
        cabin: 0.62,
        glass: 1.22,
      }),
    },
    {
      camera: new Vector3(8.4, 5.9, -8.6),
      target: new Vector3(0.12, 0.8, 0.9),
      rotationY: 0.8,
      lift: 0.28,
      explode: 0.52,
      assemblyWeights: assemblyWeights({
        body: 0.04,
        rear: 1.1,
        wheelsRear: 0.34,
      }),
    },
    {
      camera: new Vector3(0, 8.9, 12.4),
      target: new Vector3(0, 0.55, 0),
      rotationY: Math.PI * 0.94,
      lift: 0.36,
      explode: 0.92,
      assemblyWeights: assemblyWeights({
        body: 0.08,
        front: 1,
        cabin: 0.68,
        glass: 1.02,
        wheelsFront: 0.92,
        wheelsRear: 0.96,
        rear: 1,
      }),
    },
  ];
};

stages = buildStagePresets();

const classifyRegion = (offset: Vector3, size: Vector3): Region => {
  const ax = Math.abs(offset.x);
  const ay = Math.abs(offset.y);
  const az = Math.abs(offset.z);

  if (offset.y > size.y * 0.18) {
    return "roof";
  }

  if (offset.y < -size.y * 0.2) {
    return "floor";
  }

  if (az > ax && az > ay * 1.2) {
    return offset.z < 0 ? "front" : "rear";
  }

  if (ax > az && ax > ay * 1.2) {
    return offset.x < 0 ? "left" : "right";
  }

  return "core";
};

const classifyNamedRegion = (meshName: string, offset: Vector3, size: Vector3): Region => {
  const name = meshName.toLowerCase();

  if (name.includes("wheel_fl") || name.includes("wheel_fr")) {
    return "front";
  }

  if (name.includes("wheel_rl") || name.includes("wheel_rr")) {
    return "rear";
  }

  if (name.includes("glass")) {
    return "roof";
  }

  if (name.includes("body")) {
    return "core";
  }

  return classifyRegion(offset, size);
};

const classifyAssemblyFromName = (name: string, region: Region): Assembly => {
  const lower = name.toLowerCase();

  if (lower.includes("glass") || lower.includes("window")) {
    return "glass";
  }
  if (lower.includes("wheel_fl") || lower.includes("wheel_fr")) {
    return "wheelsFront";
  }
  if (lower.includes("wheel_rl") || lower.includes("wheel_rr")) {
    return "wheelsRear";
  }
  if (lower.includes("body")) {
    return "body";
  }

  if (region === "front") return "front";
  if (region === "rear") return "rear";
  if (region === "roof") return "cabin";
  return "body";
};

const classifyAssemblyFromMetrics = (
  mesh: Mesh,
  offset: Vector3,
  size: Vector3,
  bounds: Vector3,
  region: Region,
): Assembly => {
  const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
  if (material && "transparent" in material && material.transparent) {
    return "glass";
  }

  const lowBand = offset.y < -size.y * 0.14;
  const compactWheelLike = bounds.x < size.x * 0.18 && bounds.z < size.z * 0.18 && bounds.y < size.y * 0.32;
  if (lowBand && compactWheelLike) {
    return region === "rear" ? "wheelsRear" : "wheelsFront";
  }

  if (offset.y > size.y * 0.16) {
    return "cabin";
  }
  if (region === "front") {
    return "front";
  }
  if (region === "rear") {
    return "rear";
  }
  return "body";
};

const namedDirectionAndStrength = (meshName: string) => {
  const name = meshName.toLowerCase();

  if (name.includes("wheel_fl")) {
    return { direction: new Vector3(-1.25, 0.12, -1.1).normalize(), strength: 1.7 };
  }

  if (name.includes("wheel_fr")) {
    return { direction: new Vector3(1.25, 0.12, -1.1).normalize(), strength: 1.7 };
  }

  if (name.includes("wheel_rl")) {
    return { direction: new Vector3(-1.25, 0.14, 1.15).normalize(), strength: 1.8 };
  }

  if (name.includes("wheel_rr")) {
    return { direction: new Vector3(1.25, 0.14, 1.15).normalize(), strength: 1.8 };
  }

  if (name.includes("glass")) {
    return { direction: new Vector3(0, 1.15, 0.15).normalize(), strength: 1.15 };
  }

  if (name.includes("body")) {
    return { direction: new Vector3(0, -0.04, 0.16).normalize(), strength: 0.45 };
  }

  return null;
};

const directionForRegion = (region: Region, offset: Vector3): Vector3 => {
  switch (region) {
    case "front":
      return new Vector3(0, 0.14, -1).normalize();
    case "rear":
      return new Vector3(0, 0.18, 1).normalize();
    case "left":
      return new Vector3(-1, 0.08, 0.18).normalize();
    case "right":
      return new Vector3(1, 0.08, 0.18).normalize();
    case "roof":
      return new Vector3(offset.x * 0.1, 1, offset.z * 0.15).normalize();
    case "floor":
      return new Vector3(offset.x * 0.1, -0.75, offset.z * 0.08).normalize();
    case "core":
    default: {
      const fallback = offset.clone();
      if (fallback.lengthSq() < 0.0001) {
        fallback.set(0.12, 0.2, 0.18);
      }
      return fallback.normalize().lerp(new Vector3(0, 0.22, 0), 0.22).normalize();
    }
  }
};

const addExplodedPart = (object: Object3D, partsCenter: Vector3, size: Vector3) => {
  if (!object.matrixAutoUpdate) {
    object.matrix.decompose(object.position, object.quaternion, object.scale);
    object.matrixAutoUpdate = true;
  }

  const center = new Box3().setFromObject(object).getCenter(new Vector3());
  const offset = center.sub(partsCenter);
  const region = classifyNamedRegion(object.name, offset, size);
  const namedConfig = namedDirectionAndStrength(object.name);
  const direction = namedConfig?.direction ?? directionForRegion(region, offset);
  const spread = MathUtils.clamp(offset.length() / (size.length() * 0.45), 0.45, 1.4);
  const strength = namedConfig?.strength ?? 1;

  parts.push({
    object,
    origin: object.position.clone(),
    direction,
    region,
    assembly: classifyAssemblyFromName(object.name, region),
    phase: Math.random() * Math.PI * 2,
    spread,
    strength,
  });
};

const addMeshExplodedPart = (mesh: Mesh, partsCenter: Vector3, size: Vector3) => {
  const parent = mesh.parent;

  if (!parent) {
    return;
  }

  if (!parent.matrixAutoUpdate) {
    parent.matrix.decompose(parent.position, parent.quaternion, parent.scale);
    parent.matrixAutoUpdate = true;
  }

  const wrapper = new Group();
  wrapper.name = `${mesh.name || "mesh"}-wrapper`;
  wrapper.position.copy(mesh.position);
  wrapper.quaternion.copy(mesh.quaternion);
  wrapper.scale.copy(mesh.scale);
  wrapper.matrixAutoUpdate = true;

  parent.add(wrapper);
  wrapper.add(mesh);

  mesh.position.set(0, 0, 0);
  mesh.quaternion.identity();
  mesh.scale.set(1, 1, 1);

  const center = new Box3().setFromObject(wrapper).getCenter(new Vector3());
  const bounds = new Box3().setFromObject(wrapper).getSize(new Vector3());
  const offset = center.sub(partsCenter);
  const region = classifyRegion(offset, size);
  const direction = directionForRegion(region, offset);
  const spread = MathUtils.clamp(offset.length() / (size.length() * 0.42), 0.55, 1.6);
  const assembly = classifyAssemblyFromMetrics(mesh, offset, size, bounds, region);
  const strength =
    assembly === "body"
      ? mesh.geometry.attributes.position.count > 10000
        ? 0.36
        : 0.55
      : assembly === "glass"
        ? 1.08
        : assembly === "cabin"
          ? 0.82
          : 1;

  parts.push({
    object: wrapper,
    origin: wrapper.position.clone(),
    direction,
    region,
    assembly,
    phase: Math.random() * Math.PI * 2,
    spread,
    strength,
  });
};

const currentCamera = new Vector3();
const currentTarget = new Vector3();
const smoothstep = (value: number) => value * value * (3 - 2 * value);
const interpolateAngle = (from: number, to: number, alpha: number) =>
  from + Math.atan2(Math.sin(to - from), Math.cos(to - from)) * alpha;

const mixStage = (progress: number) => {
  const index = Math.min(Math.floor(progress), stages.length - 1);
  const nextIndex = Math.min(index + 1, stages.length - 1);
  const alpha = smoothstep(progress - index);
  const from = stages[index];
  const to = stages[nextIndex];

  currentCamera.copy(from.camera).lerp(to.camera, alpha);
  currentTarget.copy(from.target).lerp(to.target, alpha);

  const assemblyWeights = {
    body: MathUtils.lerp(from.assemblyWeights.body, to.assemblyWeights.body, alpha),
    front: MathUtils.lerp(from.assemblyWeights.front, to.assemblyWeights.front, alpha),
    cabin: MathUtils.lerp(from.assemblyWeights.cabin, to.assemblyWeights.cabin, alpha),
    glass: MathUtils.lerp(from.assemblyWeights.glass, to.assemblyWeights.glass, alpha),
    wheelsFront: MathUtils.lerp(from.assemblyWeights.wheelsFront, to.assemblyWeights.wheelsFront, alpha),
    wheelsRear: MathUtils.lerp(from.assemblyWeights.wheelsRear, to.assemblyWeights.wheelsRear, alpha),
    rear: MathUtils.lerp(from.assemblyWeights.rear, to.assemblyWeights.rear, alpha),
  };

  return {
    camera: currentCamera.clone(),
    target: currentTarget.clone(),
    rotationY: interpolateAngle(from.rotationY, to.rotationY, alpha),
    lift: MathUtils.lerp(from.lift, to.lift, alpha),
    explode: MathUtils.lerp(from.explode, to.explode, alpha),
    assemblyWeights,
  };
};

const manager = new LoadingManager();
manager.onProgress = (_url: string, loaded: number, total: number) => {
  const progress = total === 0 ? 0 : loaded / total;
  loadingProgress.style.transform = `scaleX(${progress})`;
};
manager.onLoad = () => {
  loadingPanel.classList.add("is-hidden");
};

const loader = new GLTFLoader(manager);

loader.load("/models/lamborghini-aventador.glb", (gltf: GLTF) => {
  carRoot = gltf.scene;
  carRig.add(carRoot);
  parts = [];

  carRoot.traverse((object: Object3D) => {
    if (!object.matrixAutoUpdate) {
      object.matrix.decompose(object.position, object.quaternion, object.scale);
      object.matrixAutoUpdate = true;
    }
  });

  const initialBox = new Box3().setFromObject(carRoot);
  const initialSize = initialBox.getSize(new Vector3());
  const maxDimension = Math.max(initialSize.x, initialSize.y, initialSize.z);
  const scale = 8.8 / maxDimension;
  carRoot.scale.setScalar(scale);

  const centeredBox = new Box3().setFromObject(carRoot);
  const centeredSize = centeredBox.getSize(new Vector3());
  const centeredMiddle = centeredBox.getCenter(new Vector3());
  carRoot.position.sub(centeredMiddle);
  carRoot.position.y += centeredSize.y * 0.04;

  const finalBox = new Box3().setFromObject(carRoot);
  const finalCenter = finalBox.getCenter(new Vector3());
  const finalSize = finalBox.getSize(new Vector3());
  explodeDistance = finalSize.length() * 0.42;

  carRoot.updateMatrixWorld(true);

  const partRoot = carRoot.getObjectByName("Lamborginhi_Aventador") ?? carRoot;
  const explodableNames = ["Body", "Glass", "Wheel_FL", "Wheel_FR", "Wheel_RL", "Wheel_RR"];
  let namedPartCount = 0;

  for (const name of explodableNames) {
    const object = partRoot.getObjectByName(name);

    if (object) {
      addExplodedPart(object, finalCenter, finalSize);
      namedPartCount += 1;
    }
  }

  if (namedPartCount === 0) {
    const meshes: Mesh[] = [];

    carRoot.traverse((object: Object3D) => {
      if (object instanceof Mesh && object.visible) {
        meshes.push(object);
      }
    });

    for (const mesh of meshes) {
      addMeshExplodedPart(mesh, finalCenter, finalSize);
    }
  }
});

const updateActivePanels = () => {
  for (const panel of panels) {
    ScrollTrigger.create({
      trigger: panel,
      start: "top 58%",
      end: "bottom 42%",
      onToggle: ({ isActive }) => {
        panel.classList.toggle("is-active", isActive);
      },
    });
  }
};

updateActivePanels();

gsap.timeline({
  scrollTrigger: {
    trigger: ".story",
    start: "top top",
    end: "bottom bottom",
    scrub: 1.1,
  },
}).to(stageState, {
  progress: stages.length - 1,
  ease: "none",
});

window.addEventListener("pointermove", (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
});

const desiredCamera = new Vector3();
const desiredTarget = new Vector3();
const pointerCameraOffset = new Vector3();
const pointerTargetOffset = new Vector3();
const animatedLookTarget = new Vector3();
const clockStart = performance.now();

const render = () => {
  const elapsed = (performance.now() - clockStart) * 0.001;
  const stage = mixStage(stageState.progress);

  desiredCamera.copy(stage.camera);
  pointerCameraOffset.set(pointer.x * 0.55, pointer.y * 0.32, 0);
  desiredCamera.add(pointerCameraOffset);

  desiredTarget.copy(stage.target);
  pointerTargetOffset.set(pointer.x * 0.18, pointer.y * 0.1, 0);
  desiredTarget.add(pointerTargetOffset);

  camera.position.lerp(desiredCamera, 0.08);
  animatedLookTarget.lerp(desiredTarget, 0.1);
  camera.lookAt(animatedLookTarget);

  if (carRoot) {
    const idleBob = Math.sin(elapsed * 0.8) * 0.03;
    carRig.position.y = stage.lift + idleBob;
    carRig.rotation.y = MathUtils.lerp(
      carRig.rotation.y,
      stage.rotationY + pointer.x * 0.08,
      0.08,
    );
  }

  const explodedAmount = Math.pow(stage.explode, 0.9);
  for (const part of parts) {
    const weight = stage.assemblyWeights[part.assembly];
    const pulse = 1 + Math.sin(elapsed * 1.1 + part.phase) * 0.03;
    const target = part.origin
      .clone()
      .addScaledVector(
        part.direction,
        explodeDistance * explodedAmount * weight * part.spread * part.strength * pulse,
      );

    part.object.position.lerp(target, 0.12);
  }

  renderer.render(scene, camera);
  requestAnimationFrame(render);
};

render();

const resize = () => {
  stages = buildStagePresets();
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  ScrollTrigger.refresh();
};

window.addEventListener("resize", resize);
