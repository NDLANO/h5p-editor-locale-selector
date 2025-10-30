export default class Description {

  /**
   * @class
   * @param {string} text Text content for the description.
   * @param {string} [id] Unique ID for the description element.
   */
  constructor(text = '', id) {
    this.id = (typeof id === 'string' && id.trim() !== '') ? id : H5P.createUUID();

    this.dom = document.createElement('div');
    this.dom.setAttribute('id', this.id);
    // H5P Editor core styles
    this.dom.classList.add('h5peditor-locale-selector-description', 'h5peditor-field-description');
    this.dom.textContent = text;
  }

  /**
   * Get the DOM element for the description.
   * @returns {HTMLElement} The DOM element.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Get the ID of the description element.
   * @returns {string} The ID.
   */
  getID() {
    return this.id;
  }
}
