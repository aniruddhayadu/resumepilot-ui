import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getUserEmail } from '../utils/storage';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const TEMPLATE_BASE_URL = (import.meta.env.VITE_TEMPLATE_BASE_URL || API_BASE_URL).replace(/\/$/, '');
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_SkRFZAHTzGMcqW';

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
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
};

const TemplateGallery: React.FC<Props> = ({ onSelect, selectedId }) => {
  const [tpls, setTpls] = useState<Template[]>([]);

  useEffect(() => {
    axios.get(`${TEMPLATE_BASE_URL}/api/templates`)
      .then((r) => setTpls(r.data.map((template: Template) => ({
        ...template,
        thumbnailUrl: resolveAssetUrl(template.thumbnailUrl),
      }))))
      .catch((e) => console.error('Templates fetch error:', e));
  }, []);

  const handleSelectTemplate = async (t: Template) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in before using this template.');
      return;
    }

    const isPro = t.price > 0;

    if (!isPro) {
      onSelect(t.id);
      return;
    }

    try {
      const r = await axios.post(`${TEMPLATE_BASE_URL}/api/payments/create-order`,
        { amount: t.price },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const oId = r.data;

      const opt = {
        key: RAZORPAY_KEY,
        amount: t.price * 100,
        currency: 'INR',
        name: 'ResumePilot Premium',
        description: t.name,
        order_id: oId,
        handler: async function (res: any) {
          try {
            await axios.post(`${TEMPLATE_BASE_URL}/api/payments/verify`, {
              payId: res.razorpay_payment_id,
              email: getUserEmail() || 'user@example.com',
            }, { headers: { Authorization: `Bearer ${token}` } });

            alert(`Payment Success! Template Unlocked. ID: ${res.razorpay_payment_id}`);
            onSelect(t.id);
          } catch {
            alert('Payment successful, but verification failed.');
          }
        },
      };
      const rz = new (window as any).Razorpay(opt);
      rz.open();
    } catch (e) {
      alert('Payment interaction failed. Check console.');
      console.error(e);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
      {tpls.map((t, idx) => {
        const isPro = t.price > 0;

        return (
          <div
            key={t.id}
            className={`group relative overflow-hidden rounded-2xl border-2 bg-white p-0 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/20 sm:p-0 animate-fadeIn ${selectedId === t.id ? 'border-indigo-500 ring-4 ring-indigo-50 scale-105' : 'border-slate-200 hover:border-indigo-300'}`}
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            {selectedId === t.id && (
              <div className="absolute -top-3 -right-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white w-10 h-10 flex items-center justify-center rounded-full shadow-lg font-bold z-10 animate-pulse">✓</div>
            )}

            <img
              src={t.thumbnailUrl}
              alt={t.name}
              className="mb-4 aspect-[4/5] w-full rounded-t-2xl border-b-2 border-slate-100 bg-slate-50 object-cover object-top shadow-sm group-hover:scale-105 transition-transform duration-300"
            />

            <div className="p-4 sm:p-5">
              <h3 className="text-base font-bold text-slate-800 sm:text-lg group-hover:text-indigo-600 transition-colors">{t.name}</h3>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {isPro ? (
                  <span className="inline-flex w-fit items-center font-bold text-amber-600 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1.5 rounded-lg text-sm border border-amber-200 shadow-sm">
                    PRO - ₹{t.price}
                  </span>
                ) : (
                  <span className="inline-flex w-fit items-center font-bold text-emerald-600 bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-1.5 rounded-lg text-sm border border-emerald-200 shadow-sm">
                    FREE
                  </span>
                )}

                <button
                  onClick={() => handleSelectTemplate(t)}
                  className={`px-5 py-2 rounded-lg font-bold text-sm transition-all duration-300 shadow-sm ${selectedId === t.id ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'bg-slate-900 text-white hover:bg-indigo-600 hover:shadow-lg'} active:scale-95`}
                >
                  {selectedId === t.id ? 'Selected' : (isPro ? 'Buy & Use' : 'Select')}
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
