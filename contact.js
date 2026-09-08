'use strict';
const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
const toggle = document.getElementById('motion-toggle');
let paused = preference.matches;
function applyMotionPreference() {
  document.body.classList.toggle('motion-paused', paused);
  toggle.setAttribute('aria-pressed', String(paused));
  toggle.setAttribute('aria-label', paused ? '启用页面装饰动效' : '暂停页面装饰动效');
  toggle.querySelector('.motion-label').textContent = paused ? '启用动效' : '暂停动效';
  toggle.querySelector('.motion-icon').textContent = paused ? '▶' : 'Ⅱ';
}
toggle.addEventListener('click', () => { paused = !paused; applyMotionPreference(); });
preference.addEventListener('change', event => { paused = event.matches; applyMotionPreference(); });
applyMotionPreference();
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      if (!paused) entry.target.classList.add('reveal-visible');
      observer.unobserve(entry.target);
    }
  }, { threshold: .08 });
  for (const element of document.querySelectorAll('.contact-card,.profile-panel,.contact-back')) observer.observe(element);
}
let queued = false;
function updateProgress() {
  const maximum = document.documentElement.scrollHeight - innerHeight;
  const ratio = maximum > 0 ? Math.min(1, Math.max(0, scrollY / maximum)) : 0;
  document.getElementById('reading-progress').style.transform = `scaleX(${ratio})`;
  queued = false;
}
window.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(updateProgress); } }, { passive: true });
window.addEventListener('resize', updateProgress);
updateProgress();
