// Panel custom element for Lightening.
// Loaded by HA via js_url (classic script). Its only jobs:
//   1. Create an iframe pointing at the Lightening app (or a dev server)
//   2. Bridge auth tokens down to the iframe
//   3. Bridge more-info intents up from the iframe
class LighteningPanel extends HTMLElement {
  constructor() {
    super();
    this._iframe = null;
    this._iframeOrigin = null;
    this._hass = null;
    this._panel = null;
    this._boundMessageHandler = null;
  }

  set hass(hass) {
    this._hass = hass;
    this._postToken();
  }

  set panel(panel) {
    this._panel = panel;
  }

  connectedCallback() {
    // Support ?dev=http://localhost:5173 for local development
    var params = new URLSearchParams(window.location.search);
    var devUrl = params.get('dev');
    var iframeUrl = devUrl || '/lightening-assets/app/index.html';

    this._iframeOrigin = new URL(iframeUrl, window.location.origin).origin;

    this.style.display = 'block';
    this.style.height = '100%';

    this._iframe = document.createElement('iframe');
    this._iframe.src = iframeUrl;
    this._iframe.style.cssText = 'border:none; width:100%; height:100%;';
    this.appendChild(this._iframe);

    this._boundMessageHandler = this._handleMessage.bind(this);
    window.addEventListener('message', this._boundMessageHandler);

    this._iframe.addEventListener('load', this._postToken.bind(this));
  }

  disconnectedCallback() {
    if (this._boundMessageHandler) {
      window.removeEventListener('message', this._boundMessageHandler);
      this._boundMessageHandler = null;
    }
  }

  _postToken() {
    if (!this._iframe || !this._iframe.contentWindow || !this._hass) return;
    this._iframe.contentWindow.postMessage(
      { type: 'auth', token: this._hass.auth.accessToken },
      this._iframeOrigin
    );
  }

  _handleMessage(event) {
    if (event.origin !== this._iframeOrigin) return;
    if (event.data && event.data.type === 'more-info') {
      this.dispatchEvent(new CustomEvent('hass-more-info', {
        detail: { entityId: event.data.entity_id },
        bubbles: true,
        composed: true,
      }));
    }
  }
}

customElements.define('lightening-panel', LighteningPanel);
