import './select.css';

export default class Select {

  /**
   * @class
   * @param {object} params Parameters for the select component.
   * @param {object} callbacks Callback functions.
   */
  constructor(params = {}, callbacks = {}) {
    this.callbacks = callbacks;
    this.callbacks.onChange = this.callbacks.onChange || (() => {});

    this.dom = document.createElement('div');
    this.dom.classList.add('h5peditor-locale-selector-select-wrapper');

    this.select = this.buildSelect(params, this.callbacks.onChange);

    this.dom.append(this.select);
  }

  /**
   * Build the select element.
   * @param {object} params Parameters for building the select.
   * @param {function} [onChange] Callback for change event.
   * @returns {HTMLElement} The select element.
   */
  buildSelect(params = {}, onChange = () => {}) {
    const select = document.createElement('select');
    select.classList.add('h5peditor-locale-selector-select');
    select.setAttribute('id', H5P.createUUID());
    if (params.descriptionID) {
      select.setAttribute('aria-describedby', params.descriptionID);
    }

    (params.options ?? []).forEach((optionData) => {
      const option = document.createElement('option');
      option.value = optionData.value;
      option.textContent = optionData.label;
      select.appendChild(option);
    });

    select.value = params.selectedValue || '';

    select.addEventListener('change', (event) => {
      onChange(event.target.value);
    });

    return select;
  }

  /**
   * Get the DOM element for the select component.
   * @returns {HTMLElement} The select DOM element.
   */
  getDOM() {
    return this.dom;
  }
}
