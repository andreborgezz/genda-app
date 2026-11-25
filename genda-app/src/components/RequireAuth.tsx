import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import gendaLogo from '../assets/genda-logo-horizontal-dots.svg';
import { authApi, clearAuthSession, getAuthToken } from '../services/api';

export function RequireAuth() {
  const token = getAuthToken();
  const [status, setStatus] = useState<'checking' | 'ok' | 'unauthorized'>(() =>
    token ? 'checking' : 'unauthorized'
  );

  useEffect(() => {
    if (!token) {
      setStatus('unauthorized');
      return;
    }
    let active = true;
    authApi
      .me()
      .then(() => {
        if (active) setStatus('ok');
      })
      .catch(() => {
        clearAuthSession();
        if (active) setStatus('unauthorized');
      });
    return () => {
      active = false;
    };
  }, [token]);

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FF] gap-3">
        <img src={gendaLogo} alt="Genda" className="h-8 animate-pulse" />
        <p className="text-xs font-medium text-[#5A6B82]">Verificando sessão...</p>
      </div>
    );
  }

  if (status === 'unauthorized') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
