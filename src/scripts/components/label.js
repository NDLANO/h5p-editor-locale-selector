export default class Label {

  /**
   * @class
   * @param {string} text Text content for the label.
   */
  constructor(text) {
    if (typeof text !== 'string') {
      text = '';
    }

    this.dom = document.createElement('span');
    this.dom.classList.add('h5peditor-locale-selector-label', 'h5peditor-label'); // H5P Editor core styles
    this.dom.textContent = text;
  }

  /**
   * Get the DOM element for the label.
   * @returns {HTMLElement} The label DOM element.
   */
  getDOM() {
    return this.dom;
  }
}
