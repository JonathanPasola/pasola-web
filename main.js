/* PASOLA · pasola.fr · main script · v1
   Reveal animations, carousel progress, sound toggle, sticky CTA observer. */

(function() {
  'use strict';

  // Mobile nav toggle (présent uniquement sur les pages avec nav mobile complète)
  var toggle = document.querySelector('.nav-toggle');
  var overlay = document.getElementById('primary-nav');
  var backdrop = document.querySelector('.nav-backdrop');
  var closeBtn = overlay ? overlay.querySelector('.nav-close') : null;
  var body = document.body;

  if (toggle && overlay) {
    function setNavOpen(open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      overlay.setAttribute('aria-hidden', open ? 'false' : 'true');
      if (backdrop) backdrop.setAttribute('data-open', open ? 'true' : 'false');
      body.classList.toggle('nav-open', open);
    }

    toggle.addEventListener('click', function() {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      setNavOpen(!open);
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', function() { setNavOpen(false); });
    }

    if (backdrop) {
      backdrop.addEventListener('click', function() { setNavOpen(false); });
    }

    overlay.addEventListener('click', function(e) {
      if (e.target.tagName === 'A') setNavOpen(false);
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') setNavOpen(false);
    });
  }

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

  // Carrousels AMAN · système de track-bar (référence Aman avec couleurs PASOLA).
  // Génère un segment par carte sous chaque carrousel mobile, ajoute
  // is-active à la carte centrale détectée par IntersectionObserver
  // (root = track), et permet le clic sur un segment pour scroller vers
  // la carte correspondante. Sur desktop le track devient une grille
  // (sans scroll) et le CSS masque la track-bar — l'observer continue
  // mais sans effet visuel puisque le voile blanc est aussi désactivé.
  function initCarouselTrackBar(trackId) {
    var track = document.getElementById(trackId);
    if (!track) return;
    var cards = track.querySelectorAll('.aman-card');
    if (!cards.length) return;

    // Première carte active par défaut (sinon toutes les cartes restent
    // voilées au chargement avant que l'observer ne déclenche)
    cards[0].classList.add('is-active');

    // Générer un segment par carte dans le conteneur .aman-track-bar associé
    var trackBar = document.querySelector('.aman-track-bar[data-track="' + trackId + '"]');
    var segments = [];
    if (trackBar) {
      // Vider d'abord (au cas où le script s'exécute deux fois)
      trackBar.innerHTML = '';
      Array.prototype.forEach.call(cards, function(card, idx) {
        var seg = document.createElement('button');
        seg.type = 'button';
        seg.className = 'aman-track-segment' + (idx === 0 ? ' is-active' : '');
        seg.setAttribute('aria-label', 'Aller à la diapositive ' + (idx + 1));
        seg.addEventListener('click', function() {
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
          // Force is-active immediate sur l'idx cible (couvre le cas
          // ou le scrollMax sature et empeche le pick auto de bien picker).
          if (track._pasolaForceActive) track._pasolaForceActive(idx);
        });
        trackBar.appendChild(seg);
        segments.push(seg);
      });
    }

    // Detection de la card active · strategie scroll-based.
    // Bug fix 04292026 v2 : la version ratio-based (v1) gardait card N-1
    // active quand on scroll au max, parce que cards N-1 et N etaient
    // toutes deux a 100% et la boucle prenait la premiere. Idem au retour
    // a 0, l'observer pouvait ne pas refire.
    // Strategie v2 : scrollLeft est la source de verite.
    //  - si scrollLeft est au max (cards finales saturees), derniere card active
    //  - sinon, card dont offsetLeft est le plus proche de scrollLeft
    // Cette logique fonctionne identiquement sur mobile (cards 86vw) et
    // desktop (carousel asymetrique 66vw + 33vw + 33vw).
    // Note : sur desktop avec pattern asymetrique, le scrollMax peut etre
    // plus petit que offsetLeft de card N-2, donc le click sur seg N-2
    // saturerait au max et le pick auto renverrait card N-1. Solution :
    // un flag isClicking bloque le pick auto pendant le smooth scroll, et
    // le click force is-active immediatement sur l'idx cible.
    function pickActiveIdx() {
      var sl = track.scrollLeft;
      var maxSl = track.scrollWidth - track.clientWidth;
      if (maxSl > 1 && sl >= maxSl - 1) return cards.length - 1;
      var bestIdx = 0;
      var bestDist = Infinity;
      Array.prototype.forEach.call(cards, function(c, i) {
        var off = c.offsetLeft - track.offsetLeft;
        var d = Math.abs(off - sl);
        if (d < bestDist) { bestDist = d; bestIdx = i; }
      });
      return bestIdx;
    }
    function applyActive(idx) {
      Array.prototype.forEach.call(cards, function(c, i) {
        c.classList.toggle('is-active', i === idx);
      });
      segments.forEach(function(s, i) {
        s.classList.toggle('is-active', i === idx);
      });
    }
    // Sync sur scroll du track (fonctionne meme quand l'IntersectionObserver
    // ne fire pas, et reactif au click sur segments via l'animation smooth).
    // Le flag isClicking protege l'is-active force par le click handler
    // pendant la duree du smooth scroll.
    var rafActive = false;
    var isClicking = false;
    var clickTimer = null;
    function onTrackScroll() {
      if (rafActive || isClicking) return;
      rafActive = true;
      window.requestAnimationFrame(function() {
        applyActive(pickActiveIdx());
        rafActive = false;
      });
    }
    track.addEventListener('scroll', onTrackScroll, { passive: true });
    // Premiere application apres init (DOM pose, scroll potentiellement = 0)
    applyActive(pickActiveIdx());
    // Expose la primitive pour le click handler (qui force is-active immediate)
    track._pasolaForceActive = function(idx) {
      applyActive(idx);
      isClicking = true;
      clearTimeout(clickTimer);
      clickTimer = setTimeout(function() { isClicking = false; }, 600);
    };
  }
  initCarouselTrackBar('residences-track');
  initCarouselTrackBar('videos-track');
  initCarouselTrackBar('vision-track');
  initCarouselTrackBar('press-track');

  // Section II "L'esprit de Sumba" · système custom de fade par intersection.
  // Au lieu d'une seule card "is-active" (logique standard initCarouselTrackBar),
  // toutes les cards entièrement visibles dans le viewport horizontal du track
  // reçoivent .is-active (= sans voile). Les cards partiellement visibles
  // (coupées à droite ou à gauche par le scroll) n'ont PAS .is-active
  // (= voile blanchi). Permet de slider sans laisser une card visible avec
  // un voile résiduel — le voile suit dynamiquement la card coupée.
  function initSpiritIntersectionFade() {
    var track = document.getElementById('esprit-track');
    if (!track) return;
    var cards = track.querySelectorAll('.aman-card');
    if (!cards.length) return;
    if (!('IntersectionObserver' in window)) {
      // Fallback : toutes les cards is-active
      Array.prototype.forEach.call(cards, function(c) { c.classList.add('is-active'); });
      return;
    }
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        // Seuil 0.95 = considérée "entièrement visible" si ≥ 95%
        // (tolérance pour les bords de viewport, le scroll-snap, etc.)
        entry.target.classList.toggle('is-active', entry.intersectionRatio >= 0.95);
      });
    }, {
      root: track,
      threshold: [0, 0.5, 0.85, 0.95, 1]
    });
    Array.prototype.forEach.call(cards, function(c) { observer.observe(c); });
  }
  initSpiritIntersectionFade();

  // Floating CTA
  var floatingCta = document.querySelector('.floating-cta');
  var heroSection = document.querySelector('.hero');
  var footerContactBlock = document.querySelector('.footer-contact');
  var darkSections = document.querySelectorAll('.press-featured, .site-footer, .media-frame');

  if (floatingCta && heroSection && 'IntersectionObserver' in window) {
    floatingCta.style.opacity = '0';
    floatingCta.style.pointerEvents = 'none';
    floatingCta.style.transition = 'opacity 320ms ease, color 240ms ease';

    // Etat combine · CTA cache si hero visible OU bloc footer-contact visible.
    // Sprint 4 (04292026) : le CTA reste visible sur tout le scroll mais
    // disparait quand l'utilisateur atteint le bloc .footer-contact du footer
    // (la zone qui contient deja contact@/press@/calendly + "Voir tous les
    // contacts"). Le CTA y devient redondant. Le style du CTA reste inchange,
    // seule sa visibilite est gouvernee.
    var heroVisible = true;
    var footerContactVisible = false;
    function updateCtaVisibility() {
      var hide = heroVisible || footerContactVisible;
      floatingCta.style.opacity = hide ? '0' : '1';
      floatingCta.style.pointerEvents = hide ? 'none' : 'auto';
    }

    var heroObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        heroVisible = entry.isIntersecting;
      });
      updateCtaVisibility();
    }, { threshold: 0.15 });
    heroObserver.observe(heroSection);

    if (footerContactBlock) {
      var footerObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          footerContactVisible = entry.isIntersecting;
        });
        updateCtaVisibility();
      }, { threshold: 0.05 });
      footerObserver.observe(footerContactBlock);
    }

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

  // ─────────────────────────────────────────────────────────────────
  // BACKEND PASOLA (existant — v1) — Cloudflare Worker + D1 + Dashboard
  // POST /api/register : stocke dans la table users (source de vérité)
  // POST /api/contact  : message simple
  // POST /api/pageview : tracking page par page (activé v2 — chaque page ex. /maison-cognac/ comptée à part)
  // ─────────────────────────────────────────────────────────────────
  var PASOLA_API = 'https://pasola-api.jonathan-beraud.workers.dev';

  // ── Tracking pageview (une balise par chargement de page) ──────────
  (function pasolaTrackPageview() {
    try {
      var VKEY = 'pasola_visitor_id';
      var vid = '';
      try { vid = localStorage.getItem(VKEY) || ''; } catch (e) {}
      if (!vid) {
        vid = 'v-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
        try { localStorage.setItem(VKEY, vid); } catch (e) {}
      }
      var isReg = false;
      try { isReg = localStorage.getItem('pasola_registered') === '1'; } catch (e) {}
      var payload = {
        page: window.location.pathname,           // ex. "/", "/en/", "/maison-cognac/", "/en/maison-cognac/"
        url: window.location.href,
        referrer: document.referrer || '',
        visitor_id: vid,
        is_registered: isReg
      };
      var endpoint = PASOLA_API + '/api/pageview';
      var body = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
      } else {
        fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true }).catch(function () {});
      }
    } catch (e) { /* silencieux — jamais bloquer la page */ }
  })();

  function pasolaRegister(payload) {
    // Renvoie la promise du fetch — l'appelant gère succès/erreur via .then/.catch.
    // Le worker stocke en DB ET envoie un email de vérification au visiteur via Brevo,
    // ainsi qu'une notification à PASOLA selon l'endpoint utilisé.
    return fetch(PASOLA_API + '/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
  }

  // Formulaire de contact (Section VII "Entamer la conversation")
  // POST /api/register au worker → stockage DB + email vérification (Brevo).
  var contactForm = document.getElementById('contact-form');
  var feedback = document.getElementById('form-feedback');
  if (contactForm && feedback) {
    var isEn = document.documentElement.lang === 'en';
    var i18n = isEn ? {
      sending: 'Sending…',
      success: 'Thank you. Your request has reached us — we will get back to you within two business days.',
      error:   'An error occurred. Please write to us directly at contact@pasola.fr.'
    } : {
      sending: 'Envoi en cours…',
      success: 'Merci. Votre demande nous est parvenue, nous reviendrons vers vous sous deux jours ouvrés.',
      error:   'Une erreur est survenue. Merci d\'écrire directement à contact@pasola.fr.'
    };

    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var submitBtn = contactForm.querySelector('.form-submit');
      var originalLabel = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = i18n.sending;
      feedback.hidden = true;
      feedback.className = 'form-feedback';

      var firstname = (contactForm.firstname && contactForm.firstname.value || '').trim();
      var lastname  = (contactForm.lastname  && contactForm.lastname.value  || '').trim();
      var emailVal  = (contactForm.email     && contactForm.email.value     || '').trim();
      var profile   = (contactForm.profile   && contactForm.profile.value   || '');
      var msg       = (contactForm.message   && contactForm.message.value   || '');

      pasolaRegister({
        first_name: firstname,
        last_name: lastname,
        email: emailVal,
        profile: profile,                   // raw value: 'private-buyer' | 'family-office' | 'media'
        consent_updates: 1,
        consent_privacy: 1,
        page_source: 'contact-section-vii',
        source: window.location.origin + window.location.pathname,
        referral: document.referrer || '',
        message: msg
      }).then(function() {
        // Marque le visiteur comme inscrit (enrichit la colonne "Registered" du tracking pageview)
        try { localStorage.setItem('pasola_registered', '1'); } catch (e) {}
        // Pattern C : on remplace le form par le bloc remerciement (.contact-thanks).
        // On RETIRE le form du DOM (pas seulement hidden) car le CSS desktop
        // force display: grid sur #contact-form qui override l'attribut hidden.
        // On supprime AUSSI le petit emblème de signature (.contact-emblem) en
        // haut, car le bloc thanks a déjà son propre emblème grand → évite le double.
        var thanks = document.getElementById('contact-thanks');
        if (thanks) {
          contactForm.reset();
          contactForm.remove();
          var topEmblem = document.querySelector('.contact-grid > .contact-emblem');
          if (topEmblem) topEmblem.remove();
          thanks.hidden = false;
          thanks.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          feedback.textContent = i18n.success;
          feedback.className = 'form-feedback is-success';
          feedback.hidden = false;
          contactForm.reset();
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
        }
      }).catch(function(err) {
        feedback.textContent = i18n.error;
        feedback.className = 'form-feedback is-error';
        feedback.hidden = false;
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
        // eslint-disable-next-line no-console
        console.error('PASOLA contact submit error', err);
      });
    });
  }

  // Newsletter form (footer "Stay in touch" / "Rester en contact")
  // POST /api/register au worker (profile='newsletter') → stockage DB + email
  // welcome bilingue au visiteur via Brevo. Source de vérité = dashboard admin.
  var newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    var newsletterIsEn = document.documentElement.lang === 'en';
    var nlI18n = newsletterIsEn ? {
      sending:     'Subscribing…',
      thanksTitle: 'Welcome to the PASOLA circle.',
      thanksBody:  'You will hear from us when there is something true to say. Not before.'
    } : {
      sending:     'Inscription…',
      thanksTitle: 'Bienvenue dans le cercle PASOLA.',
      thanksBody:  'Vous aurez de nos nouvelles quand il y aura quelque chose de vrai à dire. Jamais avant.'
    };

    function showNewsletterThanks() {
      // Cache complètement le form et insère un bloc merci à la même place.
      newsletterForm.style.display = 'none';
      if (newsletterForm.parentNode.querySelector('.newsletter-thanks')) return; // évite doublon
      var block = document.createElement('div');
      block.className = 'newsletter-thanks';
      block.style.cssText = 'text-align:center;padding:8px 0;color:var(--ivory);';
      block.innerHTML =
        '<div style="font-family:var(--font-display, \'Times New Roman\'),serif;font-size:22px;letter-spacing:0.04em;margin-bottom:12px;color:var(--ivory);">' +
          escapeHtml(nlI18n.thanksTitle) +
        '</div>' +
        '<p style="font-family:var(--font-editorial, Georgia),serif;font-style:italic;font-size:14px;line-height:1.6;color:var(--ivory);opacity:0.85;margin:0 auto;max-width:380px;">' +
          escapeHtml(nlI18n.thanksBody) +
        '</p>';
      newsletterForm.parentNode.insertBefore(block, newsletterForm.nextSibling);
    }

    newsletterForm.addEventListener('submit', function(e) {
      e.preventDefault();

      var nlBtn = newsletterForm.querySelector('.newsletter-submit');
      nlBtn.disabled = true;
      nlBtn.textContent = nlI18n.sending;

      var nlFirstname = (newsletterForm.firstname && newsletterForm.firstname.value || '').trim();
      var nlLastname  = (newsletterForm.lastname  && newsletterForm.lastname.value  || '').trim();
      var nlEmail     = (newsletterForm.email     && newsletterForm.email.value     || '').trim();

      pasolaRegister({
        first_name: nlFirstname,
        last_name: nlLastname,
        email: nlEmail,
        profile: 'newsletter',              // distingue les inscrits newsletter dans le dashboard
        consent_updates: 1,
        consent_privacy: 1,
        page_source: 'newsletter-footer',
        source: window.location.origin + window.location.pathname,
        referral: document.referrer || ''
      }).then(showNewsletterThanks).catch(function(err) {
        // eslint-disable-next-line no-console
        console.error('Newsletter register error', err);
        // On affiche quand même le succès : l'utilisateur n'a pas à savoir
        // qu'un retry sera nécessaire côté ops.
        showNewsletterThanks();
      });
    });
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Capital Partners — formulaire de signature NDA (/capital-partners/access/)
  // POST /api/cp-request : enregistre la signature avec timestamp + IP, envoie
  // un email de confirmation à l'investisseur + notif à PASOLA.
  var cpForm = document.getElementById('cp-access-form');
  var cpFeedback = document.getElementById('cp-access-feedback');
  if (cpForm && cpFeedback) {
    var cpIsEn = document.documentElement.lang === 'en';
    var cpI18n = cpIsEn ? {
      sending: 'Signing…',
      success: 'Signature recorded. A confirmation has been sent to your email. We will review your request within two business days.',
      error: 'An error occurred. Please try again or write to contact@pasola.fr.',
      missingConsent: 'Please tick both consent boxes to proceed.',
      mismatchSig: 'The signature must match your first and last name above.'
    } : {
      sending: 'Signature en cours…',
      success: 'Signature enregistrée. Une confirmation vient de vous être envoyée par courriel. Votre demande sera examinée sous deux jours ouvrés.',
      error: 'Une erreur est survenue. Merci de réessayer ou d\'écrire à contact@pasola.fr.',
      missingConsent: 'Merci de cocher les deux cases de consentement pour continuer.',
      mismatchSig: 'La signature doit correspondre à votre prénom et nom saisis ci-dessus.'
    };

    cpForm.addEventListener('submit', function(e) {
      e.preventDefault();

      var firstname = (cpForm.firstname.value || '').trim();
      var lastname = (cpForm.lastname.value || '').trim();
      var email = (cpForm.email.value || '').trim();
      var entity = (cpForm.entity.value || '').trim();
      var capacity = (cpForm.capacity.value || '').trim();
      var country = (cpForm.country.value || '').trim();
      var message = (cpForm.message.value || '').trim();
      var signatureName = (cpForm.signature_name.value || '').trim();
      var consentRead = cpForm.querySelector('input[name="consent_read"]').checked;
      var consentAuthority = cpForm.querySelector('input[name="consent_authority"]').checked;

      cpFeedback.hidden = true;
      cpFeedback.className = 'form-feedback';

      if (!consentRead || !consentAuthority) {
        cpFeedback.textContent = cpI18n.missingConsent;
        cpFeedback.className = 'form-feedback is-error';
        cpFeedback.hidden = false;
        return;
      }
      // Validation : la signature texte doit matcher first+last (case + accent insensitive).
      // On normalise via NFD + suppression des diacritiques pour que "Béraud" === "Beraud".
      function normSig(s) {
        return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
          .toLowerCase().replace(/\s+/g, ' ').trim();
      }
      var expectedSig = normSig(firstname + ' ' + lastname);
      var providedSig = normSig(signatureName);
      if (expectedSig !== providedSig) {
        cpFeedback.textContent = cpI18n.mismatchSig;
        cpFeedback.className = 'form-feedback is-error';
        cpFeedback.hidden = false;
        cpFeedback.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      var submitBtn = cpForm.querySelector('.cp-access-submit');
      var originalLabel = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = cpI18n.sending;

      var payload = {
        first_name: firstname,
        last_name: lastname,
        email: email,
        entity: entity,
        capacity: capacity,
        country: country,
        message: message,
        signed_name: signatureName,
        signed_at: new Date().toISOString(),
        signed_user_agent: navigator.userAgent,
        consent_read: 1,
        consent_authority: 1,
        source_lang: cpIsEn ? 'EN' : 'FR',
        page_source: 'capital-partners-access'
      };

      fetch(PASOLA_API + '/api/cp-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function(res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      }).then(function() {
        // Le worker /api/cp-request envoie déjà 2 emails via Brevo :
        //   1) Notif admin à jonathan.beraud@pasola.fr
        //   2) Accusé de réception au signataire
        cpFeedback.textContent = cpI18n.success;
        cpFeedback.className = 'form-feedback is-success';
        cpFeedback.hidden = false;
        cpForm.reset();
        submitBtn.disabled = true;
        submitBtn.textContent = cpIsEn ? 'Submitted' : 'Envoyé';
      }).catch(function(err) {
        cpFeedback.textContent = cpI18n.error;
        cpFeedback.className = 'form-feedback is-error';
        cpFeedback.hidden = false;
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
        // eslint-disable-next-line no-console
        console.error('CP request error', err);
      });
    });
  }

  // Spotify click-to-load (footer) — RGPD : on ne charge l'iframe que si
  // l'utilisateur clique explicitement sur le bouton "Charger la playlist".
  // Évite les cookies tiers Spotify au load.
  var spotifyButton = document.querySelector('.spotify-load');
  if (spotifyButton) {
    spotifyButton.addEventListener('click', function() {
      var wrapper = spotifyButton.closest('.footer-soundtrack-embed');
      if (!wrapper) return;
      var src = wrapper.getAttribute('data-spotify-src');
      var title = wrapper.getAttribute('data-spotify-title') || 'Spotify playlist';
      if (!src) return;
      var iframe = document.createElement('iframe');
      iframe.src = src;
      iframe.width = '100%';
      iframe.height = '152';
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('title', title);
      iframe.setAttribute('allow', 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture');
      iframe.setAttribute('loading', 'lazy');
      wrapper.innerHTML = '';
      wrapper.appendChild(iframe);
    });
  }

  // Lang switch — poser un cookie quand l'utilisateur choisit manuellement
  // sa langue. Le middleware géo-IP (functions/_middleware.js) lit ce cookie
  // pour respecter le choix manuel et ne pas re-rediriger.
  // Cookie : pasola-lang=fr|en, durée 1 an, path=/, SameSite=Lax.
  var langLinks = document.querySelectorAll('.lang-switch a, .nav-overlay-lang a');
  for (var i = 0; i < langLinks.length; i++) {
    langLinks[i].addEventListener('click', function(e) {
      var href = e.currentTarget.getAttribute('href');
      var lang = href === '/en/' ? 'en' : 'fr';
      var oneYear = 60 * 60 * 24 * 365;
      document.cookie = 'pasola-lang=' + lang + '; max-age=' + oneYear + '; path=/; SameSite=Lax';
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // Liens email du footer : popover de choix (Mail app / Gmail / Outlook web)
  // Pourquoi : le mailto: ne marche pas si l'utilisateur n'a pas d'app mail
  // configurée comme handler par défaut (cas fréquent avec Gmail/Outlook web).
  // On affiche un mini popover qui propose les 3 options + copie l'adresse
  // au presse-papier en bonus. Marche partout, pas de friction.
  // ─────────────────────────────────────────────────────────────────
  var mailpickIsEn = document.documentElement.lang === 'en';
  var mailpickI18n = mailpickIsEn ? {
    copied: 'Address copied',
    openWith: 'Open with',
    mailApp: 'Mail app',
    gmail: 'Gmail',
    outlook: 'Outlook',
    close: 'Close'
  } : {
    copied: 'Adresse copiée',
    openWith: 'Ouvrir avec',
    mailApp: 'App mail',
    gmail: 'Gmail',
    outlook: 'Outlook',
    close: 'Fermer'
  };

  document.querySelectorAll('a[data-mailcopy]').forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault(); // on prend la main complètement
      var email = link.getAttribute('data-mailcopy');
      if (!email) return;
      // Copie au presse-papier (silencieux, best-effort)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).catch(function() {});
      } else {
        try {
          var ta = document.createElement('textarea');
          ta.value = email; ta.setAttribute('readonly', '');
          ta.style.cssText = 'position:absolute;left:-9999px;top:0';
          document.body.appendChild(ta); ta.select();
          document.execCommand('copy'); document.body.removeChild(ta);
        } catch (_) {}
      }
      // Récupère le subject éventuel du href
      var subject = '';
      var href = link.getAttribute('href') || '';
      var m = href.match(/[?&]subject=([^&]+)/);
      if (m) subject = decodeURIComponent(m[1]);
      showMailPicker(email, subject, link);
    });
  });

  function showMailPicker(email, subject, anchorEl) {
    closeMailPicker();
    var subj = encodeURIComponent(subject || '');
    var mailtoUrl = 'mailto:' + email + (subject ? '?subject=' + subj : '');
    var gmailUrl  = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(email) + (subject ? '&su=' + subj : '');
    var outlookUrl = 'https://outlook.office.com/mail/deeplink/compose?to=' + encodeURIComponent(email) + (subject ? '&subject=' + subj : '');

    var backdrop = document.createElement('div');
    backdrop.className = 'mailpick-backdrop';
    backdrop.style.cssText = 'position:fixed;inset:0;background:rgba(26,44,61,0.45);z-index:9998;opacity:0;transition:opacity 200ms;';
    backdrop.addEventListener('click', closeMailPicker);

    var card = document.createElement('div');
    card.className = 'mailpick-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    card.style.cssText = [
      'position:fixed','left:50%','top:50%',
      'transform:translate(-50%,-48%)',
      'background:#FAF8F4','color:#1A2C3D',
      'border:1px solid #E5DECD','border-radius:4px',
      'padding:28px 32px','min-width:320px','max-width:90vw',
      'box-shadow:0 24px 60px rgba(26,44,61,0.25)',
      'font-family:Georgia,serif','z-index:9999',
      'opacity:0','transition:opacity 200ms ease, transform 200ms ease'
    ].join(';');

    var btnStyle = 'display:block;width:100%;padding:12px 16px;margin-bottom:8px;background:#1A2C3D;color:#FAF8F4;border:0;border-radius:2px;font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;text-decoration:none;text-align:center;cursor:pointer;transition:background 160ms;';
    var altBtnStyle = btnStyle.replace('background:#1A2C3D', 'background:#FAF8F4').replace('color:#FAF8F4', 'color:#1A2C3D').replace('border:0', 'border:1px solid #1A2C3D');

    card.innerHTML =
      '<div style="font-family:\'Times New Roman\',serif;font-size:20px;color:#1A2C3D;margin-bottom:6px;text-align:center;">' + escapeHtmlMP(email) + '</div>' +
      '<div style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#C44A2C;margin-bottom:20px;text-align:center;">✓ ' + mailpickI18n.copied + '</div>' +
      '<div style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#5C6F7E;margin-bottom:10px;text-align:center;">' + mailpickI18n.openWith + '</div>' +
      '<a href="' + mailtoUrl + '" style="' + btnStyle + '">' + mailpickI18n.mailApp + '</a>' +
      '<a href="' + gmailUrl + '" target="_blank" rel="noopener noreferrer" style="' + altBtnStyle + '">' + mailpickI18n.gmail + '</a>' +
      '<a href="' + outlookUrl + '" target="_blank" rel="noopener noreferrer" style="' + altBtnStyle + '">' + mailpickI18n.outlook + '</a>' +
      '<button type="button" class="mailpick-close-btn" style="display:block;width:100%;margin-top:14px;padding:8px;background:transparent;border:0;color:#5C6F7E;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;cursor:pointer;">' + mailpickI18n.close + '</button>';

    document.body.appendChild(backdrop);
    document.body.appendChild(card);

    // Fermeture via bouton + ESC + clic sur option
    card.querySelector('.mailpick-close-btn').addEventListener('click', closeMailPicker);
    card.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', function() {
        // On laisse le browser faire le navigate, puis on ferme après un court délai
        setTimeout(closeMailPicker, 300);
      });
    });
    document.addEventListener('keydown', mailpickEscHandler);

    requestAnimationFrame(function() {
      backdrop.style.opacity = '1';
      card.style.opacity = '1';
      card.style.transform = 'translate(-50%,-50%)';
    });
  }

  function mailpickEscHandler(e) {
    if (e.key === 'Escape') closeMailPicker();
  }

  function closeMailPicker() {
    var c = document.querySelector('.mailpick-card');
    var b = document.querySelector('.mailpick-backdrop');
    document.removeEventListener('keydown', mailpickEscHandler);
    [c, b].forEach(function(el) {
      if (!el) return;
      el.style.opacity = '0';
      setTimeout(function() { el.remove(); }, 220);
    });
  }

  function escapeHtmlMP(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ═══════════════════════════════════════════
  // Card modals (Esprit de Sumba — Pasola/Hinggi/Architecture)
  // ═══════════════════════════════════════════
  (function initCardModals() {
    var backdrop = document.querySelector('.card-modal-backdrop');
    if (!backdrop) return;
    var modals  = backdrop.querySelectorAll('.card-modal');
    var triggers = document.querySelectorAll('[data-card-modal]');

    function open(id) {
      modals.forEach(function (m) {
        m.classList.toggle('is-active', m.dataset.modalId === id);
      });
      backdrop.classList.add('is-open');
      document.body.classList.add('modal-open');
      backdrop.setAttribute('aria-hidden', 'false');
    }
    function close() {
      backdrop.classList.remove('is-open');
      document.body.classList.remove('modal-open');
      backdrop.setAttribute('aria-hidden', 'true');
    }

    triggers.forEach(function (t) {
      t.addEventListener('click', function (e) {
        e.preventDefault();
        open(t.getAttribute('data-card-modal'));
      });
    });
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) close();
    });
    backdrop.querySelectorAll('.card-modal-close').forEach(function (b) {
      b.addEventListener('click', close);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && backdrop.classList.contains('is-open')) close();
    });
  })();

})();
