const { AdapterMappingError } = require('../errors/adapter.errors');
const { getByPath, setByPath } = require('../utils/object-path');

function applyFieldMapping(source, mapping, target = {}) {
  const transform = mapping.transform || 'copy';
  if (transform === 'constant') {
    return setByPath(target, mapping.target, mapping.value);
  }

  if (transform === 'combine') {
    const values = (mapping.sources || []).map((entry) => getByPath(source, entry)).filter((value) => value != null);
    return setByPath(target, mapping.target, values.join(mapping.separator || ' ').trim());
  }

  if (transform === 'boolean_to_yes_no') {
    return setByPath(target, mapping.target, getByPath(source, mapping.source) ? 'Yes' : 'No');
  }

  if (transform === 'yes_no_to_boolean') {
    return setByPath(target, mapping.target, String(getByPath(source, mapping.source)).toLowerCase() === 'yes');
  }

  if (transform === 'enum_map') {
    const rawValue = getByPath(source, mapping.source);
    return setByPath(target, mapping.target, mapping.map?.[rawValue] ?? rawValue);
  }

  if (transform === 'conditional') {
    const actualValue = getByPath(source, mapping.source);
    return setByPath(target, mapping.target, actualValue === mapping.equals ? mapping.whenTrue : mapping.whenFalse);
  }

  if (transform === 'date_format') {
    const rawValue = getByPath(source, mapping.source);
    return setByPath(target, mapping.target, rawValue ? new Date(rawValue).toISOString() : rawValue);
  }

  const value = getByPath(source, mapping.source);
  return setByPath(target, mapping.target, value);
}

function applyDefaultValues(payload, defaults = {}) {
  const cloned = { ...payload };
  for (const [key, value] of Object.entries(defaults)) {
    if (cloned[key] === undefined) {
      cloned[key] = value;
    }
  }
  return cloned;
}

function applyEnumMappings(payload, enumMappings = []) {
  const target = { ...payload };
  for (const mapping of enumMappings) {
    const value = getByPath(target, mapping.path);
    if (value !== undefined) {
      setByPath(target, mapping.path, mapping.values?.[value] ?? value);
    }
  }
  return target;
}

function validateRequiredMappedFields(payload, requiredFields = []) {
  const missing = requiredFields.filter((path) => {
    const value = getByPath(payload, path);
    return value === undefined || value === null || value === '';
  });
  if (missing.length) {
    throw new AdapterMappingError(`Mapped payload is missing required fields: ${missing.join(', ')}`, {
      details: { missing }
    });
  }
  return payload;
}

function mapCanonicalToDepartment(canonicalPayload, mappingProfile) {
  const mapped = (mappingProfile.fieldMappings || []).reduce(
    (result, mapping) => applyFieldMapping(canonicalPayload, mapping, result),
    {}
  );
  const withDefaults = applyDefaultValues(mapped, mappingProfile.defaultValues || {});
  const withEnums = applyEnumMappings(withDefaults, mappingProfile.enumMappings || []);
  return validateRequiredMappedFields(withEnums, mappingProfile.requiredFields || []);
}

function mapDepartmentToCanonical(departmentPayload, mappingProfile) {
  const mapped = (mappingProfile.fieldMappings || []).reduce(
    (result, mapping) => applyFieldMapping(departmentPayload, mapping, result),
    {}
  );
  const withDefaults = applyDefaultValues(mapped, mappingProfile.defaultValues || {});
  const withEnums = applyEnumMappings(withDefaults, mappingProfile.enumMappings || []);
  return validateRequiredMappedFields(withEnums, mappingProfile.requiredFields || []);
}

module.exports = {
  mapCanonicalToDepartment,
  mapDepartmentToCanonical,
  applyFieldMapping,
  applyDefaultValues,
  applyEnumMappings,
  validateRequiredMappedFields
};
