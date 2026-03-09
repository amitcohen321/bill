import { AppRoutes } from '../routes';
import { Toaster } from '../components/ui/Toaster';

export function App() {
  return (
    <Toaster>
      <AppRoutes />
    </Toaster>
  );
}
