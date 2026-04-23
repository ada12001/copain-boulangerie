/* Copain V2 — nav scroll state + video carousel */

/* ── Nav scroll ─────────────────────────────────────────── */
(function () {
  var nav = document.getElementById('site-nav');
  if (!nav) return;

  function update() {
    if (window.scrollY > 60) {
      nav.classList.add('is-solid');
    } else {
      nav.classList.remove('is-solid');
    }
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
}());

/* ── Video carousel ─────────────────────────────────────── */
(function () {
  var carousel = document.getElementById('video-carousel');
  var track   = document.getElementById('video-track');
  var btnPrev = document.getElementById('video-prev');
  var btnNext = document.getElementById('video-next');
  if (!carousel || !track || !btnPrev || !btnNext) return;

  var originals = Array.from(track.querySelectorAll('.video-slide'));
  var total     = originals.length;
  var current   = 1;
  if (total === 0) return;

  if (total > 1) {
    var firstClone = originals[0].cloneNode(true);
    var lastClone  = originals[total - 1].cloneNode(true);
    var cloneControls;

    firstClone.setAttribute('aria-hidden', 'true');
    lastClone.setAttribute('aria-hidden', 'true');
    firstClone.classList.add('video-slide--clone');
    lastClone.classList.add('video-slide--clone');

    cloneControls = firstClone.querySelectorAll('a, button, input, select, textarea, [tabindex]');
    cloneControls.forEach(function (control) {
      control.setAttribute('tabindex', '-1');
    });

    cloneControls = lastClone.querySelectorAll('a, button, input, select, textarea, [tabindex]');
    cloneControls.forEach(function (control) {
      control.setAttribute('tabindex', '-1');
    });

    track.appendChild(firstClone);
    track.insertBefore(lastClone, track.firstChild);
  }

  var slides = Array.from(track.querySelectorAll('.video-slide'));

  function slideWidth() {
    return slides[0].offsetWidth;
  }

  function slideGap() {
    var styles = window.getComputedStyle(track);
    return parseFloat(styles.columnGap || styles.gap || '0') || 0;
  }

  function centerOffset(index) {
    var containerW = carousel.offsetWidth;
    var slideW     = slideWidth();
    var gap        = slideGap();
    /* offset so the active slide sits centred in the container */
    return (containerW - slideW) / 2 - index * (slideW + gap);
  }

  function updateSlides() {
    slides.forEach(function (slide, i) {
      slide.style.opacity = i === current ? '1' : '0.55';
    });
  }

  function setPosition(animate) {
    track.style.transition = animate ? '' : 'none';
    track.style.transform = 'translateX(' + centerOffset(current) + 'px)';
    updateSlides();
  }

  function goTo(index) {
    if (total < 2) {
      current = 0;
      setPosition(false);
      return;
    }

    current = index;
    setPosition(true);
  }

  function jumpTo(index) {
    current = index;
    setPosition(false);
    track.offsetHeight;
    track.style.transition = '';
  }

  btnPrev.addEventListener('click', function () {
    goTo(current - 1);
  });

  btnNext.addEventListener('click', function () {
    goTo(current + 1);
  });

  /* keyboard support */
  carousel.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft')  goTo(current - 1);
    if (e.key === 'ArrowRight') goTo(current + 1);
  });

  track.addEventListener('transitionend', function () {
    if (current === 0) jumpTo(total);
    if (current === total + 1) jumpTo(1);
  });

  /* recalc on resize */
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      setPosition(false);
      track.offsetHeight;
      track.style.transition = '';
    }, 100);
  });

  /* init — start on the first real slide with no transition on first paint */
  current = total < 2 ? 0 : 1;
  setPosition(false);
  setTimeout(function () {
    track.style.transition = '';
  }, 50);
}());

/* ── Contact gallery carousel ───────────────────────────── */
(function () {
  var carousel = document.getElementById('contact-gallery');
  var track = document.getElementById('contact-gallery-track');
  var btnPrev = document.getElementById('contact-gallery-prev');
  var btnNext = document.getElementById('contact-gallery-next');
  if (!carousel || !track || !btnPrev || !btnNext) return;

  var originals = Array.from(track.querySelectorAll('.contact-gallery__slide'));
  var total = originals.length;
  var visible = window.matchMedia('(max-width: 768px)').matches ? 1 : 3;
  var maxIndex = (total * 3) - visible;
  var current = total;
  var reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var autoTimer;
  var isAnimating = false;
  var pointerActive = false;
  var dragStartX = 0;
  var dragDeltaX = 0;
  var dragBaseX = 0;

  if (total <= visible) {
    btnPrev.style.display = 'none';
    btnNext.style.display = 'none';
    return;
  }

  function cloneSlide(slide) {
    var clone = slide.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.classList.add('contact-gallery__slide--clone');
    return clone;
  }

  for (var i = 0; i < total; i += 1) {
    track.appendChild(cloneSlide(originals[i]));
    track.insertBefore(cloneSlide(originals[total - 1 - i]), track.firstChild);
  }

  function slideWidth() {
    return carousel.querySelector('.contact-gallery__viewport').offsetWidth / visible;
  }

  function setPosition(animate) {
    track.style.transition = animate ? '' : 'none';
    track.style.transform = 'translateX(' + (-current * slideWidth()) + 'px)';
  }

  function setDragPosition() {
    track.style.transition = 'none';
    track.style.transform = 'translateX(' + (dragBaseX + dragDeltaX) + 'px)';
  }

  function currentTranslateX() {
    var transform = window.getComputedStyle(track).transform;
    if (!transform || transform === 'none') {
      return -current * slideWidth();
    }

    try {
      return new window.DOMMatrixReadOnly(transform).m41;
    } catch (error) {
      return -current * slideWidth();
    }
  }

  function interruptAnimation() {
    var translateX = currentTranslateX();
    track.style.transition = 'none';
    track.style.transform = 'translateX(' + translateX + 'px)';
    current = Math.round(-translateX / slideWidth());
    isAnimating = false;
  }

  function goTo(index) {
    if (isAnimating) return;
    if (index < 0) index = 0;
    if (index > maxIndex) index = maxIndex;
    current = index;
    isAnimating = true;
    setPosition(true);
  }

  function jumpTo(index) {
    current = index;
    isAnimating = false;
    setPosition(false);
    track.offsetHeight;
    track.style.transition = '';
  }

  function next() {
    goTo(current + 1);
  }

  function prev() {
    goTo(current - 1);
  }

  function startAuto() {
    if (reducedMotionQuery.matches) return;
    stopAuto();
    autoTimer = window.setInterval(next, 5000);
  }

  function stopAuto() {
    if (autoTimer) {
      window.clearInterval(autoTimer);
      autoTimer = null;
    }
  }

  function onPointerMove(event) {
    if (!pointerActive) return;
    dragDeltaX = event.clientX - dragStartX;
    setDragPosition();
  }

  function onPointerUp() {
    if (!pointerActive) return;

    var finalDeltaX = dragDeltaX;

    pointerActive = false;
    carousel.classList.remove('is-dragging');

    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);

    if (Math.abs(finalDeltaX) > slideWidth() * 0.18) {
      if (finalDeltaX < 0) {
        next();
      } else {
        prev();
      }
    } else {
      setPosition(true);
    }

    dragDeltaX = 0;
    startAuto();
  }

  btnPrev.addEventListener('click', function () {
    prev();
    startAuto();
  });

  btnNext.addEventListener('click', function () {
    next();
    startAuto();
  });

  carousel.addEventListener('keydown', function (e) {
    if (isAnimating) return;
    if (e.key === 'ArrowLeft') {
      prev();
      startAuto();
    }

    if (e.key === 'ArrowRight') {
      next();
      startAuto();
    }
  });

  carousel.addEventListener('mouseenter', stopAuto);
  carousel.addEventListener('mouseleave', startAuto);
  carousel.addEventListener('focusin', stopAuto);
  carousel.addEventListener('focusout', function (event) {
    if (!carousel.contains(event.relatedTarget)) {
      startAuto();
    }
  });

  carousel.addEventListener('pointerdown', function (event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (event.target.closest('.contact-gallery__nav')) return;

    event.preventDefault();
    if (isAnimating) {
      interruptAnimation();
    }

    pointerActive = true;
    dragStartX = event.clientX;
    dragDeltaX = 0;
    dragBaseX = currentTranslateX();
    carousel.classList.add('is-dragging');
    stopAuto();

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  });

  track.addEventListener('transitionend', function () {
    isAnimating = false;
    if (current < total) {
      jumpTo(current + total);
      return;
    }

    if (current >= total * 2) {
      jumpTo(current - total);
    }
  });

  var resizeTimer;
  window.addEventListener('resize', function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () {
      visible = window.matchMedia('(max-width: 768px)').matches ? 1 : 3;
      maxIndex = (total * 3) - visible;
      if (current > maxIndex) current = maxIndex;
      setPosition(false);
      track.offsetHeight;
      track.style.transition = '';
    }, 100);
  });

  setPosition(false);
  setTimeout(function () {
    track.style.transition = '';
  }, 50);
  startAuto();

  reducedMotionQuery.addEventListener('change', function () {
    if (reducedMotionQuery.matches) {
      stopAuto();
    } else {
      startAuto();
    }
  });
}());

/* ── Hamburger drawer ────────────────────────────────────── */
(function () {
  var burger  = document.querySelector('.nav__burger');
  var drawer  = document.getElementById('menu-drawer');
  var overlay = document.getElementById('menu-overlay');
  var closeBtn = document.getElementById('menu-close');

  if (!burger || !drawer) return;

  function openMenu() {
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  burger.addEventListener('click', openMenu);
  if (overlay)  overlay.addEventListener('click', closeMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);

  /* Escape key closes */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });
}());

/* ── Contact form ─────────────────────────────────────────── */
(function () {
  var form = document.querySelector('.contact-form');
  var status = document.getElementById('form-status');
  var submit = form ? form.querySelector('button[type="submit"]') : null;
  var leadSourceField = document.getElementById('lead-source');
  var ipAddressField = document.getElementById('ip-address');
  var ipLookupPromise = null;
  var requiredFields = form ? Array.prototype.slice.call(form.querySelectorAll('[required]')) : [];

  if (!form || !status || !submit) return;

  function setStatus(message, type) {
    status.textContent = message;
    status.className = 'form-submit__status' + (type ? ' is-' + type : '');
  }

  function errorElementFor(field) {
    var describedBy = field.getAttribute('aria-describedby');
    return describedBy ? document.getElementById(describedBy) : null;
  }

  function validationMessageFor(field) {
    if (field.validity.valueMissing) {
      if (field.name === 'message') return 'Please tell us a little about what you are looking for.';
      return 'Please enter your ' + field.name.replace(/_/g, ' ') + '.';
    }

    if (field.validity.typeMismatch && field.type === 'email') {
      return 'Please enter a valid email address.';
    }

    return '';
  }

  function clearFieldError(field) {
    var error = errorElementFor(field);
    field.removeAttribute('aria-invalid');
    if (error) {
      error.textContent = '';
    }
  }

  function showFieldError(field) {
    var error = errorElementFor(field);
    var message = validationMessageFor(field);

    if (!message) {
      clearFieldError(field);
      return false;
    }

    field.setAttribute('aria-invalid', 'true');
    if (error) {
      error.textContent = message;
    }
    return true;
  }

  function validateField(field) {
    if (field.checkValidity()) {
      clearFieldError(field);
      return false;
    }

    return showFieldError(field);
  }

  function validateForm() {
    var firstInvalid = null;

    requiredFields.forEach(function (field) {
      var hasError = validateField(field);
      if (!firstInvalid && hasError) {
        firstInvalid = field;
      }
    });

    if (firstInvalid) {
      setStatus('Please fix the highlighted fields and try again.', 'error');
      firstInvalid.focus();
      return false;
    }

    return true;
  }

  function deriveLeadSource() {
    var params = new URLSearchParams(window.location.search);
    var utmSource = params.get('utm_source');
    var utmMedium = params.get('utm_medium');
    var utmCampaign = params.get('utm_campaign');
    var referrer = document.referrer;

    if (utmSource) {
      return [utmSource, utmMedium, utmCampaign].filter(Boolean).join(' / ');
    }

    if (!referrer) {
      return 'direct';
    }

    try {
      return new URL(referrer).hostname.replace(/^www\./, '');
    } catch (error) {
      return referrer;
    }
  }

  function populateLeadSource() {
    if (leadSourceField) {
      leadSourceField.value = deriveLeadSource();
    }
  }

  function populateIpAddress() {
    if (!ipAddressField) return Promise.resolve('');
    if (ipAddressField.value) return Promise.resolve(ipAddressField.value);
    if (ipLookupPromise) return ipLookupPromise;

    ipLookupPromise = fetch('https://api.ipify.org?format=json', {
      cache: 'no-store'
    })
      .then(function (response) {
        if (!response.ok) throw new Error('IP lookup failed');
        return response.json();
      })
      .then(function (data) {
        ipAddressField.value = data.ip || '';
        return ipAddressField.value;
      })
      .catch(function () {
        return '';
      })
      .finally(function () {
        ipLookupPromise = null;
      });

    return ipLookupPromise;
  }

  populateLeadSource();
  populateIpAddress();

  requiredFields.forEach(function (field) {
    field.addEventListener('blur', function () {
      validateField(field);
    });

    field.addEventListener('input', function () {
      if (field.getAttribute('aria-invalid') === 'true') {
        validateField(field);
      } else {
        clearFieldError(field);
      }
    });
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    if (!validateForm()) return;

    submit.disabled = true;
    setStatus('Sending your message...', '');

    populateLeadSource();

    populateIpAddress()
      .then(function () {
        var formData = new FormData(form);

        return fetch(form.action, {
          method: 'POST',
          body: formData,
          headers: {
            Accept: 'application/json'
          }
        });
      })
      .then(function (response) {
        return response.json().then(function (data) {
          return {
            ok: response.ok,
            data: data
          };
        });
      })
      .then(function (result) {
        if (result.ok && result.data.success) {
          form.reset();
          populateLeadSource();
          populateIpAddress();
          setStatus('Thanks. Your message has been sent.', 'success');
          return;
        }

        setStatus(result.data.message || 'Something went wrong. Please try again.', 'error');
      })
      .catch(function () {
        setStatus('Unable to send right now. Please try again in a moment.', 'error');
      })
      .finally(function () {
        submit.disabled = false;
      });
  });
}());
