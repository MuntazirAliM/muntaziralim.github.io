/* ============================================================
   js/main.js  v5
   Scroll beats drive:
     - neural mesh X position (right / left / centre)
     - panel visibility (fade in/out)
     - project card orbit animation
     - skill tag orbit animation
     - curtain open
     - cursor, nav, progress bar, magnetic hover
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  if (typeof gsap === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);


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
     Only one panel is visible at a time.
     showPanel() fades out old, fades in new.
  ══════════════════════════════════════════════════════════ */
  /* Force all panels invisible on init */
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

    /* Hard-hide all other panels instantly */
    document.querySelectorAll('.panel').forEach(p => {
      if (p !== panel) {
        gsap.killTweensOf(p);
        gsap.set(p, { opacity: 0 });
        p.classList.remove('active');
        p.style.pointerEvents = 'none';
      }
    });

    /* Fade in target */
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
     MESH POSITION SHORTCUTS
  ══════════════════════════════════════════════════════════ */
  const RIGHT   = { x:  2.4, y: 0, opacity: 1 };
  const LEFT    = { x: -2.4, y: 0, opacity: 1 };
  const CENTRE  = { x:  0,   y: 0, opacity: 1 };
  const GONE    = { x:  0,   y: 0, opacity: 0 };

  function moveMesh(pos) {
    if (!window.neuralTarget) return;
    Object.assign(window.neuralTarget, pos);
  }


  /* ══════════════════════════════════════════════════════════
     BEAT MAP — calculate which beat is active from scrollY
     This avoids all enter/leave timing issues.
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
    /* Mesh position */
    moveMesh(beat.mesh);

    /* Stop all orbits first */
    stopCardOrbit();
    stopSkillOrbit();

    /* Show correct panel */
    BEATS.forEach(b => {
      if (b.id !== beat.id) hidePanel(b.id);
    });
    showPanel(beat.id, { fromBelow: true });

    /* Start orbits if needed */
    if (beat.id === 'projects') setTimeout(startCardOrbit, 400);
    if (beat.id === 'skills')   setTimeout(startSkillOrbit, 400);
  }

  function checkBeat() {
    const beat = getActiveBeat();
    if (!beat) return;
    if (!activeBeat || activeBeat.id !== beat.id) {
      activeBeat = beat;
      onBeatChange(beat);
    }
  }

  /* Run on scroll and on load */
  window.addEventListener('scroll', checkBeat, { passive: true });
  /* Delay initial check so neural.js has time to init */
  setTimeout(checkBeat, 300);


  /* ══════════════════════════════════════════════════════════
     PROJECT CARD ORBIT
     4 cards placed at 90° intervals around the mesh centre.
     They slowly rotate around it.
  ══════════════════════════════════════════════════════════ */
  let cardOrbitRAF = null;
  let cardAngle    = 0;

  /* Ellipse slightly larger than mesh so cards don't overlap it */
  const CARD_RX = 330;
  const CARD_RY = 185;
  const CARDS = [0, 1, 2, 3].map(i => document.getElementById(`card-${i}`));
  const CARD_W = 240;
  const CARD_H = 160; /* approx half-height */

  function positionCards(angle) {
    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight / 2;
    CARDS.forEach((card, i) => {
      if (!card) return;
      const a = angle + (i / 4) * Math.PI * 2;
      const x = cx + Math.cos(a) * CARD_RX - CARD_W / 2;
      const y = cy + Math.sin(a) * CARD_RY - CARD_H / 2;
      card.style.left = `${x}px`;
      card.style.top  = `${y}px`;
    });
  }

  function startCardOrbit() {
    gsap.to(CARDS, { opacity: 1, duration: 0.7, stagger: 0.14, ease: 'expo.out' });
    gsap.to('.projects-label', { opacity: 1, duration: 0.6, delay: 0.5, ease: 'expo.out' });
    positionCards(cardAngle);
    function loop() {
      cardAngle += 0.0025; /* slightly slower — more cinematic */
      positionCards(cardAngle);
      cardOrbitRAF = requestAnimationFrame(loop);
    }
    if (cardOrbitRAF) cancelAnimationFrame(cardOrbitRAF);
    cardOrbitRAF = requestAnimationFrame(loop);
  }

  function stopCardOrbit() {
    if (cardOrbitRAF) { cancelAnimationFrame(cardOrbitRAF); cardOrbitRAF = null; }
    gsap.to(CARDS, { opacity: 0, duration: 0.35, ease: 'power2.in' });
    gsap.to('.projects-label', { opacity: 0, duration: 0.3 });
  }


  /* ══════════════════════════════════════════════════════════
     SKILL TAG ORBIT
     12 skill tags placed around the mesh at varying radii.
     Two rings — inner and outer — rotating in opposite directions.
  ══════════════════════════════════════════════════════════ */
  let skillOrbitRAF = null;
  let skillAngle    = 0;

  const SKILL_TAGS = Array.from(document.querySelectorAll('.skill-tag'));
  const INNER = [0, 2, 4, 6, 8, 10];
  const OUTER = [1, 3, 5, 7, 9, 11];
  const IR = { x: 260, y: 140 }; /* inner ring radii */
  const OR = { x: 370, y: 195 }; /* outer ring radii */

  function positionSkills(angle) {
    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight / 2;

    INNER.forEach((tagIdx, i) => {
      const tag = SKILL_TAGS[tagIdx];
      if (!tag) return;
      const a = angle + (i / INNER.length) * Math.PI * 2;
      /* Offset so tag centre lands on orbit point */
      tag.style.left = `${cx + Math.cos(a) * IR.x - 40}px`;
      tag.style.top  = `${cy + Math.sin(a) * IR.y - 15}px`;
    });

    OUTER.forEach((tagIdx, i) => {
      const tag = SKILL_TAGS[tagIdx];
      if (!tag) return;
      const a = -angle + (i / OUTER.length) * Math.PI * 2;
      tag.style.left = `${cx + Math.cos(a) * OR.x - 40}px`;
      tag.style.top  = `${cy + Math.sin(a) * OR.y - 15}px`;
    });
  }

  function startSkillOrbit() {
    gsap.to(SKILL_TAGS, { opacity: 1, duration: 0.5, stagger: 0.05, ease: 'expo.out' });
    gsap.to('.skills-label', { opacity: 1, duration: 0.6, delay: 0.3, ease: 'expo.out' });
    positionSkills(skillAngle);
    function loop() {
      skillAngle += 0.0035;
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
     CURSOR
  ══════════════════════════════════════════════════════════ */
  const cursor = document.getElementById('cursor');
  const ring   = document.getElementById('cursorRing');
  let mx = 0, my = 0, rx = 0, ry = 0;

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


  /* ══════════════════════════════════════════════════════════
     NAV HIDE/SHOW + PROGRESS
  ══════════════════════════════════════════════════════════ */
  const nav = document.getElementById('nav');
  let lastY = 0;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (nav) {
      if (y > lastY && y > 80) nav.classList.add('hidden');
      else nav.classList.remove('hidden');
    }
    const bar = document.getElementById('progressBar');
    const max = document.body.scrollHeight - window.innerHeight;
    if (bar && max > 0) bar.style.width = `${(y / max) * 100}%`;
    lastY = y;
  }, { passive: true });


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
     MAGNETIC HOVER
  ══════════════════════════════════════════════════════════ */
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

});
