export function initPhotoGallery() {
  const cleanups = [...document.querySelectorAll<HTMLElement>('[data-gallery]')].map(setupGallery);
  return () => cleanups.forEach((cleanup) => cleanup());
}

function setupGallery(gallery: HTMLElement) {
  const track = gallery.querySelector<HTMLElement>('.photo-track')!;
  const frame = gallery.querySelector<HTMLElement>('.photo-carousel')!;
  const previous = gallery.querySelector<HTMLButtonElement>('.photo-prev')!;
  const next = gallery.querySelector<HTMLButtonElement>('.photo-next')!;
  const dots = [...gallery.querySelectorAll<HTMLButtonElement>('.photo-dots button')];
  const count = gallery.querySelector<HTMLElement>('.photo-count')!;
  let active = 0;
  const controller = new AbortController();
  const { signal } = controller;
  const select = (index: number) => {
    const target = Math.max(0, Math.min(dots.length - 1, index));
    track.scrollTo({ left: target * track.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };
  const sync = () => {
    active = Math.round(track.scrollLeft / track.clientWidth);
    dots.forEach((dot, index) => dot.setAttribute('aria-pressed', String(index === active)));
    previous.setAttribute('aria-disabled', String(active === 0));
    next.setAttribute('aria-disabled', String(active === dots.length - 1));
    count.textContent = `${active + 1} / ${dots.length}`;
  };
  previous.addEventListener('click', () => select(active - 1), { signal });
  next.addEventListener('click', () => select(active + 1), { signal });
  dots.forEach((dot, index) => dot.addEventListener('click', () => select(index), { signal }));
  track.addEventListener('scroll', sync, { passive: true, signal });
  track.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    select(active + (event.key === 'ArrowRight' ? 1 : -1));
  }, { signal });
  // Cross the same breakpoint in either direction without overriding manual
  // navigation while the reader stays on one side of it.
  let lastScrollY = window.scrollY;
  let pastBreakpoint = frame.getBoundingClientRect().top <= 48;
  const advanceOnScroll = () => {
    const scrollY = window.scrollY;
    if (scrollY === lastScrollY) return;
    const scrollingDown = scrollY > lastScrollY;
    lastScrollY = scrollY;
    const bounds = frame.getBoundingClientRect();
    const isPastBreakpoint = bounds.top <= 48;
    if (isPastBreakpoint === pastBreakpoint) return;
    pastBreakpoint = isPastBreakpoint;
    if (bounds.bottom <= 0 || dots.length < 2) return;
    const target = scrollingDown ? 1 : 0;
    // Compare actual offsets so reversing mid-transition also reverses smoothly.
    if (Math.abs(track.scrollLeft - target * track.clientWidth) > 1) select(target);
  };
  window.addEventListener('scroll', advanceOnScroll, { passive: true, signal });
  const resize = new ResizeObserver(() => {
    track.scrollTo({ left: active * track.clientWidth, behavior: 'instant' });
    pastBreakpoint = frame.getBoundingClientRect().top <= 48;
    lastScrollY = window.scrollY;
  });
  resize.observe(track);
  sync();
  return () => { controller.abort(); resize.disconnect(); };
}
