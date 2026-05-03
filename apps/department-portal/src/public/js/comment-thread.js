document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-comment-thread]').forEach((thread) => {
    thread.addEventListener('click', () => thread.classList.toggle('is-expanded'));
  });
});
