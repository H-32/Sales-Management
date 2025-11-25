// file: public/js/login.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const message = document.getElementById('loginMessage');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    message.textContent = '';

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        const errData = await res.json();
        message.textContent = errData.message || 'فشل تسجيل الدخول';
        message.style.color = 'red';
        return;
      }

      const data = await res.json();
      message.style.color = 'green';
      message.textContent = 'تم تسجيل الدخول... جاري التحويل';

      // تحويل للداشبورد
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 800);
    } catch (err) {
      console.error(err);
      message.textContent = 'حدث خطأ أثناء الاتصال بالسيرفر';
      message.style.color = 'red';
    }
  });

  // أنميشن بسيطة باستخدام GSAP
  if (window.gsap) {
    gsap.from('.auth-container', {
      duration: 0.7,
      y: 30,
      opacity: 0,
      ease: 'power2.out'
    });
  }
});
