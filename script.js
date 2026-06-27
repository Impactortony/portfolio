/* ===========================================================
   PORTFOLIO SCRIPT
   Anthony Chukwuemeka Stephen — Data Analyst Portfolio

   Sections:
   1. Sticky nav + scroll progress bar
   2. Mobile nav toggle
   3. Scroll-reveal animations (IntersectionObserver)
   4. Expandable project case cards
   5. Hero canvas: "noise -> signal" animation
=========================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     1. STICKY NAV + SCROLL PROGRESS
  --------------------------------------------------------- */
  const header = document.getElementById('siteHeader');
  const progressBar = document.getElementById('scrollProgress');

  function onScroll() {
    const scrollY = window.scrollY;
    header.classList.toggle('is-scrolled', scrollY > 8);

    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
    progressBar.style.width = pct + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------
     2. MOBILE NAV TOGGLE
  --------------------------------------------------------- */
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Close mobile menu after tapping a link
  navMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---------------------------------------------------------
     3. SCROLL-REVEAL ANIMATIONS
  --------------------------------------------------------- */
  const revealEls = document.querySelectorAll('.reveal');

  if (reduceMotion) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------------------------------------------------------
     4. EXPANDABLE PROJECT CASE CARDS
  --------------------------------------------------------- */
  document.querySelectorAll('.case-card').forEach((card) => {
    const toggle = card.querySelector('.case-toggle');
    const details = card.querySelector('.case-details');
    const toggleText = toggle.querySelector('.case-toggle-text');

    toggle.addEventListener('click', () => {
      const isOpen = card.classList.contains('is-open');

      if (isOpen) {
        details.style.maxHeight = '0px';
        card.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggleText.textContent = 'Read the full story';
      } else {
        details.style.maxHeight = details.scrollHeight + 'px';
        card.classList.add('is-open');
        toggle.setAttribute('aria-expanded', 'true');
        toggleText.textContent = 'Hide the full story';
      }
    });
  });

  // Keep open cards correctly sized if the window is resized
  // (text reflow changes scrollHeight on narrower screens)
  window.addEventListener('resize', () => {
    document.querySelectorAll('.case-card.is-open .case-details').forEach((details) => {
      details.style.maxHeight = details.scrollHeight + 'px';
    });
  });

  /* ---------------------------------------------------------
     5. HERO CANVAS — "NOISE -> SIGNAL"
     A scatter of points resolves into an ascending sparkline,
     visualising the move from chaotic real-world data
     (community/social work) to structured signal (analysis).
  --------------------------------------------------------- */
  const canvas = document.getElementById('signalCanvas');
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    const POINT_COUNT = 22;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let cssW = 0;
    let cssH = 0;
    let points = [];

    function buildPoints() {
      points = [];
      const marginX = cssW * 0.08;
      const marginTop = cssH * 0.18;
      const marginBottom = cssH * 0.22;
      const usableW = cssW - marginX * 2;
      const usableH = cssH - marginTop - marginBottom;

      for (let i = 0; i < POINT_COUNT; i++) {
        const t = i / (POINT_COUNT - 1);

        // Target: a gently noisy upward trend (the "signal")
        const trendY = marginTop + usableH * (1 - Math.pow(t, 1.15));
        const wobble = Math.sin(t * 9) * usableH * 0.035;
        const targetX = marginX + usableW * t;
        const targetY = trendY + wobble;

        // Start: scattered randomly (the "noise")
        const startX = marginX + Math.random() * usableW;
        const startY = marginTop + Math.random() * usableH;

        points.push({ startX, startY, targetX, targetY, x: startX, y: startY });
      }
    }

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      cssW = rect.width;
      cssH = rect.height;
      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildPoints();
    }

    function drawFrame(progress) {
      ctx.clearRect(0, 0, cssW, cssH);

      // Update point positions
      points.forEach((p) => {
        p.x = p.startX + (p.targetX - p.startX) * progress;
        p.y = p.startY + (p.targetY - p.startY) * progress;
      });

      // Connecting line fades in as points converge
      ctx.beginPath();
      points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.strokeStyle = `rgba(23, 107, 67, ${0.55 * progress})`;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();

      // Points: muted while scattered, signal-colored once resolved
      points.forEach((p, i) => {
        const isLast = i === points.length - 1;
        const r = isLast ? 4.5 : 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);

        const settledColor = isLast ? '#176B43' : `rgba(23, 107, 67, ${0.35 + 0.55 * progress})`;
        const noisyColor = 'rgba(94, 107, 102, 0.45)';
        ctx.fillStyle = progress > 0.05 ? settledColor : noisyColor;
        ctx.fill();
      });
    }

    function animate() {
      const duration = 1900;
      const start = performance.now();

      function frame(now) {
        const elapsed = now - start;
        const linear = Math.min(elapsed / duration, 1);
        // ease-out-cubic
        const eased = 1 - Math.pow(1 - linear, 3);
        drawFrame(eased);
        if (linear < 1) requestAnimationFrame(frame);
        else gentleDrift();
      }
      requestAnimationFrame(frame);
    }

    // Subtle ambient motion once resolved (skipped for reduced motion)
    function gentleDrift() {
      if (reduceMotion) return;
      let t = 0;
      function loop() {
        t += 0.01;
        points.forEach((p, i) => {
          const offset = Math.sin(t + i) * 0.6;
          p.x = p.targetX;
          p.y = p.targetY + offset;
        });
        ctx.clearRect(0, 0, cssW, cssH);
        ctx.beginPath();
        points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.strokeStyle = 'rgba(23, 107, 67, 0.55)';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();
        points.forEach((p, i) => {
          const isLast = i === points.length - 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, isLast ? 4.5 : 3, 0, Math.PI * 2);
          ctx.fillStyle = isLast ? '#176B43' : 'rgba(23, 107, 67, 0.7)';
          ctx.fill();
        });
        requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);
    }

    resizeCanvas();

    if (reduceMotion) {
      drawFrame(1); // jump straight to the resolved "signal" state
    } else {
      animate();
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resizeCanvas();
        drawFrame(1);
      }, 150);
    });
  }
});
