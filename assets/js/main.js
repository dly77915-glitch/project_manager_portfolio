(() => {
  'use strict';

  const root = document.documentElement;
  root.classList.add('js');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const focusableSelector = 'a[href], button:not([disabled]), iframe, input, textarea, select, [tabindex]:not([tabindex="-1"])';

  // Header state and mobile navigation
  const header = document.querySelector('[data-site-header]');
  const navToggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-nav]');

  const setHeaderState = () => {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 24);
  };

  setHeaderState();
  window.addEventListener('scroll', setHeaderState, { passive: true });

  const closeNav = () => {
    if (!navToggle || !nav) return;
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open navigation');
    nav.classList.remove('is-open');
    document.body.classList.remove('nav-open');
  };

  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const willOpen = navToggle.getAttribute('aria-expanded') !== 'true';
      navToggle.setAttribute('aria-expanded', String(willOpen));
      navToggle.setAttribute('aria-label', willOpen ? 'Close navigation' : 'Open navigation');
      nav.classList.toggle('is-open', willOpen);
      document.body.classList.toggle('nav-open', willOpen);
    });

    nav.querySelectorAll('a, button[data-cv-open]').forEach((control) => control.addEventListener('click', closeNav));
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

  const refreshDrawerLock = () => {
    const hasOpenDrawer = Boolean(document.querySelector('.drawer-layer.is-open'));
    document.body.classList.toggle('drawer-open', hasOpenDrawer);
  };

  const trapDrawerFocus = (event, drawer) => {
    if (event.key !== 'Tab' || !drawer) return;
    const focusable = [...drawer.querySelectorAll(focusableSelector)].filter((element) => !element.hasAttribute('hidden'));
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
  };

  // CV drawer — shared by Header, Hero, and Footer buttons
  const cvLayer = document.querySelector('[data-cv-layer]');
  const cvDrawer = document.querySelector('[data-cv-drawer]');
  const cvOpenButtons = [...document.querySelectorAll('[data-cv-open]')];
  const cvCloseButtons = [...document.querySelectorAll('[data-cv-close]')];
  let cvLastFocused = null;

  const closeCvDrawer = () => {
    if (!cvLayer || cvLayer.hidden) return;
    cvLayer.classList.remove('is-open');
    window.setTimeout(() => {
      cvLayer.hidden = true;
      refreshDrawerLock();
      cvLastFocused?.focus();
    }, reducedMotion ? 0 : 380);
  };

  const openCvDrawer = (trigger) => {
    if (!cvLayer || !cvDrawer) return;
    cvLastFocused = trigger;
    cvLayer.hidden = false;
    window.requestAnimationFrame(() => {
      cvLayer.classList.add('is-open');
      refreshDrawerLock();
      cvDrawer.focus();
    });
  };

  cvOpenButtons.forEach((button) => button.addEventListener('click', () => openCvDrawer(button)));
  cvCloseButtons.forEach((button) => button.addEventListener('click', closeCvDrawer));

  // YouTube link parser for the Kinh Van Hoa intro placeholder
  const getYouTubeId = (input) => {
    if (!input) return '';
    try {
      const url = new URL(input);
      if (url.hostname.includes('youtu.be')) return url.pathname.split('/').filter(Boolean)[0] || '';
      if (url.pathname.includes('/embed/')) return url.pathname.split('/embed/')[1]?.split('/')[0] || '';
      if (url.pathname.includes('/shorts/')) return url.pathname.split('/shorts/')[1]?.split('/')[0] || '';
      return url.searchParams.get('v') || '';
    } catch {
      return input.match(/^[\w-]{11}$/) ? input : '';
    }
  };

  const initialiseYouTubeEmbeds = (container) => {
    container.querySelectorAll('[data-youtube-embed]').forEach((embed) => {
      const videoId = getYouTubeId(embed.dataset.youtubeUrl?.trim());
      if (!videoId) return;
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`;
      iframe.title = embed.dataset.youtubeTitle || 'YouTube video';
      iframe.loading = 'lazy';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      embed.replaceChildren(iframe);
    });
  };

  // Activity drawer
  const activityLayer = document.querySelector('[data-activity-layer]');
  const activityDrawer = document.querySelector('[data-activity-drawer]');
  const activityContent = document.querySelector('[data-activity-content]');
  const activityOpenButtons = [...document.querySelectorAll('[data-activity-open]')];
  const activityCloseButtons = [...document.querySelectorAll('[data-activity-close]')];
  let activityLastFocused = null;

  const closeActivityDrawer = () => {
    if (!activityLayer || activityLayer.hidden) return;
    activityLayer.classList.remove('is-open');
    window.setTimeout(() => {
      activityLayer.hidden = true;
      if (activityContent) activityContent.innerHTML = '';
      refreshDrawerLock();
      activityLastFocused?.focus();
    }, reducedMotion ? 0 : 380);
  };

  const openActivityDrawer = (activityId, trigger) => {
    if (!activityLayer || !activityDrawer || !activityContent) return;
    const template = document.querySelector(`#activity-${activityId}`);
    if (!(template instanceof HTMLTemplateElement)) return;

    activityLastFocused = trigger;
    activityContent.replaceChildren(template.content.cloneNode(true));
    initialiseYouTubeEmbeds(activityContent);
    activityLayer.hidden = false;
    window.requestAnimationFrame(() => {
      activityLayer.classList.add('is-open');
      refreshDrawerLock();
      activityDrawer.focus();
    });
  };

  activityOpenButtons.forEach((button) => {
    button.addEventListener('click', () => openActivityDrawer(button.dataset.activityOpen, button));
  });
  activityCloseButtons.forEach((button) => button.addEventListener('click', closeActivityDrawer));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (activityLayer && !activityLayer.hidden) {
        closeActivityDrawer();
        return;
      }
      if (cvLayer && !cvLayer.hidden) closeCvDrawer();
      return;
    }

    if (activityLayer && !activityLayer.hidden) {
      trapDrawerFocus(event, activityDrawer);
    } else if (cvLayer && !cvLayer.hidden) {
      trapDrawerFocus(event, cvDrawer);
    }
  });

  // Current year
  document.querySelectorAll('[data-current-year]').forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
})();
