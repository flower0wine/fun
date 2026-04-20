import "./style.css";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { ImportMeshAsync } from "@babylonjs/core/Loading/sceneLoader";
import { AnimatorAvatar } from "@babylonjs/core/Animations/animatorAvatar";
import { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scalar } from "@babylonjs/core/Maths/math.scalar";
import { registerBuiltInLoaders } from "@babylonjs/loaders/dynamic";
import { demoConfig } from "./config";

registerBuiltInLoaders();

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root not found");
}

app.innerHTML = `
  <div class="app-shell">
    <canvas class="scene-canvas"></canvas>
    <aside class="panel">
      <p class="eyebrow">Babylon.js + TypeScript</p>
      <h1>Mixamo Action Retarget</h1>
      <p class="lead">
        This scene loads the current Sketchfab character asset and validates
        whether the placed Mixamo action can be retargeted by the Babylon.js
        runtime pipeline.
      </p>
      <dl class="meta">
        <div><dt>Character</dt><dd>${demoConfig.characterUrl}</dd></div>
        <div><dt>Action</dt><dd>${demoConfig.animationUrl}</dd></div>
      </dl>
      <p class="status-label">Status</p>
      <p class="status-text" id="status">Initializing scene...</p>
    </aside>
  </div>
`;

const canvas = document.querySelector<HTMLCanvasElement>(".scene-canvas");
const statusElement = document.querySelector<HTMLParagraphElement>("#status");

if (!canvas || !statusElement) {
  throw new Error("UI elements not found");
}

const setStatus = (message: string) => {
  statusElement.textContent = message;
};

const getFileExtension = (assetUrl: string) => {
  const cleanUrl = assetUrl.split("?")[0]?.split("#")[0] ?? assetUrl;
  const match = /\.([a-z0-9]+)$/i.exec(cleanUrl);
  return match?.[1]?.toLowerCase() ?? "";
};

const getFileName = (assetUrl: string) => {
  const cleanUrl = assetUrl.split("?")[0]?.split("#")[0] ?? assetUrl;
  return decodeURIComponent(cleanUrl.split("/").pop() ?? cleanUrl);
};

const engine = new Engine(canvas, true, {
  antialias: true,
  preserveDrawingBuffer: true,
  stencil: true,
});

const scene = new Scene(engine);
scene.clearColor = new Color4(0.93, 0.95, 0.98, 1);

const camera = new ArcRotateCamera(
  "camera",
  -Math.PI / 2,
  1.18,
  5.8,
  new Vector3(0, 1.15, 0),
  scene,
);
camera.lowerRadiusLimit = 2.8;
camera.upperRadiusLimit = 12;
camera.lowerBetaLimit = 0.45;
camera.upperBetaLimit = 1.48;
camera.wheelDeltaPercentage = 0.01;
camera.attachControl(canvas, true);

const hemi = new HemisphericLight("hemi", new Vector3(0.2, 1, 0.15), scene);
hemi.intensity = 1.2;
hemi.groundColor = new Color3(0.6, 0.62, 0.67);

const sun = new DirectionalLight("sun", new Vector3(-0.4, -1, -0.3), scene);
sun.position = new Vector3(4, 7, 3);
sun.intensity = 1.35;

const ground = MeshBuilder.CreateGround("ground", { width: 14, height: 14 }, scene);
ground.position.y = 0;
const groundMaterial = new StandardMaterial("ground-material", scene);
groundMaterial.diffuseColor = new Color3(0.85, 0.87, 0.9);
groundMaterial.specularColor = new Color3(0.05, 0.05, 0.05);
ground.material = groundMaterial;

const frameCharacter = (root: TransformNode) => {
  const childMeshes = root.getChildMeshes(false);

  if (childMeshes.length === 0) {
    return;
  }

  const min = new Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
  const max = new Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);

  for (const mesh of childMeshes) {
    const info = mesh.getBoundingInfo();
    min.minimizeInPlace(info.boundingBox.minimumWorld);
    max.maximizeInPlace(info.boundingBox.maximumWorld);
  }

  const size = max.subtract(min);
  const center = min.add(max).scale(0.5);
  const scale = Scalar.Clamp(2.4 / Math.max(size.x, size.y, size.z), 0.001, 100);

  root.scaling.scaleInPlace(scale);
  root.position.subtractInPlace(center.scale(scale));
  root.position.y -= min.y * scale;
  camera.target = new Vector3(0, Math.max(0.85, size.y * scale * 0.45), 0);
};

const chooseAnimationGroup = (groups: AnimationGroup[]) => {
  if (groups.length === 0) {
    throw new Error("No animation groups found in the Mixamo file.");
  }

  if (demoConfig.animationGroupName) {
    const match = groups.find((group) => group.name === demoConfig.animationGroupName);
    if (!match) {
      throw new Error(`Animation group "${demoConfig.animationGroupName}" was not found.`);
    }
    return match;
  }

  return groups[0];
};

const assertAnimationFormat = (assetUrl: string) => {
  const extension = getFileExtension(assetUrl);

  if (extension === "glb" || extension === "gltf") {
    return;
  }

  if (extension === "fbx") {
    throw new Error(
      [
        `The current Mixamo action "${getFileName(assetUrl)}" is FBX.`,
        "This Babylon.js retarget demo expects a Mixamo GLB/GLTF animation file.",
        "Convert the Mixamo export to GLB, then update src/config.ts or replace the file path.",
      ].join(" "),
    );
  }

  throw new Error(
    `Unsupported animation format ".${extension || "unknown"}". Use a Mixamo GLB/GLTF animation export.`,
  );
};

const boot = async () => {
  try {
    setStatus("Loading Sketchfab character...");
    const characterResult = await ImportMeshAsync(demoConfig.characterUrl, scene);
    const characterRoot =
      characterResult.transformNodes[0] ??
      characterResult.meshes[0] ??
      null;

    if (!characterRoot) {
      throw new Error("Character root node could not be resolved.");
    }

    frameCharacter(characterRoot);

    setStatus("Validating Mixamo action format...");
    assertAnimationFormat(demoConfig.animationUrl);

    setStatus("Loading Mixamo action...");
    const actionResult = await ImportMeshAsync(demoConfig.animationUrl, scene);
    const sourceGroup = chooseAnimationGroup(actionResult.animationGroups);

    sourceGroup.stop();
    sourceGroup.goToFrame(sourceGroup.from);

    const avatar = new AnimatorAvatar("character-avatar", characterRoot, false, false);
    const retargeted = avatar.retargetAnimationGroup(sourceGroup, {
      animationGroupName: `retargeted_${sourceGroup.name}`,
      retargetAnimationKeys: true,
      fixRootPosition: true,
      fixGroundReference: true,
      rootNodeName: demoConfig.retarget.rootNodeName,
      groundReferenceNodeName: demoConfig.retarget.groundReferenceNodeName,
      mapNodeNames: demoConfig.retarget.mapNodeNames,
    });

    for (const mesh of actionResult.meshes) {
      mesh.setEnabled(false);
    }
    for (const node of actionResult.transformNodes) {
      node.setEnabled(false);
    }

    retargeted.start(
      demoConfig.loop,
      demoConfig.animationSpeed,
      retargeted.from,
      retargeted.to,
      false,
    );

    setStatus(`Playing "${sourceGroup.name}" on the loaded character.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    setStatus(`Failed: ${message}`);
    console.error(error);
  }
};

void boot();

engine.runRenderLoop(() => {
  scene.render();
});

window.addEventListener("resize", () => {
  engine.resize();
});
