document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-auto-submit-filter] select').forEach((element) => {
    element.addEventListener('change', () => element.form.submit());
  });
});
