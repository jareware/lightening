// Panel custom element for Lightening.
//
// Loaded by HA via js_url (classic script). HA sets `hass`, `narrow`, `route`
// and `panel` properties on this element -- see
// https://developers.home-assistant.io/docs/frontend/custom-ui/creating-custom-panels/
//
// The app itself lives in an iframe, purely for isolation: React and MUI get
// their own runtime, away from HA's frontend. The iframe is always same-origin
// with HA -- in production because HA serves it, in development because the Vite
// proxy puts the dev server and HA on one origin. So the app reads `hass`
// straight off this element and we need no bridge of any kind.
//
// Our only job is the doorbell: HA replaces `hass` on every change rather than
// mutating it, so the app has to re-read it. We tell it when.
class LighteningPanel extends HTMLElement {
  constructor() {
    super();
    this._iframe = null;
    this._hass = null;
    this._panel = null;
  }

  set hass(hass) {
    this._hass = hass;
    // Payload-free: the app re-reads `this.hass` itself. Nothing is serialized.
    if (this.onHassChanged) this.onHassChanged();
  }

  get hass() {
    return this._hass;
  }

  set panel(panel) {
    this._panel = panel;
  }

  get panel() {
    return this._panel;
  }

  // Called by the app so the CustomEvent is constructed and dispatched in HA's
  // own realm rather than the iframe's.
  showMoreInfo(entityId) {
    this.dispatchEvent(new CustomEvent('hass-more-info', {
      detail: { entityId: entityId },
      bubbles: true,
      composed: true,
    }));
  }

  connectedCallback() {
    // ?dev=/lightening-app/ points the iframe at the Vite dev server, which the
    // dev proxy serves from this same origin. See frontend/vite.config.ts.
    var params = new URLSearchParams(window.location.search);
    var iframeUrl = params.get('dev') || '/lightening-assets/app/index.html';
    var iframeOrigin = new URL(iframeUrl, window.location.origin).origin;

    if (iframeOrigin !== window.location.origin) {
      console.error(
        '[lightening] Refusing to load a cross-origin app from ' + iframeUrl +
        '. The app must be same-origin with Home Assistant to reach `hass`. ' +
        'For local development run the Vite dev server (which proxies HA) and ' +
        'use ?dev=/lightening-app/ instead of a localhost URL.'
      );
      return;
    }

    this.style.display = 'block';
    this.style.height = '100%';

    this._iframe = document.createElement('iframe');
    this._iframe.src = iframeUrl;
    this._iframe.style.cssText = 'border:none; width:100%; height:100%;';
    this.appendChild(this._iframe);
  }

  disconnectedCallback() {
    this.onHassChanged = null;
  }
}

customElements.define('lightening-panel', LighteningPanel);
