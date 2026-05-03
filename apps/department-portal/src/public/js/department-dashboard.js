document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('[data-sidebar-toggle]');
  const sidebar = document.getElementById('department-sidebar');
  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      sidebar.classList.toggle('is-open');
    });
  }
});
