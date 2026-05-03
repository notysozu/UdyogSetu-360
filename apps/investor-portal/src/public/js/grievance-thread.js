document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('form[action*="/grievances/"][action$="/messages"]').forEach((form) => {
    form.addEventListener('submit', () => {
      const button = form.querySelector('button[type="submit"]');
      if (button) button.disabled = true;
    });
  });
});
