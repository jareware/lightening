import { useCallback, useEffect, useState } from 'react';
import type { Hass } from './useHass';

const API = '/api/lightening/floorplan';

export interface Floorplan {
  /** Raw SVG markup, or null when nothing is uploaded yet. */
  svg: string | null;
  loading: boolean;
  error: string | null;
  upload: (file: File) => Promise<void>;
  remove: () => Promise<void>;
}

export function useFloorplan(hass: Hass): Floorplan {
  const { available, fetchApi } = hass;
  const [svg, setSvg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi(`${API}/svg`);
      if (res.ok) {
        setSvg(await res.text());
      } else if (res.status === 404) {
        setSvg(null); // nothing uploaded yet -- not an error
      } else {
        setError(`Could not load floorplan (${res.status})`);
      }
    } catch {
      setError('Could not reach Home Assistant');
    } finally {
      setLoading(false);
    }
  }, [fetchApi]);

  useEffect(() => {
    if (available) refresh();
  }, [available, refresh]);

  const upload = useCallback(
    async (file: File) => {
      setError(null);
      const body = new FormData();
      body.append('file', file);
      try {
        const res = await fetchApi(API, { method: 'POST', body });
        if (!res.ok) {
          setError(res.status === 413 ? 'That file is too large' : `Upload failed (${res.status})`);
          return;
        }
        await refresh();
      } catch {
        setError('Upload failed');
      }
    },
    [fetchApi, refresh],
  );

  const remove = useCallback(async () => {
    setError(null);
    try {
      const res = await fetchApi(API, { method: 'DELETE' });
      if (!res.ok) {
        setError(`Could not remove floorplan (${res.status})`);
        return;
      }
      setSvg(null);
    } catch {
      setError('Could not remove floorplan');
    }
  }, [fetchApi]);

  return { svg, loading, error, upload, remove };
}
