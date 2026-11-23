import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './components/AdminLayout';
import { PublicBookingPage } from './pages/PublicBookingPage';
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

        {/* Painel do profissional/dono */}
        <Route path="/painel" element={<AdminLayout />}>
          <Route index element={<AdminAgendaPage />} />
          <Route path="servicos" element={<AdminServicesPage />} />
          <Route path="horarios" element={<AdminHoursPage />} />
          <Route path="configuracoes" element={<AdminSettingsPage />} />
        </Route>

        {/* Slug personalizado de estabelecimento (ex: /studio-aura) */}
        <Route path="/:slug" element={<PublicBookingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
