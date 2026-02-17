import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Clock, ChevronDown, Stethoscope } from 'lucide-react';
import { getSlots, appointmentTypeLabel, specialtyLabel, HOURS as DEFAULT_HOURS } from '../data/mockData';

const SLOT_HEIGHT = 42;
const DRAG_THRESHOLD = 5;
const MOBILE_BREAKPOINT = 768;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);
  return isMobile;
}

function getDurationMinutes(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh - sh) * 60 + (em - sm);
}

export default function ResourceCalendar({
  dentists,
  appointments,
  currentDate,
  currentDateKey,
  patientSearch,
  patients,
  onSlotClick,
  onAppointmentMove,
  onAppointmentClick,
  doctorVacations = [],
  workingHours = DEFAULT_HOURS,
  allDentists = [],
  selectedDentistIds = [],
  onDentistToggle,
}) {
  const slots = useMemo(() => getSlots(workingHours), [workingHours]);
  const [dragState, setDragState] = useState(null);
  const overlayRef = useRef(null);
  const ignoreNextSlotClickRef = useRef(false);
  const dragStateRef = useRef(null);
  dragStateRef.current = dragState;

  const isMobile = useIsMobile();
  const [focusedDentistId, setFocusedDentistId] = useState(null);
  const [mobileDentistsOpen, setMobileDentistsOpen] = useState(false);
  const mobileDentistsRef = useRef(null);

  const listForMobile = (allDentists.length ? allDentists : dentists);
  const dentistsToShow = useMemo(() => {
    if (!isMobile || dentists.length === 0) return dentists;
    const focused = dentists.find((d) => d.id === focusedDentistId) || dentists[0];
    return focused ? [focused] : dentists;
  }, [isMobile, dentists, focusedDentistId]);
  useEffect(() => {
    if (!isMobile || !dentists.length) return;
    const inList = dentists.some((d) => d.id === focusedDentistId);
    if (!inList || focusedDentistId === null) setFocusedDentistId(dentists[0].id);
  }, [isMobile, dentists, focusedDentistId]);

  useEffect(() => {
    if (!mobileDentistsOpen) return;
    const onDocClick = (e) => {
      if (mobileDentistsRef.current && !mobileDentistsRef.current.contains(e.target)) setMobileDentistsOpen(false);
    };
    document.addEventListener('click', onDocClick, true);
    return () => document.removeEventListener('click', onDocClick, true);
  }, [mobileDentistsOpen]);

  const isOnVacation = (dentistId) => {
    const dateStr = currentDateKey ?? currentDate.toISOString().slice(0, 10);
    return doctorVacations.some(
      (v) =>
        v.dentist_id === dentistId &&
        v.start_date <= dateStr &&
        v.end_date >= dateStr
    );
  };

  const getPatientDisplayName = (a) =>
    (a.patientId && patients.find((p) => p.id === a.patientId)?.name) || a.patientName || 'Пациент';

  const patientMatchesSearch = (a) => {
    if (!patientSearch.trim()) return true;
    const name = (a.patientId && patients.find((p) => p.id === a.patientId)?.name) || a.patientName || '';
    const phone = a.patientId ? patients.find((p) => p.id === a.patientId)?.phone : '';
    const q = patientSearch.toLowerCase();
    return name.toLowerCase().includes(q) || (phone && phone.includes(q));
  };

  const getAppointmentsForColumn = (dentistId) => {
    const dateStr = currentDateKey ?? currentDate.toISOString().slice(0, 10);
    return appointments.filter(
      (a) =>
        a.dentistId === dentistId &&
        a.date === dateStr &&
        patientMatchesSearch(a)
    );
  };

  const timeToOffset = (time) => {
    const [h, m] = time.split(':').map(Number);
    const totalM = (h - workingHours.start) * 60 + m;
    return (totalM / 30) * SLOT_HEIGHT;
  };

  const [timeTick, setTimeTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTimeTick((x) => x + 1), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isToday = (currentDateKey ?? currentDate.toISOString().slice(0, 10)) === todayKey;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const rangeStart = workingHours.start * 60;
  const rangeEnd = workingHours.end * 60;
  const showNowLine = isToday && nowMinutes >= rangeStart && nowMinutes < rangeEnd;
  const nowLineTop = showNowLine
    ? ((nowMinutes - rangeStart) / 30) * SLOT_HEIGHT
    : 0;

  const durationHeight = (start, end) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const minutes = (eh - sh) * 60 + (em - sm);
    return (minutes / 30) * SLOT_HEIGHT;
  };

  const handleSlotClick = useCallback(
    (dentistId, slot, e) => {
      if (ignoreNextSlotClickRef.current) {
        ignoreNextSlotClickRef.current = false;
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      onSlotClick(dentistId, slot);
    },
    [onSlotClick]
  );

  const handlePointerDown = useCallback((e, appointment, dentistColor) => {
    if (e.button !== 0 && e.pointerType !== 'touch') return;
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    const durationMin = getDurationMinutes(appointment.start, appointment.end);
    setDragState({
      appointment,
      dentistColor,
      durationMinutes: durationMin,
      offsetX,
      offsetY,
      x: e.clientX,
      y: e.clientY,
      hasMoved: false,
    });
  }, []);

  useEffect(() => {
    if (!dragState) return;

    const onPointerMove = (e) => {
      const current = dragStateRef.current;
      if (!current) return;
      const dx = Math.abs(e.clientX - (current.x ?? e.clientX));
      const dy = Math.abs(e.clientY - (current.y ?? e.clientY));
      const started = current.hasMoved || dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD;

      setDragState((prev) => {
        if (!prev) return null;
        if (!started && !prev.hasMoved) return prev;
        document.body.style.touchAction = 'none';
        document.body.style.userSelect = 'none';
        return {
          ...prev,
          hasMoved: true,
          x: e.clientX,
          y: e.clientY,
        };
      });
    };

    const onPointerUp = (e) => {
      document.body.style.touchAction = '';
      document.body.style.userSelect = '';

      const prev = dragStateRef.current;
      if (!prev?.hasMoved) {
        if (prev?.appointment && onAppointmentClick) onAppointmentClick(prev.appointment);
        setDragState(null);
        return;
      }

      const clientX = e.clientX;
      const clientY = e.clientY;

      if (overlayRef.current) {
        overlayRef.current.style.visibility = 'hidden';
        overlayRef.current.style.pointerEvents = 'none';
      }

      const target = document.elementFromPoint(clientX, clientY);
      const slotEl = target?.closest?.('[data-slot]');

      if (overlayRef.current) {
        overlayRef.current.style.visibility = '';
        overlayRef.current.style.pointerEvents = '';
      }

      if (slotEl && onAppointmentMove) {
        const dentistId = slotEl.getAttribute('data-dentist-id');
        const slot = slotEl.getAttribute('data-slot');
        if (dentistId && slot) {
          onAppointmentMove(prev.appointment.id, { dentistId, start: slot });
          ignoreNextSlotClickRef.current = true;
        }
      }

      setDragState(null);
    };

    const onPointerCancel = () => {
      document.body.style.touchAction = '';
      document.body.style.userSelect = '';
      setDragState(null);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
    };
  }, [dragState, onAppointmentMove]);

  const dragOverlay =
    dragState?.hasMoved && dragState.appointment
      ? createPortal(
          <div
            ref={overlayRef}
            role="presentation"
            className="fixed z-[9999] pointer-events-none rounded-lg shadow-2xl border-2 border-white/40 flex flex-col justify-center px-2 py-1 overflow-hidden transition-transform duration-75 ease-out will-change-transform"
            style={{
              left: dragState.x - dragState.offsetX,
              top: dragState.y - dragState.offsetY,
              minWidth: 120,
              minHeight: 36,
              backgroundColor: dragState.dentistColor,
              color: '#fff',
              opacity: 0.92,
              transform: 'scale(1.03)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
            }}
          >
            <span className="text-xs font-medium truncate drop-shadow-sm">
              {(dragState.appointment.patientId && patients.find((p) => p.id === dragState.appointment.patientId)?.name) || dragState.appointment.patientName || 'Пациент'}
            </span>
            <span className="text-[10px] opacity-95 truncate drop-shadow-sm">
              {appointmentTypeLabel(dragState.appointment.type)}
            </span>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden">
        {isMobile && listForMobile.length > 0 && (
          <div ref={mobileDentistsRef} className="relative px-3 py-2 border-b border-slate-800 bg-slate-800/50">
            {onDentistToggle ? (
              <>
                <button
                  type="button"
                  onClick={() => setMobileDentistsOpen((v) => !v)}
                  className="w-full flex items-center justify-between gap-2 py-2.5 pl-3 pr-3 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none"
                >
                  <span className="flex items-center gap-2 truncate">
                    <Stethoscope className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-slate-300">Лекари</span>
                    <span className="text-slate-100 font-medium">
                      ({selectedDentistIds.length} избрани)
                    </span>
                  </span>
                  <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${mobileDentistsOpen ? 'rotate-180' : ''}`} />
                </button>
                {mobileDentistsOpen && (
                  <div className="absolute left-3 right-3 top-full mt-1 z-50 rounded-lg border border-slate-600 bg-slate-900 shadow-xl overflow-hidden flex flex-col max-h-[min(70vh,420px)]">
                    <div className="p-2 border-b border-slate-700 flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const allSel = listForMobile.every((d) => selectedDentistIds.includes(d.id));
                          listForMobile.forEach((d) => {
                            if (allSel && selectedDentistIds.includes(d.id)) onDentistToggle(d.id);
                            if (!allSel && !selectedDentistIds.includes(d.id)) onDentistToggle(d.id);
                          });
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border bg-slate-800 text-slate-200 border-slate-600 hover:border-emerald-500 hover:text-emerald-300"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        {listForMobile.every((d) => selectedDentistIds.includes(d.id)) ? 'Отмаркирай всички' : 'Избери всички'}
                      </button>
                    </div>
                    <div className="overflow-y-auto scroll-thin flex-1 min-h-0 p-2">
                      {listForMobile.map((d) => {
                        const selected = selectedDentistIds.includes(d.id);
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => onDentistToggle(d.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm border transition-colors ${
                              selected ? 'bg-slate-100 text-slate-900 border-emerald-500' : 'bg-slate-800 text-slate-200 border-slate-600'
                            }`}
                          >
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                            <span className="flex-1 truncate">{d.name}</span>
                            {selected && <span className="text-xs text-emerald-600 font-medium">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                    {dentists.length > 1 && (
                      <div className="p-2 border-t border-slate-700 shrink-0">
                        <label className="text-xs text-slate-400 block mb-1">Преглед на графика:</label>
                        <select
                          value={focusedDentistId ?? dentists[0]?.id ?? ''}
                          onChange={(e) => setFocusedDentistId(e.target.value)}
                          className="w-full py-2 pl-3 pr-8 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500/40 outline-none appearance-none bg-no-repeat bg-[length:1rem] bg-[right_0.5rem_center]"
                          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")" }}
                        >
                          {dentists.map((d) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-300 shrink-0">Лекар:</label>
                <select
                  value={focusedDentistId ?? dentists[0]?.id ?? ''}
                  onChange={(e) => setFocusedDentistId(e.target.value)}
                  className="flex-1 min-w-0 py-2 pl-3 pr-8 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
                >
                  {dentists.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
        <div className="flex border-b border-slate-800 bg-slate-900">
          <div className="w-16 shrink-0 flex items-center justify-center border-r border-slate-800 py-3">
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          {dentistsToShow.map((d) => (
            <div
              key={d.id}
              className="flex-1 min-w-[140px] sm:min-w-[160px] border-r border-slate-800 last:border-r-0 py-2 sm:py-3 px-2 sm:px-3 text-center"
            >
              <div className="font-semibold text-slate-100 truncate" title={d.name}>
                {d.name}
              </div>
              <div className="text-xs text-slate-400 truncate">{specialtyLabel(d.specialty)}</div>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-auto scroll-thin overflow-x-auto">
          <div className="flex relative min-w-0" style={{ minHeight: slots.length * SLOT_HEIGHT }}>
            {showNowLine && (
              <div
                className="absolute left-0 right-0 h-0.5 bg-emerald-400 z-10 pointer-events-none"
                style={{ top: nowLineTop }}
                aria-hidden
              />
            )}
            <div className="w-16 shrink-0 border-r border-slate-800 bg-slate-900">
              {slots.map((slot) => (
                <div
                  key={slot}
                  className="text-xs text-slate-400 text-right pr-2 flex items-center justify-end border-b border-slate-800"
                  style={{ height: SLOT_HEIGHT }}
                >
                  {slot}
                </div>
              ))}
            </div>

            {dentistsToShow.map((d) => {
              const vacation = isOnVacation(d.id);
              return (
                <div
                  key={d.id}
                  className={`flex-1 min-w-[140px] sm:min-w-[160px] relative border-r border-slate-800 last:border-r-0 ${
                    vacation ? 'bg-red-900/40' : 'bg-slate-900'
                  }`}
                >
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      data-slot={slot}
                      data-dentist-id={d.id}
                      onClick={(e) => {
                        if (vacation) return;
                        handleSlotClick(d.id, slot, e);
                      }}
                      className={`absolute left-0.5 right-0.5 rounded border border-transparent transition-colors ${
                        vacation
                          ? 'cursor-not-allowed opacity-60'
                          : 'hover:bg-emerald-500/20 hover:ring-1 hover:ring-emerald-400/50 hover:border-emerald-400/30'
                      }`}
                      style={{
                        top: timeToOffset(slot),
                        height: Math.max(SLOT_HEIGHT - 2, 44),
                      }}
                    />
                  ))}

                  {getAppointmentsForColumn(d.id).map((a) => {
                    const top = timeToOffset(a.start);
                    const h = Math.max(durationHeight(a.start, a.end), 24);
                    const isDragging = dragState?.appointment?.id === a.id && dragState?.hasMoved;
                    const isNoShow = a.attendance === 'no_show';
                    const isNhif = a.insurance === 'nhif';
                    return (
                      <div
                        key={a.id}
                        onPointerDown={(e) => handlePointerDown(e, a, d.color)}
                        onContextMenu={(e) => e.preventDefault()}
                        className={`absolute left-1 right-1 rounded-lg shadow-lg border border-white/20 overflow-hidden flex flex-col justify-center px-2 py-1 ring-1 ring-black/20 touch-none select-none transition-opacity duration-150 ${
                          isDragging ? 'opacity-40 pointer-events-none' : ''
                        } ${isNoShow ? 'ring-red-400/70' : ''}`}
                        style={{
                          top,
                          height: h - 2,
                          backgroundColor: isNoShow ? '#b91c1c' : d.color, // червено за „не се яви“
                          color: '#fff',
                          cursor: dragState?.appointment?.id === a.id ? 'grabbing' : 'grab',
                        }}
                      >
                        <span className="text-xs font-medium truncate drop-shadow-sm">
                          {getPatientDisplayName(a)}
                        </span>
                        <span className="text-[10px] opacity-95 truncate drop-shadow-sm">
                          {appointmentTypeLabel(a.type)}
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                          {isNhif && (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500 text-slate-900 tracking-wide">
                              НЗОК
                            </span>
                          )}
                          {isNoShow && (
                            <span className="text-[9px] font-semibold uppercase tracking-wide drop-shadow-sm">
                              НЕ СЕ ЯВИ
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {dragOverlay}
    </>
  );
}
