/**
 * Panel custom element for Lightening.
 *
 * Loaded by HA via js_url (classic script). HA sets `hass`, `narrow`, `route`
 * and `panel` properties on this element -- see
 * https://developers.home-assistant.io/docs/frontend/custom-ui/creating-custom-panels/
 *
 * The app itself lives in an iframe, purely for isolation: React and MUI get
 * their own runtime, away from HA's frontend. The iframe is always same-origin
 * with HA -- in production because HA serves it, in development because the Vite
 * proxy puts the dev server and HA on one origin. So the app reads `hass`
 * straight off this element and we need no bridge of any kind.
 *
 * Our only job is the doorbell: HA replaces `hass` on every change rather than
 * mutating it, so the app has to re-read it. We tell it when.
 */
class LighteningPanel extends HTMLElement {
  constructor() {
    super();
    this._iframe = null;
    this._hass = null;
    this._panel = null;
  }

  /**
   * Assigned by HA on every state change, with a newly created object each
   * time. Ringing the doorbell is payload-free: the app re-reads `this.hass`
   * itself, so nothing is ever serialized across the iframe boundary.
   */
  set hass(hass) {
    this._hass = hass;
    if (this.onHassChanged) this.onHassChanged();
  }

  get hass() {
    return this._hass;
  }

  /** Panel metadata from HA; its `config` carries what we registered. */
  set panel(panel) {
    this._panel = panel;
  }

  get panel() {
    return this._panel;
  }

  /**
   * Fire a DOM event into HA's frontend. HA drives its UI with bubbling custom
   * events rather than methods on `hass` -- opening a more-info dialog, for
   * one, exists only as an event -- so this is how the app asks HA to do things
   * that aren't service calls.
   *
   * The app could dispatch on this element itself, but the event object would
   * then belong to the iframe's realm; building it here keeps it in HA's, where
   * its listeners live. Mirrors HA's own fireEvent helper, defaults included:
   * https://github.com/home-assistant/frontend/blob/dev/src/common/dom/fire_event.ts
   *
   * @param {string} type Event name, e.g. 'hass-more-info'
   * @param {*} [detail] Payload, read by HA's listener as `ev.detail`
   * @param {{bubbles?: boolean, cancelable?: boolean, composed?: boolean}} [options]
   */
  fireEvent(type, detail, options) {
    options = options || {};
    this.dispatchEvent(new CustomEvent(type, {
      detail: detail,
      bubbles: options.bubbles === undefined ? true : options.bubbles,
      cancelable: !!options.cancelable,
      composed: options.composed === undefined ? true : options.composed,
    }));
  }

  /**
   * Creates the iframe. `?dev=/lightening-app/` points it at the Vite dev
   * server, which the dev proxy serves from this same origin -- see
   * frontend/vite.config.ts.
   */
  connectedCallback() {
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
