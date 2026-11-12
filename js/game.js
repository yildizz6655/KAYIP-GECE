
import * as THREE from "three";

// ===================================
// KAYIP GECE - GAME ENGINE
// ===================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030303);
scene.fog = new THREE.FogExp2(0x080808, 0.035);

const camera = new THREE.PerspectiveCamera(
  75,
  innerWidth / innerHeight,
  0.1,
  100
);

camera.position.set(0, 1.65, 6);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
document.getElementById("game").appendChild(renderer.domElement);

// ===================================
// IŞIKLAR
// ===================================

scene.add(new THREE.AmbientLight(0x526070, 0.35));

const moon = new THREE.DirectionalLight(0x8090a0, 0.5);
moon.position.set(-5, 10, 5);
scene.add(moon);

const flashlight = new THREE.SpotLight(
  0xffe8c0,
  40,
  25,
  Math.PI / 7,
  0.5,
  1.5
);

flashlight.position.set(0, 0, 0);
flashlight.target.position.set(0, 0, -1);
camera.add(flashlight);
camera.add(flashlight.target);
scene.add(camera);

// ===================================
// MATERYALLER
// ===================================

const wallMat = new THREE.MeshStandardMaterial({
  color: 0x39332d,
  roughness: 1
});

const floorMat = new THREE.MeshStandardMaterial({
  color: 0x211d19,
  roughness: 1
});

const woodMat = new THREE.MeshStandardMaterial({
  color: 0x382318,
  roughness: 0.95
});

const blackMat = new THREE.MeshStandardMaterial({
  color: 0x080808
});

const redMat = new THREE.MeshStandardMaterial({
  color: 0x550000
});

// ===================================
// NESNE OLUŞTURMA
// ===================================

const colliders = [];

function createBox(x, y, z, w, h, d, material, collision = true) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    material
  );

  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  scene.add(mesh);

  if (collision) {
    colliders.push(
      new THREE.Box3().setFromObject(mesh)
    );
  }

  return mesh;
}

// ===================================
// EV
// ===================================

createBox(0, -0.2, 0, 24, 0.4, 18, floorMat, false);

createBox(0, 2, -9, 24, 4, 0.4, wallMat);
createBox(0, 2, 9, 24, 4, 0.4, wallMat);
createBox(-12, 2, 0, 0.4, 4, 18, wallMat);
createBox(12, 2, 0, 0.4, 4, 18, wallMat);

createBox(0, 4.2, 0, 24, 0.4, 18, blackMat, false);

// İç duvarlar
createBox(-5, 2, -5, 0.3, 4, 7, wallMat);
createBox(5, 2, -5, 0.3, 4, 7, wallMat);
createBox(-5, 2, 4, 0.3, 4, 7, wallMat);
createBox(5, 2, 4, 0.3, 4, 7, wallMat);

// Eşyalar
createBox(-8, 1, 2, 2.5, 0.2, 1.5, woodMat);
createBox(8, 1.5, -6, 2, 3, 1, woodMat);
createBox(-8, 0.6, -6, 3, 0.6, 2, woodMat);
createBox(8, 0.5, 5, 1, 1, 1, blackMat);

// Kırmızı ışık
const redLight = new THREE.PointLight(0xaa0000, 3, 10);
redLight.position.set(0, 2, -7);
scene.add(redLight);

// ===================================
// OYUNCU
// ===================================

let yaw = 0;
let pitch = 0;
let moveX = 0;
let moveY = 0;

let running = false;
let playing = false;
let flashlightOn = true;
let gameOver = false;

const player = camera.position;
const keys = {};

addEventListener("keydown", e => keys[e.code] = true);
addEventListener("keyup", e => keys[e.code] = false);

// ===================================
// MOBİL JOYSTICK
// ===================================

const joystick = document.getElementById("joystick");
const stick = document.getElementById("stick");

let joystickPointer = null;

function joystickMove(e) {
  const rect = joystick.getBoundingClientRect();

  let dx = e.clientX - (rect.left + rect.width / 2);
  let dy = e.clientY - (rect.top + rect.height / 2);

  const max = 38;
  const distance = Math.hypot(dx, dy);

  if (distance > max) {
    dx *= max / distance;
    dy *= max / distance;
  }

  moveX = dx / max;
  moveY = dy / max;

  stick.style.left = `${36 + dx}px`;
  stick.style.top = `${36 + dy}px`;
}

joystick.addEventListener("pointerdown", e => {
  joystickPointer = e.pointerId;
  joystick.setPointerCapture(e.pointerId);
  joystickMove(e);
});

joystick.addEventListener("pointermove", e => {
  if (e.pointerId === joystickPointer) joystickMove(e);
});

function resetJoystick() {
  joystickPointer = null;
  moveX = 0;
  moveY = 0;
  stick.style.left = "36px";
  stick.style.top = "36px";
}

joystick.addEventListener("pointerup", resetJoystick);
joystick.addEventListener("pointercancel", resetJoystick);

// ===================================
// KAMERA KONTROLÜ
// ===================================

const look = document.getElementById("look");

let lookPointer = null;
let oldX = 0;
let oldY = 0;

look.addEventListener("pointerdown", e => {
  lookPointer = e.pointerId;
  oldX = e.clientX;
  oldY = e.clientY;
  look.setPointerCapture(e.pointerId);
});

look.addEventListener("pointermove", e => {
  if (lookPointer !== e.pointerId || !playing) return;

  yaw -= (e.clientX - oldX) * 0.004;
  pitch -= (e.clientY - oldY) * 0.004;

  pitch = THREE.MathUtils.clamp(pitch, -1.3, 1.3);

  oldX = e.clientX;
  oldY = e.clientY;
});

look.addEventListener("pointerup", () => lookPointer = null);
look.addEventListener("pointercancel", () => lookPointer = null);

// ===================================
// FENER
// ===================================

document.getElementById("flashlight").onclick = () => {
  flashlightOn = !flashlightOn;
  flashlight.visible = flashlightOn;

  document.querySelector("#top span:nth-child(2)").textContent =
    flashlightOn ? "EL FENERİ: AÇIK" : "EL FENERİ: KAPALI";
};

// ===================================
// KOŞMA
// ===================================

const runButton = document.getElementById("run");

runButton.addEventListener("pointerdown", () => running = true);
runButton.addEventListener("pointerup", () => running = false);
runButton.addEventListener("pointercancel", () => running = false);
runButton.addEventListener("pointerleave", () => running = false);

// ===================================
// ÇARPIŞMA
// ===================================

const radius = 0.3;

function canMove(x, z) {
  const bounds = new THREE.Box3(
    new THREE.Vector3(x - radius, 0, z - radius),
    new THREE.Vector3(x + radius, 1.8, z + radius)
  );

  return !colliders.some(wall => bounds.intersectsBox(wall));
}

// ===================================
// ZOMBİ OLUŞTURMA
// ===================================

const zombie = new THREE.Group();

const zombieSkin = new THREE.MeshStandardMaterial({
  color: 0x65715b,
  roughness: 1
});

const zombieClothes = new THREE.MeshStandardMaterial({
  color: 0x292424
});

function zombiePart(x, y, z, w, h, d, material) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    material
  );

  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  zombie.add(mesh);

  return mesh;
}

// Gövde
zombiePart(0, 1.1, 0, 0.65, 0.9, 0.35, zombieClothes);

// Kafa
const head = zombiePart(0, 1.85, 0, 0.48, 0.55, 0.45, zombieSkin);

// Kollar
const leftArm = zombiePart(-0.48, 1.15, -0.1, 0.2, 0.85, 0.2, zombieSkin);
const rightArm = zombiePart(0.48, 1.15, -0.1, 0.2, 0.85, 0.2, zombieSkin);

// Bacaklar
const leftLeg = zombiePart(-0.2, 0.4, 0, 0.22, 0.8, 0.25, zombieClothes);
const rightLeg = zombiePart(0.2, 0.4, 0, 0.22, 0.8, 0.25, zombieClothes);

// Gözler
const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });

zombiePart(-0.12, 1.9, -0.23, 0.08, 0.07, 0.03, eyeMat);
zombiePart(0.12, 1.9, -0.23, 0.08, 0.07, 0.03, eyeMat);

zombie.position.set(0, 0, -6);
scene.add(zombie);

// ===================================
// ZOMBİ YAPAY ZEKÂSI
// ===================================

let zombieSpeed = 0.85;
let zombieAttackDistance = 1.25;
let zombieAnimation = 0;
let attackCooldown = 0;

function updateZombie(delta) {
  if (!playing || gameOver) return;

  const dx = player.x - zombie.position.x;
  const dz = player.z - zombie.position.z;

  const distance = Math.hypot(dx, dz);

  // Oyuncuya dön
  zombie.rotation.y = Math.atan2(dx, dz);

  if (distance > zombieAttackDistance) {
    const step = zombieSpeed * delta;

    const nx = zombie.position.x + (dx / distance) * step;
    const nz = zombie.position.z + (dz / distance) * step;

    // Duvarların içinden geçmemesi için basit engel kontrolü
    if (canMove(nx, nz)) {
      zombie.position.x = nx;
      zombie.position.z = nz;
    } else {
      // Engel varsa çevresinden dolaşmaya çalış
      const side = new THREE.Vector3(-dz, 0, dx).normalize();

      const sx = zombie.position.x + side.x * step;
      const sz = zombie.position.z + side.z * step;

      if (canMove(sx, sz)) {
        zombie.position.x = sx;
        zombie.position.z = sz;
      }
    }

    // Yürüme animasyonu
    zombieAnimation += delta * 5;

    leftArm.rotation.x = Math.sin(zombieAnimation) * 0.65;
    rightArm.rotation.x = -Math.sin(zombieAnimation) * 0.65;

    leftLeg.rotation.x = -Math.sin(zombieAnimation) * 0.45;
    rightLeg.rotation.x = Math.sin(zombieAnimation) * 0.45;

  } else {
    attackCooldown -= delta;

    if (attackCooldown <= 0) {
      attackCooldown = 1.5;
      showMessage("ZOMBİ SANA YAKLAŞTI!");
    }

    if (distance < 0.8) {
      endGame();
    }
  }
}

// ===================================
// MESAJ
// ===================================

let messageTimer;

function showMessage(text) {
  const element = document.getElementById("message");

  element.textContent = text;

  clearTimeout(messageTimer);

  messageTimer = setTimeout(() => {
    element.textContent = "";
  }, 1500);
}

// ===================================
// OYUN BİTİŞİ
// ===================================

function endGame() {
  if (gameOver) return;

  gameOver = true;
  playing = false;

  const menu = document.getElementById("menu");

  menu.style.display = "flex";
  menu.innerHTML = `
    <h1>YAKALANDIN!</h1>
    <p>ZOMBİ SENİ YAKALADI...</p>
    <button id="restart" style="
      padding:17px 45px;
      background:#8c0000;
      color:white;
      border:1px solid red;
      font-size:17px;
    ">TEKRAR DENE</button>
  `;

  document.getElementById("hud").style.display = "none";

  document.getElementById("restart").onclick = () => {
    location.reload();
  };
}

// ===================================
// OYUN BAŞLATMA
// ===================================

document.getElementById("start").onclick = async () => {
  playing = true;
  gameOver = false;

  document.getElementById("menu").style.display = "none";
  document.getElementById("hud").style.display = "block";

  camera.position.set(0, 1.65, 6);
  zombie.position.set(0, 0, -6);

  try {
    await document.documentElement.requestFullscreen();
    await screen.orientation.lock("landscape");
  } catch (e) {
    console.log("Tam ekran desteklenmiyor.");
  }
};

// ===================================
// HAREKET
// ===================================

function updateMovement(delta) {
  if (!playing) return;

  let forward = -moveY;
  let sideways = moveX;

  if (keys["KeyW"]) forward++;
  if (keys["KeyS"]) forward--;
  if (keys["KeyA"]) sideways--;
  if (keys["KeyD"]) sideways++;

  const length = Math.hypot(forward, sideways);

  if (length > 1) {
    forward /= length;
    sideways /= length;
  }

  const speed = running ? 5 : 2.5;

  const fx = -Math.sin(yaw);
  const fz = -Math.cos(yaw);

  const rx = Math.cos(yaw);
  const rz = -Math.sin(yaw);

  const dx = (fx * forward + rx * sideways) * speed * delta;
  const dz = (fz * forward + rz * sideways) * speed * delta;

  const nx = player.x + dx;
  const nz = player.z + dz;

  if (canMove(nx, player.z)) player.x = nx;
  if (canMove(player.x, nz)) player.z = nz;

  camera.rotation.order = "YXZ";
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
}

// ===================================
// ANA DÖNGÜ
// ===================================

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);

  updateMovement(delta);
  updateZombie(delta);

  redLight.intensity =
    2.5 + Math.sin(Date.now() * 0.004) * 0.8;

  renderer.render(scene, camera);
}

animate();

// ===================================
// EKRAN BOYUTU
// ===================================

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
