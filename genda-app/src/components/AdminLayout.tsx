import { Calendar, Clock, ExternalLink, Scissors, Settings } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import gendaLogo from '../assets/genda-logo-horizontal-dots.svg';

const NAV_ITEMS = [
  { to: '/painel', label: 'Agenda', icon: Calendar, end: true },
  { to: '/painel/servicos', label: 'Serviços', icon: Scissors, end: false },
  { to: '/painel/horarios', label: 'Horários', icon: Clock, end: false },
  { to: '/painel/configuracoes', label: 'Ajustes', icon: Settings, end: false },
];

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-[#F8F9FF] flex flex-col lg:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-[#DBEAFE] p-5 justify-between">
        <div>
          <div className="mb-8 px-2">
            <img src={gendaLogo} alt="Genda" className="h-7" />
            <p className="text-[11px] font-medium text-[#5A6B82] mt-1">Painel do Profissional</p>
          </div>

          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-[#F4F8FF] text-[#1D4ED8] border border-[#DBEAFE]'
                        : 'text-[#5A6B82] hover:bg-[#F8F9FF] hover:text-[#1E3A8A]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <Link
          to="/"
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#F4F8FF] border border-[#DBEAFE] text-[#1D4ED8] text-xs font-semibold hover:bg-[#E5EEFF] transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Ver página de agendamento
        </Link>
      </aside>

      {/* Topbar Mobile */}
      <header className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#DBEAFE] px-4 h-14 flex items-center justify-between">
        <img src={gendaLogo} alt="Genda" className="h-6" />
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1D4ED8] bg-[#F4F8FF] px-3 py-1.5 rounded-full border border-[#DBEAFE]"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Página Pública
        </Link>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 lg:pl-64 pb-24 lg:pb-10">
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* Bottom Nav Mobile */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 genda-dock h-18 px-2 flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-colors ${
                  isActive ? 'text-[#1D4ED8]' : 'text-[#5A6B82]'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
