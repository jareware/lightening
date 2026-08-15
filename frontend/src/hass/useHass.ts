import { useCallback, useEffect, useState } from 'react';

// Access to Home Assistant from inside the panel iframe.
//
// HA sets a `hass` property on our <lightening-panel> element -- see
// https://developers.home-assistant.io/docs/frontend/custom-ui/creating-custom-panels/
// Because the iframe is same-origin with the HA frontend (in production it's
// served by HA; in dev the Vite proxy puts both on localhost:5173), we can just
// read that property. We hold no connection of our own, so there is nothing to
// reconnect after the browser suspends us.
//
// HA replaces `hass` on every change rather than mutating it -- "whenever a
// state changes, a new version of the objects that changed are created"
// (https://developers.home-assistant.io/docs/frontend/data/) -- so we must
// re-read it each time instead of caching. The glue calls onHassChanged() as a
// payload-free doorbell to tell us when.

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
}

/** The subset of HA's `hass` object we rely on. */
interface HassObject {
  states: Record<string, HassEntity>;
  auth: { accessToken: string };
  callService: (
    domain: string,
    service: string,
    serviceData?: Record<string, unknown>,
    target?: { entity_id: string },
  ) => Promise<unknown>;
}

/** The <lightening-panel> element, plus the hooks the glue exposes on it. */
interface PanelElement extends HTMLElement {
  hass?: HassObject;
  onHassChanged?: (() => void) | null;
  showMoreInfo?: (entityId: string) => void;
}

export interface Hass {
  /** False when we can't reach HA -- opened standalone, or a cross-origin iframe. */
  available: boolean;
  states: Record<string, HassEntity>;
  callService: (
    domain: string,
    service: string,
    target: { entity_id: string },
    data?: Record<string, unknown>,
  ) => void;
  moreInfo: (entityId: string) => void;
  /** Authenticated fetch against HA. Paths are relative -- we're same-origin. */
  fetchApi: (path: string, init?: RequestInit) => Promise<Response>;
}

/**
 * The panel element hosting this iframe, or null if unreachable. Static for the
 * lifetime of the page, so it's resolved once at module scope.
 */
function getPanelElement(): PanelElement | null {
  try {
    // Cross-origin, window.frameElement is null rather than throwing -- but it
    // throws in some engines, so guard anyway.
    const frame = window.frameElement as HTMLIFrameElement | null;
    return (frame?.parentElement as PanelElement | null) ?? null;
  } catch {
    return null;
  }
}

const panelEl = getPanelElement();

const NO_STATES: Record<string, HassEntity> = {};

export function useHass(): Hass {
  const [hass, setHass] = useState<HassObject | null>(() => panelEl?.hass ?? null);

  useEffect(() => {
    if (!panelEl) return;
    panelEl.onHassChanged = () => setHass(panelEl.hass ?? null);
    setHass(panelEl.hass ?? null); // in case it landed before we subscribed
    return () => {
      panelEl.onHassChanged = null;
    };
  }, []);

  const callService = useCallback<Hass['callService']>((domain, service, target, data) => {
    panelEl?.hass?.callService(domain, service, data, target);
  }, []);

  const moreInfo = useCallback<Hass['moreInfo']>((entityId) => {
    // Delegated to the glue so the CustomEvent is built in HA's own realm.
    panelEl?.showMoreInfo?.(entityId);
  }, []);

  const fetchApi = useCallback<Hass['fetchApi']>((path, init) => {
    const token = panelEl?.hass?.auth?.accessToken;
    return fetch(path, {
      ...init,
      headers: { ...init?.headers, Authorization: `Bearer ${token}` },
    });
  }, []);

  return {
    available: !!hass,
    states: hass?.states ?? NO_STATES,
    callService,
    moreInfo,
    fetchApi,
  };
}
