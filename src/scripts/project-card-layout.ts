export function initProjectCardLayout() {
  const vibe = document.querySelector<HTMLElement>('.product-card--vibe-translate');
  const omega = document.querySelector<HTMLElement>('.product-card--ashen-omega');
  const vibeBody = vibe?.querySelector<HTMLElement>('.product-card__body');
  const omegaLink = omega?.querySelector<HTMLElement>('.product-card__link');
  const details = omega?.querySelector<HTMLElement>('details');
  const summary = details?.querySelector<HTMLElement>('summary');
  if (!vibe || !vibeBody || !omegaLink || !details || !summary) return () => {};

  const desktop = window.matchMedia('(min-width: 761px)');
  function alignCards() {
    if (!desktop.matches) {
      vibe!.style.removeProperty('--vibe-media-height');
      return;
    }
    // Use only the collapsed disclosure height, even while its content is open.
    const spacing = getComputedStyle(details!);
    const disclosureHeight = summary!.getBoundingClientRect().height
      + parseFloat(spacing.marginTop) + parseFloat(spacing.marginBottom);
    const imageHeight = omegaLink!.getBoundingClientRect().height
      + disclosureHeight - vibeBody!.getBoundingClientRect().height;
    vibe!.style.setProperty('--vibe-media-height', `${imageHeight}px`);
  }

  const observer = new ResizeObserver(alignCards);
  [vibeBody, omegaLink, summary].forEach(element => observer.observe(element));
  desktop.addEventListener('change', alignCards);
  alignCards();
  return () => {
    observer.disconnect();
    desktop.removeEventListener('change', alignCards);
    vibe.style.removeProperty('--vibe-media-height');
  };
}
