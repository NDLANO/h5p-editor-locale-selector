import defaultTranslation from '@root/language/en.json';

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
    return translation;
  }

  let fallbackTranslation = (typeof fallback === 'string') ?
    fallback :
    defaultTranslation?.libraryStrings?.[`${key}`];

  if (typeof fallbackTranslation !== 'string') {
    return translation;
  }

  for (const placeholder in placeholderReplacements) {
    if (typeof placeholder !== 'string' || typeof placeholderReplacements[placeholder] !== 'string') {
      continue;
    }
    fallbackTranslation = fallbackTranslation.replace(placeholder, placeholderReplacements[placeholder]);
  }

  return fallbackTranslation;
};
