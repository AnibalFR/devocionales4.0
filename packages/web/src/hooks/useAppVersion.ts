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
const DISMISSED_BUILDS_KEY = 'dismissedBuildIds';

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

// Helper para manejar buildIds descartados en localStorage
const getDismissedBuilds = (): Set<string> => {
  try {
    const stored = localStorage.getItem(DISMISSED_BUILDS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

const addDismissedBuild = (buildId: string): void => {
  try {
    const dismissed = getDismissedBuilds();
    dismissed.add(buildId);
    // Mantener solo los últimos 10 buildIds para no llenar localStorage
    const array = Array.from(dismissed).slice(-10);
    localStorage.setItem(DISMISSED_BUILDS_KEY, JSON.stringify(array));
  } catch (error) {
    console.error('Error saving dismissed build:', error);
  }
};

const isBuildDismissed = (buildId: string): boolean => {
  return getDismissedBuilds().has(buildId);
};

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

        // Verificar si este buildId ya fue descartado antes
        if (isBuildDismissed(data.buildId)) {
          // No mostrar notificación si el usuario ya la descartó
          return;
        }

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
              // Verificar que no fue descartado mientras esperábamos
              if (latestData.buildId !== CURRENT_BUILD_ID && !isBuildDismissed(latestData.buildId)) {
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
    // Guardar en localStorage para no volver a mostrar este buildId
    if (release?.buildId) {
      addDismissedBuild(release.buildId);
    }
  }, [release]);

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
