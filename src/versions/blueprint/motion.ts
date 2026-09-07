import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const diagramWide = () => matchMedia('(min-width: 56rem)').matches;

let lenis: Lenis | undefined;
let raf: ((t: number) => void) | undefined;
const mm = gsap.matchMedia();

/* ---------------------------------------------------------------- smooth scroll */
function initLenis() {
  if (reduced) return;
  lenis = new Lenis();
  lenis.on('scroll', ScrollTrigger.update);
  raf = (t: number) => lenis!.raf(t * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);

  // In-page anchors go through Lenis so they respect the pinned strip.
  document.addEventListener('click', (ev) => {
    const a = (ev.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
    if (!a || !lenis) return;
    const target = document.querySelector<HTMLElement>(a.getAttribute('href')!);
    if (!target) return;
    ev.preventDefault();
    lenis.scrollTo(target, { offset: -56 });
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
}

/* ------------------------------------------------------------------------- nav */
function initNav() {
  const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]');
  const menu = document.querySelector<HTMLElement>('[data-nav-menu]');
  if (!toggle || !menu) return;
  const iconOpen = toggle.querySelector<SVGElement>('[data-icon-open]');
  const iconClose = toggle.querySelector<SVGElement>('[data-icon-close]');

  const set = (open: boolean) => {
    menu.dataset.open = String(open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (iconOpen) iconOpen.hidden = open;
    if (iconClose) iconClose.hidden = !open;
  };
  toggle.addEventListener('click', () => set(menu.dataset.open !== 'true'));
  menu.addEventListener('click', (e) => {
    if ((e.target as Element).closest('a')) set(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.dataset.open === 'true') {
      set(false);
      toggle.focus();
    }
  });
}

/* --------------------------------------------------------------------- diagram */
function initDiagram() {
  const diagram = document.querySelector<HTMLElement>('[data-diagram]');
  if (!diagram) return;
  const nodes = Array.from(diagram.querySelectorAll<HTMLElement>('[data-node]'));
  const edges = Array.from(diagram.querySelectorAll<SVGPathElement>('.edge'));
  const dots = Array.from(diagram.querySelectorAll<SVGCircleElement>('.edge-dot'));

  // Hover / focus highlights connected edges and nodes.
  const connected = (id: string) => edges.filter((e) => e.dataset.from === id || e.dataset.to === id);
  const activate = (id: string) => {
    diagram.classList.add('has-active');
    for (const e of connected(id)) {
      e.classList.add('is-active');
      const other = e.dataset.from === id ? e.dataset.to : e.dataset.from;
      diagram.querySelector(`[data-node="${other}"]`)?.classList.add('is-active');
    }
  };
  const clear = () => {
    diagram.classList.remove('has-active');
    edges.forEach((e) => e.classList.remove('is-active'));
    nodes.forEach((n) => n.classList.remove('is-active'));
  };
  for (const n of nodes) {
    const id = n.dataset.node!;
    n.addEventListener('mouseenter', () => activate(id));
    n.addEventListener('focus', () => activate(id));
    n.addEventListener('mouseleave', clear);
    n.addEventListener('blur', clear);
  }

  // Draw-on-load. Only when the SVG is actually visible and motion is allowed.
  if (reduced || !diagramWide()) return;
  const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
  tl.from(nodes, { autoAlpha: 0, y: 10, duration: 0.45, stagger: 0.05 }, 0.1);
  edges.forEach((e, i) => {
    const len = e.getTotalLength();
    gsap.set(e, { strokeDasharray: len, strokeDashoffset: len });
    tl.to(e, { strokeDashoffset: 0, duration: 0.7, ease: 'power1.inOut' }, 0.35 + i * 0.08);
  });
  tl.from(dots, { scale: 0, transformOrigin: 'center', duration: 0.3, stagger: 0.06 }, 0.4);
}

/* -------------------------------------------------------------------- reveals */
function initReveals() {
  if (reduced) return;

  // Word-by-word headings.
  document.querySelectorAll<HTMLElement>('[data-split]').forEach((h) => {
    const words = h.querySelectorAll<HTMLElement>('.wi');
    if (!words.length) return;
    gsap.from(words, {
      yPercent: 110,
      duration: 0.7,
      ease: 'power3.out',
      stagger: 0.06,
      scrollTrigger: { trigger: h, start: 'top 88%', once: true },
    });
  });

  // Copy blocks.
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    gsap.from(el, {
      autoAlpha: 0,
      y: 18,
      duration: 0.6,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });

  // Dimension lines draw from the centre outwards. The line halves are
  // pseudo-elements, so we animate a CSS variable that scales them.
  document.querySelectorAll<HTMLElement>('[data-dim]').forEach((el) => {
    gsap.fromTo(
      el,
      { '--dim': 0 },
      {
        '--dim': 1,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      },
    );
  });
}

/* ------------------------------------------------------------ pinned strip */
function initStrip() {
  const strip = document.querySelector<HTMLElement>('[data-strip]');
  const track = document.querySelector<HTMLElement>('[data-strip-track]');
  if (!strip || !track) return;
  const panels = track.querySelectorAll<HTMLElement>('[data-panel]');

  mm.add('(min-width: 64rem) and (prefers-reduced-motion: no-preference)', () => {
    const distance = () => Math.max(0, track.scrollWidth - strip.clientWidth);
    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: strip,
        start: 'top top',
        end: () => `+=${panels.length * window.innerHeight * 0.6}`,
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      },
    });
    // Reveal panels as they slide into view. Checked from the strip's own
    // trigger so it also works when the page opens directly at #experience.
    const shown = new Set<HTMLElement>();
    gsap.set(panels, { autoAlpha: 0, x: 40 });
    const revealVisible = () => {
      const limit = window.innerWidth * 0.95;
      panels.forEach((p) => {
        if (shown.has(p)) return;
        if (p.getBoundingClientRect().left < limit) {
          shown.add(p);
          gsap.to(p, { autoAlpha: 1, x: 0, duration: 0.6, ease: 'power2.out', overwrite: 'auto' });
        }
      });
    };
    ScrollTrigger.create({
      trigger: strip,
      start: 'top 90%',
      end: () => `+=${panels.length * window.innerHeight * 0.6 + window.innerHeight}`,
      onUpdate: revealVisible,
      onRefresh: revealVisible,
      onEnter: revealVisible,
    });
    requestAnimationFrame(revealVisible);
    return () => {
      tween.kill();
      gsap.set(track, { clearProps: 'transform' });
      gsap.set(panels, { clearProps: 'opacity,visibility,transform' });
    };
  });
}

/* ------------------------------------------------------------------ lifecycle */
function cleanup() {
  lenis?.destroy();
  lenis = undefined;
  if (raf) gsap.ticker.remove(raf);
  mm.revert();
  ScrollTrigger.getAll().forEach((t) => t.kill());
}

function start() {
  initLenis();
  initNav();
  initDiagram();
  initReveals();
  initStrip();
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('pagehide', cleanup, { once: true });
  document.addEventListener('astro:before-swap', cleanup, { once: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}

