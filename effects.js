'use strict';
// Decorative geometry only. A small, capped canvas avoids large animated images.
(() => {
  const canvas = document.getElementById('ambient-scene');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;
  let width = 0;
  let height = 0;
  let points = [];
  let frame = null;
  let lastTime = 0;
  let lastDraw = 0;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const allowed = () => !document.hidden && !document.body.classList.contains('motion-paused') && !reduce.matches;

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = width < 700 ? 22 : 38;
    points = Array.from({ length: count }, () => ({ x: Math.random() * width, y: Math.random() * height, vx: (Math.random() - .5) * 7, vy: (Math.random() - .5) * 7, r: Math.random() * 1.2 + .55 }));
    draw(0);
  }

  function draw(delta) {
    ctx.clearRect(0, 0, width, height);
    for (const point of points) {
      point.x = (point.x + point.vx * delta + width) % width;
      point.y = (point.y + point.vy * delta + height) % height;
      ctx.fillStyle = 'rgba(190,112,67,.42)';
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.r, 0, Math.PI * 2);
      ctx.fill();
    }
    const distanceLimit = width < 700 ? 105 : 150;
    for (let a = 0; a < points.length; a++) for (let b = a + 1; b < points.length; b++) {
      const dx = points[a].x - points[b].x;
      const dy = points[a].y - points[b].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < distanceLimit) {
        ctx.strokeStyle = `rgba(139,116,98,${.12 * (1 - distance / distanceLimit)})`;
        ctx.lineWidth = .7;
        ctx.beginPath();ctx.moveTo(points[a].x, points[a].y);ctx.lineTo(points[b].x, points[b].y);ctx.stroke();
      }
    }
  }

  function animate(time) {
    if (!allowed()) { frame = null; return; }
    if (time - lastDraw >= 32) {
      const delta = lastTime ? Math.min((time - lastTime) / 1000, .08) : 0;
      draw(delta);
      lastTime = time;
      lastDraw = time;
    }
    frame = requestAnimationFrame(animate);
  }

  function sync() {
    if (!allowed()) {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      lastTime = 0;
    } else if (frame === null) {
      lastTime = 0;
      frame = requestAnimationFrame(animate);
    }
  }
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  reduce.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  let resizeFrame = null;
  window.addEventListener('resize', () => {
    if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => { resizeFrame = null; resize(); });
  });
  resize();sync();

  for (const card of document.querySelectorAll('.research-card,.decision-card,.contact-card,.profile-panel')) {
    card.addEventListener('pointermove', event => {
      if (!allowed() || event.pointerType !== 'mouse') return;
      const box = card.getBoundingClientRect();
      card.style.setProperty('--spot-x', `${event.clientX - box.left}px`);
      card.style.setProperty('--spot-y', `${event.clientY - box.top}px`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.removeProperty('--spot-x');card.style.removeProperty('--spot-y');
    });
  }
})();
