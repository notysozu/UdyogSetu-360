document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.querySelector('input[type="file"]');
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      const label = document.querySelector('[data-file-name]');
      if (label && fileInput.files[0]) {
        label.textContent = fileInput.files[0].name;
      }
    });
  }
});
