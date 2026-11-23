import { Check, Copy, ImagePlus, MapPin, MessageCircle, Palette, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import type { Establishment } from '../../types/genda';
import { formatWhatsappInput } from '../../utils/format';

const COLOR_SWATCHES = ['#1D4ED8', '#1E3A8A', '#0F766E', '#7C3AED', '#BE185D'];

export function AdminSettingsPage() {
  const [form, setForm] = useState<Establishment | null>(null);
  const [r2Configured, setR2Configured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<'logo_url' | 'banner_url' | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    adminApi
      .getEstablishment()
      .then((res) => {
        setForm(res.establishment);
        setR2Configured(res.r2Configured);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleUpload(field: 'logo_url' | 'banner_url', file: File) {
    setUploadingField(field);
    try {
      const res = await adminApi.uploadImage(file, 'establishments');
      setForm((prev) => (prev ? { ...prev, [field]: res.url } : prev));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro no upload.');
    } finally {
      setUploadingField(null);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      const res = await adminApi.updateEstablishment({
        name: form.name,
        subtitle: form.subtitle,
        slug: form.slug,
        bio: form.bio,
        logo_url: form.logo_url,
        banner_url: form.banner_url,
        primary_color: form.primary_color,
        address: form.address,
        address_complement: form.address_complement,
        whatsapp: form.whatsapp,
      });
      setForm(res.establishment);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2500);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  }

  function handleCopyLink() {
    if (!form) return;
    const url = `${window.location.origin}/${form.slug}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading || !form) {
    return <div className="p-6 text-sm text-[#5A6B82]">Carregando configurações...</div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E3A8A]">Configurar Estabelecimento</h1>
        <p className="text-sm text-[#5A6B82]">
          Personalize a identidade visual, endereço e WhatsApp da sua página pública.
        </p>
      </div>

      {/* Identidade Visual & Upload R2 */}
      <section className="genda-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-[#1D4ED8]" />
            <h2 className="text-base font-bold text-[#1E3A8A]">Identidade Visual & Imagens</h2>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
              r2Configured
                ? 'bg-[#10B981]/15 text-[#047857]'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {r2Configured ? 'Cloudflare R2 conectado' : 'R2 aguardando chaves'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[#F4F8FF] border border-[#DBEAFE] space-y-3">
            <span className="text-xs font-semibold text-[#5A6B82] block">Logo do Estúdio</span>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl bg-white border border-[#DBEAFE] overflow-hidden flex items-center justify-center shrink-0">
                {form.logo_url ? (
                  <img src={form.logo_url} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <ImagePlus className="w-6 h-6 text-[#5A6B82]" />
                )}
              </div>
              <label className="h-9 px-4 rounded-full bg-white border border-[#DBEAFE] text-[#1D4ED8] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer">
                <ImagePlus className="w-3.5 h-3.5" />
                {uploadingField === 'logo_url' ? 'Enviando...' : 'Subir Logo'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload('logo_url', file);
                  }}
                />
              </label>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#F4F8FF] border border-[#DBEAFE] space-y-3">
            <span className="text-xs font-semibold text-[#5A6B82] block">Banner de Capa</span>
            <div className="flex items-center gap-3">
              <div className="w-24 h-16 rounded-xl bg-white border border-[#DBEAFE] overflow-hidden flex items-center justify-center shrink-0">
                {form.banner_url ? (
                  <img src={form.banner_url} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <ImagePlus className="w-6 h-6 text-[#5A6B82]" />
                )}
              </div>
              <label className="h-9 px-4 rounded-full bg-white border border-[#DBEAFE] text-[#1D4ED8] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer">
                <ImagePlus className="w-3.5 h-3.5" />
                {uploadingField === 'banner_url' ? 'Enviando...' : 'Subir Banner'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload('banner_url', file);
                  }}
                />
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#5A6B82] mb-2">Cor Principal</label>
          <div className="flex items-center gap-3">
            {COLOR_SWATCHES.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => setForm({ ...form, primary_color: hex })}
                style={{ backgroundColor: hex }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-transform cursor-pointer ${
                  form.primary_color === hex ? 'scale-110 ring-2 ring-offset-2 ring-[#1D4ED8]' : ''
                }`}
              >
                {form.primary_color === hex && <Check className="w-4 h-4" />}
              </button>
            ))}
            <input
              type="text"
              value={form.primary_color}
              onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
              className="h-9 w-28 px-3 rounded-xl border border-[#DBEAFE] bg-[#F4F8FF] text-xs font-semibold text-[#1E3A8A]"
            />
          </div>
        </div>
      </section>

      {/* Dados do Estúdio */}
      <section className="genda-card p-5 space-y-4">
        <h2 className="text-base font-bold text-[#1E3A8A]">Dados do Estúdio</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#5A6B82] mb-1">Nome do Estúdio</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full h-11 px-3.5 rounded-xl border border-[#DBEAFE] bg-[#F4F8FF] text-sm font-medium text-[#1E3A8A]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5A6B82] mb-1">Subtítulo / Especialidade</label>
            <input
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              className="w-full h-11 px-3.5 rounded-xl border border-[#DBEAFE] bg-[#F4F8FF] text-sm text-[#1E3A8A]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
            Link Personalizado (Bio)
          </label>
          <div className="flex items-center h-11 rounded-xl border border-[#DBEAFE] bg-[#F4F8FF] overflow-hidden">
            <span className="pl-3.5 pr-1 text-xs font-medium text-[#5A6B82]">genda.me/</span>
            <input
              value={form.slug}
              onChange={(e) =>
                setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })
              }
              className="flex-1 h-full bg-transparent text-sm font-semibold text-[#1D4ED8] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="h-full px-4 text-xs font-semibold text-[#1D4ED8] hover:bg-[#E5EEFF] inline-flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#5A6B82] mb-1">Bio / Descrição curta</label>
          <textarea
            rows={2}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="w-full p-3 rounded-xl border border-[#DBEAFE] bg-[#F4F8FF] text-sm text-[#1E3A8A]"
          />
        </div>
      </section>

      {/* Localização & Contato */}
      <section className="genda-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#1D4ED8]" />
          <h2 className="text-base font-bold text-[#1E3A8A]">Localização & Contato</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#5A6B82] mb-1">Endereço Completo</label>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full h-11 px-3.5 rounded-xl border border-[#DBEAFE] bg-[#F4F8FF] text-sm text-[#1E3A8A]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5A6B82] mb-1">Complemento / Sala</label>
            <input
              value={form.address_complement}
              onChange={(e) => setForm({ ...form, address_complement: e.target.value })}
              className="w-full h-11 px-3.5 rounded-xl border border-[#DBEAFE] bg-[#F4F8FF] text-sm text-[#1E3A8A]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
            WhatsApp para Agendamentos
          </label>
          <div className="relative">
            <MessageCircle className="w-4 h-4 text-[#10B981] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="tel"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: formatWhatsappInput(e.target.value) })}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#DBEAFE] bg-[#F4F8FF] text-sm font-medium text-[#1E3A8A]"
            />
          </div>
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="h-12 px-8 rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-semibold text-sm inline-flex items-center gap-2 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
        {savedToast && (
          <span className="text-sm font-semibold text-[#10B981]">Configurações salvas!</span>
        )}
      </div>
    </form>
  );
}
