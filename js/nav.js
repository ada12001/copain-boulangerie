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
