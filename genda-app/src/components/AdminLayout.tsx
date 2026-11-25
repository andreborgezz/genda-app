import {
  Building2,
  Calendar,
  ChevronsUpDown,
  Clock,
  CreditCard,
  ExternalLink,
  LogOut,
  Mail,
  Scissors,
  Sparkles,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import gendaLogo from '../assets/genda-logo-horizontal-dots.svg';
import { adminApi, clearAuthSession, getStoredUser } from '../services/api';
import type { AuthUser, Establishment } from '../types/genda';

const NAV_GROUPS = [
  {
    title: 'Operação',
    items: [
      { to: '/painel', label: 'Agenda', mobileLabel: 'Agenda', icon: Calendar, end: true },
      {
        to: '/painel/servicos',
        label: 'Serviços',
        mobileLabel: 'Serviços',
        icon: Scissors,
        end: false,
      },
      {
        to: '/painel/horarios',
        label: 'Horários',
        mobileLabel: 'Horários',
        icon: Clock,
        end: false,
      },
    ],
  },
  {
    title: 'Negócio',
    items: [
      {
        to: '/painel/estabelecimento',
        label: 'Seu estabelecimento',
        mobileLabel: 'Estúdio',
        icon: Building2,
        end: false,
      },
    ],
  },
];

const MOBILE_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

export function AdminLayout() {
  const navigate = useNavigate();
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [user] = useState<AuthUser | null>(() => getStoredUser());
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    adminApi
      .getEstablishment()
      .then((res) => setEstablishment(res.establishment))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [menuOpen]);

  const publicPath = establishment?.slug ? `/${establishment.slug}` : '/';

  function handleLogout() {
    setMenuOpen(false);
    clearAuthSession();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-[#F8F9FF] flex flex-col lg:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-[#DBEAFE] p-5 justify-between">
        <div>
          <div className="mb-8 px-2">
            <img src={gendaLogo} alt="Genda" className="h-7" />
            <p className="text-[11px] font-medium text-[#5A6B82] mt-1">Painel do Profissional</p>
          </div>

          <nav className="space-y-6">
            {NAV_GROUPS.map((group) => (
              <div key={group.title} className="space-y-1.5">
                <p className="px-3.5 text-[11px] font-bold uppercase tracking-wider text-[#5A6B82]/75">
                  {group.title}
                </p>
                {group.items.map((item) => {
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
                      <Icon className="w-4 h-4 shrink-0" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Rodapé da Sidebar com Drop-up de Conta / Plano / Logout */}
        <div ref={menuRef} className="relative">
          {menuOpen && (
            <div
              className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl border border-[#DBEAFE] p-3 space-y-2.5 z-50"
              style={{
                boxShadow:
                  '0px 10px 25px -5px rgba(30, 58, 138, 0.14), 0px 4px 10px -2px rgba(30, 58, 138, 0.05)',
              }}
            >
              {/* E-mail e Plano */}
              <div className="p-2.5 rounded-xl bg-[#F4F8FF] border border-[#DBEAFE] space-y-2">
                <div className="flex items-center gap-2 text-xs text-[#5A6B82]">
                  <Mail className="w-3.5 h-3.5 text-[#1D4ED8] shrink-0" />
                  <span className="truncate font-medium text-[#1E3A8A]">
                    {user?.email || `contato@${establishment?.slug || 'studio'}.com`}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#DBEAFE]">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#1E3A8A]">
                    <CreditCard className="w-3.5 h-3.5 text-[#1D4ED8]" />
                    {user?.plan_name || 'Plano Pro'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#047857] text-[10px] font-bold">
                    {user?.plan_status || 'Ativo'}
                  </span>
                </div>
                <p className="text-[10px] text-[#5A6B82]">
                  {user?.name ? `${user.name} • ` : ''}Assinatura mensal
                </p>
              </div>

              <div className="space-y-1">
                <Link
                  to="/painel/estabelecimento"
                  onClick={() => setMenuOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#1E3A8A] hover:bg-[#F4F8FF] transition-colors"
                >
                  <Building2 className="w-3.5 h-3.5 text-[#1D4ED8]" />
                  Dados do estabelecimento
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sair da conta
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className={`w-full flex items-center gap-3 p-2.5 rounded-2xl border transition-colors text-left cursor-pointer ${
              menuOpen
                ? 'bg-[#F4F8FF] border-[#DBEAFE]'
                : 'border-transparent hover:bg-[#F4F8FF] hover:border-[#DBEAFE]'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-[#F4F8FF] border border-[#DBEAFE] overflow-hidden flex items-center justify-center shrink-0">
              {establishment?.logo_url ? (
                <img
                  src={establishment.logo_url}
                  alt={establishment.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Sparkles className="w-4 h-4 text-[#1D4ED8]" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#1E3A8A] truncate">
                {establishment?.name || 'Meu Estúdio'}
              </p>
              <p className="text-xs text-[#5A6B82] truncate">
                {establishment?.slug ? `genda.me/${establishment.slug}` : 'Configurar perfil'}
              </p>
            </div>
            <ChevronsUpDown className="w-4 h-4 text-[#5A6B82] shrink-0" />
          </button>
        </div>
      </aside>

      {/* Topbar Mobile */}
      <header className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#DBEAFE] px-4 h-14 flex items-center justify-between">
        <img src={gendaLogo} alt="Genda" className="h-6" />
        <div className="flex items-center gap-2">
          <Link
            to={publicPath}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1D4ED8] bg-[#F4F8FF] px-3 py-1.5 rounded-full border border-[#DBEAFE]"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Ver página
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            title="Sair da conta"
            className="w-8 h-8 rounded-full border border-[#DBEAFE] bg-white text-red-600 hover:bg-red-50 flex items-center justify-center cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 lg:pl-64 pb-24 lg:pb-10">
        {/* Barra superior direita Desktop */}
        <div className="hidden lg:flex max-w-5xl mx-auto px-8 pt-6 justify-end">
          <Link
            to={publicPath}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#DBEAFE] text-[#1D4ED8] text-xs font-semibold hover:bg-[#F4F8FF] transition-colors shadow-2xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Ver página de agendamento
          </Link>
        </div>

        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:px-8 lg:pt-4 lg:pb-8">
          <Outlet />
        </div>
      </main>

      {/* Bottom Nav Mobile */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 genda-dock h-18 px-2 flex items-center justify-around">
        {MOBILE_NAV_ITEMS.map((item) => {
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
              {item.mobileLabel}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
