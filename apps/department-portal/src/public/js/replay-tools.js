document.addEventListener('DOMContentLoaded', () => {
  const replayForm = document.querySelector('form[action="/admin/operations/replay"]');
  if (!replayForm) return;
  replayForm.addEventListener('submit', (event) => {
    const reason = replayForm.querySelector('[name="reason"]');
    if (!reason?.value?.trim()) {
      event.preventDefault();
      alert('Reason is required for replay.');
    }
  });
});
