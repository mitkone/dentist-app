import { useRef, useState } from 'react';
import { X, CalendarOff, Calendar, MapPin, Camera, Trash2, RefreshCw } from 'lucide-react';

export default function DentistProfileModal({
  open,
  onClose,
  dentist,
  onOpenVacation,
  onOpenFreeSlots,
  onOpenDayLocation,
  canManageVacation,
  canManageFreeSlots,
  canManageDayLocation,
  canUploadPhoto,
  onUploadPhoto,
  onDeletePhoto,
}) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  if (!open || !dentist) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadPhoto) return;
    setUploading(true);
    await onUploadPhoto(dentist.id, file);
    setUploading(false);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            {/* Avatar with optional upload */}
            <div className="relative shrink-0">
              {dentist.photoUrl ? (
                <img src={dentist.photoUrl} alt={dentist.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-slate-200" />
              ) : (
                <span className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base"
                  style={{ backgroundColor: dentist.color }}>
                  {dentist.name.charAt(0).toUpperCase()}
                </span>
              )}
              {canUploadPhoto && (
                <>
                  <button type="button" title="Смени снимка"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="absolute inset-0 rounded-full bg-slate-900/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    {uploading ? <RefreshCw className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
                  </button>
                  <input type="file" accept="image/*" className="hidden" ref={fileRef} onChange={handleFileChange} />
                </>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{dentist.name}</h3>
              <p className="text-sm text-slate-500">Профил на стоматолог</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-2">
          {canUploadPhoto && (
            <div className="flex gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm transition-colors disabled:opacity-50">
                {uploading ? <RefreshCw className="w-4 h-4 text-slate-500 animate-spin" /> : <Camera className="w-4 h-4 text-slate-500" />}
                {dentist.photoUrl ? 'Смени снимката' : 'Качи снимка'}
              </button>
              {dentist.photoUrl && onDeletePhoto && (
                <button type="button" onClick={() => onDeletePhoto(dentist.id)}
                  className="p-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors" title="Премахни снимка">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
          {(canManageVacation !== false) && onOpenVacation && (
            <button
              type="button"
              onClick={() => { onClose(); onOpenVacation(dentist.id); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
            >
              <CalendarOff className="w-5 h-5 text-amber-400" />
              <span>Отпуски</span>
            </button>
          )}
          {(canManageFreeSlots !== false) && onOpenFreeSlots && (
            <button
              type="button"
              onClick={() => { onClose(); onOpenFreeSlots(dentist); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
            >
              <Calendar className="w-5 h-5 text-emerald-400" />
              <span>Свободни часове</span>
            </button>
          )}
          {(canManageDayLocation !== false) && onOpenDayLocation && (
            <button
              type="button"
              onClick={() => { onClose(); onOpenDayLocation(dentist); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
            >
              <MapPin className="w-5 h-5 text-cyan-500" />
              <span>Кабинет по ден</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
