/* PASOLA · main.js SAFE V2
   Safe version compatible with clean HTML structure
   - No crash if elements missing
   - Optional modules only
   - Keeps performance & stability
*/

(function () {
  'use strict';

  // =========================
  // SAFE QUERY HELPER
  // =========================
  function qs(selector) {
    return document.querySelector(selector);
  }

  function qsa(selector) {
    return document.querySelectorAll(selector);
  }

  // =========================
  // MOBILE NAV (OPTIONAL)
  // =========================
  var toggle = qs('.nav-toggle');
  var overlay = qs('#primary-nav');
  var backdrop = qs('.nav-backdrop');
  var closeBtn = overlay ? overlay.querySelector('.nav-close') : null;
  var body = document.body;

  function setNav(open) {
    if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (overlay) overlay.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (backdrop) backdrop.setAttribute('data-open', open ? 'true' : 'false');
    if (body) body.classList.toggle('nav-open', open);
  }

  if (toggle && overlay) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      setNav(!open);
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      setNav(false);
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', function () {
      setNav(false);
    });
  }

  if (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target && e.target.tagName === 'A') setNav(false);
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setNav(false);
  });

  // =========================
  // HEADER SCROLL STATE
  // =========================
  var header = qs('.site-header');
  var scrollThreshold = 32;
  var ticking = false;

  function updateHeader() {
    if (header) {
      header.classList.toggle('is-scrolled', window.scrollY > scrollThreshold);
    }
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }, { passive: true });

  updateHeader();

  // =========================
  // REVEAL ON SCROLL (OPTIONAL)
  // =========================
  var reveals = qsa('.reveal');

  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    reveals.forEach(function (el) {
      io.observe(el);
    });
  }

  // =========================
  // HERO VIDEO PROGRESS (OPTIONAL)
  // =========================
  var video = qs('#hero-video');
  var progressFill = qs('#hero-progress-fill');

  if (video && progressFill) {
    video.addEventListener('timeupdate', function () {
      if (video.duration) {
        var pct = (video.currentTime / video.duration) * 100;
        progressFill.style.width = pct + '%';
      }
    });
  }

  // =========================
  // FLOATING CTA (OPTIONAL)
  // =========================
  var floatingCta = qs('.floating-cta');
  var hero = qs('.hero');

  if (floatingCta && hero && 'IntersectionObserver' in window) {
    var heroVisible = true;

    var heroObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        heroVisible = entry.isIntersecting;
      });

      floatingCta.style.opacity = heroVisible ? '0' : '1';
      floatingCta.style.pointerEvents = heroVisible ? 'none' : 'auto';
    }, { threshold: 0.15 });

    heroObs.observe(hero);
  }

})();
