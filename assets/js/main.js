/**
 * main.js
 * Vanilla JS only, no dependencies — kept framework-free so this stays easy
 * to extend as more sections/pages are added later.
 */
(function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* 1. Scroll-reveal animations                                        */
  /* Any element with class="reveal" fades/slides in once it enters the */
  /* viewport. Optional data-delay="ms" staggers siblings (used by the  */
  /* 4 Pillars grid).                                                   */
  /* ------------------------------------------------------------------ */
  function initScrollReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var delay = parseInt(el.getAttribute("data-delay") || "0", 10);
          setTimeout(function () { el.classList.add("is-visible"); }, delay);
          observer.unobserve(el);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );

    items.forEach(function (el) { observer.observe(el); });
  }

  /* ------------------------------------------------------------------ */
  /* 2. Off-canvas drawer for the "Beyond Work" activity cards           */
  /* ------------------------------------------------------------------ */
  function initActivityDrawer() {
    var drawer = document.getElementById("drawer");
    var overlay = document.getElementById("drawer-overlay");
    var closeBtn = document.getElementById("drawer-close");
    var triggers = document.querySelectorAll("[data-drawer-target]");
    var panels = document.querySelectorAll("[data-drawer-panel]");

    if (!drawer || !overlay || !triggers.length) return;

    function openDrawer(key) {
      panels.forEach(function (panel) {
        panel.classList.toggle("is-active", panel.getAttribute("data-drawer-panel") === key);
      });
      drawer.classList.add("is-open");
      overlay.classList.add("is-open");
      drawer.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    function closeDrawer() {
      drawer.classList.remove("is-open");
      overlay.classList.remove("is-open");
      drawer.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    triggers.forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        openDrawer(trigger.getAttribute("data-drawer-target"));
      });
    });

    if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
    overlay.addEventListener("click", closeDrawer);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeDrawer();
    });
  }

  /* ------------------------------------------------------------------ */
  /* 3. Mobile nav toggle                                                */
  /* ------------------------------------------------------------------ */
  function initNavToggle() {
    var toggle = document.getElementById("nav-toggle");
    var nav = document.getElementById("site-nav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    // Close mobile nav after tapping a link.
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initScrollReveal();
    initActivityDrawer();
    initNavToggle();
  });
})();
