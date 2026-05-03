document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('[data-sidebar-toggle]');
  const sidebar = document.getElementById('investor-sidebar');
  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      sidebar.classList.toggle('is-open');
    });
  }

  document.querySelectorAll('[data-copy-case-id]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(button.getAttribute('data-copy-case-id'));
        button.textContent = 'Copied';
      } catch (_error) {}
    });
  });
});
