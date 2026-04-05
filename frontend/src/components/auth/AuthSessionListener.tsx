import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AUTH_REQUIRED_EVENT } from '@/lib/authEvents';

/**
 * Listens for 401 handling from axios; uses client-side navigation so browser back/forward keep working.
 */
export function AuthSessionListener() {
  const navigate = useNavigate();

  useEffect(() => {
    const onAuthRequired = () => {
      navigate('/login', { replace: true, state: { sessionExpired: true } });
    };
    window.addEventListener(AUTH_REQUIRED_EVENT, onAuthRequired);
    return () => window.removeEventListener(AUTH_REQUIRED_EVENT, onAuthRequired);
  }, [navigate]);

  return null;
}
