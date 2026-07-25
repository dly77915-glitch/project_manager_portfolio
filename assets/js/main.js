(() => {
  'use strict';

  const root = document.documentElement;
  root.classList.add('js');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Header state and mobile navigation
  const header = document.querySelector('[data-site-header]');
  const navToggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-nav]');

  const setHeaderState = () => {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 24);
  };

  setHeaderState();
  window.addEventListener('scroll', setHeaderState, { passive: true });

  if (navToggle && nav) {
    const closeNav = () => {
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open navigation');
      nav.classList.remove('is-open');
      document.body.classList.remove('nav-open');
    };

    navToggle.addEventListener('click', () => {
      const willOpen = navToggle.getAttribute('aria-expanded') !== 'true';
      navToggle.setAttribute('aria-expanded', String(willOpen));
      navToggle.setAttribute('aria-label', willOpen ? 'Close navigation' : 'Open navigation');
      nav.classList.toggle('is-open', willOpen);
      document.body.classList.toggle('nav-open', willOpen);
    });

    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeNav));
    window.addEventListener('resize', () => {
      if (window.innerWidth > 860) closeNav();
    });
  }

  // Scroll reveal
  const revealItems = document.querySelectorAll('[data-reveal]');
  if (revealItems.length) {
    if (reducedMotion || !('IntersectionObserver' in window)) {
      revealItems.forEach((item) => item.classList.add('is-visible'));
    } else {
      const revealObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.14, rootMargin: '0px 0px -8% 0px' }
      );
      revealItems.forEach((item) => revealObserver.observe(item));
    }
  }

  // Active navigation section
  const homeSections = [...document.querySelectorAll('main section[id]')];
  const navLinks = [...document.querySelectorAll('[data-nav-link]')];
  if (homeSections.length && navLinks.length && 'IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        navLinks.forEach((link) => {
          const target = link.getAttribute('href').split('#')[1];
          link.classList.toggle('is-active', target === visible.target.id);
        });
      },
      { threshold: [0.25, 0.45, 0.65] }
    );
    homeSections.forEach((section) => sectionObserver.observe(section));
  }

  // Quote parallax
  const quote = document.querySelector('[data-quote-parallax]');
  if (quote && !reducedMotion) {
    let ticking = false;
    const updateQuote = () => {
      const rect = quote.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const elementCenter = rect.top + rect.height / 2;
      const offset = Math.max(-18, Math.min(18, (viewportCenter - elementCenter) * 0.035));
      quote.style.setProperty('--quote-shift', `${offset}px`);
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(updateQuote);
        ticking = true;
      }
    }, { passive: true });
    updateQuote();
  }

  // My Story carousel
  const carousel = document.querySelector('[data-story-carousel]');
  if (carousel) {
    const track = carousel.querySelector('[data-story-track]');
    const cards = [...carousel.querySelectorAll('.story-card')];
    const previous = carousel.querySelector('[data-story-prev]');
    const next = carousel.querySelector('[data-story-next]');
    const current = carousel.querySelector('[data-story-current]');

    const cardStep = () => {
      if (!cards[0] || !track) return 0;
      const styles = window.getComputedStyle(track);
      const gap = Number.parseFloat(styles.columnGap || styles.gap || '0');
      return cards[0].getBoundingClientRect().width + gap;
    };

    const updateCurrent = () => {
      if (!track || !current || !cards.length) return;
      const step = cardStep();
      const index = step ? Math.round(track.scrollLeft / step) : 0;
      current.textContent = String(Math.min(cards.length, Math.max(1, index + 1))).padStart(2, '0');
      if (previous) previous.disabled = index <= 0;
      if (next) next.disabled = index >= cards.length - 1;
    };

    previous?.addEventListener('click', () => {
      track?.scrollBy({ left: -cardStep(), behavior: reducedMotion ? 'auto' : 'smooth' });
    });
    next?.addEventListener('click', () => {
      track?.scrollBy({ left: cardStep(), behavior: reducedMotion ? 'auto' : 'smooth' });
    });
    track?.addEventListener('scroll', updateCurrent, { passive: true });
    window.addEventListener('resize', updateCurrent);
    updateCurrent();
  }

  // Activity drawer
  const drawerLayer = document.querySelector('[data-drawer-layer]');
  const drawer = document.querySelector('[data-activity-drawer]');
  const drawerContent = document.querySelector('[data-drawer-content]');
  const openButtons = [...document.querySelectorAll('[data-activity-open]')];
  const closeButtons = [...document.querySelectorAll('[data-drawer-close]')];
  let lastFocusedElement = null;

  const focusableSelector = 'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])';

  const closeDrawer = () => {
    if (!drawerLayer || drawerLayer.hidden) return;
    drawerLayer.classList.remove('is-open');
    document.body.classList.remove('drawer-open');
    window.setTimeout(() => {
      drawerLayer.hidden = true;
      if (drawerContent) drawerContent.innerHTML = '';
      lastFocusedElement?.focus();
    }, reducedMotion ? 0 : 320);
  };

  const openDrawer = (activityId, trigger) => {
    if (!drawerLayer || !drawer || !drawerContent) return;
    const template = document.querySelector(`#activity-${activityId}`);
    if (!(template instanceof HTMLTemplateElement)) return;

    lastFocusedElement = trigger;
    drawerContent.replaceChildren(template.content.cloneNode(true));
    drawerLayer.hidden = false;
    document.body.classList.add('drawer-open');
    window.requestAnimationFrame(() => {
      drawerLayer.classList.add('is-open');
      drawer.focus();
    });
  };

  openButtons.forEach((button) => {
    button.addEventListener('click', () => openDrawer(button.dataset.activityOpen, button));
  });
  closeButtons.forEach((button) => button.addEventListener('click', closeDrawer));

  document.addEventListener('keydown', (event) => {
    if (!drawerLayer || drawerLayer.hidden) return;
    if (event.key === 'Escape') {
      closeDrawer();
      return;
    }
    if (event.key !== 'Tab' || !drawer) return;

    const focusable = [...drawer.querySelectorAll(focusableSelector)];
    if (!focusable.length) return;
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

  // Current year
  document.querySelectorAll('[data-current-year]').forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
})();
