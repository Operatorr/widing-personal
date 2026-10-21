/** One shared tooltip, with roving keyboard focus instead of 365 tab stops. */
export function initContributionTooltip() {
  const section = document.querySelector<HTMLElement>('#contributions');
  if (!section) return () => {};
  const tooltip = document.createElement('div');
  tooltip.id = 'contribution-day-tooltip';
  tooltip.className = 'day-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.setAttribute('aria-hidden', 'true');
  tooltip.innerHTML = '<p class="day-tooltip-date"></p><p class="day-tooltip-count"></p><p class="day-tooltip-repos"></p>';
  document.body.append(tooltip);
  const date = tooltip.querySelector<HTMLElement>('.day-tooltip-date')!;
  const count = tooltip.querySelector<HTMLElement>('.day-tooltip-count')!;
  const repos = tooltip.querySelector<HTMLElement>('.day-tooltip-repos')!;
  const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const numberFormat = new Intl.NumberFormat('en-US');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let active: HTMLButtonElement | null = null;
  let openTimer: ReturnType<typeof setTimeout> | undefined;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  const removers: (() => void)[] = [];
  const dayFrom = (target: EventTarget | null) => target instanceof Element ? target.closest<HTMLButtonElement>('button.day[data-date]') : null;
  function listen(target: EventTarget, type: string, handler: (event: any) => void, capture = false) {
    target.addEventListener(type, handler, capture);
    removers.push(() => target.removeEventListener(type, handler, capture));
  }
  function clearTimers() {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
  }
  function hide() {
    clearTimers();
    active?.classList.remove('is-active');
    active?.removeAttribute('aria-describedby');
    active = null;
    tooltip.classList.remove('is-open');
    tooltip.setAttribute('aria-hidden', 'true');
  }
  function position(day: HTMLButtonElement) {
    const rect = day.getBoundingClientRect();
    const width = tooltip.offsetWidth;
    const height = tooltip.offsetHeight;
    const margin = 12;
    const left = Math.max(margin, Math.min(rect.left + rect.width / 2 - width / 2, innerWidth - width - margin));
    const above = rect.top >= height + 16;
    const top = Math.max(margin, Math.min(above ? rect.top - height - 12 : rect.bottom + 12, innerHeight - height - margin));
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.style.transformOrigin = `${Math.max(0, Math.min(width, rect.left + rect.width / 2 - left))}px ${above ? 'bottom' : 'top'}`;
  }
  function show(day: HTMLButtonElement, instant = false) {
    clearTimers();
    const wasOpen = Boolean(active);
    active?.classList.remove('is-active');
    active?.removeAttribute('aria-describedby');
    active = day;
    const commits = Number(day.dataset.commits);
    const repositories = Number(day.dataset.repositories);
    const future = day.dataset.future === 'true';
    date.textContent = dateFormat.format(new Date(`${day.dataset.date}T00:00:00Z`));
    count.textContent = future ? 'Future date' : `${numberFormat.format(commits)} ${commits === 1 ? 'commit' : 'commits'}`;
    repos.textContent = future ? 'No activity recorded yet' : `across ${numberFormat.format(repositories)} ${repositories === 1 ? 'repository' : 'repositories'}`;
    tooltip.dataset.instant = String(instant || wasOpen);
    position(day);
    day.classList.add('is-active');
    day.setAttribute('aria-describedby', tooltip.id);
    tooltip.setAttribute('aria-hidden', 'false');
    tooltip.classList.add('is-open');
  }
  function scheduleClose() {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      if (!active?.matches(':focus-visible')) hide();
    }, 125);
  }
  // Native title remains a no-JavaScript fallback, but must not duplicate our tooltip.
  const days = [...section.querySelectorAll<HTMLButtonElement>('button.day[data-date]')];
  days.forEach(day => day.removeAttribute('title'));
  listen(section, 'pointerover', (event: PointerEvent) => {
    if (event.pointerType === 'touch' || !finePointer.matches) return;
    const day = dayFrom(event.target);
    if (!day || day === dayFrom(event.relatedTarget)) return;
    clearTimers();
    if (active) show(day, true);
    else openTimer = setTimeout(() => show(day), 100);
  });
  listen(section, 'pointerout', (event: PointerEvent) => {
    if (dayFrom(event.target) && !tooltip.contains(event.relatedTarget as Node | null)) scheduleClose();
  });
  listen(tooltip, 'pointerenter', () => clearTimers());
  listen(tooltip, 'pointerleave', scheduleClose);
  listen(section, 'focusin', (event: FocusEvent) => {
    const day = dayFrom(event.target);
    if (!day) return;
    day.closest('.calendar-grid')?.querySelectorAll<HTMLButtonElement>('.day[data-date]').forEach(cell => { cell.tabIndex = cell === day ? 0 : -1; });
    show(day, true);
  });
  listen(section, 'focusout', (event: FocusEvent) => {
    if (dayFrom(event.target)) hide();
  });
  listen(section, 'keydown', (event: KeyboardEvent) => {
    const day = dayFrom(event.target);
    if (!day) return;
    const cells = [...day.closest('.calendar-grid')!.querySelectorAll<HTMLButtonElement>('button.day')];
    const index = cells.indexOf(day);
    const offsets: Record<string, number> = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7 };
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? cells.length - 1 : event.key in offsets ? Math.max(0, Math.min(cells.length - 1, index + offsets[event.key])) : null;
    if (next === null) return;
    event.preventDefault();
    cells[next].focus({ preventScroll: true });
    cells[next].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    show(cells[next], true);
  });
  listen(document, 'keydown', (event: KeyboardEvent) => { if (event.key === 'Escape') hide(); });
  listen(document, 'click', (event: MouseEvent) => {
    const day = dayFrom(event.target);
    if (day && section.contains(day)) show(day, true);
    else if (!tooltip.contains(event.target as Node)) hide();
  });
  listen(document, 'scroll', () => {
    if (active?.matches(':focus-visible')) position(active);
    else hide();
  }, true);
  listen(window, 'resize', hide);
  return () => {
    hide();
    removers.forEach(remove => remove());
    days.forEach(day => day.setAttribute('title', day.getAttribute('aria-label') || ''));
    tooltip.remove();
  };
}
