document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('form').forEach((form) => {
    form.addEventListener('submit', () => {
      const submit = form.querySelector('button[type="submit"]');
      if (submit) submit.disabled = true;
    });
  });

  document.querySelectorAll('form[action$="/read"]').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      if (!window.fetch) return;
      event.preventDefault();
      try {
        await fetch(form.action, { method: 'POST', headers: { Accept: 'application/json' } });
        form.closest('.notification-item')?.classList.remove('is-unread');
      } catch (_error) {
        form.submit();
      }
    });
  });
});
