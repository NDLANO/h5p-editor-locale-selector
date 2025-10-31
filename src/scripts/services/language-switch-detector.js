export default class LanguageSwitchDetector {
  /**
   * @class
   * H5PEditor core adds a language switcher to the form, but does not provide any events
   * for detecting language switch changes. This class detects language switch changes
   * including handling of confirmation dialog popups.
   * @param {H5PEditor.Form} form Editor form instance.
   */
  constructor(form) {
    this.handleLanguageSwitchChanged = this.handleLanguageSwitchChanged.bind(this);
    this.callbacks = {};

    this.updateLanguageSwitcher(form);
  }

  /**
   * Update language switcher element and reattach event listener.
   * @param {H5PEditor.Form} form Editor form instance.
   */
  updateLanguageSwitcher(form) {
    this.languageSwitcher?.removeEventListener('change', this.handleLanguageSwitchChanged);
    this.popupObserver?.disconnect();
    this.languageSwitcher = form.$form[0].querySelector('#h5peditor-language-switcher');
    this.languageSwitcher?.addEventListener('change', this.handleLanguageSwitchChanged);
  }

  /**
   * Handle language switch change event.
   */
  handleLanguageSwitchChanged() {
    window.requestAnimationFrame(() => {
      const dialogBackground = document.querySelector('.h5p-confirmation-dialog-background');
      if (!dialogBackground) {
        return;
      }

      this.popupObserver = new MutationObserver((mutationsList, observer) => {
        const dialogRemoved = mutationsList.some((mutation) =>
          mutation.type === 'childList' &&
          Array.from(mutation.removedNodes).some((node) => node === dialogBackground)
        );
        if (!dialogRemoved) {
          return;
        }

        Object.values(this.callbacks).forEach((callback) => callback());
        observer.disconnect();
      });

      this.popupObserver.observe(document.body, { childList: true });
    });
  }

  /**
   * Register a callback for language switch changes.
   * @param {string} id Unique identifier for the callback.
   * @param {function} callback Callback function to execute on language switch.
   */
  registerCallback(id, callback) {
    this.callbacks[id] = callback;
  }

  /**
   * Unregister a callback.
   * @param {string} id Unique identifier for the callback.
   */
  unregisterCallback(id) {
    delete this.callbacks[id];
  }
}
