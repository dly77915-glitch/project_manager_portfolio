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

  // Sticky project navigator: compact anchors, reliable cross-section navigation,
  // active-section tracking, and horizontal-only chip centering.
  const projectNavigator = document.querySelector('[data-project-navigator]');
  const projectNavLinks = projectNavigator
    ? [...projectNavigator.querySelectorAll('[data-project-nav-link]')]
    : [];

  if (projectNavigator && projectNavLinks.length) {
    const projectNavScroller = projectNavigator.querySelector('[data-project-nav-scroll]');
    const projectNavTargets = projectNavLinks
      .map((link) => ({
        link,
        target: document.getElementById(link.dataset.projectNavTarget || '')
      }))
      .filter((item) => item.target);

    let activeProjectNavId = '';
    let projectNavTicking = false;
    let isProjectNavNavigating = false;
    let projectNavUnlockTimer = 0;
    let intendedProjectNavTop = null;

    const navigatorOffset = () => {
      const headerHeight = Number.parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--header-height')
      ) || 0;
      return headerHeight + projectNavigator.offsetHeight + 12;
    };

    const centerProjectNavLink = (link) => {
      if (!link || !projectNavScroller || projectNavScroller.scrollWidth <= projectNavScroller.clientWidth) return;

      const desiredLeft = link.offsetLeft - ((projectNavScroller.clientWidth - link.offsetWidth) / 2);
      const maxLeft = Math.max(0, projectNavScroller.scrollWidth - projectNavScroller.clientWidth);
      projectNavScroller.scrollTo({
        left: Math.max(0, Math.min(desiredLeft, maxLeft)),
        behavior: reducedMotion ? 'auto' : 'smooth'
      });
    };

    const setActiveProjectNav = (id, center = false) => {
      if (!id) return;
      const changed = id !== activeProjectNavId;
      activeProjectNavId = id;

      projectNavLinks.forEach((link) => {
        const isActive = link.dataset.projectNavTarget === id;
        link.classList.toggle('is-active', isActive);
        if (isActive) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });

      if (center && changed) {
        centerProjectNavLink(
          projectNavLinks.find((link) => link.dataset.projectNavTarget === id)
        );
      }
    };

    const unlockProjectNav = () => {
      isProjectNavNavigating = false;
      intendedProjectNavTop = null;
      window.clearTimeout(projectNavUnlockTimer);
      projectNavUnlockTimer = 0;
      requestProjectNavUpdate();
    };

    const scheduleProjectNavUnlock = (delay = 180) => {
      window.clearTimeout(projectNavUnlockTimer);
      projectNavUnlockTimer = window.setTimeout(unlockProjectNav, delay);
    };

    const updateActiveProjectNav = () => {
      projectNavTicking = false;
      if (isProjectNavNavigating) return;

      const marker = window.scrollY + navigatorOffset() + 28;
      let current = projectNavTargets[0]?.target.id || '';
      projectNavTargets.forEach(({ target }) => {
        if (target.offsetTop <= marker) current = target.id;
      });
      setActiveProjectNav(current, true);
    };

    function requestProjectNavUpdate() {
      if (projectNavTicking) return;
      projectNavTicking = true;
      window.requestAnimationFrame(updateActiveProjectNav);
    }

    projectNavLinks.forEach((link) => {
      link.addEventListener('click', (event) => {
        const target = document.getElementById(link.dataset.projectNavTarget || '');
        if (!target) return;

        event.preventDefault();
        window.clearTimeout(projectNavUnlockTimer);
        isProjectNavNavigating = true;

        const top = Math.max(
          0,
          target.getBoundingClientRect().top + window.scrollY - navigatorOffset()
        );
        intendedProjectNavTop = top;

        setActiveProjectNav(target.id, true);
        window.history.replaceState(null, '', `#${target.id}`);
        window.scrollTo({
          top,
          behavior: reducedMotion ? 'auto' : 'smooth'
        });

        if (reducedMotion) {
          window.requestAnimationFrame(unlockProjectNav);
        } else {
          scheduleProjectNavUnlock(1200);
        }
      });
    });

    window.addEventListener('scroll', () => {
      if (isProjectNavNavigating) {
        if (intendedProjectNavTop !== null && Math.abs(window.scrollY - intendedProjectNavTop) <= 5) {
          scheduleProjectNavUnlock(90);
        } else {
          scheduleProjectNavUnlock(220);
        }
        return;
      }
      requestProjectNavUpdate();
    }, { passive: true });

    window.addEventListener('resize', () => {
      if (isProjectNavNavigating) unlockProjectNav();
      requestProjectNavUpdate();
    });

    window.addEventListener('load', () => {
      const hashTarget = window.location.hash
        ? document.querySelector(window.location.hash)
        : null;

      if (hashTarget && projectNavTargets.some(({ target }) => target === hashTarget)) {
        window.setTimeout(() => {
          const top = Math.max(
            0,
            hashTarget.getBoundingClientRect().top + window.scrollY - navigatorOffset()
          );
          window.scrollTo({ top, behavior: 'auto' });
          setActiveProjectNav(hashTarget.id, true);
        }, 60);
      } else {
        requestProjectNavUpdate();
      }
    }, { once: true });

    requestProjectNavUpdate();
  }

})();
