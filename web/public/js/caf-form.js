(function () {
  const form = document.querySelector('[data-caf-form]');
  if (!form) return;

  const attachmentsList = document.getElementById('caf-attachments-list');
  const addAttachmentButton = document.getElementById('add-attachment-row');
  const submitButton = form.querySelector('[data-submit-final]');
  const caseId = form.getAttribute('data-case-id');
  const autosaveEnabled = form.getAttribute('data-autosave') === 'true';
  let autosaveTimer = null;
  let submitting = false;

  function showFieldSummary() {
    const required = form.querySelectorAll('input[required], textarea[required], select[required]');
    required.forEach((field) => {
      field.classList.toggle('field-has-error', !field.value && document.activeElement !== field);
    });
  }

  function addAttachmentRow() {
    if (!attachmentsList) return;
    const index = attachmentsList.querySelectorAll('.attachment-row').length;
    const wrapper = document.createElement('div');
    wrapper.className = 'card card-subtle attachment-row';
    wrapper.innerHTML = `
      <div class="grid-3">
        <label>Document type
          <select name="attachments[${index}][documentType]">
            <option value="">Select</option>
            <option value="pan_card">pan card</option>
            <option value="gst_certificate">gst certificate</option>
            <option value="udyam_certificate">udyam certificate</option>
            <option value="land_document">land document</option>
            <option value="project_report">project report</option>
            <option value="layout_plan">layout plan</option>
            <option value="pollution_control_documents">pollution control documents</option>
            <option value="fire_safety_plan">fire safety plan</option>
            <option value="factory_safety_documents">factory safety documents</option>
            <option value="labour_documents">labour documents</option>
            <option value="authorisation_letter">authorisation letter</option>
            <option value="other">other</option>
          </select>
        </label>
        <label>Title <input name="attachments[${index}][title]"></label>
        <label>File name <input name="attachments[${index}][fileName]"></label>
        <label>MIME type <input name="attachments[${index}][mimeType]" value="application/pdf"></label>
        <label>File size <input name="attachments[${index}][fileSize]" type="number" min="0"></label>
        <label>Object key <input name="attachments[${index}][objectKey]"></label>
        <label>Checksum <input name="attachments[${index}][checksum]"></label>
      </div>
    `;
    attachmentsList.appendChild(wrapper);
  }

  async function autosaveDraft() {
    if (!caseId || !autosaveEnabled || submitting) return;
    const method = 'PATCH';
    const action = `/cases/${caseId}/draft`;
    const data = new URLSearchParams(new FormData(form));
    data.set('_method', 'PATCH');

    try {
      await fetch(action, {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: data.toString()
      });
    } catch (_error) {
      // Silent autosave failure; the user can still save manually.
    }
  }

  if (addAttachmentButton) {
    addAttachmentButton.addEventListener('click', addAttachmentRow);
  }

  form.addEventListener('input', showFieldSummary);
  form.addEventListener('submit', function () {
    submitting = true;
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Submitting...';
    }
  });

  if (autosaveEnabled && caseId) {
    autosaveTimer = window.setInterval(autosaveDraft, 30000);
  }

  window.addEventListener('beforeunload', function () {
    if (autosaveTimer) {
      window.clearInterval(autosaveTimer);
    }
  });
})();
