import * as THREE from 'https://unpkg.com/three@0.165.0/build/three.module.js';

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x86b58b);
scene.fog = new THREE.Fog(0x86b58b, 16, 42);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);

const hemi = new THREE.HemisphereLight(0xfff6dd, 0x355c3f, 1.15);
scene.add(hemi);

const dir = new THREE.DirectionalLight(0xfff9ef, 1);
dir.position.set(8, 14, 6);
scene.add(dir);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.MeshStandardMaterial({ color: 0x546b54, roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const lane = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 26),
  new THREE.MeshStandardMaterial({ color: 0x7f735f, roughness: 0.95 })
);
lane.rotation.x = -Math.PI / 2;
lane.position.y = 0.01;
scene.add(lane);

const player = new THREE.Group();
player.position.set(0, 0.9, 0);
scene.add(player);

const logMaterial = new THREE.MeshStandardMaterial({
  color: 0xa56f3f,
  roughness: 0.85,
  metalness: 0.05,
  transparent: true,
  opacity: 1
});
const logMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.5, 28), logMaterial);
player.add(logMesh);

const fragmentGroup = new THREE.Group();
player.add(fragmentGroup);
const fragmentData = [];
const fragmentGeometry = new THREE.BoxGeometry(0.28, 0.28, 0.28);

for (let i = 0; i < 8; i += 1) {
  const material = new THREE.MeshStandardMaterial({
    color: 0xd9b17c,
    roughness: 0.85,
    transparent: true,
    opacity: 0
  });
  const piece = new THREE.Mesh(fragmentGeometry, material);
  piece.scale.setScalar(0.01);
  fragmentGroup.add(piece);
  fragmentData.push({
    piece,
    scatter: new THREE.Vector3(),
    from: { pos: new THREE.Vector3(), rot: new THREE.Euler(), scale: new THREE.Vector3(0.25, 0.25, 0.25) },
    to: { pos: new THREE.Vector3(), rot: new THREE.Euler(), scale: new THREE.Vector3(0.25, 0.25, 0.25) }
  });
}

const productTargets = {
  doghouse: [
    t(-0.55, 0.22, 0.55, 1.1, 0.45, 1.1),
    t(0.55, 0.22, 0.55, 1.1, 0.45, 1.1),
    t(-0.55, 0.22, -0.55, 1.1, 0.45, 1.1),
    t(0.55, 0.22, -0.55, 1.1, 0.45, 1.1),
    t(-0.35, 0.8, 0, 1.2, 0.35, 0.9, 0, 0, -0.45),
    t(0.35, 0.8, 0, 1.2, 0.35, 0.9, 0, 0, 0.45),
    t(0, 0.2, 0.65, 0.95, 0.4, 0.28),
    t(0, 0.95, 0, 0.2, 0.2, 0.2)
  ],
  planter: [
    t(0, 0.12, 0, 2, 0.3, 1.4),
    t(0, 0.65, -0.25, 1.5, 0.3, 1.1),
    t(0, 1.2, -0.5, 1.05, 0.3, 0.85),
    t(0.8, 0.4, 0.35, 0.4, 0.85, 0.4),
    t(-0.8, 0.4, 0.35, 0.4, 0.85, 0.4),
    t(0.55, 0.95, 0.05, 0.35, 0.85, 0.35),
    t(-0.55, 0.95, 0.05, 0.35, 0.85, 0.35),
    t(0, 1.55, -0.5, 0.7, 0.3, 0.7)
  ],
  picnic: [
    t(0, 0.9, 0, 2.2, 0.28, 1.2),
    t(-0.9, 0.45, 0.45, 0.25, 0.9, 0.25, 0, 0, 0.36),
    t(0.9, 0.45, 0.45, 0.25, 0.9, 0.25, 0, 0, -0.36),
    t(-0.9, 0.45, -0.45, 0.25, 0.9, 0.25, 0, 0, 0.36),
    t(0.9, 0.45, -0.45, 0.25, 0.9, 0.25, 0, 0, -0.36),
    t(0, 0.45, 0.95, 1.6, 0.24, 0.4),
    t(0, 0.45, -0.95, 1.6, 0.24, 0.4),
    t(0, 0.18, 0, 0.4, 0.3, 0.4)
  ]
};

const zones = [
  zone('Dog House', 'doghouse', -7, -4, 5, 5, 0xc59769),
  zone('Tiered Planters', 'planter', 7, -4, 5, 5, 0x95be7c),
  zone('Picnic Table', 'picnic', 0, 8, 6, 5, 0x7eb0c5)
];

zones.forEach((z) => {
  const area = new THREE.Mesh(
    new THREE.PlaneGeometry(z.size.x, z.size.y),
    new THREE.MeshStandardMaterial({ color: z.color, roughness: 1, transparent: true, opacity: 0.68 })
  );
  area.rotation.x = -Math.PI / 2;
  area.position.set(z.center.x, 0.015, z.center.y);
  scene.add(area);

  const marker = createShowcaseMarker(z.form);
  marker.position.set(z.center.x, 0, z.center.y);
  scene.add(marker);
});

let activeForm = 'log';
let transition = null;
setInstantForm('log');

const keys = new Set();
const joystick = { x: 0, y: 0, active: false };

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
    e.preventDefault();
    keys.add(key);
  }
});

window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

setupJoystick();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();
animate();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.033);

  updateMovement(dt);
  updateFormTransition(dt);

  const camTarget = new THREE.Vector3(player.position.x, 0.7, player.position.z);
  camera.position.lerp(new THREE.Vector3(player.position.x, 9, player.position.z + 10), 0.12);
  camera.lookAt(camTarget);

  renderer.render(scene, camera);
}

function updateMovement(dt) {
  const input = movementInput();
  const direction = new THREE.Vector2(input.x + joystick.x, input.y + joystick.y);

  if (direction.lengthSq() > 1) direction.normalize();

  if (direction.lengthSq() > 0.0001) {
    const speed = 4;
    player.position.x += direction.x * speed * dt;
    player.position.z += direction.y * speed * dt;

    player.position.x = THREE.MathUtils.clamp(player.position.x, -12, 12);
    player.position.z = THREE.MathUtils.clamp(player.position.z, -12, 12);

    const facing = Math.atan2(direction.x, direction.y);
    player.rotation.y = THREE.MathUtils.lerp(player.rotation.y, facing, 0.18);
  }

  const zone = zones.find((z) => insideZone(z, player.position.x, player.position.z));
  const form = zone ? zone.form : 'log';
  if (form !== activeForm && (!transition || transition.to !== form)) {
    startTransition(form);
  }
}

function updateFormTransition(dt) {
  if (!transition) return;

  transition.progress = Math.min(1, transition.progress + dt * 1.5);
  const p = transition.progress;
  const ease = smoothstep(0, 1, p);

  if (transition.from === 'log') {
    logMesh.material.opacity = 1 - ease;
    const s = 1 - ease * 0.85;
    logMesh.scale.set(s, s, s);
  } else if (transition.to === 'log') {
    logMesh.material.opacity = ease;
    const s = 0.15 + ease * 0.85;
    logMesh.scale.set(s, s, s);
  } else {
    logMesh.material.opacity = 0;
    logMesh.scale.set(0.15, 0.15, 0.15);
  }

  fragmentGroup.visible = true;

  fragmentData.forEach((frag, i) => {
    const piece = frag.piece;
    piece.material.opacity = Math.max(0.35, transition.to === 'log' ? 1 - ease * 0.6 : 0.35 + ease * 0.65);

    let fromPos = frag.from.pos;
    let fromRot = frag.from.rot;
    let fromScale = frag.from.scale;
    let toPos = frag.to.pos;
    let toRot = frag.to.rot;
    let toScale = frag.to.scale;

    if (transition.from === 'log') {
      const spread = p < 0.45 ? p / 0.45 : 1;
      fromPos = new THREE.Vector3().lerpVectors(new THREE.Vector3(0, 0, 0), frag.scatter, spread);
      fromScale = new THREE.Vector3(0.2, 0.2, 0.2);
      fromRot = new THREE.Euler(spread * 1.2, spread * 1.2, spread * 0.9);
      if (p < 0.45) {
        piece.position.copy(fromPos);
        piece.rotation.set(fromRot.x, fromRot.y, fromRot.z);
        piece.scale.setScalar(0.2 + spread * 0.2);
        return;
      }
      const settle = (p - 0.45) / 0.55;
      piece.position.lerpVectors(frag.scatter, toPos, settle);
      piece.rotation.set(
        THREE.MathUtils.lerp(fromRot.x, toRot.x, settle),
        THREE.MathUtils.lerp(fromRot.y, toRot.y, settle),
        THREE.MathUtils.lerp(fromRot.z, toRot.z, settle)
      );
      piece.scale.set(
        THREE.MathUtils.lerp(0.4, toScale.x, settle),
        THREE.MathUtils.lerp(0.4, toScale.y, settle),
        THREE.MathUtils.lerp(0.4, toScale.z, settle)
      );
      return;
    }

    if (transition.to === 'log') {
      const gather = p < 0.55 ? p / 0.55 : 1;
      const gatherPos = new THREE.Vector3().lerpVectors(fromPos, frag.scatter, gather);
      piece.position.copy(gatherPos);
      piece.rotation.set(
        THREE.MathUtils.lerp(fromRot.x, 0, gather),
        THREE.MathUtils.lerp(fromRot.y, 0, gather),
        THREE.MathUtils.lerp(fromRot.z, 0, gather)
      );
      piece.scale.set(
        THREE.MathUtils.lerp(fromScale.x, 0.26, gather),
        THREE.MathUtils.lerp(fromScale.y, 0.26, gather),
        THREE.MathUtils.lerp(fromScale.z, 0.26, gather)
      );
      if (p > 0.55) {
        const collapse = (p - 0.55) / 0.45;
        piece.position.lerpVectors(frag.scatter, new THREE.Vector3(0, 0, 0), collapse);
        piece.scale.setScalar(THREE.MathUtils.lerp(0.26, 0.01, collapse));
      }
      return;
    }

    piece.position.lerpVectors(fromPos, toPos, ease);
    piece.rotation.set(
      THREE.MathUtils.lerp(fromRot.x, toRot.x, ease),
      THREE.MathUtils.lerp(fromRot.y, toRot.y, ease),
      THREE.MathUtils.lerp(fromRot.z, toRot.z, ease)
    );
    piece.scale.set(
      THREE.MathUtils.lerp(fromScale.x, toScale.x, ease),
      THREE.MathUtils.lerp(fromScale.y, toScale.y, ease),
      THREE.MathUtils.lerp(fromScale.z, toScale.z, ease)
    );
  });

  if (p >= 1) {
    activeForm = transition.to;
    setInstantForm(activeForm);
    transition = null;
  }
}

function setInstantForm(form) {
  activeForm = form;

  if (form === 'log') {
    logMesh.material.opacity = 1;
    logMesh.scale.set(1, 1, 1);
    fragmentGroup.visible = false;
    fragmentData.forEach((f) => {
      f.piece.material.opacity = 0;
      f.piece.scale.setScalar(0.01);
      f.piece.position.set(0, 0, 0);
    });
    return;
  }

  logMesh.material.opacity = 0;
  logMesh.scale.set(0.15, 0.15, 0.15);
  fragmentGroup.visible = true;

  const targets = productTargets[form];
  fragmentData.forEach((f, i) => {
    const target = targets[i];
    f.piece.position.copy(target.pos);
    f.piece.rotation.set(target.rot.x, target.rot.y, target.rot.z);
    f.piece.scale.copy(target.scale);
    f.piece.material.opacity = 1;
  });
}

function startTransition(nextForm) {
  const fromForm = activeForm;
  activeForm = nextForm;

  const fromTargets = fromForm === 'log' ? null : productTargets[fromForm];
  const toTargets = nextForm === 'log' ? null : productTargets[nextForm];

  fragmentData.forEach((frag, i) => {
    frag.scatter.set((Math.random() - 0.5) * 2.6, Math.random() * 1.6 + 0.2, (Math.random() - 0.5) * 2.6);

    if (fromTargets) {
      frag.from.pos.copy(fromTargets[i].pos);
      frag.from.rot.copy(fromTargets[i].rot);
      frag.from.scale.copy(fromTargets[i].scale);
    } else {
      frag.from.pos.set(0, 0, 0);
      frag.from.rot.set(0, 0, 0);
      frag.from.scale.set(0.2, 0.2, 0.2);
    }

    if (toTargets) {
      frag.to.pos.copy(toTargets[i].pos);
      frag.to.rot.copy(toTargets[i].rot);
      frag.to.scale.copy(toTargets[i].scale);
    } else {
      frag.to.pos.set(0, 0, 0);
      frag.to.rot.set(0, 0, 0);
      frag.to.scale.set(0.2, 0.2, 0.2);
    }
  });

  transition = { from: fromForm, to: nextForm, progress: 0 };
}

function setupJoystick() {
  const base = document.getElementById('joystick-base');
  const knob = document.getElementById('joystick-knob');

  const center = () => {
    joystick.x = 0;
    joystick.y = 0;
    knob.style.transform = 'translate(-50%, -50%)';
  };

  const apply = (clientX, clientY) => {
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const max = rect.width * 0.35;
    const len = Math.hypot(dx, dy);
    const clamped = len > max ? max / len : 1;
    const x = dx * clamped;
    const y = dy * clamped;

    joystick.x = x / max;
    joystick.y = y / max;
    knob.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
  };

  const start = (e) => {
    joystick.active = true;
    const p = e.touches ? e.touches[0] : e;
    apply(p.clientX, p.clientY);
  };

  const move = (e) => {
    if (!joystick.active) return;
    e.preventDefault();
    const p = e.touches ? e.touches[0] : e;
    apply(p.clientX, p.clientY);
  };

  const end = () => {
    joystick.active = false;
    center();
  };

  base.addEventListener('pointerdown', start);
  window.addEventListener('pointermove', move, { passive: false });
  window.addEventListener('pointerup', end);

  base.addEventListener('touchstart', start, { passive: false });
  window.addEventListener('touchmove', move, { passive: false });
  window.addEventListener('touchend', end);

  center();
}

function movementInput() {
  let x = 0;
  let y = 0;

  if (keys.has('a') || keys.has('arrowleft')) x -= 1;
  if (keys.has('d') || keys.has('arrowright')) x += 1;
  if (keys.has('w') || keys.has('arrowup')) y -= 1;
  if (keys.has('s') || keys.has('arrowdown')) y += 1;

  return { x, y };
}

function zone(label, form, x, z, width, depth, color) {
  return {
    label,
    form,
    center: new THREE.Vector2(x, z),
    size: new THREE.Vector2(width, depth),
    color
  };
}

function insideZone(zoneDef, x, z) {
  return (
    x >= zoneDef.center.x - zoneDef.size.x / 2 &&
    x <= zoneDef.center.x + zoneDef.size.x / 2 &&
    z >= zoneDef.center.y - zoneDef.size.y / 2 &&
    z <= zoneDef.center.y + zoneDef.size.y / 2
  );
}

function t(px, py, pz, sx, sy, sz, rx = 0, ry = 0, rz = 0) {
  return {
    pos: new THREE.Vector3(px, py, pz),
    scale: new THREE.Vector3(sx, sy, sz),
    rot: new THREE.Euler(rx, ry, rz)
  };
}

function smoothstep(min, max, value) {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

function createShowcaseMarker(form) {
  const group = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0xae8452, roughness: 0.9 });
  const accent = new THREE.MeshStandardMaterial({ color: 0x5a3e20, roughness: 0.9 });

  if (form === 'doghouse') {
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 1.5), wood);
    base.position.y = 0.45;
    const roof1 = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.25, 1), accent);
    roof1.position.set(0, 1.15, 0.3);
    roof1.rotation.z = 0.35;
    const roof2 = roof1.clone();
    roof2.position.z = -0.3;
    roof2.rotation.z = -0.35;
    group.add(base, roof1, roof2);
  }

  if (form === 'planter') {
    const t1 = new THREE.Mesh(new THREE.BoxGeometry(2, 0.4, 1.2), wood);
    t1.position.set(0, 0.2, 0);
    const t2 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.4, 0.95), wood);
    t2.position.set(0, 0.75, -0.25);
    const t3 = new THREE.Mesh(new THREE.BoxGeometry(1, 0.4, 0.75), wood);
    t3.position.set(0, 1.3, -0.5);
    group.add(t1, t2, t3);
  }

  if (form === 'picnic') {
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.2, 1.2), wood);
    top.position.y = 0.95;
    const benchA = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.2, 0.35), accent);
    benchA.position.set(0, 0.5, 0.9);
    const benchB = benchA.clone();
    benchB.position.z = -0.9;
    const legA = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.9, 0.2), accent);
    legA.position.set(-0.8, 0.45, 0.45);
    const legB = legA.clone();
    legB.position.set(0.8, 0.45, 0.45);
    const legC = legA.clone();
    legC.position.set(-0.8, 0.45, -0.45);
    const legD = legA.clone();
    legD.position.set(0.8, 0.45, -0.45);
    group.add(top, benchA, benchB, legA, legB, legC, legD);
  }

  return group;
}
