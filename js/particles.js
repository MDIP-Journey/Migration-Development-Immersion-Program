/* =========================================================================
   particles.js: interactive particle-network background
   Draws small nodes connected by thin lines; nodes drift and gently
   react to the mouse (mild repulsion). Kept subtle (low opacity, teal/gold)
   so it never competes with foreground text.
   ========================================================================= */
(function () {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let width, height, dpr;
  let particles = [];
  const mouse = { x: null, y: null, radius: 120 };

  const COLORS = ['rgba(21,155,152,', 'rgba(185,154,40,']; // logo teal and gold: opacity appended per-use

  function sizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth = window.innerWidth;
    height = canvas.clientHeight = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function particleCount() {
    const area = width * height;
    // Roughly one particle per 16,000px^2, capped for very large screens
    return Math.min(120, Math.max(35, Math.floor(area / 16000)));
  }

  function makeParticles() {
    const count = particleCount();
    particles = new Array(count).fill(0).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.6 + 0.6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    }));
  }

  function step() {
    ctx.clearRect(0, 0, width, height);

    for (const p of particles) {
      // Gentle drift
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;
      if (p.y < -10) p.y = height + 10;
      if (p.y > height + 10) p.y = -10;

      // Mild mouse repulsion
      if (mouse.x !== null) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          p.x += (dx / (dist || 1)) * force * 1.2;
          p.y += (dy / (dist || 1)) * force * 1.2;
        }
      }

      ctx.beginPath();
      ctx.fillStyle = p.color + '0.55)';
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Connect nearby particles with thin lines
    const linkDist = 130;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < linkDist) {
          const opacity = (1 - dist / linkDist) * 0.18;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(69, 129, 132, ${opacity * 0.7})`;
          ctx.lineWidth = 1;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(step);
  }

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }, { passive: true });
  window.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { sizeCanvas(); makeParticles(); }, 150);
  });

  sizeCanvas();
  makeParticles();

  if (!prefersReducedMotion) {
    requestAnimationFrame(step);
  } else {
    // Draw a single static frame for reduced-motion users
    step_once();
  }

  function step_once() {
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      ctx.beginPath();
      ctx.fillStyle = p.color + '0.4)';
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
})();
