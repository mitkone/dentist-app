/** Time picker that always displays 24-hour format (no AM/PM). */
export default function TimePicker24({ value = '09:00', onChange, className = '', stepMinutes = 15 }) {
  const [h, m] = (value || '09:00').split(':').map(Number);
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minuteOptions = Array.from({ length: 60 / stepMinutes }, (_, i) => i * stepMinutes);
  const displayM = minuteOptions.includes(m) ? m : Math.min(59, Math.round(m / stepMinutes) * stepMinutes);

  const handleChange = (newH, newM) => {
    const hh = newH ?? h;
    const mm = newM !== undefined ? newM : m;
    onChange?.(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
  };

  return (
    <div className={`flex gap-1 items-center ${className}`}>
      <select
        value={String(h).padStart(2, '0')}
        onChange={(e) => handleChange(Number(e.target.value), undefined)}
        className="px-2 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none"
      >
        {hours.map((hh) => (
          <option key={hh} value={hh}>{hh}</option>
        ))}
      </select>
      <span className="text-slate-500">:</span>
      <select
        value={String(displayM).padStart(2, '0')}
        onChange={(e) => handleChange(undefined, parseInt(e.target.value, 10))}
        className="px-2 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none"
      >
        {minuteOptions.map((mm) => {
          const v = String(mm).padStart(2, '0');
          return <option key={mm} value={v}>{v}</option>;
        })}
      </select>
    </div>
  );
}
