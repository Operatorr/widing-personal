/**
 * Marine snow: a 2D-canvas particle field fixed behind the content.
 * Particles are scattered at random (no tiling), drift down with a slow sway,
 * and get pushed aside by the pointer's wake as if something swam past.
 * Cheap on purpose: one canvas, no allocation per frame, DPR capped, paused
 * when the tab is hidden, disposed on page hide.
 */
export function mountSnow(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return () => {};

  const DPR = Math.min(devicePixelRatio || 1, 1.5);
  let W = 0;
  let H = 0;
  let count = 0;

  // Flat typed arrays: x, y, radius, depth (0 near .. 1 far), drift speed, sway phase, vx, vy
  const MAX = 260;
  const px = new Float32Array(MAX);
  const py = new Float32Array(MAX);
  const pr = new Float32Array(MAX);
  const pd = new Float32Array(MAX);
  const ps = new Float32Array(MAX);
  const pp = new Float32Array(MAX);
  const vx = new Float32Array(MAX);
  const vy = new Float32Array(MAX);

  const seed = (i: number) => {
    px[i] = Math.random() * W;
    py[i] = Math.random() * H;
    pd[i] = Math.random();
    pr[i] = 0.5 + Math.random() * 1.4 * (1 - pd[i] * 0.6);
    ps[i] = 8 + Math.random() * 18; // px per second
    pp[i] = Math.random() * Math.PI * 2;
    vx[i] = 0;
    vy[i] = 0;
  };

  const resize = () => {
    W = innerWidth;
    H = innerHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    // Density scales with area, capped.
    count = Math.min(MAX, Math.round((W * H) / 7000));
    for (let i = 0; i < count; i++) seed(i);
  };

  // Pointer wake: position plus smoothed velocity.
  let mx = -1e4;
  let my = -1e4;
  let lastX = mx;
  let lastY = my;
  let mvx = 0;
  let mvy = 0;
  let pointerActive = false;
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    mx = e.clientX;
    my = e.clientY;
    pointerActive = true;
  };
  const onLeave = () => {
    pointerActive = false;
    mx = my = -1e4;
  };

  let raf = 0;
  let last = performance.now();
  let running = false;

  const frame = (now: number) => {
    raf = 0;
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    // Smooth the pointer velocity so the wake is a push, not a jitter.
    if (pointerActive) {
      const dx = mx - lastX;
      const dy = my - lastY;
      mvx += (dx / Math.max(dt, 1e-3) - mvx) * 0.25;
      mvy += (dy / Math.max(dt, 1e-3) - mvy) * 0.25;
    } else {
      mvx *= 0.9;
      mvy *= 0.9;
    }
    lastX = mx;
    lastY = my;
    const speed = Math.hypot(mvx, mvy);
    const R = 140; // wake radius in px

    ctx.clearRect(0, 0, W, H);
    const t = now / 1000;
    for (let i = 0; i < count; i++) {
      const depth = pd[i];
      // Base drift: downwards, with a sideways sway that differs per particle.
      const sway = Math.sin(t * (0.35 + depth * 0.4) + pp[i]) * (6 + 10 * (1 - depth));
      let x = px[i] + (sway * dt) + vx[i] * dt;
      let y = py[i] + ps[i] * (1.3 - depth * 0.8) * dt + vy[i] * dt;

      // Pointer wake: push particles away from the pointer along its motion, stronger when it moves fast.
      const ddx = x - mx;
      const ddy = y - my;
      const d2 = ddx * ddx + ddy * ddy;
      if (d2 < R * R && speed > 20) {
        const d = Math.sqrt(d2) || 1;
        const k = (1 - d / R) * Math.min(speed, 1400) / 1400;
        // Mostly sideways to the pointer's path, a little along it.
        const nx = ddx / d;
        const ny = ddy / d;
        vx[i] += (nx * 260 + mvx * 0.08) * k * (1 - depth * 0.5);
        vy[i] += (ny * 260 + mvy * 0.08) * k * (1 - depth * 0.5);
      }
      // Water damping.
      vx[i] *= 0.94;
      vy[i] *= 0.94;

      // Wrap around the viewport.
      if (y > H + 4) { y = -4; x = Math.random() * W; }
      if (x < -4) x = W + 4;
      else if (x > W + 4) x = -4;
      px[i] = x;
      py[i] = y;

      const a = 0.12 + (1 - depth) * 0.3;
      ctx.beginPath();
      ctx.arc(x, y, pr[i], 0, Math.PI * 2);
      ctx.fillStyle = `rgba(230,241,245,${a.toFixed(3)})`;
      ctx.fill();
    }
    raf = requestAnimationFrame(frame);
  };

  const start = () => {
    if (running) return;
    running = true;
    last = performance.now();
    if (!raf) raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };
  const onVisibility = () => (document.visibilityState === 'visible' ? start() : stop());

  resize();
  addEventListener('resize', resize, { passive: true });
  addEventListener('pointermove', onMove, { passive: true });
  addEventListener('pointerleave', onLeave);
  addEventListener('blur', onLeave);
  document.addEventListener('visibilitychange', onVisibility);
  start();

  return () => {
    stop();
    removeEventListener('resize', resize);
    removeEventListener('pointermove', onMove);
    removeEventListener('pointerleave', onLeave);
    removeEventListener('blur', onLeave);
    document.removeEventListener('visibilitychange', onVisibility);
    ctx.clearRect(0, 0, W, H);
  };
}
