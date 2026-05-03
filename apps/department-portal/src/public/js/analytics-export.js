(() => {
  const forms = document.querySelectorAll('.analytics-export-form');
  forms.forEach((form) => {
    form.addEventListener('submit', (event) => {
      const ok = window.confirm('Create this analytics export job?');
      if (!ok) {
        event.preventDefault();
        return;
      }
      const submit = form.querySelector('button[type="submit"]');
      if (submit) submit.disabled = true;
    });
  });
})();
