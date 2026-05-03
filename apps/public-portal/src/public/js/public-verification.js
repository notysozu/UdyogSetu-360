document.addEventListener('DOMContentLoaded', () => {
  const copyButton = document.querySelector('[data-copy-target]');
  if (copyButton) {
    copyButton.addEventListener('click', async () => {
      const target = document.getElementById(copyButton.dataset.copyTarget);
      if (!target) return;
      try {
        await navigator.clipboard.writeText(target.textContent.trim());
        copyButton.textContent = 'Copied';
      } catch (_error) {}
    });
  }
  const printButton = document.querySelector('[data-print-page]');
  if (printButton) {
    printButton.addEventListener('click', () => window.print());
  }
});
