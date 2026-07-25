(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const focusableSelector = 'a[href], button:not([disabled]), iframe, input, textarea, select, [tabindex]:not([tabindex="-1"])';

  // Section reveal with optional data delay.
  const revealItems = [...document.querySelectorAll('[data-project-reveal]')];
  revealItems.forEach((item) => {
    const delay = Number.parseInt(item.dataset.projectDelay || '0', 10);
    item.style.setProperty('--project-delay', `${Number.isFinite(delay) ? delay : 0}ms`);
  });

  if (revealItems.length) {
    if (reducedMotion || !('IntersectionObserver' in window)) {
      revealItems.forEach((item) => item.classList.add('is-visible'));
    } else {
      const observer = new IntersectionObserver((entries, revealObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
      revealItems.forEach((item) => observer.observe(item));
    }
  }

  // Journey progress follows the visible portion of the timeline.
  const journey = document.querySelector('[data-journey-track]');
  const journeyProgress = journey?.querySelector('[data-journey-progress]');
  if (journey && journeyProgress) {
    const updateJourney = () => {
      const rect = journey.getBoundingClientRect();
      const viewportAnchor = window.innerHeight * 0.68;
      const travelled = viewportAnchor - rect.top;
      const ratio = Math.max(0, Math.min(1, travelled / Math.max(rect.height, 1)));
      journey.style.setProperty('--journey-progress', `${Math.round(ratio * 100)}%`);
    };
    updateJourney();
    window.addEventListener('scroll', updateJourney, { passive: true });
    window.addEventListener('resize', updateJourney);
  }

  // Replace missing project images with an intentional path placeholder.
  document.querySelectorAll('[data-project-image]').forEach((image) => {
    const showFallback = () => {
      image.hidden = true;
      const fallback = image.parentElement?.querySelector('.solution-image__fallback');
      if (fallback) fallback.hidden = false;
    };
    if (image.complete && image.naturalWidth === 0) showFallback();
    image.addEventListener('error', showFallback, { once: true });
  });

  // Evidence drawer.
  const layer = document.querySelector('[data-evidence-layer]');
  const drawer = layer?.querySelector('[data-evidence-drawer]');
  const drawerTitle = layer?.querySelector('[data-evidence-title]');
  const panels = layer ? [...layer.querySelectorAll('[data-evidence-panel]')] : [];
  const openButtons = [...document.querySelectorAll('[data-evidence-open]')];
  const closeButtons = layer ? [...layer.querySelectorAll('[data-evidence-close]')] : [];
  let returnFocus = null;

  const getFocusable = () => drawer
    ? [...drawer.querySelectorAll(focusableSelector)].filter((element) => !element.hidden && element.offsetParent !== null)
    : [];

  const closeEvidence = () => {
    if (!layer?.classList.contains('is-open')) return;
    layer.classList.remove('is-open');
    layer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('project-drawer-open');
    window.setTimeout(() => {
      panels.forEach((panel) => { panel.hidden = true; });
      returnFocus?.focus?.();
      returnFocus = null;
    }, reducedMotion ? 0 : 360);
  };

  const openEvidence = (id, trigger) => {
    if (!layer || !drawer) return;
    const panel = panels.find((item) => item.dataset.evidencePanel === id);
    if (!panel) return;

    panels.forEach((item) => { item.hidden = item !== panel; });
    const title = panel.querySelector('h3')?.textContent?.trim() || 'Project evidence';
    if (drawerTitle) drawerTitle.textContent = title;

    returnFocus = trigger || document.activeElement;
    layer.classList.add('is-open');
    layer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('project-drawer-open');
    const drawerBody = drawer.querySelector('.evidence-drawer__body');
    if (drawerBody) drawerBody.scrollTop = 0;
    drawer.focus({ preventScroll: true });
  };

  openButtons.forEach((button) => {
    button.addEventListener('click', () => openEvidence(button.dataset.evidenceOpen, button));
  });
  closeButtons.forEach((button) => button.addEventListener('click', closeEvidence));

  document.addEventListener('keydown', (event) => {
    if (!layer?.classList.contains('is-open')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeEvidence();
      return;
    }
    if (event.key !== 'Tab' || !drawer) return;
    const focusable = getFocusable();
    if (!focusable.length) {
      event.preventDefault();
      drawer.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
})();
