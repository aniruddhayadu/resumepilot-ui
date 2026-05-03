import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getUserEmail } from '../utils/storage'; 

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

const TemplateGallery: React.FC<Props> = ({ onSelect, selectedId }) => {
    const [tpls, setTpls] = useState<Template[]>([]);

    useEffect(() => {
        axios.get('http://localhost:8084/api/templates')
            .then(r => setTpls(r.data))
            .catch(e => console.error("Templates fetch error:", e));
    }, []);

    const handleSelectTemplate = async (t: Template) => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert("Bhai, is mast template ko use karne ke liye pehle Login karna padega! 🚀");
            return; 
        }

        // 🚀 BULLETPROOF LOGIC: Agar price 0 se zyada hai, toh wo PREMIUM hai!
        const isPro = t.price > 0;

        if (!isPro) {
            onSelect(t.id); // Free hai toh direct select
        } else {
            // Premium hai toh Razorpay shuru
            try {
                const r = await axios.post('http://localhost:8084/api/payments/create-order',
                    { amount: t.price },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                const oId = r.data;

                const opt = {
                    key: "rzp_test_SkRFZAHTzGMcqW", // 🚀 TERI ASLI RAZORPAY KEY YAHAN AA GYI HAI
                    amount: t.price * 100,
                    currency: "INR",
                    name: "ResumePilot Premium",
                    description: t.name,
                    order_id: oId,
                    handler: async function (res: any) {
                        try {
                            await axios.post('http://localhost:8084/api/payments/verify', {
                                payId: res.razorpay_payment_id,
                                email: getUserEmail() || 'user@example.com' 
                            }, { headers: { Authorization: `Bearer ${token}` } });
                            
                            alert("Payment Success! 🚀 Template Unlocked. ID: " + res.razorpay_payment_id);
                            onSelect(t.id); 
                        } catch (err) {
                            alert("Payment successful, but verification failed.");
                        }
                    }
                };
                const rz = new (window as any).Razorpay(opt);
                rz.open();
            } catch (e) {
                alert("Payment interaction failed. Check console.");
                console.error(e); // Isse console me exact error pata chalega agar kuch fasa toh
            }
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tpls.map(t => {
                const isPro = t.price > 0; // Check agar premium hai
                
                return (
                    <div key={t.id} className={`relative p-5 rounded-xl border-2 transition-all bg-white hover:shadow-lg ${selectedId === t.id ? 'border-indigo-600 ring-4 ring-indigo-50' : 'border-slate-200'}`}>
                        {selectedId === t.id && (
                            <div className="absolute -top-3 -right-3 bg-indigo-600 text-white w-8 h-8 flex items-center justify-center rounded-full shadow-md font-bold z-10">✓</div>
                        )}
                        
                        <img src={t.thumbnailUrl} alt={t.name} className="w-full h-64 object-cover object-top rounded-lg border border-gray-100 mb-4 bg-slate-50 shadow-sm" />
                        <h3 className="text-lg font-bold text-slate-800">{t.name}</h3>
                        
                        <div className="flex justify-between items-center mt-3">
                            {isPro ? (
                                <span className="font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md text-sm border border-amber-200">
                                    ⭐ PRO - ₹{t.price}
                                </span>
                            ) : (
                                <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md text-sm border border-emerald-200">
                                    FREE
                                </span>
                            )}

                            <button
                                onClick={() => handleSelectTemplate(t)}
                                className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${selectedId === t.id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-900 text-white hover:bg-indigo-600'}`}
                            >
                                {selectedId === t.id ? 'Selected' : (isPro ? 'Buy & Use' : 'Select')}
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default TemplateGallery;