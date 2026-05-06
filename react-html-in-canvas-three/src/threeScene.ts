import * as THREE from "three";

export type DemoScene = {
  texture: THREE.CanvasTexture;
  update: (delta: number, phase: number) => void;
  dispose: () => void;
};

export function createDemoScene(
  host: HTMLElement,
  textureCanvas: HTMLCanvasElement,
): DemoScene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#07111f");
  scene.fog = new THREE.Fog("#07111f", 7, 16);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 1.14, 7.85);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(host.clientWidth, host.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const group = new THREE.Group();
  scene.add(group);

  const screenGeometry = makeCurvedPlane(4.7, 2.95, 28, 0.34);
  const screenMaterial = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.34,
    metalness: 0.08,
    emissive: new THREE.Color("#123241"),
    emissiveIntensity: 0.22,
  });
  const screen = new THREE.Mesh(screenGeometry, screenMaterial);
  screen.position.set(0, 1.15, 0);
  group.add(screen);

  const frameMaterial = new THREE.MeshStandardMaterial({
    color: "#1f2937",
    roughness: 0.42,
    metalness: 0.58,
  });
  const frameBars = createFrameBars(frameMaterial);
  frameBars.forEach((bar) => group.add(bar));

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.52, 0.8, 0.36, 32),
    frameMaterial,
  );
  base.position.set(0, -1.02, -0.15);
  group.add(base);

  const floor = new THREE.GridHelper(16, 32, "#38bdf8", "#1f2937");
  floor.position.y = -1.23;
  scene.add(floor);

  const ambient = new THREE.HemisphereLight("#a5f3fc", "#111827", 1.65);
  scene.add(ambient);

  const key = new THREE.DirectionalLight("#fff7ed", 2.8);
  key.position.set(3.5, 4.5, 5);
  scene.add(key);

  const rim = new THREE.PointLight("#fb7185", 16, 9);
  rim.position.set(-3, 1.4, 2.6);
  scene.add(rim);

  const resize = () => {
    const width = Math.max(host.clientWidth, 1);
    const height = Math.max(host.clientHeight, 1);
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();

  const update = (delta: number, phase: number) => {
    group.rotation.y = Math.sin(phase * 0.55) * 0.16;
    group.rotation.x = Math.sin(phase * 0.32) * 0.035;
    group.position.y = Math.sin(phase * 0.8) * 0.045;
    floor.rotation.y += delta * 0.08;
    renderer.render(scene, camera);
  };

  return {
    texture,
    update,
    dispose: () => {
      observer.disconnect();
      host.removeChild(renderer.domElement);
      texture.dispose();
      screenGeometry.dispose();
      screenMaterial.dispose();
      frameBars.forEach((bar) => bar.geometry.dispose());
      frameMaterial.dispose();
      renderer.dispose();
    },
  };
}

function createFrameBars(material: THREE.Material) {
  const topBottomGeometry = new THREE.BoxGeometry(5.06, 0.14, 0.18);
  const sideGeometry = new THREE.BoxGeometry(0.14, 3.18, 0.18);
  const top = new THREE.Mesh(topBottomGeometry, material);
  const bottom = new THREE.Mesh(topBottomGeometry.clone(), material);
  const left = new THREE.Mesh(sideGeometry, material);
  const right = new THREE.Mesh(sideGeometry.clone(), material);

  top.position.set(0, 2.7, 0.04);
  bottom.position.set(0, -0.4, 0.04);
  left.position.set(-2.53, 1.15, 0.04);
  right.position.set(2.53, 1.15, 0.04);

  return [top, bottom, left, right];
}

function makeCurvedPlane(
  width: number,
  height: number,
  segments: number,
  curve: number,
) {
  const geometry = new THREE.PlaneGeometry(width, height, segments, 1);
  const position = geometry.attributes.position;

  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const normalized = x / (width / 2);
    const z = -Math.cos(normalized * Math.PI * 0.5) * curve + curve;
    position.setZ(i, z);
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}
