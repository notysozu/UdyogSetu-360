document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-sla-countdown]').forEach((element) => {
    const dueAt = element.getAttribute('data-due-at');
    if (!dueAt) return;
    const target = new Date(dueAt).getTime();
    const update = () => {
      const diff = target - Date.now();
      if (diff <= 0) return;
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const span = element.querySelector('span:last-child');
      if (span) span.textContent = `${hours}h ${minutes}m remaining`;
    };
    update();
    window.setInterval(update, 60000);
  });
});
