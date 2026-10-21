import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let cleanup: (() => void) | undefined;

export function initDescent(): void {
  cleanup?.();

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const disposers: Array<() => void> = [];

  const navH = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) * 16 || 52;

  // The sentinel sits at the foot of the sky. The strip turns dark as it sticks,
  // while the island and waterline continue upward with the document.
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

  // The surface moves with the document; only a slight lateral ripple is animated.
  const waterline = document.querySelector<HTMLElement>('[data-waterline]');
  const strip = waterline?.querySelector<HTMLElement>('.waterline__strip');
  if (waterline && strip && !reduced) {
    let inView = false;
    const ripple = gsap.fromTo(strip, { xPercent: -2 }, {
      xPercent: 2, duration: 14, ease: 'none', repeat: -1, yoyo: true, paused: true,
    });
    const syncRipple = () => ripple.paused(!inView || document.visibilityState !== 'visible');
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncRipple();
    });
    observer.observe(waterline);
    document.addEventListener('visibilitychange', syncRipple);
    disposers.push(() => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', syncRipple);
      ripple.revert();
    });
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
    const pressure = gauge.querySelector<HTMLElement>('[data-gauge-pressure]');
    const pressureFill = gauge.querySelector<HTMLElement>('[data-gauge-pressure-fill]');
    const state = gauge.querySelector<HTMLElement>('[data-gauge-state]');
    const title = gauge.querySelector<HTMLElement>('[data-gauge-title]');
    const section = gauge.querySelector<HTMLElement>('[data-gauge-section]');
    const fill = gauge.querySelector<HTMLElement>('[data-gauge-fill]');
    const marker = gauge.querySelector<HTMLElement>('[data-gauge-marker]');
    const scale = gauge.querySelector<HTMLElement>('.gauge__scale');
    let tops: number[] = [];
    let depths: number[] = [];
    let sections: string[] = [];
    let trackHeight = 0;
    let ticking = false;
    let frame = 0;
    let disposed = false;
    let shown = '';
    const measure = () => {
      const pairs = anchors
        .map((a) => {
          const parent = a.closest('section');
          const heading = parent?.querySelector('h2');
          return {
            top: a.getBoundingClientRect().top + scrollY,
            depth: Number(a.dataset.depth),
            section: heading?.getAttribute('aria-label') ?? heading?.textContent?.trim() ?? 'Introduction',
          };
        })
        .sort((a, b) => a.top - b.top);
      tops = pairs.map((p) => p.top);
      depths = pairs.map((p) => p.depth);
      sections = pairs.map((p) => p.section);
      trackHeight = scale?.clientHeight ?? 0;
    };
    const currentDepth = () => {
      if (!tops.length) return 0;
      if (scrollY <= 0) return depths[0];
      const probe = scrollY + navH();
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
      if (disposed) return;
      const d = Math.round(currentDepth());
      const probe = scrollY + navH() + 24;
      let index = 0;
      for (let i = 0; i < tops.length; i++) { if (tops[i] <= probe) index = i; }
      if (scrollY >= document.documentElement.scrollHeight - innerHeight - 2) index = sections.length - 1;
      const label = sections[index];
      const signature = `${d}:${label}`;
      if (signature === shown) return;
      shown = signature;
      readout.textContent = String(d);
      if (pressure) pressure.textContent = String(Math.round((1 + d / 10) * 10) / 10);
      if (state) state.textContent = d === 0 ? 'Surface' : d === 100 ? 'Deep' : 'Diving';
      if (title) title.textContent = d === 0 ? 'At the surface' : d === 100 ? '100 metres down' : 'Under the surface';
      if (section) section.textContent = label;
      if (fill) fill.style.transform = `scaleY(${d / 100})`;
      if (pressureFill) pressureFill.style.transform = `scaleX(${d / 100})`;
      if (marker) marker.style.transform = `translateY(${trackHeight * d / 100 - 7}px)`;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      frame = requestAnimationFrame(paint);
    };
    const onResize = () => {
      if (disposed) return;
      measure();
      shown = '';
      onScroll();
    };
    measure();
    paint();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onResize);
    document.fonts?.ready.then(onResize);
    disposers.push(() => {
      disposed = true;
      cancelAnimationFrame(frame);
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
    if (gauge) intro.from(gauge, { autoAlpha: 0, duration: 0.7, clearProps: 'opacity,visibility' }, 0.7);

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

  let active = true;
  const refresh = () => { if (active) ScrollTrigger.refresh(); };
  document.fonts?.ready.then(refresh);
  const island = document.querySelector<HTMLImageElement>('.surface__island');
  if (island && !island.complete) {
    island.addEventListener('load', refresh, { once: true });
    disposers.push(() => island.removeEventListener('load', refresh));
  }

  cleanup = () => {
    active = false;
    disposers.forEach((d) => d());
    ScrollTrigger.getAll().forEach((t) => t.kill());
    cleanup = undefined;
  };
  addEventListener('pagehide', () => cleanup?.(), { once: true });
  addEventListener('astro:before-swap', () => cleanup?.(), { once: true });
}
