document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.timeline-item').forEach((item) => {
    item.addEventListener('click', () => {
      item.classList.toggle('is-expanded');
    });
  });
});
