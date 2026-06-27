import { AuthProvider } from './store/authStore';
import Router from './Router';

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}
