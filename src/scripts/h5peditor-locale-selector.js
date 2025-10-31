import { decode } from 'he';

import { findEditorFormInstance, getContentTranslation, getTranslation } from '@services/h5p-util.js';
import { sanitizeLocaleSelectorConfig } from '@services/sanitization.js';

import Description from '@components/description.js';
import Label from '@components/label.js';
import Select from '@components/select.js';

import countriesData from '@assets/countries.json';
import languagesData from '@assets/languages.json';
import LanguageSwitchDetector from './services/language-switch-detector.js';

/** @constant {string} DEFAULT_BCP47 Default BCP47 language code. */
const DEFAULT_BCP47 = 'en';

/** @constant {string} DEFAULT_ISO3166 Default ISO3166 country code. */
const DEFAULT_ISO3166 = 'GB';

/** @constant {string} LOCALESELECTOR_TYPE_COUNTRY LocaleSelector type for languages. */
const LOCALESELECTOR_TYPE_COUNTRY = 'country';

/** @constant {string} OPTION_LABEL_SEPARATOR Separator for option flag and labels. */
const OPTION_LABEL_SEPARATOR = '\u00A0\u00A0'; // Non-breaking spaces

/** Class for H5P widget LocaleSelector */
export default class LocaleSelector {

  /**
   * @class
   * @param {object} parent Parent element in semantics.
   * @param {object} field Semantics field properties.
   * @param {object} params Parameters entered in editor form.
   * @param {function} setValue Callback to set parameters.
   */
  constructor(parent, field, params, setValue) {
    this.parent = parent;
    this.field = field;
    this.params = params ?? '';
    this.setValue = setValue;

    this.validateInputs();

    this.params = decode(this.params); // H5P stores special characters encoded, so we need to decode them
    this.targetFieldInstances = {};
    this.countriesData = window.structuredClone(countriesData);
    this.languagesData = window.structuredClone(languagesData);

    this.uuid = H5P.createUUID();

    this.initializeLocaleData();
    this.setupFieldInstance();

    // Relay changes
    if (this.fieldInstance.changes) {
      this.fieldInstance.changes.push(() => {
        this.handleFieldChange();
      });
    }

    this.setupCustomTargetFieldHandling();
  }

  /**
   * Validate input parameters and field configuration.
   * @throws {Error} If validation fails.
   */
  validateInputs() {
    if (this.field?.type !== 'text') {
      throw new Error('LocaleSelector can only be used with text fields.');
    }

    if (typeof this.params !== 'string') {
      throw new Error(`Invalid parameters: expected string, received ${typeof this.params}`);
    }
  }

  /**
   * Initialize and configure locale data with translations.
   */
  initializeLocaleData() {
    for (const bcp47 in this.languagesData) {
      const languageNameTranslatedEditor = getTranslation('H5PEditor.LocaleSelector', `languageLabel-${bcp47}`);

      this.languagesData[bcp47] = {
        ...this.languagesData[bcp47],
        languageNameTranslatedEditor: languageNameTranslatedEditor,
      };
    }

    for (const iso3166 in this.countriesData) {
      const countryNameTranslatedEditor = getTranslation('H5PEditor.LocaleSelector', `countryLabel-${iso3166}`);

      this.countriesData[iso3166] = {
        ...this.countriesData[iso3166],
        countryNameTranslatedEditor: countryNameTranslatedEditor,
      };
    }

    this.field.localeSelector = sanitizeLocaleSelectorConfig(
      this.field.localeSelector,
      { countries: this.countriesData, languages: this.languagesData },
      DEFAULT_BCP47,
      DEFAULT_ISO3166,
    );
  }

  /**
   * Set up the field instance and DOM.
   */
  setupFieldInstance() {
    this.setupDOM();

    // Callbacks to call when parameters change, expected by H5P core
    this.changes = [];

    // Let parent handle ready callbacks of children
    this.passReadies = true;

  }

  /**
   * Set up DOM elements and field instance.
   */
  setupDOM() {
    // DOM
    const container = document.createElement('div');
    container.classList.add('h5peditor-locale-selector');
    this.$container = H5P.jQuery(container); // jQuery is what H5P core uses :-(, should only be used when required

    // Setting params to undefined, because fieldInstance creation breaks for JSON strings with double quotes
    this.fieldInstance = new H5PEditor.widgets[this.field.type](this.parent, this.field, undefined, this.setValue);

    this.domElements = this.buildDOM({
      requestedBCP47s: this.field.localeSelector.requestedBCP47s,
      requestedISO3166s: this.field.localeSelector.requestedISO3166s,
      selectedValue: this.getSelectedValue(this.params, this.field.localeSelector.type),
    });

    container.append(...this.domElements);
    this.fieldInstance.appendTo(this.$container); // Field DOM will not be created otherwise, field hidden via CSS
    this.fieldInstance.forceValue(this.params); // Now set JSON string as value

    this.$errors = this.$container.find('.h5p-errors'); // expected by H5P core
  }

  /**
   * Build DOM for locale selector.
   * @param {object} params Parameters for building the DOM.
   * @param {string[]} params.requestedBCP47s Requested BCP47s to include in select field.
   * @param {string} params.selectedBCP47 Selected BCP47.
   * @returns {HTMLElement[]} DOM elements.
   */
  buildDOM(params = {}) {
    const domElements = [];

    const labelText = this.field.label ?? H5PEditor.t('H5PEditor.LocaleSelector', 'LanguageSettings');
    const label = new Label(labelText);
    domElements.push(label.getDOM());

    const hasDescription = typeof this.field.description === 'string' && this.field.description.trim() !== '';
    let description;
    if (hasDescription) {
      description = new Description(this.field.description);
      domElements.push(description.getDOM());
    }

    const select = new Select(
      {
        descriptionID: hasDescription ? description.getID() : undefined,
        options: this.compileSelectOptions(
          this.field.localeSelector.type,
          params.requestedBCP47s,
          params.requestedISO3166s,
          { countries: this.countriesData, languages: this.languagesData },
          this.field.localeSelector.noFlag,
        ),
        selectedValue: params.selectedValue,
      },
      {
        onChange: (selectedValue) => {
          this.handleSelectChange(selectedValue);
        }
      }
    );
    domElements.push(select.getDOM());

    return domElements;
  }

  /**
   * Compile select options for the select field.
   * @param {string} type Label type to use for options.
   * @param {string[]} requestedBCP47s Requested BCP47s to include.
   * @param {string[]} requestedISO3166s Requested ISO3166s to include.
   * @param {object} data Locale data to use for labels.
   * @param {boolean} noFlag True to disable flags in options.
   * @returns {object[]} Select options.
   */
  compileSelectOptions(type = '', requestedBCP47s = [], requestedISO3166s = [], data = {}, noFlag = false) {
    const labelProperty = (type === LOCALESELECTOR_TYPE_COUNTRY) ?
      'countryNameTranslatedEditor' :
      'languageNameTranslatedEditor';
    const requestedData = (type === LOCALESELECTOR_TYPE_COUNTRY) ? requestedISO3166s : requestedBCP47s;
    const localeData = (type === LOCALESELECTOR_TYPE_COUNTRY) ? data.countries : data.languages;

    return requestedData
      .sort((a, b) => {
        return localeData[a][labelProperty].localeCompare(localeData[b][labelProperty]);
      })
      .map((key) => ({
        value: key,
        label: this.buildOptionLabel(localeData, key, labelProperty, noFlag),
      }));
  }

  /**
   * Build option label with optional flag.
   * @param {object} localeData Locale data to use for labels.
   * @param {string} key Key for the locale data.
   * @param {string} labelProperty Property to use for label text.
   * @param {boolean} noFlag True to disable flags in options.
   * @returns {string} Option label.
   */
  buildOptionLabel(localeData, key, labelProperty, noFlag) {
    const flagText = noFlag ? '' : `${localeData[key].flag}${OPTION_LABEL_SEPARATOR}`;
    return `${flagText}${localeData[key][labelProperty]}`;
  }

  /**
   * Get selected value from parameters.
   * @param {string} params Parameters entered in editor form.
   * @param {string} type Type.
   * @returns {string} Selected BCP47 or default BCP47 if error.
   */
  getSelectedValue(params, type = '') {
    const defaultValue = this.field.localeSelector.default;

    if (!params || params.trim() === '') {
      return defaultValue;
    }

    if (!params.startsWith('{')) {
      return params; // Plain value, not JSON
    }

    try {
      const parsed = JSON.parse(params);
      const selected = (type === LOCALESELECTOR_TYPE_COUNTRY) ? parsed?.iso3166 : parsed?.bcp47;
      return selected ?? defaultValue;
    }
    catch (error) {
      console.warn('Could not parse locale data:', error);
      return defaultValue;
    }
  }

  /**
   * Set up handling for custom target fields.
   */
  setupCustomTargetFieldHandling() {
    if (!Object.keys(this.field.localeSelector.targetFieldMap)) {
      return; // No custom target fields specified
    }

    const form = findEditorFormInstance(this);
    if (!form) {
      console.warn('Could not find H5PEditor.Form instance for LocaleSelector field.');
      return;
    }

    form.ready(() => {
      this.handleParentReady(form);
    });
  }

  /**
   * Handle parent field signals to be ready.
   * @param {H5PEditor.Form} form Parent form instance.
   */
  handleParentReady(form) {
    this.setupTargetFieldInstances();

    // Store initial values
    this.handleSelectChange(this.getSelectedValue(this.params, this.field.localeSelector.type));

    this.setupLanguageSwitchDetector(form);
  }

  /**
   * Set up target field instances based on field map.
   */
  setupTargetFieldInstances() {
    for (const localeKey in this.field.localeSelector.targetFieldMap) {
      const fieldPath = this.field.localeSelector.targetFieldMap[localeKey];
      const targetFieldInstance = H5PEditor.findField(fieldPath, this.parent);
      if (targetFieldInstance?.field?.type !== 'text') {
        console.warn(`LocaleSelector target field for key "${localeKey}" must be of type "text".`);
        continue;
      }

      this.targetFieldInstances[localeKey] = targetFieldInstance;
    }
  }

  /**
   * Update fields when select value changes.
   * @param {string} selectedValue Selected BCP47 value.
   */
  handleSelectChange(selectedValue) {
    this.updateNamesTranslatedContent(selectedValue);

    let allValues = this.field.localeSelector.type === LOCALESELECTOR_TYPE_COUNTRY ?
      this.countriesData[selectedValue] :
      this.languagesData[selectedValue];

    if (!allValues) {
      return;
    }

    const updatedProperties = this.updateTargetFields(allValues);
    allValues = this.filterUpdatedProperties(allValues, updatedProperties);
    allValues = this.filterRequestedProperties(allValues);
    this.updateOwnFieldValue(allValues);
  }

  /**
   * Update translated names in locale data based on content language.
   * @param {string} [selectedValue] Selected BCP47 or ISO 3166 value to update for. If not provided, all values are updated.
   */
  updateNamesTranslatedContent(selectedValue) {
    const contentLanguageTag = H5PEditor.defaultLanguage || H5PEditor.contentLanguage;

    if (this.field.localeSelector.type === LOCALESELECTOR_TYPE_COUNTRY) {
      this.updateCountryNamesTranslatedContent(contentLanguageTag, selectedValue);
    }
    else {
      this.updateLanguageNamesTranslatedContent(contentLanguageTag, selectedValue);
    }
  }

  /**
   * Update translated country names in locale data based on content language.
   * @param {string} contentLanguageTag Language set for the content.
   * @param {string} [selectedValue] Selected ISO 3166 value to update for. If not provided, all values are updated.
   */
  updateCountryNamesTranslatedContent(contentLanguageTag, selectedValue) {
    const updateCountry = (iso3166) => {
      const countryNameTranslatedContent =
        getContentTranslation(contentLanguageTag, 'H5PEditor.LocaleSelector', `countryLabel-${iso3166}`);
      this.countriesData[iso3166] = { ...this.countriesData[iso3166], countryNameTranslatedContent };
    };

    if (selectedValue) {
      updateCountry(selectedValue);
    }
    else {
      Object.keys(this.countriesData).forEach((iso3166) => {
        updateCountry(iso3166);
      });
    }
  }

  /**
   * Update translated language names in locale data based on content language.
   * @param {string} contentLanguageTag Language set for the content.
   * @param {string} [selectedValue] Selected BCP47 value to update for. If not provided, all values are updated.
   */
  updateLanguageNamesTranslatedContent(contentLanguageTag, selectedValue) {
    const updateLanguage = (bcp47) => {
      const languageNameTranslatedContent =
        getContentTranslation(contentLanguageTag, 'H5PEditor.LocaleSelector', `languageLabel-${bcp47}`);
      this.languagesData[bcp47] = { ...this.languagesData[bcp47], languageNameTranslatedContent };
    };

    if (selectedValue) {
      updateLanguage(selectedValue);
    }
    else {
      Object.keys(this.languagesData).forEach((bcp47) => {
        updateLanguage(bcp47);
      });
    }
  }

  /**
   * Filter out updated properties from locale values.
   * @param {object} allValues Locale values to filter.
   * @param {string[]} updatedProperties List of properties that were already updated.
   * @returns {object} Filtered locale values.
   */
  filterUpdatedProperties(allValues, updatedProperties) {
    const filtered = { ...allValues };
    updatedProperties.forEach((key) => {
      delete filtered[key];
    });

    return filtered;
  }

  /**
   * Filter out unrequested properties from locale values.
   * @param {object} allValues Locale values to filter.
   * @returns {object} Filtered locale values.
   */
  filterRequestedProperties(allValues) {
    if (!this.field.localeSelector.requestedProperties) {
      return allValues;
    }

    const filtered = { ...allValues };
    Object.keys(filtered).forEach((key) => {
      if (!this.field.localeSelector.requestedProperties.includes(key)) {
        delete filtered[key];
      }
    });

    return filtered;
  }

  /**
   * Update target field instances with locale values.
   * @param {object} allValues Locale values to apply to target fields.
   * @returns {string[]} List of all updated locale keys.
   */
  updateTargetFields(allValues) {
    const updatedKeys = [];
    for (const localeKey in this.targetFieldInstances) {
      if (localeKey in allValues) {
        const targetFieldInstance = this.targetFieldInstances[localeKey];

        // widget "none" is never attached, so "forceValue" may not be available
        if (typeof targetFieldInstance.forceValue !== 'function') {
          targetFieldInstance.setValue(targetFieldInstance.field, allValues[localeKey]);
        }
        else {
          targetFieldInstance.forceValue(allValues[localeKey]);
        }

        updatedKeys.push(localeKey);
      }
    }

    return updatedKeys;
  }

  /**
   * Update own field value with stringified locale data.
   * @param {object} allValues Locale values to stringify and set.
   * @returns {boolean} True if successful, false if error occurred.
   */
  updateOwnFieldValue(allValues) {
    if (Object.keys(allValues).length === 1) {
      this.fieldInstance.forceValue(Object.values(allValues)[0]);
      this.handleFieldChange();
      return true;
    }

    try {
      const stringifiedValues = JSON.stringify(allValues);
      this.fieldInstance.forceValue(stringifiedValues);
      this.handleFieldChange();
      return true;
    }
    catch (error) {
      console.warn('Could not stringify locale data:', error);
      return false;
    }
  }

  /**
   * Set up language switch detector on H5PEditor form, does not send event or similar itself.
   * @param {H5PEditor.Form} form Parent form instance.
   */
  setupLanguageSwitchDetector(form) {
    LocaleSelector.languageSwitchChangeDetector = LocaleSelector.languageSwitchChangeDetector ??
      new LanguageSwitchDetector(form);

    LocaleSelector.languageSwitchChangeDetector?.registerCallback(this.uuid, () => {
      this.handleSelectChange(this.getSelectedValue(this.params, this.field.localeSelector.type));
    });
  }

  /**
   * Handle change of field and inform callers.
   */
  handleFieldChange() {
    this.params = this.fieldInstance.value;

    this.changes.forEach((change) => {
      change(this.params);
    });
  }

  /**
   * Append field to wrapper. Invoked by H5P core.
   * @param {H5P.jQuery} $wrapper Wrapper.
   */
  appendTo($wrapper) {
    $wrapper.get(0).append(this.$container.get(0));

    if (LocaleSelector.languageSwitchChangeDetector) {
      LocaleSelector.languageSwitchChangeDetector.updateLanguageSwitcher(findEditorFormInstance(this));
      LocaleSelector.languageSwitchChangeDetector?.registerCallback(this.uuid, () => {
        this.handleSelectChange(this.getSelectedValue(this.params, this.field.localeSelector.type));
      });
    }
  }

  /**
   * Remove self. Invoked by H5P core.
   */
  remove() {
    this.$container.get(0).remove();

    this.cleanUpLanguageSwitchDetector();
  }

  /**
   * Clean up language switch detector when instance is removed.
   */
  cleanUpLanguageSwitchDetector() {
    LocaleSelector.languageSwitchChangeDetector?.unregisterCallback(this.uuid);
  }

  /**
   * Validate current values. Invoked by H5P core.
   * @returns {boolean} True, if current value is valid, else false.
   */
  validate() {
    return this.fieldInstance.validate();
  }
}

/** @type {MutationObserver} Observer for language switcher changes. Only one for all instances. */
LocaleSelector.languageSwitchChangeDetector = null;
