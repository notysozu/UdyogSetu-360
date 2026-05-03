function clean(value, maxLength = 120) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (trimmed.length > maxLength) throw new Error('Input is too long.');
  if (/<|>|script/i.test(trimmed)) throw new Error('Invalid characters in verification input.');
  return trimmed;
}

function validateVerificationInput(input = {}) {
  const certificateNumber = clean(input.certificateNumber || input.referenceNumber || '', 80);
  const universalCaseId = clean(input.universalCaseId || '', 80);
  const checksum = clean(input.checksum || '', 200);
  const verificationToken = clean(input.verificationToken || '', 200);

  if (universalCaseId && !/^US360-[A-Z]{2}-\d{4}-\d{6}$/i.test(universalCaseId)) {
    throw new Error('Invalid Universal Case ID format.');
  }
  if (checksum && !/^[a-zA-Z0-9+/=:-]+$/.test(checksum)) {
    throw new Error('Checksum must be a valid hex or base64-like value.');
  }
  if (!verificationToken && !certificateNumber) {
    throw new Error('Provide a verification token or certificate/reference number.');
  }
  if (!verificationToken && certificateNumber && !universalCaseId && !checksum) {
    throw new Error('Use certificate/reference number with either Universal Case ID or checksum.');
  }
  return { certificateNumber, universalCaseId, checksum, verificationToken };
}

module.exports = { validateVerificationInput };
