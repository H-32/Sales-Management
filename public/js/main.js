// file: public/js/main.js
document.addEventListener('DOMContentLoaded', () => {
  if (window.gsap) {
    gsap.from('.title', { duration: 0.8, y: 40, opacity: 0, ease: 'power2.out' });
    gsap.from('.subtitle', { duration: 0.8, y: 20, opacity: 0, delay: 0.3 });
    gsap.from('.card', {
      duration: 0.6,
      opacity: 0,
      y: 20,
      stagger: 0.2,
      delay: 0.6
    });
  }
});
