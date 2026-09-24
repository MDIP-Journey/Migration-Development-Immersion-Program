/* =========================================================================
   animations.js: Intersection Observer scroll reveals + page transitions
   ========================================================================= */
(function () {
  /* ---- Scroll-triggered reveals ------------------------------------- */
  const revealTargets = document.querySelectorAll('[data-reveal], [data-reveal-stagger]');

  if ('IntersectionObserver' in window && revealTargets.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');

          // Assign stagger index to children the first time they appear
          if (entry.target.hasAttribute('data-reveal-stagger')) {
            Array.from(entry.target.children).forEach((child, i) => {
              child.style.setProperty('--d', i);
            });
          }
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });

    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---- Header shrink-on-scroll --------------------------------------- */
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 24);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---- Page transitions (content fade + falling logo-colored flecks) -- */
  const veil = document.querySelector('.page-veil');
  veil?.remove();
  let incomingAt = 0;
  try {
    incomingAt = Number(sessionStorage.getItem('mdipPageEnterAt')) || 0;
    if (incomingAt) {
      sessionStorage.removeItem('mdipPageEnterAt');
      document.body.classList.add('page-pending');
    }
  } catch (_) {}
  let isNavigating = false;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isInternalLink = (a) => {
    if (!a || !a.href) return false;
    const url = new URL(a.href, window.location.href);
    return url.origin === window.location.origin &&
      url.pathname.endsWith('.html') &&
      a.target !== '_blank';
  };

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!isInternalLink(a)) return;
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (isNavigating) { e.preventDefault(); return; }
    const url = new URL(a.href, window.location.href);
    if (url.pathname === window.location.pathname && url.search === window.location.search) return;
    e.preventDefault();
    isNavigating = true;

    const dust = document.createElement('div');
    dust.className = 'page-dust';
    const colors = ['rgba(21, 155, 152, 0.62)', 'rgba(7, 85, 106, 0.4)', 'rgba(185, 154, 40, 0.58)'];
    for (let i = 0; i < (reducedMotion ? 0: 28); i++) {
      const fleck = document.createElement('i');
      fleck.style.setProperty('--x', `${Math.random() * 100}%`);
      fleck.style.setProperty('--size', `${3 + Math.random() * 5}px`);
      fleck.style.setProperty('--duration', `${0.68 + Math.random() * 0.22}s`);
      fleck.style.setProperty('--delay', `${Math.random() * 0.08}s`);
      fleck.style.setProperty('--drift', `${Math.round((Math.random() - 0.5) * 100)}px`);
      fleck.style.setProperty('--dust-color', colors[i % colors.length]);
      dust.appendChild(fleck);
    }
    document.body.appendChild(dust);
    document.body.classList.add('page-leaving');
    const transitionTime = reducedMotion ? 0: 1000;
    try { sessionStorage.setItem('mdipPageEnterAt', String(Date.now() + transitionTime)); } catch (_) {}
    window.setTimeout(() => { window.location.assign(url.href); }, transitionTime);
  });

  window.addEventListener('pageshow', (event) => {
    if (event.persisted && !incomingAt) {
      document.documentElement.classList.remove('page-pending');
      document.body.classList.remove('page-leaving');
      document.querySelector('.page-dust')?.remove();
      document.body.classList.add('page-entering');
      window.setTimeout(() => document.body.classList.remove('page-entering'), 1650);
      return;
    }
    if (!incomingAt) return;
    window.setTimeout(() => {
      document.documentElement.classList.remove('page-pending');
      document.body.classList.remove('page-pending');
      document.body.offsetWidth;
      document.body.classList.add('page-entering');
      window.setTimeout(() => document.body.classList.remove('page-entering'), 1650);
    }, Math.max(0, incomingAt - Date.now()));
  });
})();
