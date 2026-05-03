document.addEventListener('DOMContentLoaded', () => {
  const blocks = document.querySelectorAll('pre');
  blocks.forEach((block) => {
    if ((block.textContent || '').length > 4000) {
      block.style.maxHeight = '420px';
      block.style.overflow = 'auto';
    }
  });
});
