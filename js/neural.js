/* ============================================================
   js/neural.js  v5
   Mesh X position is driven by scroll beat progress.

   Beat layout:
     hero      → right  (+2.8, 0)
     about     → left   (-2.8, 0)   [transition from right]
     projects  → centre (0, 0)
     skills    → centre (0, 0)
     education → right  (+2.8, 0)
     contact   → fade out (opacity 0)
   ============================================================ */

(function () {

  if (typeof THREE === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.getElementById('neural-canvas');
  if (!canvas) return;

  /* ── Renderer ───────────────────────────────────────────── */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 5.2;

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  /* ── Colours ────────────────────────────────────────────── */
  const GOLD     = new THREE.Color(0xc9a84c);
  const GOLD_DIM = new THREE.Color(0x7a6030);
  const GOLD_FOG = new THREE.Color(0x2a1e08);

  /* ── Node positions ─────────────────────────────────────── */
  const N   = 200;
  const R   = 1.65;
  const phi = Math.PI * (3 - Math.sqrt(5));
  const pos = [];

  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    pos.push(new THREE.Vector3(
      Math.cos(phi * i) * r * R,
      y * R,
      Math.sin(phi * i) * r * R
    ));
  }

  /* ── Nodes ──────────────────────────────────────────────── */
  const nodeGeo = new THREE.SphereGeometry(0.020, 6, 6);
  const nodeMat = new THREE.MeshBasicMaterial({ color: GOLD });
  const nodes   = new THREE.InstancedMesh(nodeGeo, nodeMat, N);
  const dummy   = new THREE.Object3D();

  pos.forEach((p, i) => {
    dummy.position.copy(p);
    dummy.updateMatrix();
    nodes.setMatrixAt(i, dummy.matrix);
    nodes.setColorAt(i, GOLD.clone().multiplyScalar(0.5 + Math.random() * 0.5));
  });
  nodes.instanceMatrix.needsUpdate = true;
  nodes.instanceColor.needsUpdate  = true;

  /* ── Edges ──────────────────────────────────────────────── */
  const THRESH   = 0.88;
  const MAX_CONN = 4;
  const ePos     = [];
  const eCol     = [];

  pos.forEach((a, i) => {
    let c = 0;
    for (let j = i + 1; j < pos.length && c < MAX_CONN; j++) {
      const d = a.distanceTo(pos[j]);
      if (d < THRESH) {
        const t   = 1 - d / THRESH;
        const col = GOLD_FOG.clone().lerp(GOLD_DIM, t);
        ePos.push(a.x, a.y, a.z, pos[j].x, pos[j].y, pos[j].z);
        eCol.push(col.r, col.g, col.b, col.r, col.g, col.b);
        c++;
      }
    }
  });

  const edgeGeo = new THREE.BufferGeometry();
  edgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(ePos, 3));
  edgeGeo.setAttribute('color',    new THREE.Float32BufferAttribute(eCol, 3));
  const edges = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.42,
  }));

  /* ── Halo ───────────────────────────────────────────────── */
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.1, 28, 28),
    new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.020, side: THREE.BackSide })
  );

  /* ── Group ──────────────────────────────────────────────── */
  const group = new THREE.Group();
  group.add(nodes, edges, halo);
  scene.add(group);

  /* ── Target position (driven by scroll beats) ───────────── */
  window.neuralTarget = { x: 2.2, y: 0, opacity: 1 };

  /* Current interpolated position */
  let curX = 2.2, curY = 0, curOpacity = 1;

  /* Scroll tracking for Y drift and rotation */
  let scrollRaw  = 0;
  let scrollDelta = 0;  /* speed of scroll — drives rotation boost */
  let lastScrollRaw = 0;

  window.addEventListener('scroll', () => {
    scrollDelta = window.scrollY - lastScrollRaw;
    lastScrollRaw = window.scrollY;
    scrollRaw = window.scrollY;
  }, { passive: true });

  /* Scroll delta decays each frame */
  let rotationBoost = 0;

  function getScrollY() {
    const max = document.body.scrollHeight - window.innerHeight;
    if (max <= 0) return 0;
    return 0.6 - (scrollRaw / max) * 1.2;
  }

  /* ── Pulse ──────────────────────────────────────────────── */
  const pulses = [];
  function spawnPulse() {
    const origin = pos[Math.floor(Math.random() * N)].clone();
    const mesh   = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 10, 10),
      new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.8 })
    );
    mesh.position.copy(origin);
    group.add(mesh);
    pulses.push({ mesh, age: 0 });
  }
  spawnPulse();
  setInterval(spawnPulse, 2200);

  /* ── Mouse tilt ─────────────────────────────────────────── */
  const tT = { x: 0, y: 0 };
  const tC = { x: 0, y: 0 };
  window.addEventListener('mousemove', e => {
    tT.x = -(e.clientY / window.innerHeight - 0.5) * 0.28;
    tT.y =  (e.clientX / window.innerWidth  - 0.5) * 0.28;
  });

  /* ── Animation loop ─────────────────────────────────────── */
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    const t  = window.neuralTarget;

    /* Smooth lerp toward target — much lower factor = glassier movement */
    const targetY = window.neuralTarget.y + getScrollY();
    curX       += (t.x       - curX)       * 0.032;
    curY       += (targetY   - curY)       * 0.032;
    curOpacity += (t.opacity - curOpacity) * 0.038;

    group.position.x = curX;
    group.position.y = curY;
    renderer.domElement.style.opacity = Math.max(0, curOpacity);

    /* Rotation boost decays from scroll delta — spike then settle */
    rotationBoost += (Math.abs(scrollDelta) * 0.012 - rotationBoost) * 0.08;
    scrollDelta   *= 0.88;  /* decay delta each frame */

    /* Idle rotation + scroll boost */
    const speedMult = 1 + rotationBoost;
    group.rotation.y += dt * 0.16 * speedMult;
    group.rotation.x += dt * 0.05 * speedMult;

    /* Mouse tilt */
    tC.x += (tT.x - tC.x) * 0.06;
    tC.y += (tT.y - tC.y) * 0.06;
    group.rotation.x += tC.x * 0.05;
    group.rotation.y += tC.y * 0.05;

    /* Pulses */
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      p.age  += dt;
      const prog = p.age / 1.4;
      p.mesh.scale.setScalar(1 + prog * 7);
      p.mesh.material.opacity = Math.max(0, 0.8 - prog);
      if (prog >= 1) {
        group.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        pulses.splice(i, 1);
      }
    }

    renderer.render(scene, camera);
  }

  animate();

})();
