import defaultTranslation from '@root/language/en.json';
import translationsDE from '@root/language/de.json';

/** @constant {object} TRANSLATIONS Translations for supported languages. */
const TRANSLATIONS = {
  de: translationsDE,
  en: defaultTranslation,
};

/**
 * Find H5PEditor.Form instance for a field.
 * @param {object} field Field to start searching from.
 * @returns {H5PEditor.Form|false} Found form instance or false.
 */
export const findEditorFormInstance = (field = {}) => {
  if (typeof field !== 'object' || field === null) {
    return false;
  }

  let parent = field.parent;
  while (parent) {
    if (parent instanceof H5PEditor.Form) {
      return parent;
    }
    parent = parent.parent;
  }

  return false;
};

/**
 * Replace placeholders in a string with their corresponding values.
 * @param {string} placeholders The string containing placeholders.
 * @param {object} replacements An object with placeholder-value pairs.
 * @returns {string} The string with placeholders replaced.
 */
const replacePlaceholders = (placeholders, replacements) => {
  if (typeof placeholders !== 'string' || typeof replacements !== 'object' || !replacements) {
    return placeholders;
  }

  let result = placeholders;
  for (const [placeholder, value] of Object.entries(replacements)) {
    if (typeof placeholder === 'string' && typeof value === 'string') {
      result = result.replace(placeholder, value);
    }
  }

  return result;
};

/**
 * Get translation from H5PEditor with explicit fallback or default (English) fallback.
 * @param {string} machineName Machine name of the H5P library (or `core`).
 * @param {string} key Translation key.
 * @param {object} [placeholderReplacements] Placeholder replacements as { placeholder: replacement }[].
 * @param {string} [fallback] Fallback translation.
 * @returns {string} Translated string.
 */
export const getTranslation = (machineName, key, placeholderReplacements = {}, fallback) => {
  // Error messages that H5PEditor.t() returns when translation cannot be found
  const potentialErrorMessages = [
    `Missing translations for ${machineName}`,
    `Missing translation for ${key}`,
    H5PEditor.t('core', 'missingTranslation', { ':key': key }),
  ];

  const translation = H5PEditor.t(machineName, key, placeholderReplacements);
  if (!potentialErrorMessages.includes(translation)) {
    return replacePlaceholders(translation, placeholderReplacements);
  }

  let fallbackTranslation = (typeof fallback === 'string') ?
    fallback :
    defaultTranslation?.libraryStrings?.[`${key}`];

  if (typeof fallbackTranslation !== 'string') {
    return translation;
  }

  return replacePlaceholders(fallbackTranslation, placeholderReplacements);
};

/**
 * Get translation for language set for the content.
 * @param {string} bcp47ORISO3166 Language BCP47 code or ISO 3166 country code of the content.
 * @param {string} machineName Machine name of the H5P library (or `core`).
 * @param {string} key Translation key.
 * @param {object} [placeholderReplacements] Placeholder replacements as { placeholder: replacement }[].
 * @param {string} [fallback] Fallback translation.
 * @returns {string} Translated string.
 */
export const getContentTranslation = (bcp47ORISO3166, machineName, key, placeholderReplacements = {}, fallback) => {
  const translation = TRANSLATIONS[bcp47ORISO3166]?.libraryStrings?.[key];
  if (typeof translation === 'string') {
    return replacePlaceholders(translation, placeholderReplacements);
  }

  console.warn(`Translation for key "${key}" not found for language "${bcp47ORISO3166}". Falling back to default translation.`);

  const fallbackTranslation = (typeof fallback === 'string') ?
    fallback :
    getTranslation(machineName, key, placeholderReplacements);

  return fallbackTranslation;
};
