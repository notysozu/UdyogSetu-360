(() => {
  const printButton = document.querySelector('[data-analytics-print]');
  if (printButton) {
    printButton.addEventListener('click', () => window.print());
  }
})();
