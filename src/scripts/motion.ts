import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** Smooth scroll, intro, scroll reveals, nav state, and the depth gauge. */
export function mountMotion(): void {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cleanups: Array<() => void> = [];

  // Lenis: the only smooth-scroll engine, wired to ScrollTrigger once.
  let lenis: Lenis | undefined;
  if (!reduced) {
    lenis = new Lenis();
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (t: number) => lenis!.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    cleanups.push(() => gsap.ticker.remove(tick));
  }

  // Anchor links go through Lenis so the descent stays smooth.
  const onAnchorClick = (e: Event) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!a || !lenis) return;
    const el = document.querySelector<HTMLElement>(a.getAttribute('href')!);
    if (!el) return;
    e.preventDefault();
    lenis.scrollTo(el, { offset: -48 });
  };
  document.addEventListener('click', onAnchorClick);
  cleanups.push(() => document.removeEventListener('click', onAnchorClick));

  // Nav bar and mobile menu.
  const nav = document.querySelector<HTMLElement>('.nav');
  const toggle = document.querySelector<HTMLButtonElement>('.nav-toggle');
  const menu = document.getElementById('nav-menu');
  const setMenu = (open: boolean) => {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
  };
  if (toggle && menu) {
    const onToggle = () => setMenu(menu.hidden);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !menu.hidden) {
        setMenu(false);
        toggle.focus();
      }
    };
    const onMenuClick = (e: Event) => {
      if ((e.target as HTMLElement).closest('a')) setMenu(false);
    };
    toggle.addEventListener('click', onToggle);
    document.addEventListener('keydown', onKey);
    menu.addEventListener('click', onMenuClick);
    cleanups.push(() => {
      toggle.removeEventListener('click', onToggle);
      document.removeEventListener('keydown', onKey);
      menu.removeEventListener('click', onMenuClick);
    });
  }

  // Depth gauge: interpolate between [data-depth] anchors by their page position.
  const anchors = Array.from(document.querySelectorAll<HTMLElement>('[data-depth]'));
  const gauge = document.querySelector<HTMLElement>('.gauge');
  const readout = gauge?.querySelector<HTMLElement>('.gauge-read .val');
  let tops: number[] = [];
  let depths: number[] = [];
  let ticking = false;
  const measure = () => {
    tops = anchors.map((a) => a.getBoundingClientRect().top + scrollY);
    depths = anchors.map((a) => Number(a.dataset.depth));
  };
  const currentDepth = () => {
    if (!tops.length) return 0;
    const probe = scrollY + innerHeight * 0.45;
    const maxScroll = document.documentElement.scrollHeight - innerHeight;
    if (maxScroll > 0 && scrollY >= maxScroll - 2) return depths[depths.length - 1];
    if (probe <= tops[0]) return depths[0];
    for (let i = 0; i < tops.length - 1; i++) {
      if (probe < tops[i + 1]) {
        const f = (probe - tops[i]) / Math.max(1, tops[i + 1] - tops[i]);
        return depths[i] + (depths[i + 1] - depths[i]) * f;
      }
    }
    return depths[depths.length - 1];
  };
  let shownDepth = -1;
  const paint = () => {
    ticking = false;
    nav?.classList.toggle('is-scrolled', scrollY > 24);
    if (!gauge || !readout) return;
    const d = Math.round(currentDepth());
    if (d === shownDepth) return;
    shownDepth = d;
    readout.textContent = String(d);
    gauge.style.setProperty('--p', String(d / 100));
    for (const a of anchors) a.classList.toggle('is-active', Number(a.dataset.depth) <= d);
  };
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(paint);
  };
  const onResize = () => {
    measure();
    onScroll();
  };
  measure();
  paint();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onResize);
  cleanups.push(() => {
    removeEventListener('scroll', onScroll);
    removeEventListener('resize', onResize);
  });

  if (!reduced) {
    // Hero intro: the name rises from below a clip line; meta fades; gauge slides in.
    const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
    intro
      .from('.hero-name .line > span', { yPercent: 110, duration: 1.1, stagger: 0.12 }, 0)
      .from('.hero-meta, .hero-label, .hero-hook, .hero-actions, .hero-scroll', { opacity: 0, y: 14, duration: 0.7, stagger: 0.08 }, 0.35)
      .from('.gauge', { xPercent: 40, opacity: 0, duration: 0.9 }, 0.5);
    cleanups.push(() => intro.kill());

    // Word-by-word heading reveals, then the copy below each.
    document.querySelectorAll<HTMLElement>('.split').forEach((h) => {
      const words = h.querySelectorAll('.w > span');
      const head = h.closest('.sec-head');
      const after = head ? Array.from(head.parentElement?.children ?? []).filter((c) => c !== head) : [];
      const tl = gsap.timeline({ scrollTrigger: { trigger: head ?? h, start: 'top 82%', once: true } });
      tl.from(words, { yPercent: 105, duration: 0.7, ease: 'power3.out', stagger: 0.06 });
      if (head) tl.from(head.querySelector('.depth-tag'), { opacity: 0, x: -8, duration: 0.5 }, 0);
      if (after.length) tl.from(after, { opacity: 0, y: 18, duration: 0.7, ease: 'power2.out', stagger: 0.08 }, 0.25);
    });

    // Role cards and project cards drift up as if sinking past.
    gsap.utils.toArray<HTMLElement>('.role, .card, .skill, .entry').forEach((el) => {
      gsap.from(el, {
        opacity: 0,
        y: 32,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });

    document.fonts?.ready.then(() => {
      ScrollTrigger.refresh();
      measure();
      onScroll();
    });
  }

  const destroy = () => {
    cleanups.forEach((fn) => fn());
    ScrollTrigger.getAll().forEach((t) => t.kill());
    lenis?.destroy();
    removeEventListener('pagehide', destroy);
    document.removeEventListener('astro:before-swap', destroy);
  };
  addEventListener('pagehide', destroy, { once: true });
  document.addEventListener('astro:before-swap', destroy, { once: true });
}
