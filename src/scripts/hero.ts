import {
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
} from 'three';
import { fragmentShader, vertexShader } from './shader';

/**
 * Mounts the WebGL light-shaft plane behind the hero.
 * Leaves the CSS poster in place on reduced motion or when WebGL is unavailable.
 */
export function mountHero(hero: HTMLElement, canvas: HTMLCanvasElement): void {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'low-power' });
  } catch {
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));

  const uniforms = {
    uTime: { value: 0 },
    uResolution: { value: new Vector2(1, 1) },
    uPointer: { value: new Vector2(0.5, 0.7) },
    uScroll: { value: 0 },
  };
  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const geometry = new PlaneGeometry(2, 2);
  const material = new ShaderMaterial({ uniforms, vertexShader, fragmentShader, depthTest: false, depthWrite: false });
  scene.add(new Mesh(geometry, material));

  // Pointer: the move handler only records a target; smoothing happens per frame.
  const target = new Vector2(0.5, 0.7);
  let inView = false;
  let visible = document.visibilityState === 'visible';
  let contextLost = false;
  let raf = 0;
  let running = false;
  let last = 0;
  let live = false;

  function resize() {
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    renderer.setSize(w, h, false);
    uniforms.uResolution.value.set(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
  }

  function onPointer(e: PointerEvent) {
    const r = hero.getBoundingClientRect();
    target.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
  }

  function onScroll() {
    const h = hero.offsetHeight || 1;
    uniforms.uScroll.value = Math.min(1, Math.max(0, scrollY / h));
  }

  function frame(now: number) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    uniforms.uTime.value += dt;
    const p = uniforms.uPointer.value;
    p.x += (target.x - p.x) * 0.06;
    p.y += (target.y - p.y) * 0.06;
    renderer.render(scene, camera);
    if (!live) {
      live = true;
      canvas.classList.add('is-live');
    }
  }

  function sync() {
    const should = inView && visible && !contextLost;
    if (should && !running) {
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    } else if (!should && running) {
      running = false;
      cancelAnimationFrame(raf);
    }
  }

  const io = new IntersectionObserver((entries) => {
    inView = entries.some((e) => e.isIntersecting);
    sync();
  }, { threshold: 0 });
  io.observe(hero);

  const ro = new ResizeObserver(resize);
  ro.observe(hero);

  function onVisibility() {
    visible = document.visibilityState === 'visible';
    sync();
  }
  function onLost(e: Event) {
    e.preventDefault();
    contextLost = true;
    canvas.classList.remove('is-live');
    live = false;
    sync();
  }
  function onRestored() {
    contextLost = false;
    resize();
    sync();
  }

  hero.addEventListener('pointermove', onPointer, { passive: true });
  addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);

  resize();
  onScroll();
  sync();

  function dispose() {
    running = false;
    cancelAnimationFrame(raf);
    io.disconnect();
    ro.disconnect();
    hero.removeEventListener('pointermove', onPointer);
    removeEventListener('scroll', onScroll);
    document.removeEventListener('visibilitychange', onVisibility);
    canvas.removeEventListener('webglcontextlost', onLost);
    canvas.removeEventListener('webglcontextrestored', onRestored);
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    removeEventListener('pagehide', dispose);
    document.removeEventListener('astro:before-swap', dispose);
  }
  addEventListener('pagehide', dispose, { once: true });
  document.addEventListener('astro:before-swap', dispose, { once: true });
}
