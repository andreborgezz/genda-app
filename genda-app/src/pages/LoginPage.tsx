import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingDown,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gendaIcon from '../assets/genda-icon-dots.svg';
import { authApi, getAuthToken, setAuthSession } from '../services/api';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (getAuthToken()) {
      navigate('/painel', { replace: true });
    }
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.login({ email, password, rememberMe });
      setAuthSession(res.token, res.user, rememberMe);
      navigate('/painel', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);
    setForgotLoading(true);
    try {
      const res = await authApi.requestPasswordReset(forgotEmail);
      setForgotSuccess(
        res.message || 'Se esse e-mail estiver cadastrado, você receberá um link em instantes.'
      );
    } catch (err) {
      setForgotError(
        err instanceof Error ? err.message : 'Não foi possível enviar o link de redefinição.'
      );
    } finally {
      setForgotLoading(false);
    }
  }

  function openForgotMode() {
    setForgotEmail(email);
    setForgotError(null);
    setForgotSuccess(null);
    setForgotMode(true);
  }

  function closeForgotMode() {
    setForgotMode(false);
    setForgotError(null);
    setForgotSuccess(null);
  }

  return (
    <div className="min-h-screen bg-[#F8F9FF] lg:bg-white lg:grid lg:grid-cols-12">
      {/* MOBILE HERO AZUL */}
      <div className="lg:hidden bg-gradient-to-b from-[#1D4ED8] to-[#1E3A8A] text-white px-5 pt-7 pb-12 rounded-b-[2rem] text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-[10px] font-bold tracking-wider uppercase">
          <Sparkles className="w-3 h-3 text-[#60A5FA]" />
          Para Profissionais de Beleza &amp; Estética
        </div>

        <div className="flex items-center justify-center gap-2.5 pt-1">
          <div className="w-10 h-10 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-sm">
            <img src={gendaIcon} alt="Genda" className="w-full h-full" />
          </div>
          <div className="text-left leading-tight">
            <span className="block text-xl font-bold tracking-tight">Genda</span>
            <span className="block text-[10px] font-semibold tracking-widest text-[#DBEAFE] uppercase">
              Studio Cloud
            </span>
          </div>
        </div>

        <h1 className="text-2xl font-bold leading-tight tracking-tight px-2">
          Sua agenda, clientes e faturamento em perfeita sintonia.
        </h1>
        <p className="text-xs text-[#DBEAFE] max-w-xs mx-auto leading-relaxed">
          A plataforma de gestão e reservas pensada para a elegância e eficiência do seu negócio.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 text-[11px] font-semibold">
            <Star className="w-3 h-3 text-amber-300 fill-amber-300" />
            4.9/5 Avaliação
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 text-[11px] font-semibold">
            <Zap className="w-3 h-3 text-[#93C5FD]" />
            Reservas em &lt; 30s
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 text-[11px] font-semibold">
            <TrendingDown className="w-3 h-3 text-[#6EE7B7]" />
            -85% no-shows
          </span>
        </div>
      </div>

      {/* COLUNA ESQUERDA (FORMULÁRIO) */}
      <div className="lg:col-span-5 flex flex-col justify-between px-4 sm:px-8 lg:px-12 pb-8 lg:py-8">
        {/* Header Desktop */}
        <div className="hidden lg:flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#1D4ED8]/10 border border-[#DBEAFE] p-1.5 flex items-center justify-center">
              <img src={gendaIcon} alt="Genda" className="w-full h-full" />
            </div>
            <div className="leading-tight">
              <span className="block text-base font-bold text-[#1E3A8A]">Genda</span>
              <span className="block text-[9px] font-bold tracking-widest text-[#5A6B82] uppercase">
                Studio Cloud
              </span>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F4F8FF] border border-[#DBEAFE] text-[11px] font-semibold text-[#1E3A8A]">
            <Sparkles className="w-3 h-3 text-[#1D4ED8]" />
            Para Profissionais de Beleza &amp; Estética
          </span>
        </div>

        {/* Card / Conteúdo do Formulário */}
        <div className="-mt-6 lg:mt-0 w-full max-w-md mx-auto">
          <div className="bg-white rounded-3xl lg:rounded-none shadow-lg lg:shadow-none border border-[#DBEAFE] lg:border-0 p-6 sm:p-8 lg:p-0 space-y-6">
            {forgotMode ? (
              <>
                <div>
                  <h2 className="text-2xl sm:text-[26px] font-bold text-[#0A1C30] tracking-tight">
                    Redefinir senha
                  </h2>
                  <p className="text-xs sm:text-sm text-[#5A6B82] mt-1.5 leading-relaxed">
                    Informe seu e-mail profissional para receber o link de redefinição de senha.
                  </p>
                </div>

                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="forgot-email"
                      className="block text-[11px] font-bold uppercase tracking-wider text-[#5A6B82] mb-1.5"
                    >
                      Seu e-mail profissional
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#5A6B82] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="forgot-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="exemplo@seuestudio.com.br"
                        className="w-full h-12 pl-10 pr-4 rounded-xl border border-[#DBEAFE] bg-[#F4F8FF] focus:bg-white focus:border-[#1D4ED8] focus:outline-none text-sm text-[#1E3A8A] placeholder:text-[#5A6B82]/70 transition-colors"
                      />
                    </div>
                  </div>

                  {forgotError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                      {forgotError}
                    </div>
                  )}

                  {forgotSuccess && (
                    <div className="p-3 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 text-xs font-semibold text-[#047857]">
                      {forgotSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full h-12 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:bg-[#93C5FD] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                  >
                    {forgotLoading ? 'Enviando...' : 'Enviar link'}
                    {!forgotLoading && <ArrowRight className="w-4 h-4" />}
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={closeForgotMode}
                      className="text-xs font-semibold text-[#1D4ED8] hover:text-[#1E3A8A] cursor-pointer"
                    >
                      Voltar ao login
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div>
                  <h2 className="text-2xl sm:text-[26px] font-bold text-[#0A1C30] tracking-tight">
                    Bem-vindo de volta! <span aria-hidden="true">👋</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-[#5A6B82] mt-1.5 leading-relaxed">
                    Acesse sua agenda inteligente e simplifique a gestão do seu estúdio hoje.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="login-email"
                      className="block text-[11px] font-bold uppercase tracking-wider text-[#5A6B82] mb-1.5"
                    >
                      Seu e-mail profissional
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#5A6B82] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="login-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="exemplo@seuestudio.com.br"
                        className="w-full h-12 pl-10 pr-4 rounded-xl border border-[#DBEAFE] bg-[#F4F8FF] focus:bg-white focus:border-[#1D4ED8] focus:outline-none text-sm text-[#1E3A8A] placeholder:text-[#5A6B82]/70 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="login-password"
                      className="block text-[11px] font-bold uppercase tracking-wider text-[#5A6B82] mb-1.5"
                    >
                      Sua senha
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#5A6B82] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full h-12 pl-10 pr-11 rounded-xl border border-[#DBEAFE] bg-[#F4F8FF] focus:bg-white focus:border-[#1D4ED8] focus:outline-none text-sm text-[#1E3A8A] placeholder:text-[#5A6B82]/70 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#5A6B82] hover:text-[#1E3A8A] cursor-pointer"
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <label className="inline-flex items-center gap-2 text-xs font-medium text-[#5A6B82] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded accent-[#1D4ED8]"
                      />
                      Lembrar de mim por 30 dias
                    </label>

                    <button
                      type="button"
                      onClick={openForgotMode}
                      className="text-xs font-semibold text-[#1D4ED8] hover:text-[#1E3A8A] cursor-pointer"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>

                  {error && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:bg-[#93C5FD] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                  >
                    {loading ? 'Entrando...' : 'Entrar na minha Conta'}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Box informativo de acesso restrito */}
          <div className="mt-5 rounded-2xl bg-[#F4F8FF] border border-[#DBEAFE] p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-white border border-[#DBEAFE] text-[#1D4ED8] flex items-center justify-center shrink-0 mt-0.5">
              <KeyRound className="w-4 h-4" />
            </div>
            <div className="text-xs leading-relaxed text-[#5A6B82] min-w-0">
              <p className="font-bold text-[#1E3A8A] mb-0.5">Não possui acesso ou cadastro?</p>
              <p>
                O cadastro é realizado exclusivamente pela gestão. Entre em contato com o
                administrador para solicitar seu acesso:
              </p>
              <a
                href="mailto:borges01andre@gmail.com"
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#DBEAFE] text-[#1D4ED8] font-semibold hover:bg-[#E5EEFF] transition-colors break-all"
              >
                <Mail className="w-3.5 h-3.5 shrink-0" />
                borges01andre@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* Rodapé esquerdo */}
        <div className="mt-8 lg:mt-0 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#5A6B82] max-w-md mx-auto w-full">
          <span className="inline-flex items-center gap-1.5 text-[#047857] font-semibold lg:order-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
            Conexão Segura SSL 256-bit
          </span>
          <span className="lg:order-1">Termos de Uso • Política de Privacidade</span>
        </div>
        <p className="lg:hidden text-center text-[10px] text-[#5A6B82]/80 mt-2">
          +1.200 estúdios ativos no Brasil • Genda Cloud v4.2
        </p>
      </div>

      {/* COLUNA DIREITA DESKTOP (SHOWCASE AZUL) */}
      <div className="hidden lg:flex lg:col-span-7 bg-gradient-to-br from-[#1D4ED8] via-[#1D4ED8] to-[#1E3A8A] text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Glow sutil decorativo */}
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-xl space-y-5">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/12 border border-white/20 text-[11px] font-bold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            Plataforma All-in-One
          </span>

          <h1 className="text-4xl xl:text-[42px] font-bold leading-[1.12] tracking-tight">
            Sua agenda, seus clientes e seu faturamento em perfeita sintonia.
          </h1>
          <p className="text-sm xl:text-base text-[#DBEAFE] leading-relaxed max-w-lg">
            Controle financeiro, confirmações automáticas por WhatsApp e agendamento online 24/7
            para seus clientes.
          </p>
        </div>

        {/* Mockup Showcase do Painel + Mobile */}
        <div className="relative z-10 my-6 flex items-center justify-center">
          <div className="relative w-full max-w-2xl">
            {/* Badge flutuante topo esquerdo */}
            <div className="absolute -top-4 left-4 z-20 px-3.5 py-2 rounded-full bg-white/95 text-[#1E3A8A] shadow-lg flex items-center gap-2 text-xs font-bold">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              4.9/5 Avaliação dos Estúdios
            </div>

            {/* Badge flutuante meio esquerdo */}
            <div className="absolute top-1/2 -left-4 z-20 px-3.5 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white shadow-lg flex items-center gap-1.5 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-[#93C5FD]" />
              Agendamento em &lt; 30s
            </div>

            {/* Card Browser Mockup */}
            <div className="bg-white rounded-2xl shadow-2xl border border-white/20 overflow-hidden text-[#0A1C30]">
              <div className="h-9 bg-[#F8F9FF] border-b border-[#DBEAFE] px-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="px-3 py-1 rounded-md bg-white border border-[#DBEAFE] text-[10px] font-medium text-[#5A6B82]">
                  app.genda.cloud/painel
                </div>
                <div className="w-5 h-5 rounded-full bg-[#1D4ED8] text-white text-[9px] font-bold flex items-center justify-center">
                  GS
                </div>
              </div>

              <div className="p-5 grid grid-cols-12 gap-4 bg-[#F8F9FF]">
                <div className="col-span-3 space-y-2">
                  <div className="px-2.5 py-2 rounded-lg bg-[#E5EEFF] text-[#1D4ED8] text-[11px] font-bold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Agenda
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg text-[#5A6B82] text-[11px] font-medium flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Clientes
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg text-[#5A6B82] text-[11px] font-medium flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5" /> Finanças
                  </div>
                  <div className="mt-6 p-2.5 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20">
                    <span className="block text-[9px] font-bold text-[#047857]">Plano Ativo</span>
                    <span className="block text-[10px] font-bold text-[#1E3A8A]">
                      Studio VIP Pro
                    </span>
                  </div>
                </div>

                <div className="col-span-9 space-y-3 pr-14">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-xl border border-[#DBEAFE] p-3">
                      <span className="text-[10px] text-[#5A6B82] block">Atendimentos Hoje</span>
                      <span className="text-xl font-bold text-[#1D4ED8]">14</span>
                      <span className="text-[10px] font-semibold text-[#10B981] block">
                        94% ocupação
                      </span>
                    </div>
                    <div className="bg-white rounded-xl border border-[#DBEAFE] p-3">
                      <span className="text-[10px] text-[#5A6B82] block">Faturamento Dia</span>
                      <span className="text-xl font-bold text-[#1E3A8A]">R$ 2.480</span>
                      <span className="text-[10px] font-semibold text-[#10B981] block">
                        +18% meta
                      </span>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-[#DBEAFE] p-3 space-y-2">
                    <span className="text-[11px] font-bold text-[#1E3A8A] block">
                      Próximos Clientes na Grade
                    </span>
                    <div className="p-2 rounded-lg bg-[#F4F8FF] flex items-center gap-2.5 text-[11px]">
                      <span className="font-bold text-[#1D4ED8]">09:30</span>
                      <div className="min-w-0">
                        <p className="font-bold text-[#1E3A8A] truncate">Marina Silva</p>
                        <p className="text-[10px] text-[#5A6B82] truncate">
                          Design de Sobrancelhas • R$ 90
                        </p>
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-[#F4F8FF] flex items-center gap-2.5 text-[11px]">
                      <span className="font-bold text-[#1D4ED8]">11:00</span>
                      <div className="min-w-0">
                        <p className="font-bold text-[#1E3A8A] truncate">Camila Costa</p>
                        <p className="text-[10px] text-[#5A6B82] truncate">
                          Extensão de Cílios Volume • R$ 180
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mockup Mobile sobreposto */}
            <div className="w-44 bg-[#0F172A] rounded-[1.5rem] p-2 shadow-2xl absolute -bottom-6 -right-2 border border-white/20">
              <div className="bg-white rounded-[1.1rem] p-3 text-[#0A1C30] space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#1D4ED8] text-white text-[10px] font-bold flex items-center justify-center">
                    B
                  </div>
                  <div className="leading-tight">
                    <p className="text-[10px] font-bold text-[#1E3A8A]">Studio Bella VIP</p>
                    <p className="text-[8px] text-[#5A6B82]">Agendamento Online</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[8px] font-bold text-[#5A6B82] uppercase block">
                    Selecione o Serviço:
                  </span>
                  <div className="p-2 rounded-lg border-2 border-[#1D4ED8] bg-[#F4F8FF] flex justify-between text-[9px] font-bold text-[#1E3A8A]">
                    <span>Lash Lifting Luxo</span>
                    <span>R$ 140</span>
                  </div>
                  <div className="p-2 rounded-lg border border-[#DBEAFE] flex justify-between text-[9px] text-[#5A6B82]">
                    <span>Design &amp; Henna</span>
                    <span>R$ 75</span>
                  </div>
                </div>

                <div>
                  <span className="text-[8px] font-bold text-[#5A6B82] uppercase block mb-1">
                    Horário:
                  </span>
                  <div className="grid grid-cols-3 gap-1 text-[8px] font-bold text-center">
                    <span className="py-1 rounded border border-[#DBEAFE] text-[#5A6B82]">14:00</span>
                    <span className="py-1 rounded bg-[#1D4ED8] text-white">15:30</span>
                    <span className="py-1 rounded border border-[#DBEAFE] text-[#5A6B82]">17:00</span>
                  </div>
                </div>

                <div className="py-1.5 rounded-full bg-[#1D4ED8] text-white text-[9px] font-bold text-center">
                  Confirmar Agendamento →
                </div>
              </div>
            </div>

            {/* Badge flutuante inferior */}
            <div className="absolute -bottom-8 left-16 z-20 px-3.5 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white shadow-lg flex items-center gap-1.5 text-xs font-semibold">
              <TrendingDown className="w-3.5 h-3.5 text-[#6EE7B7]" />
              -85% de no-shows
            </div>
          </div>
        </div>

        {/* Rodapé direito */}
        <div className="relative z-10 flex items-center justify-between text-xs text-[#DBEAFE] pt-4">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-[#6EE7B7]" />
            +1.200 estúdios ativos no Brasil
          </span>
          <span className="font-medium text-white/80">Genda Cloud v4.2</span>
        </div>
      </div>
    </div>
  );
}
