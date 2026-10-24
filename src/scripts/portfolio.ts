import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { initContributionTooltip } from './contribution-tooltip';

import { initPhotoGallery } from './photo-gallery';
import { initProjectCardLayout } from './project-card-layout';

export function initPortfolio() {
  const cleanups: (() => void)[] = [];
  const buttons = [
    ...document.querySelectorAll<HTMLButtonElement>("[data-year]"),
  ];
  const panels = [...document.querySelectorAll<HTMLElement>("[data-panel]")];
  function selectYear(year: string, updateUrl = true) {
    if (!buttons.some((b) => b.dataset.year === year)) return;
    buttons.forEach((b) => {
      const active = b.dataset.year === year;
      b.classList.toggle("selected", active);
      b.setAttribute("aria-pressed", String(active));
    });
    panels.forEach((p) => {
      p.hidden = p.dataset.panel !== year;
    });
    const announcement = document.querySelector("#year-announcement");
    if (announcement)
      announcement.textContent = `Showing daily commit history for ${year}.`;
    if (updateUrl) {
      const url = new URL(location.href);
      url.searchParams.set("year", year);
      history.replaceState(null, "", url);
    }
    ScrollTrigger.refresh();
  }
  buttons.forEach((button) => {
    const handler = () => selectYear(button.dataset.year!);
    button.addEventListener("click", handler);
    cleanups.push(() => button.removeEventListener("click", handler));
  });
  const year = new URLSearchParams(location.search).get("year");
  if (year) selectYear(year, false);
  cleanups.push(initContributionTooltip());
  cleanups.push(initPhotoGallery());
  cleanups.push(initProjectCardLayout());

  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia();
  media.add("(prefers-reduced-motion: no-preference)", () => {
    const headingRestorers: (() => void)[] = [];
    const context = gsap.context(() => {
      gsap.from(".hero-heading h1", {
        y: 25,
        duration: 0.9,
        ease: "power3.out",
      });
      gsap.from(".hero-intro", {
        y: 16,
        duration: 0.9,
        delay: 0.12,
        ease: "power3.out",
      });
      gsap.from(".phone-wrap", {
        y: 40,
        rotation: -9,
        duration: 1.3,
        ease: "power3.out",
        delay: 0.1,
      });
      gsap.from(".language-meter > span", {
        scaleX: 0,
        clearProps: "transform",
        stagger: 0.08,
        duration: 1.1,
        ease: "power3.out",
        scrollTrigger: { trigger: ".languages", start: "top 85%", once: true },
      });
      // Text stays visible at all times, including interrupted intros.
      document
        .querySelectorAll<HTMLElement>(".section-head h2")
        .forEach((heading) => {
          const original = heading.innerHTML;
          const label = heading.innerText.replace(/\s+/g, " ").trim();
          heading.setAttribute("aria-label", label);
          const walker = document.createTreeWalker(
            heading,
            NodeFilter.SHOW_TEXT,
          );
          const nodes: Text[] = [];
          while (walker.nextNode()) nodes.push(walker.currentNode as Text);
          nodes.forEach((node) => {
            const fragment = document.createDocumentFragment();
            node.textContent?.split(/(\s+)/).forEach((word) => {
              if (!word.trim()) {
                fragment.append(document.createTextNode(word));
                return;
              }
              const span = document.createElement("span");
              span.className = "motion-word";
              span.setAttribute("aria-hidden", "true");
              span.textContent = word;
              fragment.append(span);
            });
            node.replaceWith(fragment);
          });
          gsap.from(heading.querySelectorAll(".motion-word"), {
            y: 18,
            stagger: 0.035,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: { trigger: heading, start: "top 92%", once: true },
          });
          headingRestorers.push(() => {
            heading.innerHTML = original;
            heading.removeAttribute("aria-label");
          });
        });
    });
    const refresh = () => ScrollTrigger.refresh();
    const details = [...document.querySelectorAll("details")];
    details.forEach((detail) => detail.addEventListener("toggle", refresh));
    document.fonts.ready.then(refresh);
    window.addEventListener("load", refresh, { once: true });
    return () => {
      details.forEach((d) => d.removeEventListener("toggle", refresh));
      window.removeEventListener("load", refresh);
      context.revert();
      headingRestorers.forEach((restore) => restore());
    };
  });
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    cleanups.forEach((fn) => fn());
    media.revert();
    window.removeEventListener("pagehide", onPageHide);
    document.removeEventListener("astro:before-swap", dispose);
  };
  const onPageHide = (event: PageTransitionEvent) => {
    dispose();
    if (event.persisted)
      window.addEventListener("pageshow", () => initPortfolio(), {
        once: true,
      });
  };
  window.addEventListener("pagehide", onPageHide, { once: true });
  document.addEventListener("astro:before-swap", dispose, { once: true });
}
