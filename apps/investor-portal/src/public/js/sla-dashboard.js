document.addEventListener('DOMContentLoaded', () => {
  const countdowns = document.querySelectorAll('[data-sla-due-at]');
  countdowns.forEach((node) => {
    const dueAt = new Date(node.getAttribute('data-sla-due-at'));
    if (Number.isNaN(dueAt.getTime())) return;
    const tick = () => {
      const ms = dueAt.getTime() - Date.now();
      const hours = Math.floor(ms / 3600000);
      node.textContent = ms > 0 ? `${hours}h remaining` : `Overdue by ${Math.abs(hours)}h`;
    };
    tick();
    setInterval(tick, 60000);
  });
});
