import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './components/AdminLayout';
import { RequireAuth } from './components/RequireAuth';
import { LoginPage } from './pages/LoginPage';
import { PublicBookingPage } from './pages/PublicBookingPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { AdminAgendaPage } from './pages/admin/AdminAgendaPage';
import { AdminHoursPage } from './pages/admin/AdminHoursPage';
import { AdminServicesPage } from './pages/admin/AdminServicesPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Página pública de agendamento */}
        <Route path="/" element={<PublicBookingPage />} />

        {/* Login do profissional */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/redefinir-senha" element={<ResetPasswordPage />} />

        {/* Painel do profissional/dono (protegido) */}
        <Route element={<RequireAuth />}>
          <Route path="/painel" element={<AdminLayout />}>
            <Route index element={<AdminAgendaPage />} />
            <Route path="servicos" element={<AdminServicesPage />} />
            <Route path="horarios" element={<AdminHoursPage />} />
            <Route path="estabelecimento" element={<AdminSettingsPage />} />
            <Route path="configuracoes" element={<Navigate to="/painel/estabelecimento" replace />} />
          </Route>
        </Route>

        {/* Slug personalizado de estabelecimento (ex: /studio-aura) */}
        <Route path="/:slug" element={<PublicBookingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
