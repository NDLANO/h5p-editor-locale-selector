/** @constant {string} BCP47_SHORTCUT_COUNTRIES Shortcut to select all countries. */
const BCP47_SHORTCUT_PRIMARY_LANGUAGES = 'primary';

/** @constant {string} BCP47_SHORTCUT_LANGUAGES Shortcut to select all primary languages. */
const BCP47_SHORTCUT_SECONDARY_LANGUAGES = 'secondary';

/** @constant {string} LOCALESELECTOR_TYPE_LANGUAGE LocaleSelector type for languages. */
const TYPE_LANGUAGE = 'language';

/** @constant {string} LOCALESELECTOR_TYPE_COUNTRY LocaleSelector type for countries. */
const TYPE_COUNTRY = 'country';

/** @constant {string[]} ALLOWED_TYPES Allowed types for the select field. */
const ALLOWED_TYPES = [TYPE_LANGUAGE, TYPE_COUNTRY];

/** @constant {string} DEFAULT_TYPE Default type for the select field. */
const DEFAULT_TYPE = TYPE_LANGUAGE;

/** @constant {string} MANDATORY_PROPERTIES Values that will always be included. BCP47/ISO3166 required for storing locale selection. */
const MANDATORY_PROPERTIES = {
  'country': ['iso3166'],
  'language': ['bcp47']
};

/**
 * Get primary languages (all primary and secondary if no primary exists).
 * @param {string[]} bcp47s All BCP47s.
 * @returns {string[]} Primary BCP47s and secondary if no primary exists.
 */
const getPrimaryLanguages = (bcp47s) => {
  const primaryLanguages = bcp47s.filter((bcp47) => !bcp47.includes('-'));

  bcp47s.forEach((bcp47) => {
    if (primaryLanguages.includes(bcp47)) {
      return;
    }

    const primaryPart = bcp47.split('-')[0];
    if (primaryLanguages.includes(primaryPart)) {
      return;
    }

    primaryLanguages.push(bcp47);
  });

  return primaryLanguages;

};

/**
 * Get secondary languages from primary BCP47s (all secondary and primary if no secondary exists).
 * @param {string[]} bcp47s All BCP47s.
 * @returns {string[]} Secondary BCP47s and primary if no secondary exists.
 */
const getSecondaryLanguages = (bcp47s) => {
  const primaryBCP47s = bcp47s.filter((bcp47) => !bcp47.includes('-'));
  const secondaryLanguages = primaryBCP47s.filter((bcp47) => bcp47.includes('-'));

  bcp47s.forEach((bcp47) => {
    if (secondaryLanguages.includes(bcp47)) {
      return;
    }

    if (secondaryLanguages.some((secondary) => secondary.startsWith(`${bcp47}-`))) {
      return;
    }

    secondaryLanguages.push(bcp47);
  });

  return secondaryLanguages;
};

/**
 * Sanitize requested BCP47s to use for the locale selector.
 * @param {string|string[]} bcp47s Requested BCP47s.
 * @param {object} dataPool Data pool containing available BCP47s.
 * @returns {string[]} Sanitized BCP47s.
 */
const sanitizeBCP47s = (bcp47s, dataPool = {}) => {
  const allBCP47s = Object.keys(dataPool);

  if (bcp47s === BCP47_SHORTCUT_PRIMARY_LANGUAGES) {
    return getPrimaryLanguages(allBCP47s);
  }
  else if (bcp47s === BCP47_SHORTCUT_SECONDARY_LANGUAGES) {
    return getSecondaryLanguages(allBCP47s);
  }

  if (!Array.isArray(bcp47s) || !bcp47s.length) {
    return getPrimaryLanguages(allBCP47s);
  }

  return bcp47s.filter((bcp47) => Object.keys(dataPool).includes(bcp47));
};

const sanitizeISO3166s = (iso3166s, dataPool = {}) => {
  const availableISO3166s = Object.keys(dataPool);

  if (!Array.isArray(iso3166s) || !iso3166s.length) {
    return availableISO3166s;
  }

  return iso3166s.filter((iso3166) => Object.keys(dataPool).includes(iso3166));
};

/**
 * Sanitize requested values to store for the selected locale.
 * @param {string[]} requestedProperties Requested values to store.
 * @param {string} type Type for select field.
 * @param {string[]} allowedProperties Allowed properties for the selected locale.
 * @returns {string[]} Sanitized requested values.
 */
const sanitizeRequestedProperties = (requestedProperties, type, allowedProperties = []) => {
  const allowedKeysSet = new Set(allowedProperties);

  const servedProperties = (Array.isArray(requestedProperties)) ? requestedProperties : [];
  const validatedKeys = new Set([...(MANDATORY_PROPERTIES[type]), ...servedProperties]);

  return Array.from(validatedKeys).filter((key) => allowedKeysSet.has(key));
};

/**
 * Sanitize type.
 * @param {string} type Type for select field.
 * @returns {string} Sanitized type.
 */
const sanitizeType = (type) => {
  if (!ALLOWED_TYPES.includes(type)) {
    type = DEFAULT_TYPE;
  }

  return type;
};

/**
 * Sanitize target field map.
 * @param {object} fieldMap Mapping from properties to target field paths.
 * @param {string[]} allowedProperties Allowed properties for target fields.
 * @returns {object} Sanitized target field map.
 */
const sanitizeTargetFieldMap = (fieldMap = {}, allowedProperties = []) => {
  if (typeof fieldMap !== 'object' || fieldMap === null) {
    return {};
  }

  const sanitizedMap = {};
  for (const [key, value] of Object.entries(fieldMap)) {
    if (typeof key !== 'string' || typeof value !== 'string' || !allowedProperties.includes(key)) {
      continue;
    }

    sanitizedMap[key] = value;
  }

  return sanitizedMap;
};

/**
 * Sanitize default value.
 * @param {string} defaultValue Default value.
 * @param {string} type Type for select field.
 * @param {object} data Data pool containing available BCP47s and values.
 * @returns {string} Sanitized default value or empty string.
 */
export const sanitizeDefault = (defaultValue, type, data) => {
  if (type === TYPE_COUNTRY) {
    const availableISO3166s = Object.keys(data.countries);
    if (typeof defaultValue !== 'string' || !availableISO3166s.includes(defaultValue)) {
      return '';
    }
  }
  else {
    const availableBCP47s = Object.keys(data.languages);
    if (typeof defaultValue !== 'string' || !availableBCP47s.includes(defaultValue)) {
      return '';
    }
  }

  return defaultValue;
};

/**
 * Sanitize locale selector configuration from semantics.
 * @param {object} config Locale selector configuration.
 * @param {object} data Data pool containing available BCP47s and values.
 * @param {string} defaultBCP47 Default BCP47 to use for sampling available values.
 * @param {string} defaultISO3166 Default ISO3166 to use for sampling available values.
 * @returns {object} Sanitized locale selector configuration.
 */
export const sanitizeLocaleSelectorConfig = (config = {}, data = {}, defaultBCP47, defaultISO3166) => {
  if (typeof config !== 'object' || config === null) {
    config = {};
  }

  config.type = sanitizeType(config.type);
  if (config.type === TYPE_COUNTRY) {
    config.requestedBCP47s = [];
    config.requestedISO3166s = sanitizeISO3166s(config.requestedISO3166s, data.countries);
  }
  else {
    config.requestedBCP47s = sanitizeBCP47s(config.requestedBCP47s, data.languages);
    config.requestedISO3166s = [];
  }

  const allProperties = [...Object.keys(data.countries[defaultISO3166]), ...Object.keys(data.languages[defaultBCP47])];

  const allowedProperties = Array.from(new Set(allProperties));

  config.requestedProperties = sanitizeRequestedProperties(config.requestedProperties, config.type, allowedProperties);
  config.targetFieldMap = sanitizeTargetFieldMap(config.targetFieldMap, allowedProperties);
  config.noFlag = config.noFlag === true;
  config.default = sanitizeDefault(config.default, config.type, data);

  return config;
};
