function validateMappingProfile(profile = {}) {
  const errors = [];
  if (!profile.profileCode) errors.push('profileCode is required.');
  if (!profile.departmentCode) errors.push('departmentCode is required.');
  if (!profile.direction) errors.push('direction is required.');
  if (!Array.isArray(profile.fieldMappings)) errors.push('fieldMappings must be an array.');
  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = { validateMappingProfile };
