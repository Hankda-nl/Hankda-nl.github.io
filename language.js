'use strict';
// Let the progress line and anchor offsets follow the responsive header.
const pageHeader = document.querySelector('.site-header');
if (pageHeader) {
  const measureHeader = () => document.documentElement.style.setProperty('--nav-height', `${pageHeader.getBoundingClientRect().height}px`);
  measureHeader();
  if ('ResizeObserver' in window) new ResizeObserver(measureHeader).observe(pageHeader);
  else window.addEventListener('resize', measureHeader);
}
