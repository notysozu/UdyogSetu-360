(() => {
  const form = document.querySelector('.analytics-filter-bar form');
  if (!form) return;
  form.addEventListener('submit', () => {
    const submit = form.querySelector('button[type="submit"]');
    if (submit) submit.disabled = true;
  });
})();
