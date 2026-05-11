import { useEffect } from 'react';
import { AppRoutes } from '../routes';
import { Toaster } from '../components/ui/Toaster';

export function App() {
  useEffect(() => {
    const ping = () => void fetch('/api/ping').catch(() => {});
    // Ping immediately to wake the server if it went dormant
    ping();
    // Ping every 5 minutes to keep the server alive
    const id = setInterval(ping, 5 * 60 * 1000);
    // Also ping when the tab becomes visible (e.g. returning to the app)
    const onVisible = () => { if (document.visibilityState === 'visible') ping(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return (
    <Toaster>
      <AppRoutes />
    </Toaster>
  );
}
