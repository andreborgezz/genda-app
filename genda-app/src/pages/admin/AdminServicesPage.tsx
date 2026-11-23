import { ImagePlus, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import type { Establishment, ServiceItem } from '../../types/genda';
import { formatCurrency, formatDuration } from '../../utils/format';

interface ServiceFormState {
  name: string;
  category: string;
  description: string;
  duration_minutes: number;
  price_reais: string;
  image_url: string;
  is_active: boolean;
}

const EMPTY_FORM: ServiceFormState = {
  name: '',
  category: 'Geral',
  description: '',
  duration_minutes: 60,
  price_reais: '100.00',
  image_url: '',
  is_active: true,
};

export function AdminServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<ServiceFormState>(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    try {
      const [srvRes, estRes] = await Promise.all([
        adminApi.getServices(),
        adminApi.getEstablishment(),
      ]);
      setServices(srvRes.services);
      setEstablishment(estRes.establishment);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function openNew() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(s: ServiceItem) {
    setEditingId(s.id);
    setForm({
      name: s.name,
      category: s.category,
      description: s.description,
      duration_minutes: s.duration_minutes,
      price_reais: (s.price_cents / 100).toFixed(2),
      image_url: s.image_url || '',
      is_active: s.is_active,
    });
    setShowModal(true);
  }

  async function handleImageUpload(file: File) {
    setUploading(true);
    try {
      const res = await adminApi.uploadImage(file, 'services');
      setForm((prev) => ({ ...prev, image_url: res.url }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao enviar imagem.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveService(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const priceCents = Math.round(Number(form.price_reais.replace(',', '.')) * 100) || 0;
      const payload = {
        name: form.name,
        category: form.category,
        description: form.description,
        duration_minutes: Number(form.duration_minutes),
        price_cents: priceCents,
        image_url: form.image_url.trim() || null,
        is_active: form.is_active,
        sort_order: services.length + 1,
      };
      if (editingId) {
        await adminApi.updateService(editingId, payload);
      } else {
        await adminApi.createService(payload);
      }
      setShowModal(false);
      await loadAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao salvar serviço.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja excluir este serviço?')) return;
    await adminApi.deleteService(id);
    await loadAll();
  }

  async function handleSaveRules() {
    if (!establishment) return;
    await adminApi.updateEstablishment({
      slot_interval_minutes: establishment.slot_interval_minutes,
      min_advance_minutes: establishment.min_advance_minutes,
      max_future_days: establishment.max_future_days,
    });
    setFeedback('Regras globais salvas!');
    setTimeout(() => setFeedback(null), 2500);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A8A]">Serviços, Preços e Duração</h1>
          <p className="text-sm text-[#5A6B82]">
            Gerencie sua vitrine de serviços visível na página pública.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="h-11 px-5 rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Novo Serviço
        </button>
      </div>

      {/* Lista de Serviços */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 rounded-2xl bg-white border border-[#DBEAFE] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((s) => (
            <div key={s.id} className="genda-card p-4 flex gap-4 items-start">
              {s.image_url ? (
                <img
                  src={s.image_url}
                  alt={s.name}
                  className="w-20 h-20 rounded-xl object-cover shrink-0 border border-[#DBEAFE]"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-[#F4F8FF] border border-[#DBEAFE] flex items-center justify-center text-[#5A6B82] shrink-0">
                  <ImagePlus className="w-6 h-6" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-[#1E3A8A] text-sm sm:text-base truncate">
                    {s.name}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                      s.is_active
                        ? 'bg-[#10B981]/15 text-[#047857]'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {s.is_active ? 'Ativo' : 'Pausado'}
                  </span>
                </div>
                <p className="text-xs text-[#5A6B82] mt-0.5">{s.category}</p>
                <div className="flex items-center gap-3 mt-2 text-xs font-semibold">
                  <span className="text-[#1D4ED8]">{formatCurrency(s.price_cents)}</span>
                  <span className="text-[#5A6B82]">• {formatDuration(s.duration_minutes)}</span>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => openEdit(s)}
                    className="h-8 px-3 rounded-full bg-[#F4F8FF] border border-[#DBEAFE] text-[#1D4ED8] text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Pencil className="w-3 h-3" /> Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(s.id)}
                    className="h-8 px-3 rounded-full border border-red-200 text-red-600 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Regras Globais de Agenda */}
      {establishment && (
        <section className="genda-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#1E3A8A]">Regras Globais de Agenda</h2>
            {feedback && (
              <span className="text-xs font-semibold text-[#10B981]">{feedback}</span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                Intervalo entre horários (min)
              </label>
              <input
                type="number"
                value={establishment.slot_interval_minutes}
                onChange={(e) =>
                  setEstablishment({
                    ...establishment,
                    slot_interval_minutes: Number(e.target.value),
                  })
                }
                className="w-full h-11 px-3 rounded-xl border border-[#DBEAFE] bg-[#F4F8FF] text-sm font-semibold text-[#1E3A8A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                Antecedência mínima (min)
              </label>
              <input
                type="number"
                value={establishment.min_advance_minutes}
                onChange={(e) =>
                  setEstablishment({
                    ...establishment,
                    min_advance_minutes: Number(e.target.value),
                  })
                }
                className="w-full h-11 px-3 rounded-xl border border-[#DBEAFE] bg-[#F4F8FF] text-sm font-semibold text-[#1E3A8A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                Janela futura (dias)
              </label>
              <input
                type="number"
                value={establishment.max_future_days}
                onChange={(e) =>
                  setEstablishment({
                    ...establishment,
                    max_future_days: Number(e.target.value),
                  })
                }
                className="w-full h-11 px-3 rounded-xl border border-[#DBEAFE] bg-[#F4F8FF] text-sm font-semibold text-[#1E3A8A]"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleSaveRules}
            className="h-10 px-5 rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" /> Salvar Regras
          </button>
        </section>
      )}

      {/* Modal Criar/Editar Serviço */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveService}
            className="bg-white rounded-2xl border border-[#DBEAFE] max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1E3A8A]">
                {editingId ? 'Editar Serviço' : 'Novo Serviço'}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-full hover:bg-[#F4F8FF] text-[#5A6B82] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A6B82] mb-1">Nome *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-[#DBEAFE] bg-[#F4F8FF] text-sm text-[#1E3A8A]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#5A6B82] mb-1">Categoria</label>
                <input
                  required
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-xl border border-[#DBEAFE] bg-[#F4F8FF] text-sm text-[#1E3A8A]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                  Duração (min)
                </label>
                <input
                  type="number"
                  required
                  min={10}
                  value={form.duration_minutes}
                  onChange={(e) =>
                    setForm({ ...form, duration_minutes: Number(e.target.value) })
                  }
                  className="w-full h-11 px-3.5 rounded-xl border border-[#DBEAFE] bg-[#F4F8FF] text-sm text-[#1E3A8A]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                  Preço (R$)
                </label>
                <input
                  required
                  value={form.price_reais}
                  onChange={(e) => setForm({ ...form, price_reais: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-xl border border-[#DBEAFE] bg-[#F4F8FF] text-sm text-[#1E3A8A]"
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#1E3A8A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 accent-[#1D4ED8]"
                  />
                  Serviço ativo
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A6B82] mb-1">Descrição</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full p-3 rounded-xl border border-[#DBEAFE] bg-[#F4F8FF] text-sm text-[#1E3A8A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                Foto do Serviço (Cloudflare R2 ou URL)
              </label>
              <div className="flex gap-2">
                <input
                  placeholder="https://..."
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  className="flex-1 h-11 px-3.5 rounded-xl border border-[#DBEAFE] bg-[#F4F8FF] text-xs text-[#1E3A8A]"
                />
                <label className="h-11 px-4 rounded-xl bg-[#F4F8FF] border border-[#DBEAFE] text-[#1D4ED8] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shrink-0">
                  <ImagePlus className="w-4 h-4" />
                  {uploading ? 'Enviando...' : 'Upload'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="h-11 px-5 rounded-full border border-[#DBEAFE] text-sm font-semibold text-[#5A6B82] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-11 px-6 rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-semibold cursor-pointer"
              >
                {saving ? 'Salvando...' : 'Salvar Serviço'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
