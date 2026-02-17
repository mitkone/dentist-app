import { useState } from 'react';
import { X } from 'lucide-react';

export default function AddPatientModal({ open, onClose, onAdd }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [address, setAddress] = useState('');
  const [egn, setEgn] = useState('');
  const [email, setEmail] = useState('');

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    onAdd({
      name: trimmedName,
      phone: phone.trim(),
      notes: notes.trim(),
      address: address.trim(),
      egn: egn.trim(),
      email: email.trim(),
    });
    setName('');
    setPhone('');
    setNotes('');
    setAddress('');
    setEgn('');
    setEmail('');
    onClose();
  };

  const handleClose = () => {
    setName('');
    setPhone('');
    setNotes('');
    setAddress('');
    setEgn('');
    setEmail('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-xl shadow-xl border border-slate-800 w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900">
          <h3 className="text-lg font-semibold text-white">Добави пациент</h3>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label htmlFor="patient-name" className="block text-sm font-medium text-slate-200 mb-1">
              Име
            </label>
            <input
              id="patient-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Пълно име"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="patient-phone" className="block text-sm font-medium text-slate-200 mb-1">
              Телефон
            </label>
            <input
              id="patient-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+359 ..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm"
            />
          </div>

          <div>
            <label htmlFor="patient-address" className="block text-sm font-medium text-slate-200 mb-1">
              Адрес
            </label>
            <input
              id="patient-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Град, адрес"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm"
            />
          </div>

          <div>
            <label htmlFor="patient-egn" className="block text-sm font-medium text-slate-200 mb-1">
              ЕГН
            </label>
            <input
              id="patient-egn"
              type="text"
              value={egn}
              onChange={(e) => setEgn(e.target.value)}
              placeholder="10 цифри"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm"
              maxLength={10}
            />
          </div>

          <div>
            <label htmlFor="patient-email" className="block text-sm font-medium text-slate-200 mb-1">
              Имейл
            </label>
            <input
              id="patient-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm"
            />
          </div>

          <div>
            <label htmlFor="patient-notes" className="block text-sm font-medium text-slate-200 mb-1">
              Бележки
            </label>
            <textarea
              id="patient-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Бележки за пациента..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm resize-y"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-200 bg-slate-700 rounded-lg hover:bg-slate-600"
            >
              Отказ
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500"
            >
              Добави
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
