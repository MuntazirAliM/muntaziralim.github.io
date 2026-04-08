/* ============================================================
   js/main.js  v6
   Improvements over v5:
     - Mobile hamburger nav
     - 15 skill tags (was 12)
     - Mobile: hides orbit, shows static stacks
     - Verified stat numbers
     - defer-safe init (DOMContentLoaded already fires before defer scripts run)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  const isMobile = () => window.innerWidth <= 640;

  /* ── GSAP guard ── */
  if (typeof gsap === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);


  /* ══════════════════════════════════════════════════════════
     MOBILE NAV
  ══════════════════════════════════════════════════════════ */
  const burger    = document.getElementById('navBurger');
  const mobileNav = document.getElementById('mobileNav');

  if (burger && mobileNav) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('open');
      mobileNav.classList.toggle('open');
    });
    document.querySelectorAll('.mnav-link').forEach(a => {
      a.addEventListener('click', () => {
        burger.classList.remove('open');
        mobileNav.classList.remove('open');
      });
    });
  }


  /* ══════════════════════════════════════════════════════════
     CURTAIN
  ══════════════════════════════════════════════════════════ */
  const curtain = document.createElement('div');
  Object.assign(curtain.style, {
    position: 'fixed', inset: '0', zIndex: '9500',
    display: 'grid', gridTemplateColumns: '1fr 1fr', pointerEvents: 'none',
  });
  const cL = document.createElement('div');
  const cR = document.createElement('div');
  [cL, cR].forEach(p => Object.assign(p.style, { background: '#070707', height: '100%' }));
  curtain.append(cL, cR);
  document.body.appendChild(curtain);

  const flash = document.createElement('div');
  Object.assign(flash.style, {
    position: 'fixed', top: '50%', left: '0', width: '0%', height: '1px',
    background: 'linear-gradient(90deg,transparent,#c9a84c,transparent)',
    zIndex: '9501', transform: 'translateY(-50%)',
  });
  document.body.appendChild(flash);

  gsap.timeline({ onComplete: () => { curtain.remove(); flash.remove(); showPanel('hero'); } })
    .to(flash, { width: '100%', duration: 0.5, ease: 'power2.inOut', delay: 0.1 })
    .to(flash, { opacity: 0, duration: 0.2 })
    .to([cL, cR], { xPercent: i => i === 0 ? -100 : 100, duration: 0.95, ease: 'expo.out', stagger: 0.04 }, '-=0.1');


  /* ══════════════════════════════════════════════════════════
     PANEL SYSTEM
  ══════════════════════════════════════════════════════════ */
  document.querySelectorAll('.panel').forEach(p => {
    p.style.opacity = '0';
    p.style.pointerEvents = 'none';
    p.classList.remove('active');
  });

  let currentPanel = null;

  function showPanel(name, opts = {}) {
    const panel = document.getElementById(`panel-${name}`);
    if (!panel) return;
    if (currentPanel === panel) return;

    document.querySelectorAll('.panel').forEach(p => {
      if (p !== panel) {
        gsap.killTweensOf(p);
        gsap.set(p, { opacity: 0 });
        p.classList.remove('active');
        p.style.pointerEvents = 'none';
      }
    });

    const fromY = opts.fromBelow ? 24 : -24;
    panel.classList.add('active');
    panel.style.pointerEvents = 'auto';
    gsap.killTweensOf(panel);
    gsap.fromTo(panel,
      { opacity: 0, y: fromY },
      { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', delay: opts.delay || 0 }
    );
    currentPanel = panel;
  }

  function hidePanel(name) {
    const panel = document.getElementById(`panel-${name}`);
    if (!panel) return;
    gsap.killTweensOf(panel);
    gsap.set(panel, { opacity: 0 });
    panel.classList.remove('active');
    panel.style.pointerEvents = 'none';
    if (currentPanel === panel) currentPanel = null;
  }


  /* ══════════════════════════════════════════════════════════
     MESH POSITIONS
  ══════════════════════════════════════════════════════════ */
  const RIGHT  = { x:  2.4, y: 0, opacity: 1 };
  const LEFT   = { x: -2.4, y: 0, opacity: 1 };
  const CENTRE = { x:  0,   y: 0, opacity: 1 };
  const GONE   = { x:  0,   y: 0, opacity: 0 };

  function moveMesh(pos) {
    if (!window.neuralTarget) return;
    Object.assign(window.neuralTarget, pos);
  }


  /* ══════════════════════════════════════════════════════════
     BEAT MAP
  ══════════════════════════════════════════════════════════ */
  const BEATS = [
    { id: 'hero',      mesh: RIGHT  },
    { id: 'about',     mesh: LEFT   },
    { id: 'projects',  mesh: CENTRE },
    { id: 'skills',    mesh: CENTRE },
    { id: 'education', mesh: RIGHT  },
    { id: 'contact',   mesh: GONE   },
  ];

  let activeBeat = null;

  function getActiveBeat() {
    const scrollMid = window.scrollY + window.innerHeight * 0.4;
    let active = null;
    BEATS.forEach(b => {
      const el = document.getElementById(`pin-${b.id}`);
      if (!el) return;
      const top = el.offsetTop;
      const bot = top + el.offsetHeight;
      if (scrollMid >= top && scrollMid < bot) active = b;
    });
    return active;
  }

  function onBeatChange(beat) {
    moveMesh(beat.mesh);
    stopCardOrbit();
    stopSkillOrbit();
    BEATS.forEach(b => { if (b.id !== beat.id) hidePanel(b.id); });
    showPanel(beat.id, { fromBelow: true });
    if (beat.id === 'projects' && !isMobile()) setTimeout(startCardOrbit, 400);
    if (beat.id === 'skills'   && !isMobile()) setTimeout(startSkillOrbit, 400);
  }

  function checkBeat() {
    const beat = getActiveBeat();
    if (!beat) return;
    if (!activeBeat || activeBeat.id !== beat.id) {
      activeBeat = beat;
      onBeatChange(beat);
    }
  }

  window.addEventListener('scroll', checkBeat, { passive: true });

  /* Reposition cards/skills on resize */
  window.addEventListener('resize', () => {
    if (activeBeat && activeBeat.id === 'projects' && cardOrbitRAF) positionCards(cardAngle);
    if (activeBeat && activeBeat.id === 'skills'   && skillOrbitRAF) positionSkills(skillAngle);
  }, { passive: true });
  setTimeout(checkBeat, 300);


  /* ══════════════════════════════════════════════════════════
     PROJECT CARD ORBIT  — v3
     
     Root problem: the Three.js mesh is NOT at viewport centre.
     When on the "projects" beat, neuralTarget.x = 0 (centre),
     but the group lerps to 0 from +2.4. We project the 3D
     group position into screen space each frame so the orbit
     ellipse always tracks the actual rendered mesh centre.
  ══════════════════════════════════════════════════════════ */
  let cardOrbitRAF = null;
  let cardAngle    = Math.PI / 4; /* start at 45° — top-right quadrant */
  let orbitPaused  = false;       /* pauses on any card hover */

  const CARDS  = [0, 1, 2, 3].map(i => document.getElementById(`card-${i}`));
  const CARD_W = 252;

  /* ── Project the Three.js mesh centre into screen px ── */
  function getMeshScreenCentre() {
    try {
      /* neural.js exposes the group via window.neuralGroup */
      const grp = window.neuralGroup;
      const cam = window.neuralCamera;
      if (!grp || !cam) throw new Error('no ref');

      const v = new THREE.Vector3();
      grp.getWorldPosition(v);
      v.project(cam);

      /* NDC → px */
      return {
        x: (v.x  + 1) / 2 * window.innerWidth,
        y: (-v.y + 1) / 2 * window.innerHeight,
      };
    } catch (_) {
      /* Fallback: viewport centre (mesh is centred on projects beat) */
      return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    }
  }

  /* ── Orbit sizing: generous ellipse that always clears the mesh ── */
  function getOrbitSize() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    /* Mesh sphere radius in Three.js units = 1.65, camera z = 5.2, fov = 50°
       Approximate projected radius in px ≈ 285px on a 1440px wide screen.
       We add 60px clearance. */
    const baseRx = Math.min(vw * 0.285, 340);
    const baseRy = Math.min(vh * 0.310, 250);
    return { rx: baseRx, ry: baseRy };
  }

  function positionCards(angle) {
    const { x: cx, y: cy } = getMeshScreenCentre();
    const { rx, ry }        = getOrbitSize();

    CARDS.forEach((card, i) => {
      if (!card) return;
      const a  = angle + (i / CARDS.length) * Math.PI * 2;
      const ch = card.offsetHeight || 200;

      /* Point on ellipse */
      const px = cx + Math.cos(a) * rx;
      const py = cy + Math.sin(a) * ry;

      /* Depth cue: cards at back (sin(a) < 0 → top of ellipse) shrink + dim */
      const depth     = (Math.sin(a) + 1) / 2;    /* 0 = back, 1 = front */
      const scaleFactor = 0.82 + depth * 0.18;     /* 0.82 → 1.00 */
      const opacity     = 0.55 + depth * 0.45;     /* 0.55 → 1.00 */
      const zIndex      = Math.round(depth * 10);

      /* Position card centre on the ellipse point */
      card.style.left      = `${px - (CARD_W * scaleFactor) / 2}px`;
      card.style.top       = `${py - (ch  * scaleFactor) / 2}px`;
      card.style.transform = `scale(${scaleFactor.toFixed(3)})`;
      card.style.opacity   = opacity.toFixed(3);
      card.style.zIndex    = zIndex;
    });
  }

  /* Pause orbit on card hover */
  CARDS.forEach(card => {
    if (!card) return;
    card.addEventListener('mouseenter', () => { orbitPaused = true; });
    card.addEventListener('mouseleave', () => { orbitPaused = false; });
  });

  function startCardOrbit() {
    if (isMobile()) return;
    /* Set initial position before fade-in so cards don't flash at 0,0 */
    positionCards(cardAngle);
    gsap.to(CARDS, { opacity: 1, duration: 0.7, stagger: 0.14, ease: 'expo.out',
      overwrite: true,
      onUpdate: function() {
        /* Let positionCards control opacity after fade-in completes */
      }
    });
    gsap.to('.projects-label', { opacity: 1, duration: 0.6, delay: 0.5, ease: 'expo.out' });

    function loop() {
      if (!orbitPaused) cardAngle += 0.0018; /* slower = more premium feel */
      positionCards(cardAngle);
      cardOrbitRAF = requestAnimationFrame(loop);
    }
    if (cardOrbitRAF) cancelAnimationFrame(cardOrbitRAF);
    cardOrbitRAF = requestAnimationFrame(loop);
  }

  function stopCardOrbit() {
    if (cardOrbitRAF) { cancelAnimationFrame(cardOrbitRAF); cardOrbitRAF = null; }
    CARDS.forEach(card => {
      if (card) gsap.to(card, { opacity: 0, duration: 0.3, ease: 'power2.in', overwrite: true });
    });
    gsap.to('.projects-label', { opacity: 0, duration: 0.3 });
  }


  /* ══════════════════════════════════════════════════════════
     SKILL TAG ORBIT  — 15 tags, 3 rings
  ══════════════════════════════════════════════════════════ */
  let skillOrbitRAF = null;
  let skillAngle    = 0;

  const SKILL_TAGS = Array.from(document.querySelectorAll('.skill-tag'));
  const INNER  = [0, 3, 6, 9, 12];
  const MIDDLE = [1, 4, 7, 10, 13];
  const OUTER  = [2, 5, 8, 11, 14];
  const IR = { x: 230, y: 125 };
  const MR = { x: 315, y: 165 };
  const OR = { x: 400, y: 210 };

  function positionSkills(angle) {
    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight / 2;

    INNER.forEach((tagIdx, i) => {
      const tag = SKILL_TAGS[tagIdx];
      if (!tag) return;
      const a = angle + (i / INNER.length) * Math.PI * 2;
      tag.style.left = `${cx + Math.cos(a) * IR.x - 44}px`;
      tag.style.top  = `${cy + Math.sin(a) * IR.y - 15}px`;
    });
    MIDDLE.forEach((tagIdx, i) => {
      const tag = SKILL_TAGS[tagIdx];
      if (!tag) return;
      const a = -angle * 0.7 + (i / MIDDLE.length) * Math.PI * 2;
      tag.style.left = `${cx + Math.cos(a) * MR.x - 44}px`;
      tag.style.top  = `${cy + Math.sin(a) * MR.y - 15}px`;
    });
    OUTER.forEach((tagIdx, i) => {
      const tag = SKILL_TAGS[tagIdx];
      if (!tag) return;
      const a = angle * 0.5 + (i / OUTER.length) * Math.PI * 2;
      tag.style.left = `${cx + Math.cos(a) * OR.x - 44}px`;
      tag.style.top  = `${cy + Math.sin(a) * OR.y - 15}px`;
    });
  }

  function startSkillOrbit() {
    if (isMobile()) return;
    gsap.to(SKILL_TAGS, { opacity: 1, duration: 0.5, stagger: 0.04, ease: 'expo.out' });
    gsap.to('.skills-label', { opacity: 1, duration: 0.6, delay: 0.3, ease: 'expo.out' });
    positionSkills(skillAngle);
    function loop() {
      skillAngle += 0.003;
      positionSkills(skillAngle);
      skillOrbitRAF = requestAnimationFrame(loop);
    }
    if (skillOrbitRAF) cancelAnimationFrame(skillOrbitRAF);
    skillOrbitRAF = requestAnimationFrame(loop);
  }

  function stopSkillOrbit() {
    if (skillOrbitRAF) { cancelAnimationFrame(skillOrbitRAF); skillOrbitRAF = null; }
    gsap.to(SKILL_TAGS, { opacity: 0, duration: 0.3, ease: 'power2.in' });
    gsap.to('.skills-label', { opacity: 0, duration: 0.3 });
  }


  /* ══════════════════════════════════════════════════════════
     CURSOR (desktop only)
  ══════════════════════════════════════════════════════════ */
  const cursor = document.getElementById('cursor');
  const ring   = document.getElementById('cursorRing');
  let mx = 0, my = 0, rx = 0, ry = 0;

  if (window.matchMedia('(hover: hover)').matches) {
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

    (function loop() {
      rx += (mx - rx) * 0.14; ry += (my - ry) * 0.14;
      if (cursor) cursor.style.transform = `translate(${mx-3.5}px,${my-3.5}px)`;
      if (ring)   ring.style.transform   = `translate(${rx-14}px,${ry-14}px)`;
      requestAnimationFrame(loop);
    })();

    document.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('mouseenter', () => ring && ring.classList.add('hover'));
      el.addEventListener('mouseleave', () => ring && ring.classList.remove('hover'));
    });
  }


  /* ══════════════════════════════════════════════════════════
     NAV HIDE/SHOW + PROGRESS BAR
  ══════════════════════════════════════════════════════════ */
  const nav = document.getElementById('nav');
  let lastY = 0;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (nav) {
      if (y > lastY && y > 80) nav.classList.add('hidden');
      else nav.classList.remove('hidden');
      nav.classList.toggle('scrolled', y > 40);
    }
    const bar = document.getElementById('progressBar');
    const max = document.body.scrollHeight - window.innerHeight;
    if (bar && max > 0) bar.style.width = `${(y / max) * 100}%`;
    lastY = y;
  }, { passive: true });

  /* Cursor click state */
  if (window.matchMedia('(hover: hover)').matches && ring) {
    document.addEventListener('mousedown', () => ring.classList.add('clicking'));
    document.addEventListener('mouseup',   () => ring.classList.remove('clicking'));
  }


  /* ══════════════════════════════════════════════════════════
     ACTIVE NAV LINK
  ══════════════════════════════════════════════════════════ */
  const beats    = document.querySelectorAll('.beat[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  ScrollTrigger.create({
    trigger: document.body, start: 'top top', end: 'bottom bottom',
    onUpdate: () => {
      beats.forEach(beat => {
        const { top, bottom } = beat.getBoundingClientRect();
        if (top <= window.innerHeight * 0.5 && bottom >= window.innerHeight * 0.5) {
          navLinks.forEach(a => {
            a.classList.toggle('active', a.getAttribute('href') === `#${beat.id}`);
          });
        }
      });
    }
  });


  /* ══════════════════════════════════════════════════════════
     MAGNETIC HOVER (desktop only)
  ══════════════════════════════════════════════════════════ */
  if (window.matchMedia('(hover: hover)').matches) {
    function magnetic(sel, str) {
      document.querySelectorAll(sel).forEach(el => {
        el.addEventListener('mousemove', e => {
          const r  = el.getBoundingClientRect();
          const dx = (e.clientX - (r.left + r.width  / 2)) * str;
          const dy = (e.clientY - (r.top  + r.height / 2)) * str;
          gsap.to(el, { x: dx, y: dy, duration: 0.35, ease: 'power2.out' });
        });
        el.addEventListener('mouseleave', () => {
          gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1,0.7)' });
        });
      });
    }

    magnetic('.btn-primary',  0.28);
    magnetic('.btn-ghost',    0.22);
    magnetic('.contact-link', 0.22);
    magnetic('.nav-links a',  0.18);
  }

});