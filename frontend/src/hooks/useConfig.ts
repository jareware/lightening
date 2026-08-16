import { useCallback, useEffect, useRef, useState } from 'react';
import type { Hass } from './useHass';

const API = '/api/lightening/config';

/** Must match EVENT_CONFIG_UPDATED in custom_components/lightening/const.py. */
const EVENT_CONFIG_UPDATED = 'lightening_config_updated';

/** Ties one element of the floorplan SVG to one HA entity. */
export interface Binding {
  svgId: string;
  entityId: string;
}

/**
 * Lightening's config.
 *
 * The backend stores this verbatim and never inspects it, so this type is the
 * only definition of the shape -- which also means migrations are ours. Bump
 * CONFIG_SCHEMA_VERSION and extend migrate() when it changes.
 */
export interface Config {
  schemaVersion: number;
  bindings: Binding[];
}

export const CONFIG_SCHEMA_VERSION = 1;

const EMPTY_CONFIG: Config = { schemaVersion: CONFIG_SCHEMA_VERSION, bindings: [] };

/**
 * Bring a stored document up to the current schema. Anything unrecognised --
 * including the empty object a fresh install returns -- becomes empty config
 * rather than an error, so a first run needs no special case.
 */
function migrate(data: unknown): Config {
  if (!data || typeof data !== 'object') return EMPTY_CONFIG;
  const raw = data as Partial<Config>;
  return {
    schemaVersion: CONFIG_SCHEMA_VERSION,
    bindings: Array.isArray(raw.bindings) ? raw.bindings : [],
  };
}

export interface ConfigState {
  config: Config;
  loading: boolean;
  error: string | null;
  /**
   * Persist config. Resolves true on success, false if it was superseded --
   * in which case `config` has already been replaced with the current server
   * document, so the caller can reapply its change on top.
   */
  save: (next: Config) => Promise<boolean>;
}

export function useConfig(hass: Hass): ConfigState {
  const { available, fetchApi, subscribeEvent } = hass;
  const [config, setConfig] = useState<Config>(EMPTY_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Not state: it's an implementation detail of writing, and changing it should
  // never trigger a render.
  const revision = useRef(0);

  const adopt = useCallback((document: { revision: number; data: unknown }) => {
    revision.current = document.revision;
    setConfig(migrate(document.data));
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetchApi(API);
      if (!res.ok) {
        setError(`Could not load config (${res.status})`);
        return;
      }
      adopt(await res.json());
      setError(null);
    } catch {
      setError('Could not reach Home Assistant');
    } finally {
      setLoading(false);
    }
  }, [fetchApi, adopt]);

  useEffect(() => {
    if (available) refresh();
  }, [available, refresh]);

  // Any client writing config fires an event on HA's bus; we refetch rather
  // than trusting a payload, so ordering between events can't matter.
  useEffect(() => {
    if (!available) return;
    return subscribeEvent(EVENT_CONFIG_UPDATED, () => {
      refresh();
    });
  }, [available, subscribeEvent, refresh]);

  const save = useCallback(
    async (next: Config): Promise<boolean> => {
      try {
        const res = await fetchApi(API, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ revision: revision.current, data: next }),
        });

        if (res.status === 409) {
          // Someone else wrote first. The response carries their document.
          adopt(await res.json());
          setError('Someone else changed the config; your change was not saved');
          return false;
        }
        if (!res.ok) {
          setError(
            res.status === 401 || res.status === 403
              ? 'Only administrators can change the config'
              : `Could not save config (${res.status})`,
          );
          return false;
        }

        adopt(await res.json());
        setError(null);
        return true;
      } catch {
        setError('Could not save config');
        return false;
      }
    },
    [fetchApi, adopt],
  );

  return { config, loading, error, save };
}
