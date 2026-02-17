import { useState, useEffect, useMemo, useRef } from 'react';
import { X, Phone, FileText, MapPin, Mail, CreditCard, CalendarCheck, Paperclip, Upload, Trash2 } from 'lucide-react';
import { appointmentTypeLabel } from '../data/mockData';

function formatDisplayDate(dateStr) {
  if (!dateStr || dateStr.length < 10) return dateStr;
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

function formatFileDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return isoStr;
  return d.toLocaleDateString('bg-BG', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function PatientDetailModal({
  patient,
  open,
  onClose,
  onSave,
  appointments = [],
  dentists = [],
  patientFiles = [],
  onUploadFile,
  onDeleteFile,
  canUseFiles = false,
  appointmentTypes = [],
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [address, setAddress] = useState('');
  const [egn, setEgn] = useState('');
  const [email, setEmail] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const fileInputRef = useRef(null);

  const attendanceLabel = (a) => (a === 'showed' ? 'Дойде' : a === 'no_show' ? 'Не се яви' : '—');
  const getTypeLabel = (key) => appointmentTypes.find((t) => t.key === key)?.label_bg ?? appointmentTypeLabel(key);
  const insuranceLabel = (i) => (i === 'nhif' ? 'По здравна каса' : 'Частно');

  useEffect(() => {
    if (patient) {
      setName(patient.name ?? '');
      setPhone(patient.phone ?? '');
      setNotes(patient.notes ?? '');
      setAddress(patient.address ?? '');
      setEgn(patient.egn ?? '');
      setEmail(patient.email ?? '');
    }
  }, [patient]);

  const visitHistory = useMemo(() => {
    if (!patient?.name || !appointments.length) return [];
    const nameNorm = patient.name.trim().toLowerCase();
    return appointments
      .filter((a) => (a.patientName || '').trim().toLowerCase() === nameNorm || (a.patientId && a.patientId === patient.id))
      .sort((a, b) => {
        const d = (a.date || '').localeCompare(b.date || '', undefined, { numeric: true });
        return d !== 0 ? -d : ((b.start || '').localeCompare(a.start || ''));
      });
  }, [patient?.id, patient?.name, appointments]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave?.({
      name: name.trim(),
      phone: phone.trim(),
      notes: notes.trim(),
      address: address.trim(),
      egn: egn.trim(),
      email: email.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-slate-900 rounded-xl shadow-xl border border-slate-800 w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900">
          <h3 className="text-lg font-semibold text-white">Данни за пациента</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">Име</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1 flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400" />
              Телефон
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+359 ..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              Адрес
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Град, адрес"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-400" />
              ЕГН
            </label>
            <input
              type="text"
              value={egn}
              onChange={(e) => setEgn(e.target.value)}
              placeholder="10 цифри"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm"
              maxLength={10}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1 flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              Имейл
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              Бележки
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Бележки за пациента..."
              rows={4}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm resize-y min-h-[80px]"
            />
          </div>

          {visitHistory.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-emerald-400" />
                История на посещения
              </h4>
              <ul className="space-y-1.5 max-h-44 overflow-y-auto scroll-thin rounded-lg border border-slate-700 bg-slate-800/50 p-2">
                {visitHistory.map((a) => (
                  <li
                    key={a.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedVisit(a)}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedVisit(a)}
                    className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 py-1.5 px-2 rounded border border-slate-700/80 bg-slate-800 text-slate-200 text-sm cursor-pointer hover:bg-slate-700/80 hover:border-slate-600"
                  >
                    <span className="font-medium text-slate-100">{formatDisplayDate(a.date)}</span>
                    {a.start && <span className="text-xs text-slate-400">{a.start}{a.end ? ` – ${a.end}` : ''}</span>}
                    <span className="text-slate-400 text-xs w-full mt-0.5">
                      {dentists.find((d) => d.id === a.dentistId)?.name ?? '—'} · {getTypeLabel(a.type)}
                      {(a.attendance && a.attendance !== 'pending') && (
                        <span className="ml-1 text-amber-400">· {attendanceLabel(a.attendance)}</span>
                      )}
                      {a.insurance && (
                        <span className="ml-1 text-slate-400">· {insuranceLabel(a.insurance)}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selectedVisit && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60" onClick={() => setSelectedVisit(null)}>
              <div
                className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-sm p-4 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-white">Посещение {formatDisplayDate(selectedVisit.date)}</h4>
                  <button type="button" onClick={() => setSelectedVisit(null)} className="p-1 rounded text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-slate-300 text-sm">
                  {selectedVisit.start}{selectedVisit.end ? ` – ${selectedVisit.end}` : ''} · {dentists.find((d) => d.id === selectedVisit.dentistId)?.name ?? '—'}
                </p>
                <p className="text-slate-400 text-sm mt-1">{getTypeLabel(selectedVisit.type)}</p>
                {selectedVisit.insurance && (
                  <p className="text-slate-400 text-sm mt-1">
                    Плащане: <span className="text-slate-200">{insuranceLabel(selectedVisit.insurance)}</span>
                  </p>
                )}
                {selectedVisit.attendance && selectedVisit.attendance !== 'pending' && (
                  <p className="text-sm mt-2">
                    <span className="text-slate-400">Статус: </span>
                    <span className={selectedVisit.attendance === 'showed' ? 'text-emerald-400' : 'text-red-400'}>{attendanceLabel(selectedVisit.attendance)}</span>
                  </p>
                )}
                {selectedVisit.notes && (
                  <div className="mt-3 pt-3 border-t border-slate-600">
                    <p className="text-xs text-slate-500 mb-1">Бележки</p>
                    <p className="text-slate-200 text-sm whitespace-pre-wrap">{selectedVisit.notes}</p>
                  </div>
                )}
                {!selectedVisit.notes && (!selectedVisit.attendance || selectedVisit.attendance === 'pending') && (
                  <p className="text-slate-500 text-xs mt-3">Няма бележки или отбелязан статус за това посещение.</p>
                )}
              </div>
            </div>
          )}

          {canUseFiles && (
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-emerald-400" />
                Файлове
              </h4>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !patient?.id) return;
                  setUploading(true);
                  try {
                    await onUploadFile?.(patient.id, file);
                  } finally {
                    setUploading(false);
                    e.target.value = '';
                  }
                }}
              />
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-slate-800 border border-slate-600 rounded-lg hover:bg-slate-700 disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {uploading ? 'Качване...' : 'Качи файл'}
                </button>
              </div>
              {patientFiles.length > 0 ? (
                <ul className="space-y-1.5 max-h-36 overflow-y-auto scroll-thin rounded-lg border border-slate-700 bg-slate-800/50 p-2">
                  {patientFiles.map((f) => (
                    <li
                      key={f.id}
                      className="flex items-center justify-between gap-2 py-1.5 px-2 rounded border border-slate-700/80 bg-slate-800 text-slate-200 text-sm"
                    >
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-emerald-400 hover:underline min-w-0"
                      >
                        {f.file_name}
                      </a>
                      <span className="text-xs text-slate-500 shrink-0">{formatFileDate(f.created_at)}</span>
                      <button
                        type="button"
                        onClick={() => onDeleteFile?.(patient.id, f.id)}
                        className="p-1 rounded text-slate-400 hover:bg-red-900/60 hover:text-red-400 shrink-0"
                        title="Изтрий файл"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 py-1">Няма прикачени файлове</p>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-200 bg-slate-700 rounded-lg hover:bg-slate-600"
            >
              Затвори
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500"
            >
              Запази
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
