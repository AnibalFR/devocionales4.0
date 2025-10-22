import { useState, useEffect, useCallback, useRef } from 'react';

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
const NOTIFICATION_DELAY = 45 * 1000; // 45 segundos - esperar a que el deploy termine completamente

// Construir URL del endpoint de release
// En desarrollo: http://localhost:4000/api/release
// En producción: usa el mismo origen que el frontend
const getReleaseUrl = () => {
  if (import.meta.env.DEV) {
    return 'http://localhost:4000/api/release';
  }
  // En producción, el backend está en el mismo dominio
  return `${window.location.origin}/api/release`;
};

const RELEASE_URL = getReleaseUrl();

export function useAppVersion(): UseAppVersionReturn {
  const [release, setRelease] = useState<ReleaseInfo | null>(null);
  const [hasNewVersion, setHasNewVersion] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const notificationTimeoutRef = useRef<number | null>(null);

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

        // Limpiar timeout anterior si existe
        if (notificationTimeoutRef.current) {
          clearTimeout(notificationTimeoutRef.current);
        }

        // Esperar antes de mostrar la notificación para que el deploy termine
        notificationTimeoutRef.current = setTimeout(() => {
          // Verificar nuevamente que sigue siendo una nueva versión
          fetch(RELEASE_URL, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
            },
          })
            .then(res => res.json())
            .then((latestData: ReleaseInfo) => {
              if (latestData.buildId !== CURRENT_BUILD_ID) {
                setHasNewVersion(true);
                setDismissed(false);
              }
            })
            .catch(err => {
              console.error('Error re-checking version after delay:', err);
            });
        }, NOTIFICATION_DELAY);
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
      // Limpiar timeout de notificación si existe
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
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
