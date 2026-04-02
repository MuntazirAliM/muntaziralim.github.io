/* ============================================================
   MUNTAZIR ALI MUGHAL — Portfolio
   js/parallax.js  ·  v2 — Dark Editorial Cinema

   Philosophy: slow, weighted, deliberate.
   Every section transition feels like turning a page in a
   luxury architecture or fashion editorial magazine.

   Techniques:
   ─ Cinematic page-load curtain (split reveal + gold flash)
   ─ Hero orchestrated entrance sequence (post-curtain)
   ─ Ambient idle float (ring + stat pills — never stops)
   ─ Editorial wipe reveals (blur + y-drift on scroll-in)
   ─ Section heading scrubbed drift (continues past viewport)
   ─ Project card 3D tilt on mouse move
   ─ Skill bar animated draw (sequenced per group)
   ─ Education items split reveal (date left / content right)
   ─ Gold rule draw-across on enter
   ─ Magnetic hover (buttons, nav, contact links)
   ─ Contact grand finale entrance
   ─ Nav hide-on-scroll-down / show-on-scroll-up
   ─ Active nav link gold highlight
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  gsap.registerPlugin(ScrollTrigger);

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  /* ── Easing palette ─────────────────────────────────────── */
  const ease = {
    out:    'power3.out',
    inOut:  'power3.inOut',
    expo:   'expo.out',
    slow:   'power1.inOut',
    spring: 'elastic.out(1, 0.75)',
  };


  /* ══════════════════════════════════════════════════════════
     1. CINEMATIC CURTAIN — split open + gold flash
  ══════════════════════════════════════════════════════════ */

  const curtain = document.createElement('div');
  curtain.id = 'curtain';
  Object.assign(curtain.style, {
    position:            'fixed',
    inset:               '0',
    zIndex:              '9000',
    display:             'grid',
    gridTemplateColumns: '1fr 1fr',
    pointerEvents:       'none',
  });

  const curtainL = document.createElement('div');
  const curtainR = document.createElement('div');
  [curtainL, curtainR].forEach(p => {
    Object.assign(p.style, { background: '#080808', height: '100%' });
  });
  curtain.appendChild(curtainL);
  curtain.appendChild(curtainR);
  document.body.appendChild(curtain);

  const flashLine = document.createElement('div');
  Object.assign(flashLine.style, {
    position:   'fixed',
    top:        '50%',
    left:       '0',
    width:      '0%',
    height:     '1px',
    background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)',
    zIndex:     '9001',
    transform:  'translateY(-50%)',
  });
  document.body.appendChild(flashLine);

  /* Hide hero content before curtain lifts */
  gsap.set([
    '.hero-tag', '.hero-name', '.hero-title',
    '.hero-desc', '.hero-ctas', '.hero-visual', '.stat-pill',
  ], { opacity: 0, y: 30 });
  gsap.set('.hero-visual', { scale: 0.88 });

  const curtainTL = gsap.timeline({
    onComplete: () => {
      curtain.remove();
      flashLine.remove();
      heroEntrance();
    }
  });

  curtainTL
    .to(flashLine, { width: '100%', duration: 0.6, ease: 'power2.inOut', delay: 0.2 })
    .to(flashLine, { opacity: 0, duration: 0.3 })
    .to([curtainL, curtainR], {
      xPercent: (i) => i === 0 ? -100 : 100,
      duration: 1.1,
      ease:     ease.expo,
      stagger:  0.05,
    }, '-=0.1');


  /* ══════════════════════════════════════════════════════════
     2. HERO ENTRANCE — orchestrated post-curtain
  ══════════════════════════════════════════════════════════ */

  function heroEntrance() {
    const tl = gsap.timeline({ defaults: { ease: ease.out } });

    tl.to('.hero-tag',   { opacity: 1, y: 0, duration: 0.8 })
      .to('.hero-name',  { opacity: 1, y: 0, duration: 1.1 }, '-=0.5')
      .to('.hero-title', { opacity: 1, y: 0, duration: 0.9 }, '-=0.7')
      .to('.hero-desc',  { opacity: 1, y: 0, duration: 0.9 }, '-=0.6')
      .to('.hero-ctas',  { opacity: 1, y: 0, duration: 0.8 }, '-=0.5')
      .to('.hero-visual',{
        opacity: 1, scale: 1,
        duration: 1.4, ease: ease.expo,
      }, '-=1.2')
      .to('.stat-pill', {
        opacity: 1, y: 0,
        duration: 0.7, stagger: 0.1,
      }, '-=0.6');
  }


  /* ══════════════════════════════════════════════════════════
     3. AMBIENT IDLE FLOAT — never stops
  ══════════════════════════════════════════════════════════ */

  gsap.to('.hero-visual-inner', {
    y: '-12px', duration: 3.5,
    ease: 'sine.inOut', repeat: -1, yoyo: true,
  });

  gsap.to('.hero-visual-ring', {
    y: '-6px', duration: 4.5,
    ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 0.5,
  });

  document.querySelectorAll('.stat-pill').forEach((pill, i) => {
    gsap.to(pill, {
      y:        `${-(6 + i * 3)}px`,
      duration: 3 + i * 0.6,
      ease:     'sine.inOut',
      repeat:   -1,
      yoyo:     true,
      delay:    i * 0.4,
    });
  });


  /* ══════════════════════════════════════════════════════════
     4. HERO SCROLL — DEPTH LAYERS
  ══════════════════════════════════════════════════════════ */

  const hT = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 2.5 };

  gsap.to('.hero-grid-lines',        { yPercent: -25,                    ease: 'none', scrollTrigger: hT });
  gsap.to('.hero-bg',                { yPercent: -45,                    ease: 'none', scrollTrigger: { ...hT, scrub: 3   } });
  gsap.to('.hero-name',              { y: -90,                           ease: 'none', scrollTrigger: { ...hT, scrub: 2   } });
  gsap.to('.hero-title, .hero-desc', { y: -60,                           ease: 'none', scrollTrigger: { ...hT, scrub: 2.5 } });
  gsap.to('.hero-tag',               { y: -40, opacity: 0,               ease: 'none', scrollTrigger: { ...hT, end: '40% top', scrub: 1.5 } });
  gsap.to('.hero-ctas',              { y: -30, opacity: 0,               ease: 'none', scrollTrigger: { ...hT, end: '35% top', scrub: 1.2 } });
  gsap.to('.hero-visual-ring',       { y: -130, rotate: 50,              ease: 'none', scrollTrigger: { ...hT, scrub: 0.9 } });
  gsap.to('.hero-visual-ring2',      { y: -80,  rotate: -35,             ease: 'none', scrollTrigger: { ...hT, scrub: 1.3 } });
  gsap.to('.hero-visual-inner',      { y: -40,                           ease: 'none', scrollTrigger: { ...hT, scrub: 2.2 } });

  document.querySelectorAll('.stat-pill').forEach((pill, i) => {
    gsap.to(pill, {
      y: -(60 + i * 15), ease: 'none',
      scrollTrigger: { ...hT, scrub: [0.7, 1.1, 0.9, 1.3][i] ?? 1 },
    });
  });


  /* ══════════════════════════════════════════════════════════
     5. EDITORIAL REVEAL HELPER
  ══════════════════════════════════════════════════════════ */

  function editorialReveal(selector, trigger, {
    stagger = 0.12, yFrom = 50, duration = 1.1,
    delay = 0, start = 'top 82%',
  } = {}) {
    gsap.fromTo(selector,
      { y: yFrom, opacity: 0, filter: 'blur(4px)' },
      {
        y: 0, opacity: 1, filter: 'blur(0px)',
        duration, stagger, delay, ease: ease.expo,
        scrollTrigger: { trigger, start, toggleActions: 'play none none reverse' },
      }
    );
  }


  /* ══════════════════════════════════════════════════════════
     6. SECTION TAGS & HEADINGS
  ══════════════════════════════════════════════════════════ */

  document.querySelectorAll('.section-tag').forEach(tag => {
    gsap.fromTo(tag,
      { x: -30, opacity: 0 },
      {
        x: 0, opacity: 1, duration: 0.9, ease: ease.expo,
        scrollTrigger: { trigger: tag, start: 'top 88%', toggleActions: 'play none none reverse' },
      }
    );
  });

  document.querySelectorAll('.section-heading').forEach(h => {
    gsap.fromTo(h,
      { y: 70, opacity: 0, filter: 'blur(6px)' },
      {
        y: 0, opacity: 1, filter: 'blur(0px)',
        duration: 1.3, ease: ease.expo,
        scrollTrigger: { trigger: h, start: 'top 85%', toggleActions: 'play none none reverse' },
      }
    );
    /* Continue drifting after reveal */
    gsap.to(h, {
      y: -25, ease: 'none',
      scrollTrigger: { trigger: h, start: 'top 50%', end: 'bottom top', scrub: 2.5 },
    });
  });


  /* ══════════════════════════════════════════════════════════
     7. ABOUT
  ══════════════════════════════════════════════════════════ */

  editorialReveal('.about-text p', '.about-text', { stagger: 0.14, yFrom: 40, duration: 1 });
  editorialReveal('.about-card',   '.about-right', { stagger: 0.16, yFrom: 50, duration: 1.1, delay: 0.1 });


  /* ══════════════════════════════════════════════════════════
     8. PROJECTS — staggered depth + 3D tilt
  ══════════════════════════════════════════════════════════ */

  gsap.fromTo('.project-card.featured',
    { y: 80, opacity: 0, filter: 'blur(8px)' },
    {
      y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.4, ease: ease.expo,
      scrollTrigger: { trigger: '.project-card.featured', start: 'top 85%', toggleActions: 'play none none reverse' },
    }
  );

  document.querySelectorAll('.project-card:not(.featured)').forEach((card, i) => {
    gsap.fromTo(card,
      { y: 70, opacity: 0, filter: 'blur(5px)' },
      {
        y: 0, opacity: 1, filter: 'blur(0px)',
        duration: 1.1, delay: i % 2 === 0 ? 0 : 0.15, ease: ease.expo,
        scrollTrigger: { trigger: card, start: 'top 88%', toggleActions: 'play none none reverse' },
      }
    );
    gsap.to(card, {
      y: -18, ease: 'none',
      scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: 1 + i * 0.2 },
    });
  });

  /* 3D tilt on mouse move */
  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const rX = ((e.clientY - r.top)  / r.height - 0.5) * -8;
      const rY = ((e.clientX - r.left) / r.width  - 0.5) *  8;
      gsap.to(card, { rotateX: rX, rotateY: rY, transformPerspective: 900, duration: 0.4, ease: 'power2.out' });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.8, ease: ease.spring });
    });
  });


  /* ══════════════════════════════════════════════════════════
     9. SKILLS — stagger columns + bar draw
  ══════════════════════════════════════════════════════════ */

  gsap.fromTo('.skill-group',
    { y: 60, opacity: 0 },
    {
      y: 0, opacity: 1, duration: 1, stagger: 0.18, ease: ease.expo,
      scrollTrigger: { trigger: '.skills-grid', start: 'top 82%', toggleActions: 'play none none reverse' },
    }
  );

  document.querySelectorAll('.skill-group').forEach(group => {
    ScrollTrigger.create({
      trigger: group,
      start: 'top 78%',
      onEnter: () => {
        group.querySelectorAll('.skill-fill').forEach((fill, i) => {
          gsap.to(fill, {
            scaleX: parseFloat(fill.dataset.width),
            duration: 1.2, delay: i * 0.08, ease: ease.expo,
          });
        });
      }
    });
  });


  /* ══════════════════════════════════════════════════════════
     10. EDUCATION — date left / content right
  ══════════════════════════════════════════════════════════ */

  document.querySelectorAll('.edu-item').forEach(item => {
    const date    = item.querySelector('.edu-date');
    const content = item.querySelector('.edu-content');

    if (date) {
      gsap.fromTo(date,
        { x: -40, opacity: 0 },
        {
          x: 0, opacity: 1, duration: 0.9, ease: ease.expo,
          scrollTrigger: { trigger: item, start: 'top 85%', toggleActions: 'play none none reverse' },
        }
      );
    }

    if (content) {
      gsap.fromTo(content,
        { y: 30, opacity: 0, filter: 'blur(4px)' },
        {
          y: 0, opacity: 1, filter: 'blur(0px)',
          duration: 1, delay: 0.1, ease: ease.expo,
          scrollTrigger: { trigger: item, start: 'top 85%', toggleActions: 'play none none reverse' },
        }
      );
    }
  });


  /* ══════════════════════════════════════════════════════════
     11. GOLD RULE — draw across viewport
  ══════════════════════════════════════════════════════════ */

  document.querySelectorAll('.gold-rule').forEach(rule => {
    gsap.fromTo(rule,
      { scaleX: 0, transformOrigin: 'center center', opacity: 0.4 },
      {
        scaleX: 1, opacity: 1, duration: 1.6, ease: ease.inOut,
        scrollTrigger: { trigger: rule, start: 'top 92%', toggleActions: 'play none none none' },
      }
    );
  });


  /* ══════════════════════════════════════════════════════════
     12. CONTACT — grand finale
  ══════════════════════════════════════════════════════════ */

  gsap.fromTo('.contact-label',
    { opacity: 0, letterSpacing: '0.6em' },
    {
      opacity: 1, letterSpacing: '0.4em', duration: 1.2, ease: ease.out,
      scrollTrigger: { trigger: '#contact', start: 'top 80%', toggleActions: 'play none none reverse' },
    }
  );

  gsap.fromTo('.contact-heading',
    { y: 60, opacity: 0, filter: 'blur(8px)', scale: 0.95 },
    {
      y: 0, opacity: 1, filter: 'blur(0px)', scale: 1,
      duration: 1.4, ease: ease.expo,
      scrollTrigger: { trigger: '.contact-heading', start: 'top 82%', toggleActions: 'play none none reverse' },
    }
  );

  gsap.fromTo('.contact-sub',
    { y: 30, opacity: 0 },
    {
      y: 0, opacity: 1, duration: 1, delay: 0.2, ease: ease.expo,
      scrollTrigger: { trigger: '.contact-sub', start: 'top 85%', toggleActions: 'play none none reverse' },
    }
  );

  gsap.fromTo('.contact-link',
    { y: 20, opacity: 0 },
    {
      y: 0, opacity: 1, duration: 0.8, stagger: 0.1, delay: 0.1, ease: ease.expo,
      scrollTrigger: { trigger: '.contact-links', start: 'top 88%', toggleActions: 'play none none reverse' },
    }
  );


  /* ══════════════════════════════════════════════════════════
     13. MAGNETIC HOVER — buttons, nav, contact links
  ══════════════════════════════════════════════════════════ */

  function addMagnetic(selector, strength = 0.3) {
    document.querySelectorAll(selector).forEach(el => {
      el.addEventListener('mousemove', e => {
        const r  = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width  / 2)) * strength;
        const dy = (e.clientY - (r.top  + r.height / 2)) * strength;
        gsap.to(el, { x: dx, y: dy, duration: 0.4, ease: 'power2.out' });
      });
      el.addEventListener('mouseleave', () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: ease.spring });
      });
    });
  }

  addMagnetic('.btn-primary',  0.3);
  addMagnetic('.btn-ghost',    0.25);
  addMagnetic('.contact-link', 0.25);
  addMagnetic('.nav-links a',  0.2);


  /* ══════════════════════════════════════════════════════════
     14. NAV — hide on scroll down, show on scroll up
         + active link gold highlight
  ══════════════════════════════════════════════════════════ */

  let lastScroll = 0;
  const nav = document.querySelector('nav');

  window.addEventListener('scroll', () => {
    const current = window.scrollY;
    if (current > lastScroll && current > 120) {
      gsap.to(nav, { y: -80, duration: 0.4, ease: ease.out });
    } else {
      gsap.to(nav, { y:   0, duration: 0.5, ease: ease.out });
    }
    lastScroll = current;
  }, { passive: true });

  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  ScrollTrigger.create({
    trigger: document.body,
    start: 'top top', end: 'bottom bottom',
    onUpdate: () => {
      sections.forEach(section => {
        const { top, bottom } = section.getBoundingClientRect();
        if (top <= 120 && bottom >= 120) {
          navLinks.forEach(link => {
            link.style.color = link.getAttribute('href') === `#${section.id}`
              ? 'var(--gold)'
              : '';
          });
        }
      });
    }
  });


  /* ══════════════════════════════════════════════════════════
     15. FOOTER
  ══════════════════════════════════════════════════════════ */

  gsap.fromTo('footer',
    { y: 30, opacity: 0 },
    {
      y: 0, opacity: 1, duration: 1, ease: ease.expo,
      scrollTrigger: { trigger: 'footer', start: 'top 95%', toggleActions: 'play none none reverse' },
    }
  );

});
