// src/index.tsx
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xfff8e8);

const camera = new THREE.PerspectiveCamera(
  60,
  innerWidth / innerHeight,
  0.1,
  1000
);
camera.position.set(0, 50, 400);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.rotateSpeed = 0.6;

// ———————— GLASS SHELL ————————
const glassShell = new THREE.Mesh(
  new THREE.SphereGeometry(120, 64, 64),
  new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0,
    transmission: 0.96,
    thickness: 30,
    ior: 1.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0,
    depthWrite: false,
  })
);
glassShell.renderOrder = 999;
scene.add(glassShell);

glassShell.material = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0,
  roughness: 0,
  transmission: 1.0,
  thickness: 15,
  ior: 1.5,
  clearcoat: 1.0,
  clearcoatRoughness: 0,
  envMapIntensity: 2.5,
  depthWrite: false,
});
glassShell.material.color = new THREE.Color(0xf0f8ff);

const cubeLoader = new THREE.CubeTextureLoader();
const envMap = cubeLoader.load([
  'https://threejs.org/examples/textures/cube/Park3Med/px.jpg',
  'https://threejs.org/examples/textures/cube/Park3Med/nx.jpg',
  'https://threejs.org/examples/textures/cube/Park3Med/py.jpg',
  'https://threejs.org/examples/textures/cube/Park3Med/ny.jpg',
  'https://threejs.org/examples/textures/cube/Park3Med/pz.jpg',
  'https://threejs.org/examples/textures/cube/Park3Med/nz.jpg',
]);
envMap.mapping = THREE.CubeReflectionMapping;
scene.environment = envMap;
glassShell.material.envMap = envMap;

// ———————— CLASSIC SNOW GLOBE BASE ————————
const baseGroup = new THREE.Group();

const snowBase = new THREE.Mesh(
  new THREE.CylinderGeometry(95, 105, 48, 64, 1),
  new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.8,
    metalness: 0.1,
  })
);
snowBase.position.y = -86;
baseGroup.add(snowBase);

const pedestal = new THREE.Mesh(
  new THREE.CylinderGeometry(62, 70, 28, 48),
  new THREE.MeshStandardMaterial({
    color: 0xf0f8ff,
    roughness: 0.3,
    metalness: 0.4,
  })
);
pedestal.position.y = -110;
baseGroup.add(pedestal);

const ring = new THREE.Mesh(
  new THREE.TorusGeometry(72, 6, 16, 100),
  new THREE.MeshStandardMaterial({
    color: 0xd0e8ff,
    roughness: 0.2,
    metalness: 0.6,
  })
);
ring.position.y = -98;
ring.rotation.x = Math.PI / 2;
baseGroup.add(ring);

scene.add(baseGroup);

// ———————— HOT CHOCOLATE MARSHMALLOW SNOWMAN ————————
const gltfLoader = new GLTFLoader();

gltfLoader.load('/christmas_hot_chocolate_with_marshmallow_snowman.glb', (gltf) => {
  const model = gltf.scene;
  model.scale.set(500, 500, 500);
  model.position.set(0, -62, 0);
  scene.add(model);
  console.log('HOT CHOCOLATE IS NOW VISIBLE — WINTER IS SAVED!');
});

// ———————— 3D SNOWFLAKE PHYSICS (REPLACING PNG) ————————
const flakes: THREE.Object3D[] = [];
let snowflakeTemplate: THREE.Group | null = null;

gltfLoader.load(
  '/snowflake_cutter.glb',
  (gltf) => {
    snowflakeTemplate = gltf.scene;

    // Enhance material for all meshes in the snowflake (make it bright & icy)
// Enhance material for all meshes in the snowflake
    snowflakeTemplate.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // We switch to StandardMaterial or Physical WITHOUT transmission
        // This ensures they are opaque enough to be rendered inside the glass shell
        child.material = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          emissive: 0xffffff, // Adds a self-glowing white color
          emissiveIntensity: 0.5, // Controls how bright the glow is
          metalness: 0.1,
          roughness: 0.8, // Snow is usually rough, not shiny like ice
          transmission: 0,

          thickness: 0,     // ✅ KEY FIX
          ior: 1.5,
          clearcoat: 1.0,   // Keeps the shiny "wet" ice look
          clearcoatRoughness: 0.1,
          envMapIntensity: 1.0,
        });
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Now spawn the flakes using the loaded 3D model
    spawnSnow();
  },
  undefined,
  (err) => console.error('Snowflake GLB load failed:', err)
);

const GROUND_Y = snowBase.position.y + 24; // top of snow base

function spawnSnow() {
  if (!snowflakeTemplate) return; // safety if model not loaded yet

  flakes.forEach((f) => scene.remove(f));  // Changed from water.remove — no water anymore

  for (let i = 0; i < 800; i++) {
    const flake = snowflakeTemplate!.clone();

    const baseSize = (3 + Math.random() * 4) / 75;
    const scale = baseSize * (0.8 + Math.random() * 0.6);
    flake.scale.set(scale, scale, scale);

    // Start piled on the snowy base
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 78;
    const pileHeight = Math.random() * 16; // natural snow mound

    flake.position.set(
      Math.cos(angle) * radius,
      GROUND_Y + pileHeight, // CORRECT ground level
      Math.sin(angle) * radius
    );

    flake.rotation.z = Math.random() * Math.PI * 2;
    flake.userData.velocity = new THREE.Vector3(0, 0, 0);

    scene.add(flake);
    flakes.push(flake);
  }
}

// ———————— LIGHTING ————————
scene.add(new THREE.AmbientLight(0xffffff, 1.4));
const topLight = new THREE.DirectionalLight(0xffffff, 0.7);
topLight.position.set(0, 200, 100);
scene.add(topLight);

// ———————— SHAKE DETECTION ————————
let lastAngle = controls.getAzimuthalAngle();
controls.addEventListener('change', () => {
  const current = controls.getAzimuthalAngle();
  const delta = Math.abs(current - lastAngle);
  lastAngle = current;

  if (delta > 0.008) {
    const strength = Math.min(delta * 90, 45);

    flakes.forEach((flake) => {
      const v = flake.userData.velocity as THREE.Vector3;
      v.add(
        new THREE.Vector3(
          (Math.random() - 0.5) * strength,
          Math.random() * strength * 1.2,
          (Math.random() - 0.5) * strength
        )
      );
    });
  }
});

// ———————— ANIMATION LOOP ————————
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  glassShell.rotation.y += 0.0008;

  flakes.forEach((flake) => {
    const pos = flake.position;
    const vel = flake.userData.velocity as THREE.Vector3;

    // Fluid turbulence
    const swirlStrength = 8;
    const swirlSpeed = 0.5;
    const swirlX = Math.sin(time * swirlSpeed + pos.z * 0.02) * swirlStrength;
    const swirlZ = Math.cos(time * swirlSpeed + pos.x * 0.02) * swirlStrength;
    const swirlY = Math.sin(time * 0.7 + pos.x * 0.015) * 3;

    vel.x += swirlX * delta;
    vel.y += swirlY * delta;
    vel.z += swirlZ * delta;

    if (Math.random() < 0.3) {
      vel.x += (Math.random() - 0.5) * 3;
      vel.y += (Math.random() - 0.5) * 2;
      vel.z += (Math.random() - 0.5) * 3;
    }

    vel.multiplyScalar(0.97);
    vel.y -= 4 * delta;

    pos.addScaledVector(vel, delta * 60);

    // Ground collision
    if (pos.y < GROUND_Y) {
      pos.y = GROUND_Y;
      vel.y = Math.abs(vel.y) * 0.4;
      vel.x *= 0.75;
      vel.z *= 0.75;

      if (vel.length() < 3.5) {
        vel.set(0, 0, 0);
      }
    }

    // Globe wall bounce
    const dist = pos.length();
    if (dist > 108) {
      const pushIn = pos.clone().normalize().multiplyScalar(-8 * delta);
      vel.add(pushIn);
      pos.normalize().multiplyScalar(108);
    }

    // Continuous random rotation for 3D tumbling effect
    flake.rotation.x += delta * 0.5 * (Math.random() - 0.5);
    flake.rotation.y += delta * 1.2;
    flake.rotation.z += delta * 0.8 * (Math.random() - 0.5);
  });

  controls.update();
  renderer.render(scene, camera);
}

animate();

// Resize
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});