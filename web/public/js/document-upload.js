document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('[data-upload-form]');
  const progress = document.querySelector('[data-upload-progress]');
  if (!form || !progress) return;

  form.addEventListener('submit', () => {
    progress.hidden = false;
    progress.value = 25;
    window.setTimeout(() => {
      progress.value = 75;
    }, 200);
  });
});
