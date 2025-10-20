import { useState, useEffect, useCallback } from 'react';

interface ReleaseInfo {
  buildId: string;
  notes: string[];
  requiresReload: boolean;
  requiresReauth: boolean;
}

interface UseAppVersionReturn {
  hasNewVersion: boolean;
  release: ReleaseInfo | null;
  refresh: () => void;
  dismissUpdate: () => void;
}

const CURRENT_BUILD_ID = import.meta.env.VITE_BUILD_ID || 'development';
const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutos
const RELEASE_URL = `${import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:4000'}/api/release`;

export function useAppVersion(): UseAppVersionReturn {
  const [release, setRelease] = useState<ReleaseInfo | null>(null);
  const [hasNewVersion, setHasNewVersion] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const checkVersion = useCallback(async () => {
    try {
      const response = await fetch(RELEASE_URL, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch release info:', response.statusText);
        return;
      }

      const data: ReleaseInfo = await response.json();

      // Comparar buildId
      if (data.buildId !== CURRENT_BUILD_ID) {
        setRelease(data);
        setHasNewVersion(true);
        setDismissed(false);
      }
    } catch (error) {
      console.error('Error checking app version:', error);
    }
  }, []);

  const refresh = useCallback(() => {
    // Limpiar cache de Apollo si está disponible
    if (window.apolloClient) {
      window.apolloClient.clearStore().catch(console.error);
    }

    // Recargar la página
    window.location.reload();
  }, []);

  const dismissUpdate = useCallback(() => {
    setDismissed(true);
  }, []);

  useEffect(() => {
    // Verificar versión al montar
    checkVersion();

    // Polling periódico
    const intervalId = setInterval(checkVersion, POLL_INTERVAL);

    // Verificar cuando la pestaña recupera el foco
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkVersion();
      }
    };

    const handleFocus = () => {
      checkVersion();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkVersion]);

  return {
    hasNewVersion: hasNewVersion && !dismissed,
    release,
    refresh,
    dismissUpdate,
  };
}

// Extender Window para el apolloClient global
declare global {
  interface Window {
    apolloClient?: {
      clearStore: () => Promise<any>;
    };
  }
}
