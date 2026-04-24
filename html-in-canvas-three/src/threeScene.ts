import * as THREE from "three";

export type SceneHandle = {
  texture: THREE.CanvasTexture;
  update: (delta: number, phase: number) => void;
  dispose: () => void;
};

type Disposable = { dispose: () => void };

export function createScene(container: HTMLElement, textureCanvas: HTMLCanvasElement): SceneHandle {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x071018, 0.052);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 90);
  camera.position.set(0, 1.25, 7.2);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const disposables: Disposable[] = [renderer, texture];
  const animated: THREE.Object3D[] = [];

  const ambient = new THREE.HemisphereLight(0xdaf7ff, 0x29130b, 1.35);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xffdfb8, 3.4);
  keyLight.position.set(-3.8, 5.2, 4.5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  scene.add(keyLight);

  const rimLight = new THREE.PointLight(0x66fff1, 8.8, 12, 1.8);
  rimLight.position.set(2.8, 1.7, 1.4);
  scene.add(rimLight);

  const screenGroup = new THREE.Group();
  screenGroup.position.set(0, 0.72, 0);
  scene.add(screenGroup);

  const frameGeometry = new THREE.BoxGeometry(4.88, 3.08, 0.16);
  const frameMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x172334,
    metalness: 0.72,
    roughness: 0.32,
    clearcoat: 0.7,
    clearcoatRoughness: 0.22,
  });
  const frame = new THREE.Mesh(frameGeometry, frameMaterial);
  frame.castShadow = true;
  frame.receiveShadow = true;
  frame.position.z = -0.06;
  screenGroup.add(frame);
  disposables.push(frameGeometry, frameMaterial);

  const screenGeometry = new THREE.PlaneGeometry(4.48, 2.8, 48, 28);
  curveScreenGeometry(screenGeometry, 0.2);
  const screenMaterial = new THREE.MeshPhysicalMaterial({
    map: texture,
    color: 0xffffff,
    metalness: 0,
    roughness: 0.18,
    emissive: 0x91efe8,
    emissiveIntensity: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
  });
  const screen = new THREE.Mesh(screenGeometry, screenMaterial);
  screen.position.z = 0.05;
  screen.castShadow = true;
  screenGroup.add(screen);
  disposables.push(screenGeometry, screenMaterial);

  const glowGeometry = new THREE.PlaneGeometry(5.2, 3.45);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x2af6db,
    transparent: true,
    opacity: 0.13,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.position.z = -0.17;
  screenGroup.add(glow);
  disposables.push(glowGeometry, glowMaterial);

  const standMaterial = new THREE.MeshStandardMaterial({
    color: 0x26313c,
    metalness: 0.86,
    roughness: 0.36,
  });
  const neckGeometry = new THREE.CylinderGeometry(0.12, 0.2, 1.4, 24);
  const neck = new THREE.Mesh(neckGeometry, standMaterial);
  neck.position.set(0, -1.55, -0.22);
  neck.castShadow = true;
  scene.add(neck);
  disposables.push(neckGeometry, standMaterial);

  const baseGeometry = new THREE.CylinderGeometry(1.25, 1.62, 0.26, 48);
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0x141a20,
    metalness: 0.68,
    roughness: 0.42,
  });
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.set(0, -2.35, -0.22);
  base.receiveShadow = true;
  base.castShadow = true;
  scene.add(base);
  disposables.push(baseGeometry, baseMaterial);

  const floorGeometry = new THREE.CircleGeometry(9, 96);
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x0b1315,
    metalness: 0.18,
    roughness: 0.62,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.5;
  floor.receiveShadow = true;
  scene.add(floor);
  disposables.push(floorGeometry, floorMaterial);

  addGrid(scene, disposables);
  addOrbitingCards(scene, animated, disposables);
  addParticles(scene, disposables);

  const pointer = new THREE.Vector2();
  const pointerTarget = new THREE.Vector2();
  const handlePointer = (event: PointerEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointerTarget.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    pointerTarget.y = -((event.clientY - rect.top) / rect.height - 0.5) * 2;
  };
  container.addEventListener("pointermove", handlePointer);

  const resize = () => {
    const { width, height } = container.getBoundingClientRect();
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  const update = (delta: number, phase: number) => {
    pointer.lerp(pointerTarget, 1 - Math.pow(0.03, delta));
    screenGroup.rotation.y = Math.sin(phase * 0.55) * 0.08 + pointer.x * 0.12;
    screenGroup.rotation.x = Math.sin(phase * 0.37) * 0.035 + pointer.y * 0.045;
    glowMaterial.opacity = 0.1 + Math.sin(phase * 1.8) * 0.025;
    rimLight.intensity = 7.5 + Math.sin(phase * 1.4) * 1.5;

    animated.forEach((object, index) => {
      object.rotation.y += delta * (0.16 + index * 0.035);
      object.position.y += Math.sin(phase * 1.7 + index) * 0.0009;
    });

    camera.position.x = pointer.x * 0.42;
    camera.position.y = 1.25 + pointer.y * 0.18;
    camera.lookAt(0, -0.1, 0);
    renderer.render(scene, camera);
  };

  const dispose = () => {
    observer.disconnect();
    container.removeEventListener("pointermove", handlePointer);
    renderer.domElement.remove();
    disposables.forEach((item) => item.dispose());
  };

  return { texture, update, dispose };
}

function curveScreenGeometry(geometry: THREE.PlaneGeometry, amount: number) {
  const positions = geometry.attributes.position;

  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i);
    const normalized = x / 2.24;
    positions.setZ(i, Math.pow(normalized, 2) * -amount);
  }

  positions.needsUpdate = true;
  geometry.computeVertexNormals();
}

function addGrid(scene: THREE.Scene, disposables: Disposable[]) {
  const material = new THREE.LineBasicMaterial({
    color: 0x4ee8d4,
    transparent: true,
    opacity: 0.18,
  });
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const size = 8;
  const divisions = 22;
  const step = (size * 2) / divisions;

  for (let i = 0; i <= divisions; i += 1) {
    const v = -size + i * step;
    vertices.push(-size, -2.485, v, size, -2.485, v);
    vertices.push(v, -2.485, -size, v, -2.485, size);
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  const grid = new THREE.LineSegments(geometry, material);
  scene.add(grid);
  disposables.push(geometry, material);
}

function addOrbitingCards(
  scene: THREE.Scene,
  animated: THREE.Object3D[],
  disposables: Disposable[],
) {
  const cardGeometry = new THREE.PlaneGeometry(0.74, 0.46);
  const colors = [0xffb45e, 0x83fff0, 0xd7ff72, 0xff6b9a];

  colors.forEach((color, index) => {
    const material = new THREE.MeshPhysicalMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.18,
      metalness: 0.1,
      roughness: 0.28,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(cardGeometry, material);
    const angle = (index / colors.length) * Math.PI * 2 + 0.35;
    mesh.position.set(Math.cos(angle) * 3.25, -0.15 + index * 0.34, Math.sin(angle) * 1.4 - 0.6);
    mesh.lookAt(0, 0, 0);
    scene.add(mesh);
    animated.push(mesh);
    disposables.push(material);
  });

  disposables.push(cardGeometry);
}

function addParticles(scene: THREE.Scene, disposables: Disposable[]) {
  const count = 900;
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 16;
    positions[i * 3 + 1] = Math.random() * 7 - 2.4;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 12 - 1.8;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xc8fff5,
    size: 0.018,
    transparent: true,
    opacity: 0.58,
    depthWrite: false,
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);
  disposables.push(geometry, material);
}
