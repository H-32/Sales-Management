

document.addEventListener('DOMContentLoaded', () => {
  if (!window.gsap) {
    console.warn('GSAP not loaded');
    return;
  }

  // =============== 1) أنميشن الهيدر والـ Hero ===============
  gsap.from('.site-header', {
    duration: 0.7,
    y: -40,
    opacity: 0,
    ease: 'power2.out'
  });

  gsap.from('.hero-content', {
    duration: 0.9,
    y: 40,
    opacity: 0,
    ease: 'power3.out'
  });

  gsap.from('.hero-illustration', {
    duration: 0.9,
    y: 40,
    opacity: 0,
    scale: 0.95,
    ease: 'power3.out',
    delay: 0.15
  });

  gsap.from('.hero-badges .badge', {
    duration: 0.5,
    y: 20,
    opacity: 0,
    stagger: 0.08,
    ease: 'power2.out',
    delay: 0.3
  });

  // =============== 2) الكارد الزجاجي – فلوّت + حركة سطور ===============
  const glassCard = document.querySelector('.glass-card');

  if (glassCard) {
    // طفوّة فوق وتحت تلقائياً
    gsap.to(glassCard, {
      y: -10,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });

    // سطور الجدول تومض كأنها Data تتحرك
    gsap.to('.glass-table-placeholder .line', {
      duration: 1.4,
      opacity: 0.3,
      repeat: -1,
      yoyo: true,
      stagger: 0.15,
      ease: 'power1.inOut'
    });

    // Tilt بسيط مع الماوس
    glassCard.addEventListener('mousemove', (e) => {
      const rect = glassCard.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateY = ((x - centerX) / centerX) * 6;    // يمين / يسار
      const rotateX = -((y - centerY) / centerY) * 6;   // فوق / تحت

      gsap.to(glassCard, {
        rotateX,
        rotateY,
        transformPerspective: 800,
        transformOrigin: 'center',
        duration: 0.3,
        ease: 'power2.out'
      });
    });

    glassCard.addEventListener('mouseleave', () => {
      gsap.to(glassCard, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.5,
        ease: 'power2.out'
      });
    });
  }

  // =============== 3) أنميشن الكروت أثناء السكرول (Features + Steps) ===============
  const scrollItems = document.querySelectorAll('.feature-card, .step-card');

  const cardsObserverOptions = {
    threshold: 0.2
  };

  const cardsObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        gsap.fromTo(
          entry.target,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: 'power2.out'
          }
        );
        obs.unobserve(entry.target); // ما نعيد الأنميشن لنفس الكرت
      }
    });
  }, cardsObserverOptions);

  scrollItems.forEach(el => cardsObserver.observe(el));

  // =============== 4) Hover + Click للكروت ===============
  const clickableCards = document.querySelectorAll('.feature-card, .step-card');

  clickableCards.forEach(card => {
    card.style.cursor = 'pointer';

    card.addEventListener('mouseenter', () => {
      gsap.to(card, {
        y: -6,
        duration: 0.2,
        boxShadow: '0 16px 30px rgba(15, 23, 42, 0.25)',
        ease: 'power1.out'
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        y: 0,
        duration: 0.25,
        boxShadow: '0 10px 20px rgba(15, 23, 42, 0.12)',
        ease: 'power2.out'
      });
    });

    card.addEventListener('mousedown', () => {
      gsap.to(card, {
        scale: 0.97,
        duration: 0.08,
        ease: 'power1.in'
      });
    });

    card.addEventListener('mouseup', () => {
      gsap.to(card, {
        scale: 1,
        duration: 0.15,
        ease: 'power2.out'
      });
    });
  });

  // =============== 5) أنميشن + Smooth Scroll للـ Navbar ===============
  const navLinks = document.querySelectorAll('.main-nav a');
  const heroButtons = document.querySelectorAll('.hero-buttons a[href^="#"]');

  function smoothScrollTo(targetSelector) {
    const el = document.querySelector(targetSelector);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const allScrollLinks = [...navLinks, ...heroButtons];

  allScrollLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href || !href.startsWith('#')) return;

    // Smooth scroll on click
    link.addEventListener('click', (e) => {
      e.preventDefault();
      smoothScrollTo(href);
    });
  });

  // Hover / Click أنميشن للروابط في النافبار
  navLinks.forEach(link => {
    link.addEventListener('mouseenter', () => {
      gsap.to(link, {
        y: -2,
        duration: 0.18,
        color: '#ffca28',
        ease: 'power1.out'
      });
    });

    link.addEventListener('mouseleave', () => {
      gsap.to(link, {
        y: 0,
        duration: 0.2,
        color: '#e3f2fd',
        ease: 'power1.out'
      });
    });

    link.addEventListener('mousedown', () => {
      gsap.to(link, {
        scale: 0.95,
        duration: 0.08,
        ease: 'power1.in'
      });
    });

    link.addEventListener('mouseup', () => {
      gsap.to(link, {
        scale: 1,
        duration: 0.15,
        ease: 'power2.out'
      });
    });
  });

  // =============== 6) CTA في نهاية الصفحة ===============
  const ctaInner = document.querySelector('.section-cta .cta-inner');
  if (ctaInner) {
    // نخليها تدخل بنعومة أول مرة توصل للفيو
    const ctaObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          gsap.fromTo(
            ctaInner,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }
          );
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    ctaObserver.observe(ctaInner);
  }

  // =============== 7) أنميشن كامل للسكشينات (About / Features / How) ===============
  const sectionBlocks = document.querySelectorAll(
    '#about .section-inner, #features .section-inner, #how .section-inner'
  );

  const sectionsObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const target = entry.target;

      // أنميشن للكونتينر نفسه
      gsap.fromTo(
        target,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'power2.out'
        }
      );

      // عنوّن السكشن
      const title = target.querySelector('.section-title');
      if (title) {
        gsap.fromTo(
          title,
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: 'power2.out',
            delay: 0.1
          }
        );
      }

      // النص الرئيسي
      const text = target.querySelector('.section-text');
      if (text) {
        gsap.fromTo(
          text,
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: 'power2.out',
            delay: 0.15
          }
        );
      }

      // الحبوب (pill-grid) إن وجدت
      const pills = target.querySelectorAll('.pill');
      if (pills.length > 0) {
        gsap.from(pills, {
          y: 15,
          opacity: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power2.out',
          delay: 0.2
        });
      }

      obs.unobserve(target);
    });
  }, { threshold: 0.3 });

  sectionBlocks.forEach(sec => sectionsObserver.observe(sec));
});
