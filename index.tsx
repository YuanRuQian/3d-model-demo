// src/index.tsx
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

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

// ———————— DELETE THE ENTIRE WATER SPHERE MESH ————————
// Remove these lines completely:
// const water = new THREE.Mesh( ... )
// scene.add(water);

// ———————— INSTEAD: FAKE THE WATER WITH TRANSMISSION ONLY ————————
glassShell.material = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0,
  roughness: 0,
  transmission: 1.0, // ← FULLY transparent glass
  thickness: 15, // ← fake water thickness inside
  ior: 1.5, // glass IOR
  clearcoat: 1.0,
  clearcoatRoughness: 0,
  envMapIntensity: 2.5, // ← this creates the "liquid" look!
  depthWrite: false,
});

// Optional: add a very subtle blue tint to simulate water
glassShell.material.color = new THREE.Color(0xf0f8ff);

// Add a high-quality environment map for beautiful reflections
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
scene.environment = envMap; // ← this gives the liquid reflections!
glassShell.material.envMap = envMap;

// ———————— CLASSIC SNOW GLOBE BASE (NOW IN WORLD SPACE!) ————————
const baseGroup = new THREE.Group();

// Snow platform
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

// ADD TO SCENE, NOT WATER!!!
scene.add(baseGroup);

// ———————— SNOWMAN (also in world space) ————————
const body = new THREE.Mesh(
  new THREE.SphereGeometry(28),
  new THREE.MeshStandardMaterial({ color: 0xffffff })
);
body.position.y = -60;
scene.add(body); // ← scene, not water!

const head = new THREE.Mesh(
  new THREE.SphereGeometry(18),
  new THREE.MeshStandardMaterial({ color: 0xffffff })
);
head.position.y = -25;
scene.add(head);

const nose = new THREE.Mesh(
  new THREE.ConeGeometry(4, 16, 16),
  new THREE.MeshStandardMaterial({ color: 0xff8800 })
);
nose.position.set(0, -25, 16);
nose.rotation.x = Math.PI / 2;
scene.add(nose);

// ———————— SNOWFLAKE PHYSICS ————————
const flakes: THREE.Mesh[] = [];
const snowTexture = new THREE.TextureLoader().load('/snowflake.png');

// Exact top of snow base (debugged!)
const GROUND_Y = snowBase.position.y + 24; // 48/2 = 24
const flake_heights = [];
function spawnSnow() {
  flakes.forEach((f) => water.remove(f));
  flakes.length = 0;

  for (let i = 0; i < 800; i++) {
    const size = 5 + Math.random() * 5;

    const flake = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      new THREE.MeshBasicMaterial({
        map: snowTexture,
        transparent: true,
        opacity: 0.96,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      })
    );

    // Start piled on the snowy base
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 78;
    const pileHeight = Math.random() * 16; // natural snow mound

    flake.position.set(
      Math.cos(angle) * radius,
      GROUND_Y + pileHeight, // CORRECT ground level
      Math.sin(angle) * radius
    );

    flake_heights.push(GROUND_Y + pileHeight);

    flake.rotation.z = Math.random() * Math.PI * 2;
    flake.userData.velocity = new THREE.Vector3(0, 0, 0);

    scene.add(flake);
    flakes.push(flake);
  }
}
spawnSnow();

// ———————— LIGHTING ————————
scene.add(new THREE.AmbientLight(0xffffff, 1.4));
const topLight = new THREE.DirectionalLight(0xffffff, 0.7);
topLight.position.set(0, 200, 100);
scene.add(topLight);

// ———————— SHAKE DETECTION (upward kick when dragging) ————————
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
          Math.random() * strength * 1.2, // strong upward burst
          (Math.random() - 0.5) * strength
        )
      );
    });
  }
});

// ———————— ANIMATION LOOP WITH REAL SNOW PHYSICS ————————
const clock = new THREE.Clock();
const gravity = 9.8;
const drag = 0.955;
const groundY = -60; // top of snow base

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  // Gentle auto-spin (optional, looks magical)
  glassShell.rotation.y += 0.0008;

  const time = clock.getElapsedTime(); // for swirling patterns

  flakes.forEach((flake) => {
    const pos = flake.position;
    const vel = flake.userData.velocity as THREE.Vector3;

    // ——— FLUID TURBULENCE (this is the magic) ———
    // Add gentle swirling based on position + time (like real water currents)
    const swirlStrength = 8;
    const swirlSpeed = 0.5;
    const swirlX = Math.sin(time * swirlSpeed + pos.z * 0.02) * swirlStrength;
    const swirlZ = Math.cos(time * swirlSpeed + pos.x * 0.02) * swirlStrength;
    const swirlY = Math.sin(time * 0.7 + pos.x * 0.015) * 3; // gentle up/down waves

    vel.x += swirlX * delta;
    vel.y += swirlY * delta;
    vel.z += swirlZ * delta;

    // Add tiny random wobble (per-flake chaos)
    if (Math.random() < 0.3) {
      // ~30% chance per frame
      vel.x += (Math.random() - 0.5) * 3;
      vel.y += (Math.random() - 0.5) * 2;
      vel.z += (Math.random() - 0.5) * 3;
    }

    // ——— PHYSICS (now feels like thick syrup) ———
    vel.multiplyScalar(0.97); // heavier drag = floaty, slow motion
    vel.y -= 4 * delta; // slower, gentler gravity (was 28)

    pos.addScaledVector(vel, delta * 60);

    // ——— GROUND COLLISION (soft landing + pile) ———
    if (pos.y < groundY) {
      pos.y = groundY;
      vel.y = Math.abs(vel.y) * 0.4; // softer bounce
      vel.x *= 0.75;
      vel.z *= 0.75;

      if (vel.length() < 3.5) {
        vel.set(0, 0, 0); // settle peacefully
      }
    }

    // ——— GLOBE WALL (soft push inward & bounce back from the glass) ———
    const dist = pos.length();
    if (dist > 108) {
      const pushIn = pos
        .clone()
        .normalize()
        .multiplyScalar(-8 * delta);
      vel.add(pushIn);
      pos.normalize().multiplyScalar(108);
    }

    // ——— BILLBOARD + gentle spin ———
    flake.lookAt(camera.position);
    flake.rotation.z += Math.PI + delta * 2; // slow elegant spin while falling
  });

  controls.update();
  renderer.render(scene, camera);
}

animate();

// Resize handler
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
