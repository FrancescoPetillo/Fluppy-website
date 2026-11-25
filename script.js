/* =========================================================
   FLUPPY — interactions
   ========================================================= */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- footer year ---------- */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- mobile menu ---------- */
  const menuButton = $('.menu-toggle');
  const navLinks = $('.nav-links');
  const closeMenu = () => {
    navLinks.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  };
  menuButton.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
  $$('a', navLinks).forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('click', e => {
    if (!e.target.closest('.nav')) closeMenu();
  });

  /* ---------- scroll progress / nav state / to-top ---------- */
  const progress = $('.scroll-progress i');
  const navWrap = $('.nav-wrap');
  const toTop = $('.to-top');
  const onScroll = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const p = max > 0 ? h.scrollTop / max : 0;
    progress.style.transform = `scaleX(${p})`;
    navWrap.classList.toggle('scrolled', h.scrollTop > 40);
    toTop.classList.toggle('show', h.scrollTop > 700);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- active section in nav ---------- */
  const sections = $$('main section[id]');
  const linkFor = id => $(`.nav-links a[href="#${id}"]`);
  if ('IntersectionObserver' in window) {
    const navObs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        $$('.nav-links a').forEach(a => a.classList.remove('active'));
        const link = linkFor(en.target.id);
        if (link) link.classList.add('active');
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(s => navObs.observe(s));
  }

  /* ---------- reveal on scroll ---------- */
  const revealEls = $$('.reveal-up, .reveal-scale, .stagger, .roadmap-grid, .ocr-app-card');
  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('in'));
  } else {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        obs.unobserve(en.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(el => obs.observe(el));
  }

  /* ---------- settings toggles animate in ---------- */
  const settings = $('.settings-card');
  if (settings) {
    const toggles = $$('.toggle[data-on]', settings);
    const fire = () => toggles.forEach((t, i) => setTimeout(() => t.classList.add('on'), 500 + i * 260));
    if (reduce || !('IntersectionObserver' in window)) toggles.forEach(t => t.classList.add('on'));
    else {
      const o = new IntersectionObserver(en => {
        if (en[0].isIntersecting) { fire(); o.disconnect(); }
      }, { threshold: 0.4 });
      o.observe(settings);
    }
    $$('.toggle', settings).forEach(t => t.addEventListener('click', () => t.classList.toggle('on')));
  }

  /* ---------- typewriter in OCR bubble ---------- */
  const tw = $('.typewriter');
  if (tw) {
    const text = tw.dataset.text || '';
    if (reduce) { tw.textContent = text; tw.classList.add('done'); }
    else {
      const start = () => {
        let i = 0;
        const step = () => {
          tw.textContent = text.slice(0, ++i);
          if (i < text.length) setTimeout(step, 28 + Math.random() * 40);
          else tw.classList.add('done');
        };
        setTimeout(step, 1400);
      };
      if ('IntersectionObserver' in window) {
        const o = new IntersectionObserver(en => {
          if (en[0].isIntersecting) { start(); o.disconnect(); }
        }, { threshold: 0.3 });
        o.observe(tw);
      } else start();
    }
  }

  /* ---------- manifesto: words light up with scroll ---------- */
  $$('[data-scroll-words]').forEach(el => {
    const wrap = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part.trim()) { frag.append(part); return; }
            const s = document.createElement('span');
            s.className = 'sw'; s.textContent = part; frag.append(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) wrap(n);
      });
    };
    wrap(el);
    const words = $$('.sw', el);
    if (reduce) { words.forEach(w => w.classList.add('on')); return; }
    const update = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.88 - r.top) / (r.height + vh * 0.38)));
      const lit = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('on', i < lit));
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  });

  /* ---------- profile switcher ---------- */
  const sw = $('.switcher');
  if (sw) {
    const tabs = $$('.switch-tab', sw);
    const panels = $$('.switch-panel', sw);
    let idx = 0, timer = null, touched = false;
    const show = i => {
      idx = i;
      tabs.forEach((t, j) => { t.classList.toggle('active', j === i); t.setAttribute('aria-selected', String(j === i)); });
      panels.forEach((p, j) => p.classList.toggle('active', j === i));
      sw.dataset.profile = tabs[i].dataset.profile;
    };
    const stop = () => { clearInterval(timer); timer = null; };
    tabs.forEach((t, i) => t.addEventListener('click', () => { touched = true; stop(); show(i); }));
    if (!reduce && 'IntersectionObserver' in window) {
      new IntersectionObserver(en => {
        if (en[0].isIntersecting && !touched) { if (!timer) timer = setInterval(() => show((idx + 1) % tabs.length), 5200); }
        else stop();
      }, { threshold: 0.45 }).observe(sw);
    }
  }

  if (reduce || !finePointer) return; // everything below is pointer-driven eye candy

  document.body.classList.add('has-pointer');

  /* ---------- cursor glow ---------- */
  const glow = $('.cursor-glow');
  let gx = window.innerWidth / 2, gy = window.innerHeight / 2, tx = gx, ty = gy;
  window.addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
  const glowLoop = () => {
    gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
    glow.style.transform = `translate(${gx}px, ${gy}px)`;
    requestAnimationFrame(glowLoop);
  };
  glowLoop();

  /* ---------- parallax stages (mouse-driven depth) ---------- */
  $$('[data-parallax-stage]').forEach(stage => {
    const items = $$('[data-depth]', stage);
    if (!items.length) return;
    let rx = 0, ry = 0, cx = 0, cy = 0, raf = null;
    const render = () => {
      cx += (rx - cx) * 0.08; cy += (ry - cy) * 0.08;
      items.forEach(it => {
        const d = parseFloat(it.dataset.depth) || 0.5;
        it.style.translate = `${cx * 28 * d}px ${cy * 22 * d}px`;
      });
      if (Math.abs(rx - cx) > 0.001 || Math.abs(ry - cy) > 0.001) raf = requestAnimationFrame(render);
      else raf = null;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(render); };
    stage.addEventListener('pointermove', e => {
      const r = stage.getBoundingClientRect();
      rx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ry = ((e.clientY - r.top) / r.height - 0.5) * 2;
      kick();
    });
    stage.addEventListener('pointerleave', () => { rx = 0; ry = 0; kick(); });
  });

  /* ---------- 3D tilt cards ---------- */
  $$('.tilt-card').forEach(card => {
    const max = parseFloat(card.dataset.tiltMax) || 7;
    let raf = null, nx = 0, ny = 0;
    const apply = () => {
      card.style.transform = `perspective(1100px) rotateX(${-ny * max}deg) rotateY(${nx * max}deg) translateY(-4px)`;
      raf = null;
    };
    card.addEventListener('pointerenter', () => card.classList.add('tilting'));
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(apply);
    });
    card.addEventListener('pointerleave', () => {
      card.classList.remove('tilting');
      card.style.transform = '';
    });
  });

  /* ---------- magnetic buttons ---------- */
  $$('.magnetic').forEach(btn => {
    btn.addEventListener('pointermove', e => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.25;
      const y = (e.clientY - r.top - r.height / 2) * 0.35;
      btn.style.transform = `translate(${x}px, ${y}px)`;
    });
    btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
  });

  /* ---------- hero mascot follows the cursor a little ---------- */
  const mascot = $('.hero .mascot');
  if (mascot) {
    const hero = $('.hero');
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - 0.5) * 14;
      const y = ((e.clientY - r.top) / r.height - 0.5) * 10;
      mascot.style.translate = `${x}px ${y}px`;
    });
    hero.addEventListener('pointerleave', () => { mascot.style.translate = ''; });
  }
})();
