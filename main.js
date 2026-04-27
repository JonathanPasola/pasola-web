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

  // Header progressif
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

  // Reveal on scroll
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

  // Sound toggle
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
        var playPromise = bgMusic.play();
        if (playPromise && playPromise.catch) {
          playPromise.catch(function() {});
        }
        soundBtn.setAttribute('aria-pressed', 'true');
        soundBtn.setAttribute('aria-label', 'Couper la bande-son');
        soundBtn.innerHTML = iconOn;
      } else {
        bgMusic.pause();
        soundBtn.setAttribute('aria-pressed', 'false');
        soundBtn.setAttribute('aria-label', 'Activer la bande-son');
        soundBtn.innerHTML = iconMuted;
      }
    });
  }

  // Hero progress
  var progressFill = document.getElementById('hero-progress-fill');
  if (video && progressFill) {
    video.addEventListener('timeupdate', function() {
      if (video.duration && isFinite(video.duration)) {
        var pct = (video.currentTime / video.duration) * 100;
        progressFill.style.width = pct + '%';
      }
    });
    video.addEventListener('seeked', function() {
      if (video.currentTime < 0.1) progressFill.style.width = '0%';
    });
  }

  // Carrousels AMAN · système de carrés indicateurs (dots).
  // Génère un carré par carte sous chaque carrousel mobile, ajoute
  // is-active à la carte centrale détectée par IntersectionObserver
  // (root = track), et permet le clic sur un carré pour scroller vers
  // la carte correspondante. Sur desktop le track devient une grille
  // (sans scroll) et le CSS masque les dots — l'observer continue
  // mais sans effet visuel puisque le voile blanc est aussi désactivé.
  function initCarouselDots(trackId) {
    var track = document.getElementById(trackId);
    if (!track) return;
    var cards = track.querySelectorAll('.aman-card');
    if (!cards.length) return;

    // Première carte active par défaut (sinon toutes les cartes restent
    // voilées au chargement avant que l'observer ne déclenche)
    cards[0].classList.add('is-active');

    // Générer un carré par carte dans le conteneur .aman-dots associé
    var dotsContainer = document.querySelector('.aman-dots[data-track="' + trackId + '"]');
    var dots = [];
    if (dotsContainer) {
      // Vider d'abord (au cas où le script s'exécute deux fois)
      dotsContainer.innerHTML = '';
      Array.prototype.forEach.call(cards, function(card, idx) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'aman-dot' + (idx === 0 ? ' is-active' : '');
        dot.setAttribute('aria-label', 'Aller à la diapositive ' + (idx + 1));
        dot.addEventListener('click', function() {
          var cardEl = cards[idx];
          // Calcul du scroll cible · tient compte du scroll-padding-left du track
          var trackStyle = window.getComputedStyle(track);
          var padX = parseInt(trackStyle.paddingLeft, 10) || 0;
          var target = cardEl.offsetLeft - track.offsetLeft - padX;
          if (track.scrollTo) {
            track.scrollTo({ left: target, behavior: 'smooth' });
          } else {
            track.scrollLeft = target;
          }
        });
        dotsContainer.appendChild(dot);
        dots.push(dot);
      });
    }

    // IntersectionObserver · détecte la carte centrée dans le viewport du track
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {
            var idx = Array.prototype.indexOf.call(cards, entry.target);
            if (idx < 0) return;
            Array.prototype.forEach.call(cards, function(c, i) {
              c.classList.toggle('is-active', i === idx);
            });
            dots.forEach(function(d, i) {
              d.classList.toggle('is-active', i === idx);
            });
          }
        });
      }, {
        root: track,
        threshold: [0.55, 0.7, 0.85]
      });
      Array.prototype.forEach.call(cards, function(card) { io.observe(card); });
    }
  }
  initCarouselDots('residences-track');
  initCarouselDots('videos-track');
  initCarouselDots('esprit-track');
  initCarouselDots('vision-track');

  // Floating CTA
  var floatingCta = document.querySelector('.floating-cta');
  var heroSection = document.querySelector('.hero');
  var darkSections = document.querySelectorAll('.press-featured, .site-footer, .media-frame');

  if (floatingCta && heroSection && 'IntersectionObserver' in window) {
    floatingCta.style.opacity = '0';
    floatingCta.style.pointerEvents = 'none';
    floatingCta.style.transition = 'opacity 320ms ease, color 240ms ease';

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

})();
