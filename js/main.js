/* =========================================================================
   main.js: navigation, custom cursor, typing effect, tilt cards,
   rundown accordion/tabs, gallery lightbox, active nav highlighting
   ========================================================================= */
(function () {
  /* ---- Press feedback for cards and controls --------------------------*/
  document.addEventListener('pointerdown', (e) => {
    const target = e.target.closest('button, .tilt-card, .masonry figure');
    if (!target) return;
    target.classList.remove('is-pressed');
    requestAnimationFrame(() => target.classList.add('is-pressed'));
  });
  document.addEventListener('animationend', (e) => {
    if (e.animationName === 'pressFeedback') e.target.classList.remove('is-pressed');
  });

  /* ---- Mobile nav toggle --------------------------------------------- */
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true': 'false');
    });
    links.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
      links.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }));
  }

  /* ---- Active nav link -------------------------------------------------*/
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach((a) => {
    const href = a.getAttribute('href');
    if (href === current || (current === '' && href === 'index.html')) {
      a.classList.add('is-active');
    }
  });

  /* ---- Custom cursor ---------------------------------------------------*/
  const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (isFinePointer) {
    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    const ring = document.createElement('div');
    ring.className = 'cursor-ring';
    document.body.append(dot, ring);

    let dotX = 0, dotY = 0, ringX = 0, ringY = 0;
    window.addEventListener('mousemove', (e) => {
      dotX = e.clientX; dotY = e.clientY;
      dot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%,-50%)`;
    });

    function trail() {
      ringX += (dotX - ringX) * 0.16;
      ringY += (dotY - ringY) * 0.16;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%,-50%)`;
      requestAnimationFrame(trail);
    }
    trail();

    document.querySelectorAll('a, button, .tilt-card, .masonry figure').forEach((el) => {
      el.addEventListener('mouseenter', () => ring.classList.add('is-active'));
      el.addEventListener('mouseleave', () => ring.classList.remove('is-active'));
    });
  }

  /* ---- Typing effect (hero) --------------------------------------------*/
  const typeEl = document.querySelector('[data-typing]');
  if (typeEl) {
    const text = typeEl.getAttribute('data-typing');
    const bar = document.createElement('span');
    bar.className = 'cursor-bar';
    let i = 0;
    typeEl.textContent = '';
    typeEl.appendChild(bar);

    function typeStep() {
      if (i <= text.length) {
        typeEl.textContent = text.slice(0, i);
        typeEl.appendChild(bar);
        i++;
        setTimeout(typeStep, 32);
      }
    }
    setTimeout(typeStep, 650);
  }

  /* ---- Tilt-card 3D hover ------------------------------------------- */
  document.querySelectorAll('.tilt-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `rotateY(${x * 7}deg) rotateX(${-y * 7}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });

  /* ---- Rundown tabs / accordion (program.html) ----------------------- */
  const tabButtons = document.querySelectorAll('.rundown-tabs button');
  const panels = document.querySelectorAll('.rundown-panel');
  if (tabButtons.length) {
    tabButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        tabButtons.forEach((b) => { b.classList.remove('is-active'); b.setAttribute('aria-selected', 'false'); });
        panels.forEach((p) => p.classList.remove('is-active'));
        btn.classList.add('is-active');
        btn.setAttribute('aria-selected', 'true');
        document.getElementById(btn.dataset.target)?.classList.add('is-active');
      });
    });
  }

  /* ---- Gallery lightbox (gallery.html) -------------------------------*/
  const lightbox = document.querySelector('.lightbox');
  if (lightbox) {
    const lbTitle = lightbox.querySelector('[data-lb-title]');
    const lbDesc = lightbox.querySelector('[data-lb-desc]');
    const lbSwatch = lightbox.querySelector('[data-lb-swatch]');
    document.querySelectorAll('.masonry figure').forEach((fig) => {
      fig.addEventListener('click', () => {
        lbTitle.textContent = fig.dataset.title || '';
        lbDesc.textContent = fig.dataset.desc || '';
        if (lbSwatch) lbSwatch.textContent = fig.dataset.title ? fig.dataset.title.slice(0, 1): '';
        lightbox.classList.add('is-open');
      });
    });
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.closest('.close')) {
        lightbox.classList.remove('is-open');
      }
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') lightbox.classList.remove('is-open');
    });
  }

  /* ---- Team profile and division photo gallery ---------------------- */
  const teamDialog = document.querySelector('.team-photo-dialog');
  if (teamDialog) {
    const title = teamDialog.querySelector('#team-photo-title');
    const subtitle = teamDialog.querySelector('#team-photo-subtitle');
    const stage = teamDialog.querySelector('#team-photo-stage');
    const counter = teamDialog.querySelector('.team-photo-counter');
    const prev = teamDialog.querySelector('.team-photo-prev');
    const next = teamDialog.querySelector('.team-photo-next');
    let slides = [];
    let activeSlide = 0;
    let slideRenderId = 0;

    const placeholder = (label) => {
      const box = document.createElement('div');
      box.className = 'team-photo-placeholder';
      box.innerHTML = '<span class="photo-placeholder-mark" aria-hidden="true">MDIP</span>';
      const message = document.createElement('span');
      message.textContent = label;
      box.appendChild(message);
      return box;
    };

    const renderSlide = async () => {
      const slide = slides[activeSlide];
      if (!slide) return;
      const renderId = ++slideRenderId;
      let loadedImage = null;
      if (slide.photo) {
        loadedImage = new Image();
        loadedImage.src = slide.photo;
        try {
          await loadedImage.decode();
        } catch {
          if (!loadedImage.complete || loadedImage.naturalWidth === 0) loadedImage = null;
        }
        if (renderId !== slideRenderId) return;
      }
      title.textContent = slide.title;
      subtitle.textContent = slide.subtitle;
      counter.textContent = slide.counter;
      prev.hidden = slides.length < 2;
      next.hidden = slides.length < 2;
      stage.replaceChildren();
      if (!loadedImage) {
        stage.appendChild(placeholder(slide.placeholder));
        return;
      }
      loadedImage.alt = slide.alt;
      loadedImage.className = 'team-photo-enter';
      stage.appendChild(loadedImage);
    };

    const openGallery = (trigger) => {
      activeSlide = 0;
      if (trigger.matches('[data-photo-profile]')) {
        const name = trigger.dataset.name;
        slides = [{
          title: name,
          photo: trigger.dataset.photo,
          alt: `Foto ${name}`,
          subtitle: trigger.dataset.role,
          counter: 'Foto profil',
          placeholder: 'Foto profil akan ditambahkan di sini.'
        }];
      } else {
        const division = trigger.dataset.division;
        const members = JSON.parse(trigger.dataset.members || '[]');
        slides = members.map((member, index) => ({
          title: member.name,
          photo: member.photo,
          alt: `Foto ${member.name}`,
          subtitle: division,
          counter: `${index + 1} dari ${members.length}`,
          placeholder: `Foto ${member.name} belum tersedia.`
        }));
      }
      renderSlide();
      if (!teamDialog.open) teamDialog.showModal();
      requestAnimationFrame(() => teamDialog.classList.add('is-visible'));
    };

    const closeGallery = () => {
      teamDialog.classList.remove('is-visible');
      window.setTimeout(() => { if (teamDialog.open) teamDialog.close(); }, 220);
    };

    document.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-photo-profile], [data-photo-division]');
      if (trigger) openGallery(trigger);
    });
    document.addEventListener('keydown', (event) => {
      const trigger = event.target.closest?.('[data-photo-profile], [data-photo-division]');
      if (trigger && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        openGallery(trigger);
      }
    });
    prev.addEventListener('click', () => { activeSlide = (activeSlide - 1 + slides.length) % slides.length; renderSlide(); });
    next.addEventListener('click', () => { activeSlide = (activeSlide + 1) % slides.length; renderSlide(); });
    teamDialog.querySelector('.team-dialog-close').addEventListener('click', closeGallery);
    teamDialog.addEventListener('click', (event) => { if (event.target === teamDialog) closeGallery(); });
    teamDialog.addEventListener('close', () => teamDialog.classList.remove('is-visible'));
  }

  /* ---- Count-up stats -------------------------------------------------*/
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.suffix || '';
        let cur = 0;
        const step = Math.max(1, Math.round(target / 40));
        const tick = () => {
          cur = Math.min(target, cur + step);
          el.textContent = cur + suffix;
          if (cur < target) requestAnimationFrame(tick);
        };
        tick();
        cio.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach((c) => cio.observe(c));
  }
})();
