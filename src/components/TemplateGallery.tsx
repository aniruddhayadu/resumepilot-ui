import React, { useEffect, useState } from 'react';
import api, { API_BASE_URL } from '../api/api';
import { getUserEmail } from '../utils/storage';
import { getUnlockedTemplateIds, isTemplateAccessible, PREMIUM_TEMPLATES, unlockTemplate } from './TemplateEngine';

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY || '';

interface Template {
  id: number;
  name: string;
  thumbnailUrl: string;
  price: number;
}

interface Props {
  onSelect: (templateId: number) => void;
  selectedId: number;
}

const resolveAssetUrl = (url: string): string => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) {
    try {
      const pathname = new URL(url).pathname;
      if (/^\/\d+\.(png|jpe?g|webp|svg)$/i.test(pathname) || pathname.startsWith('/images/') || pathname.startsWith('/templates/images/')) {
        return resolveAssetUrl(pathname);
      }
    } catch {
      return url;
    }
    return url;
  }

  const normalized = url.startsWith('/') ? url : `/${url}`;
  if (/^\/\d+\.(png|jpe?g|webp|svg)$/i.test(normalized)) return `${API_BASE_URL}/templates/images${normalized}`;
  if (normalized.startsWith('/templates/images/')) return `${API_BASE_URL}${normalized}`;
  if (normalized.startsWith('/images/')) return `${API_BASE_URL}/templates${normalized}`;
  return normalized;
};

const TemplateGallery: React.FC<Props> = ({ onSelect, selectedId }) => {
  const [tpls, setTpls] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unlockedTemplateIds, setUnlockedTemplateIds] = useState<number[]>(() => getUnlockedTemplateIds());

  useEffect(() => {
    setLoading(true);
    setError('');

    api.get('/api/templates')
      .then((response) => {
        const templates = Array.isArray(response.data)
          ? response.data
          : response.data?.content || response.data?.templates || [];

        setTpls(templates.map((template: Template) => ({
          ...template,
          thumbnailUrl: resolveAssetUrl(template.thumbnailUrl),
        })));
      })
      .catch((err) => {
        setError('Unable to load templates from the API Gateway.');
        console.error('Templates fetch error:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const syncUnlockedTemplates = () => setUnlockedTemplateIds(getUnlockedTemplateIds());
    window.addEventListener('storage', syncUnlockedTemplates);
    window.addEventListener('focus', syncUnlockedTemplates);
    return () => {
      window.removeEventListener('storage', syncUnlockedTemplates);
      window.removeEventListener('focus', syncUnlockedTemplates);
    };
  }, []);

  const handleSelectTemplate = async (t: Template) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in before using this template.');
      return;
    }

    const isPro = PREMIUM_TEMPLATES.has(t.id);
    const isUnlocked = isTemplateAccessible(t.id, localStorage.getItem('userRole'), unlockedTemplateIds);
    const proPrice = t.price > 0 ? t.price : 99;

    if (!isPro || isUnlocked) {
      onSelect(t.id);
      return;
    }

    try {
      if (!RAZORPAY_KEY) {
        throw new Error('Razorpay key is missing. Set RAZORPAY_KEY in the backend .env and rebuild the frontend container.');
      }

      const orderResponse = await api.post('/api/payments/create-order',
        { amount: proPrice },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const options = {
        key: RAZORPAY_KEY,
        amount: proPrice * 100,
        currency: 'INR',
        name: 'ResumePilot Premium',
        description: t.name,
        order_id: orderResponse.data,
        handler: async function (res: any) {
          try {
            await api.post('/api/payments/verify', {
              payId: res.razorpay_payment_id,
              email: getUserEmail() || 'user@example.com',
            }, { headers: { Authorization: `Bearer ${token}` } });

            setUnlockedTemplateIds(unlockTemplate(t.id));
            alert(`Payment Success! Template Unlocked. ID: ${res.razorpay_payment_id}`);
            onSelect(t.id);
          } catch {
            alert('Payment successful, but verification failed.');
          }
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (err) {
      const data = (err as any)?.response?.data;
      const message = typeof data === 'string'
        ? data
        : data?.message || data?.error || (err as Error)?.message || 'Payment interaction failed.';
      alert(message);
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="min-h-[420px] animate-pulse rounded-2xl border border-slate-800 bg-slate-950/75 p-4 shadow-2xl shadow-black/25">
            <div className="aspect-[4/5] rounded-xl bg-slate-900" />
            <div className="mt-5 h-5 w-2/3 rounded bg-slate-900" />
            <div className="mt-5 flex justify-between">
              <div className="h-9 w-20 rounded-lg bg-slate-900" />
              <div className="h-9 w-24 rounded-lg bg-slate-900" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 px-5 py-4 text-sm font-semibold text-rose-100 shadow-lg shadow-rose-950/20">
        {error} Check that the API Gateway is running.
      </div>
    );
  }

  if (tpls.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/70 px-6 py-10 text-center text-slate-300">
        No templates returned from the API Gateway.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
      {tpls.map((t, idx) => {
        const isPro = PREMIUM_TEMPLATES.has(t.id);
        const isUnlocked = isTemplateAccessible(t.id, localStorage.getItem('userRole'), unlockedTemplateIds);
        const proPrice = t.price > 0 ? t.price : 99;
        const isSelected = selectedId === t.id;

        return (
          <div
            key={t.id}
            className={`group relative overflow-hidden rounded-2xl border bg-slate-950/90 p-0 shadow-2xl shadow-black/30 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:border-indigo-400/70 hover:shadow-indigo-500/20 sm:p-0 animate-fadeIn ${isSelected ? 'scale-[1.02] border-indigo-400 ring-4 ring-indigo-500/20' : 'border-slate-800'}`}
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            {isSelected && (
              <div className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-indigo-500 to-cyan-400 text-sm font-black text-white shadow-lg shadow-indigo-500/30">
                OK
              </div>
            )}

            <img
              src={t.thumbnailUrl}
              alt={t.name}
              className="mb-4 aspect-[4/5] w-full border-b border-slate-800 bg-slate-900 object-cover object-top shadow-sm transition-transform duration-300 group-hover:scale-[1.03]"
            />

            <div className="p-4 sm:p-5">
              <h3 className="text-base font-bold text-slate-100 transition-colors group-hover:text-indigo-200 sm:text-lg">
                {t.name}
              </h3>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {isPro ? (
                  <span className="inline-flex w-fit items-center rounded-lg border border-amber-300/25 bg-amber-400/10 px-3 py-1.5 text-sm font-bold text-amber-200 shadow-sm">
                    {isUnlocked ? 'UNLOCKED' : `PRO - INR ${proPrice}`}
                  </span>
                ) : (
                  <span className="inline-flex w-fit items-center rounded-lg border border-emerald-300/25 bg-emerald-400/10 px-3 py-1.5 text-sm font-bold text-emerald-200 shadow-sm">
                    FREE
                  </span>
                )}

                <button
                  onClick={() => handleSelectTemplate(t)}
                  className={`rounded-lg px-5 py-2 text-sm font-bold shadow-sm transition-all duration-300 active:scale-95 ${isSelected ? 'bg-indigo-400/15 text-indigo-100 ring-1 ring-indigo-300/25 hover:bg-indigo-400/20' : 'bg-indigo-600 text-white shadow-indigo-500/20 hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/30'}`}
                >
                  {isSelected ? 'Selected' : (isPro && !isUnlocked ? 'Buy & Use' : 'Select')}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TemplateGallery;
