import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let cleanup: (() => void) | undefined;

export function initDescent(): void {
  cleanup?.();

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const disposers: Array<() => void> = [];

  // --- Smooth scroll (Lenis is the only engine; skipped under reduced motion) ---
  let lenis: Lenis | undefined;
  if (!reduced) {
    lenis = new Lenis();
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (t: number) => lenis!.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    disposers.push(() => {
      gsap.ticker.remove(raf);
      lenis?.destroy();
    });
  }

  // --- In-page links ("Descend", "Surface", nav): smooth via Lenis when it runs, native otherwise ---
  const navH = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) * 16 || 52;
  const onLinkClick = (e: MouseEvent) => {
    if (!lenis || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href')!.slice(1);
    const target = id ? document.getElementById(id) : null;
    if (!target) return;
    e.preventDefault();
    const top = id === 'top' || id === 'main';
    lenis.scrollTo(top ? 0 : target, { offset: top ? 0 : -navH() - 16, duration: 1.4 });
    history.replaceState(null, '', top ? location.pathname : `#${id}`);
  };
  document.addEventListener('click', onLinkClick);
  disposers.push(() => document.removeEventListener('click', onLinkClick));

  // --- Folio strip: hairline once the hero has scrolled past ---
  const folio = document.querySelector<HTMLElement>('[data-folio]');
  const sentinel = document.querySelector<HTMLElement>('[data-folio-sentinel]');
  if (folio && sentinel) {
    const io = new IntersectionObserver(([e]) => folio.classList.toggle('is-stuck', !e.isIntersecting), {
      rootMargin: '-1px 0px 0px 0px',
      threshold: 0,
    });
    io.observe(sentinel);
    disposers.push(() => io.disconnect());
  }

  // --- Mobile menu ---
  const toggle = document.querySelector<HTMLButtonElement>('[data-folio-toggle]');
  const nav = document.getElementById('folio-nav');
  if (toggle && nav) {
    const setOpen = (open: boolean) => {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    };
    const onClick = () => setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    };
    const onNavClick = (e: Event) => {
      if ((e.target as HTMLElement).closest('a')) setOpen(false);
    };
    toggle.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    nav.addEventListener('click', onNavClick);
    disposers.push(() => {
      toggle.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
      nav.removeEventListener('click', onNavClick);
    });
  }

  // --- Depth gauge: interpolate between [data-depth] anchors by page position (plain scroll, rAF-throttled) ---
  const anchors = Array.from(document.querySelectorAll<HTMLElement>('[data-depth]'));
  const gauge = document.querySelector<HTMLElement>('[data-gauge]');
  const readout = gauge?.querySelector<HTMLElement>('[data-gauge-val]');
  if (gauge && readout && anchors.length) {
    let tops: number[] = [];
    let depths: number[] = [];
    let ticking = false;
    let shown = -1;
    const measure = () => {
      const pairs = anchors
        .map((a) => ({ top: a.getBoundingClientRect().top + scrollY, depth: Number(a.dataset.depth) }))
        .sort((a, b) => a.top - b.top);
      tops = pairs.map((p) => p.top);
      depths = pairs.map((p) => p.depth);
    };
    const currentDepth = () => {
      if (!tops.length) return 0;
      if (scrollY <= 0) return depths[0];
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
    const paint = () => {
      ticking = false;
      const d = Math.round(currentDepth());
      if (d === shown) return;
      shown = d;
      readout.textContent = String(d);
      gauge.style.setProperty('--p', String(d / 100));
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
    document.fonts?.ready.then(onResize);
    disposers.push(() => {
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onResize);
    });
  }

  // --- Year rail: highlight the active role's span (state, not motion) ---
  const rail = document.querySelector<HTMLElement>('[data-rail]');
  const roles = Array.from(document.querySelectorAll<HTMLElement>('[data-role]'));
  const rolesWrap = document.querySelector<HTMLElement>('[data-roles]');
  if (rail && roles.length && rolesWrap) {
    const yearEls = Array.from(rail.querySelectorAll<HTMLElement>('[data-year]'));
    const bracket = rail.querySelector<HTMLElement>('[data-rail-bracket]');
    const progress = rail.querySelector<HTMLElement>('[data-rail-progress]');
    const caption = rail.querySelector<HTMLElement>('[data-rail-caption]');
    const list = yearEls[0]?.parentElement as HTMLElement;

    const setActive = (role: HTMLElement | null) => {
      const start = role ? Number(role.dataset.start) : NaN;
      const end = role ? Number(role.dataset.end) : NaN;
      let first: HTMLElement | undefined;
      let last: HTMLElement | undefined;
      yearEls.forEach((el) => {
        const y = Number(el.dataset.year);
        const active = role !== null && y >= start && y <= end;
        el.classList.toggle('is-active', active);
        el.classList.toggle('is-current', active && y === end);
        if (active) {
          first ??= el;
          last = el;
        }
      });
      if (caption) caption.textContent = role?.dataset.company ?? '';
      if (bracket && list) {
        if (first && last) {
          // The list is the positioned parent, so offsetTop is already relative to it.
          const top = first.offsetTop;
          const height = last.offsetTop + last.offsetHeight - first.offsetTop;
          if (reduced) gsap.set(bracket, { top, height, opacity: 1 });
          else gsap.to(bracket, { top, height, opacity: 1, duration: 0.45, ease: 'power3.out', overwrite: true });
        } else if (reduced) {
          gsap.set(bracket, { opacity: 0 });
        } else {
          gsap.to(bracket, { opacity: 0, duration: 0.3, overwrite: true });
        }
      }
    };

    roles.forEach((role) => {
      ScrollTrigger.create({
        trigger: role,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => {
          if (self.isActive) setActive(role);
          else if (!roles.some((r) => r !== role && ScrollTrigger.getById(r.dataset.company!)?.isActive)) setActive(null);
        },
        id: role.dataset.company,
      });
    });

    if (progress && !reduced) {
      gsap.fromTo(
        progress,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: { trigger: rolesWrap, start: 'top 55%', end: 'bottom 55%', scrub: 0.4 },
        },
      );
    }
  }

  // --- Intro and reveals (skipped under reduced motion; CSS already shows the final state) ---
  if (!reduced) {
    const rules = gsap.utils.toArray<HTMLElement>('[data-hero-rule]');
    const words = gsap.utils.toArray<HTMLElement>('[data-masthead-word]');
    const meta = document.querySelector<HTMLElement>('[data-hero-meta]');

    const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
    intro
      .from(rules, { scaleX: 0, duration: 0.7, stagger: 0.12 }, 0)
      .from(words, { yPercent: 110, duration: 0.85, stagger: 0.1 }, 0.12)
      .from(meta ? Array.from(meta.children) : [], { autoAlpha: 0, y: 10, duration: 0.5, stagger: 0.06 }, 0.55);
    if (gauge) intro.from(gauge, { autoAlpha: 0, x: -12, duration: 0.7 }, 0.7);

    gsap.utils.toArray<HTMLElement>('[data-split-head]').forEach((head) => {
      const inner = head.querySelectorAll('.wi');
      gsap.from(inner, {
        yPercent: 110,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.06,
        scrollTrigger: { trigger: head, start: 'top 88%', once: true },
      });
    });

    // Roles sink into place: a short, bounded drift, once.
    roles.forEach((role) => {
      gsap.from(role, {
        y: 28,
        duration: 0.9,
        ease: 'power2.out',
        scrollTrigger: { trigger: role, start: 'top 92%', once: true },
      });
    });

    // Language bars fill from the left as the column comes into view.
    gsap.utils.toArray<HTMLElement>('.notice__lang-fill').forEach((el, i) => {
      gsap.from(el, {
        scaleX: 0,
        duration: 0.9,
        delay: i * 0.08,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      });
    });

    gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
      gsap.from(el, {
        autoAlpha: 0,
        y: 18,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });

    disposers.push(() => intro.kill());
  }

  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  cleanup = () => {
    disposers.forEach((d) => d());
    ScrollTrigger.getAll().forEach((t) => t.kill());
    cleanup = undefined;
  };
  addEventListener('pagehide', () => cleanup?.(), { once: true });
  addEventListener('astro:before-swap', () => cleanup?.(), { once: true });
}
