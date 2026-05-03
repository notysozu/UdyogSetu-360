document.addEventListener('DOMContentLoaded', () => {
  const markReadForms = document.querySelectorAll('form[action*="/notifications/"][action$="/read"]');
  markReadForms.forEach((form) => {
    form.addEventListener('submit', () => {
      const button = form.querySelector('button[type="submit"]');
      if (button) button.disabled = true;
    });
  });
});
