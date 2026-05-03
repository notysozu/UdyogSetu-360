document.addEventListener('DOMContentLoaded', () => {
  const printButtons = document.querySelectorAll('[data-print-audit]');
  printButtons.forEach((button) => button.addEventListener('click', () => window.print()));
});
