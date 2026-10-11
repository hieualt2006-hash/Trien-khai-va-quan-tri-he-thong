document.addEventListener('DOMContentLoaded', () => {
  // Update real-time clock
  const timeElem = document.getElementById('current-time');
  if (timeElem) {
    const updateTime = () => {
      const now = new Date();
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
      timeElem.textContent = now.toLocaleDateString('vi-VN', options);
    };
    updateTime();
    setInterval(updateTime, 1000);
  }

  // Auto-hide alert after 5 seconds
  const alerts = document.querySelectorAll('.alert');
  alerts.forEach(alert => {
    setTimeout(() => {
      alert.style.transition = 'opacity 0.5s ease';
      alert.style.opacity = '0';
      setTimeout(() => alert.remove(), 500);
    }, 5000);
  });
});
