document.addEventListener('submit', (event) => {
  const button = event.target.querySelector('button[type="submit"]');
  if (button && !button.dataset.noDisable) {
    button.dataset.originalText = button.textContent;
    button.textContent = 'Processing...';
    button.disabled = true;
  }
});
