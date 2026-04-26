/* PASOLA · pasola.fr · main script · v1
   Reveal animations, carousel progress, sound toggle, sticky CTA observer. */

(function() {
  'use strict';

  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var overlay = document.getElementById('primary-nav');
  var body = document.body;

  function setNavOpen(open) {
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    overlay.setAttribute('aria-hidden', open ? 'false' : 'true');
    body.style.overflow = open ? 'hidden' : '';
  }

  toggle.addEventListener('click', function() {
    var open = toggle.getAttribute('aria-expanded') === 'true';
    setNavOpen(!open);
  });

  overlay.addEventListener('click', function(e) {
    if (e.target.tagName === 'A') setNavOpen(false);
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') setNavOpen(false);
  });

  // Header progressif · rétraction au scroll
  var header = document.querySelector('.site-header');
  var scrollThreshold = 32;
  var scrollTicking = false;

  function updateHeader() {
    var shouldShrink = window.scrollY > scrollThreshold;
    header.classList.toggle('is-scrolled', shouldShrink);
    scrollTicking = false;
  }

  window.addEventListener('scroll', function() {
    if (!scrollTicking) {
      window.requestAnimationFrame(updateHeader);
      scrollTicking = true;
    }
  }, { passive: true });

  updateHeader();

  // Reveal on scroll (IntersectionObserver, zero dep)
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });
    reveals.forEach(function(el) { io.observe(el); });
  } else {
    reveals.forEach(function(el) { el.classList.add('is-visible'); });
  }

  // Sound toggle — active/désactive la bande-son ambiante PASOLA (audio séparé,
  // même pattern que pasola.fr actuel). La vidéo reste muette en permanence.
  var video = document.getElementById('hero-video');
  var soundBtn = document.getElementById('sound-toggle');
  var bgMusic = document.getElementById('bg-music');

  var iconMuted = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M5 9H2v6h3l5 4V5L5 9z" fill="currentColor"/>' +
    '<line x1="15" y1="9" x2="21" y2="15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
    '<line x1="21" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
    '</svg>';
  var iconOn = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M5 9H2v6h3l5 4V5L5 9z" fill="currentColor"/>' +
    '<path d="M15 8c1.6 1 2.4 2.4 2.4 4s-0.8 3-2.4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/>' +
    '<path d="M18 5c2.8 1.6 4 4 4 7s-1.2 5.4-4 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/>' +
    '</svg>';

  if (bgMusic && soundBtn) {
    soundBtn.addEventListener('click', function() {
      if (bgMusic.paused) {
        // Activer la bande-son
        var playPromise = bgMusic.play();
        if (playPromise && playPromise.catch) {
          playPromise.catch(function() { /* autoplay bloqué silencieusement */ });
        }
        soundBtn.setAttribute('aria-pressed', 'true');
        soundBtn.setAttribute('aria-label', 'Couper la bande-son');
        soundBtn.innerHTML = iconOn;
      } else {
        // Couper la bande-son
        bgMusic.pause();
        soundBtn.setAttribute('aria-pressed', 'false');
        soundBtn.setAttribute('aria-label', 'Activer la bande-son');
        soundBtn.innerHTML = iconMuted;
      }
    });
  }

  // Progress indicator hero · suit la lecture vidéo (spec brand book v1.1)
  var progressFill = document.getElementById('hero-progress-fill');
  if (video && progressFill) {
    video.addEventListener('timeupdate', function() {
      if (video.duration && isFinite(video.duration)) {
        var pct = (video.currentTime / video.duration) * 100;
        progressFill.style.width = pct + '%';
      }
    });
    // Reset à zéro à chaque boucle (loop attribut)
    video.addEventListener('seeked', function() {
      if (video.currentTime < 0.1) progressFill.style.width = '0%';
    });
  }

  // Carrousels AMAN · progress bar Terra suit le scroll horizontal de chaque track
  function initCarouselProgress(trackId, fillId) {
    var track = document.getElementById(trackId);
    var fill = document.getElementById(fillId);
    if (!track || !fill) return;
    var ticking = false;
    function update() {
      var max = track.scrollWidth - track.clientWidth;
      if (max <= 1) {
        fill.style.width = '100%';
        return;
      }
      var pct = Math.min(100, Math.max(0, (track.scrollLeft / max) * 100));
      fill.style.width = pct + '%';
    }
    track.addEventListener('scroll', function() {
      if (!ticking) {
        window.requestAnimationFrame(function() {
          update();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
    // Init + recalcul sur resize (bascule mobile/desktop)
    update();
    window.addEventListener('resize', update, { passive: true });
  }
  initCarouselProgress('residences-track', 'residences-progress-fill');
  initCarouselProgress('videos-track', 'videos-progress-fill');
  initCarouselProgress('esprit-track', 'esprit-progress-fill');
  initCarouselProgress('vision-track', 'vision-progress-fill');

  // D-02 · Floating CTA "Plus simple" (variante 04) · apparait après que le hero passe.
  // Détection automatique du fond pour inverser la lisibilité sur sections indigo.
  var floatingCta = document.querySelector('.floating-cta');
  var heroSection = document.querySelector('.hero');
  var darkSections = document.querySelectorAll('.press-featured, .site-footer, .media-frame');

  if (floatingCta && heroSection && 'IntersectionObserver' in window) {
    // Initial state · invisible
    floatingCta.style.opacity = '0';
    floatingCta.style.pointerEvents = 'none';
    floatingCta.style.transition = 'opacity 320ms ease, color 240ms ease';

    // Visibility observer · apparait après hero
    var stickyObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          floatingCta.style.opacity = '0';
          floatingCta.style.pointerEvents = 'none';
        } else {
          floatingCta.style.opacity = '1';
          floatingCta.style.pointerEvents = 'auto';
        }
      });
    }, { threshold: 0.15 });
    stickyObserver.observe(heroSection);

    // Détection fond sombre · toggle --on-dark si une section indigo couvre
    // la zone du bouton. Throttle via rAF pour rester smooth au scroll.
    var rafPending = false;
    function checkDarkBackground() {
      var ctaRect = floatingCta.getBoundingClientRect();
      var ctaCenter = (ctaRect.top + ctaRect.bottom) / 2;
      var onDark = false;
      darkSections.forEach(function(sec) {
        var rect = sec.getBoundingClientRect();
        if (rect.top <= ctaCenter && rect.bottom >= ctaCenter) {
          onDark = true;
        }
      });
      floatingCta.classList.toggle('floating-cta--on-dark', onDark);
      rafPending = false;
    }
    function onScrollOrResize() {
      if (rafPending) return;
      rafPending = true;
      window.requestAnimationFrame(checkDarkBackground);
    }
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
    checkDarkBackground();
  }

  // Contact form — wiring EmailJS (à activer après config)
  // Décommenter et renseigner les IDs EmailJS pour activer.
  /*
  var form = document.getElementById('contact-form');
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    emailjs.sendForm('service_xxx', 'template_xxx', form)
      .then(function() { window.location.href = '/merci/'; })
      .catch(function(err) { console.error(err); alert('Envoi impossible, merci de réessayer.'); });
  });
  */

})();