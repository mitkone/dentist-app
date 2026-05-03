import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Clock, ChevronDown, Stethoscope, StickyNote } from 'lucide-react';
import { getSlots, appointmentTypeLabel, HOURS as DEFAULT_HOURS, SLOT_MINUTES } from '../data/mockData';
import { effectiveDentistId } from '../lib/appointments';

const SLOT_HEIGHT = 40;
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

function mondayOfWeek(d) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function weekDateKeysFrom(anchor) {
  const mon = mondayOfWeek(anchor);
  const keys = [];
  for (let i = 0; i < 7; i++) {
    const dt = new Date(mon);
    dt.setDate(mon.getDate() + i);
    keys.push(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`);
  }
  return keys;
}

/** Локален YYYY-MM-DD (не UTC), за да съвпада с дата на часовете в графика. */
function calendarDateKeyFromDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Унифицирано YYYY-MM-DD (попълва месец/ден) за филтри в графиката. */
function normalizeCalendarDateKey(ds) {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(String(ds || '').trim());
  if (!m) return String(ds || '').trim();
  return `${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`;
}

function assignAppointmentLanes(apps) {
  const sorted = [...apps].sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end));
  const laneEnds = [];
  sorted.forEach((a) => {
    let L = 0;
    while (laneEnds[L] && a.start < laneEnds[L]) L++;
    laneEnds[L] = a.end;
    a._lane = L;
  });
  const n = sorted.length ? Math.max(...sorted.map((x) => x._lane)) + 1 : 1;
  sorted.forEach((a) => {
    a._laneCount = n;
  });
  return sorted;
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
  doctorAvailableSlots = {},
  doctorDayLocations = {},
  onDentistNameClick,
  canManageVacation = true,
  appointmentTypes = [],
  canMoveAppointment = false,
  viewMode = 'day',
  onOpenFreeSlotsForDate,
}) {
  const dentistPoolForId = useMemo(
    () => (allDentists && allDentists.length > 0 ? allDentists : dentists),
    [allDentists, dentists]
  );
  const columnDentistId = useCallback((a) => effectiveDentistId(a, dentistPoolForId), [dentistPoolForId]);

  const getTypeDisplay = (type) =>
    appointmentTypes.find((t) => t.key === type || t.label_bg === type)?.label_bg ?? appointmentTypeLabel(type) ?? type;
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
  const headerScrollRef = useRef(null);
  const gridScrollRef = useRef(null);
  const headerRowRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [hoverInfo, setHoverInfo] = useState(null);
  const lastPinchDist = useRef(null);
  const effectiveSlotHeight = SLOT_HEIGHT * zoom;

  useEffect(() => {
    const grid = gridScrollRef.current;
    const header = headerScrollRef.current;
    if (!grid || !header) return;
    let skipSync = false;
    const syncGridToHeader = () => {
      if (skipSync) return;
      skipSync = true;
      header.scrollLeft = Math.max(0, grid.scrollLeft);
      requestAnimationFrame(() => { skipSync = false; });
    };
    const syncHeaderToGrid = () => {
      if (skipSync) return;
      skipSync = true;
      grid.scrollLeft = header.scrollLeft;
      requestAnimationFrame(() => { skipSync = false; });
    };
    grid.addEventListener('scroll', syncGridToHeader);
    header.addEventListener('scroll', syncHeaderToGrid);
    const ro = new ResizeObserver(syncGridToHeader);
    ro.observe(grid);
    return () => {
      grid.removeEventListener('scroll', syncGridToHeader);
      header.removeEventListener('scroll', syncHeaderToGrid);
      ro.disconnect();
    };
  }, [viewMode]);

  useEffect(() => {
    const grid = gridScrollRef.current;
    const header = headerScrollRef.current;
    const headerRow = headerRowRef.current;
    if (!grid || typeof window === 'undefined') return;
    const onHeaderWheel = (e) => {
      if (window.innerWidth >= MOBILE_BREAKPOINT) {
        const dy = e.deltaY || 0;
        if (Math.abs(dy) > 0) {
          const { scrollLeft, scrollWidth, clientWidth } = grid;
          const canScrollRight = scrollLeft + clientWidth < scrollWidth - 1;
          const canScrollLeft = scrollLeft > 0;
          if ((dy > 0 && canScrollRight) || (dy < 0 && canScrollLeft)) {
            e.preventDefault();
            grid.scrollLeft += dy;
            if (header) header.scrollLeft = grid.scrollLeft;
          }
        }
      }
    };
    const onGridWheel = (e) => {
      if (window.innerWidth >= MOBILE_BREAKPOINT) {
        const dy = e.deltaY || 0;
        const dx = e.deltaX || 0;
        if (Math.abs(dx) > Math.abs(dy)) {
          const { scrollLeft, scrollWidth, clientWidth } = grid;
          const canScrollRight = scrollLeft + clientWidth < scrollWidth - 1;
          const canScrollLeft = scrollLeft > 0;
          if ((dx > 0 && canScrollRight) || (dx < 0 && canScrollLeft)) {
            e.preventDefault();
            grid.scrollLeft += dx;
            if (header) header.scrollLeft = grid.scrollLeft;
          }
        } else if (Math.abs(dy) > 0) {
          const { scrollTop, scrollHeight, clientHeight } = grid;
          const canScrollDown = scrollTop + clientHeight < scrollHeight - 1;
          const canScrollUp = scrollTop > 0;
          if ((dy > 0 && canScrollDown) || (dy < 0 && canScrollUp)) {
            e.preventDefault();
            grid.scrollTop += dy;
          }
        }
      }
    };
    if (headerRow) {
      headerRow.addEventListener('wheel', onHeaderWheel, { passive: false });
    }
    grid.addEventListener('wheel', onGridWheel, { passive: false });
    return () => {
      if (headerRow) headerRow.removeEventListener('wheel', onHeaderWheel);
      grid.removeEventListener('wheel', onGridWheel);
    };
  }, []);

  const listForMobile = (allDentists.length ? allDentists : dentists);
  const dentistsToShow = useMemo(() => {
    if (!isMobile || dentists.length === 0) return dentists;
    const focused = dentists.find((d) => d.id === focusedDentistId) || dentists[0];
    return focused ? [focused] : dentists;
  }, [isMobile, dentists, focusedDentistId]);
  useEffect(() => {
    if (!dentists.length) return;
    const inList = dentists.some((d) => d.id === focusedDentistId);
    if (!inList || focusedDentistId === null) setFocusedDentistId(dentists[0].id);
  }, [dentists, focusedDentistId]);
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

  const dateStr = currentDateKey ?? calendarDateKeyFromDate(currentDate);

  const weekDateKeys = useMemo(
    () => (viewMode === 'week' ? weekDateKeysFrom(currentDate) : []),
    [currentDate, viewMode]
  );

  const isSlotAvailable = (dentistId, slot, dayKey = dateStr) => {
    const key = `${dentistId}_${dayKey}`;
    const availableSet = doctorAvailableSlots[key];
    if (!availableSet) return true; // няма запис – всички слотове са свободни
    if (availableSet.size === 0) return false; // празен списък – няма свободни
    return availableSet.has(slot);
  };

  const isOnVacation = (dentistId, dayKey = dateStr) => {
    return doctorVacations.some(
      (v) =>
        v.dentist_id === dentistId &&
        v.start_date <= dayKey &&
        v.end_date >= dayKey
    );
  };

  const getAppointmentsForWeekDay = (dayKey, dentistId) =>
    appointments.filter(
      (a) =>
        normalizeCalendarDateKey(a.date) === normalizeCalendarDateKey(dayKey) &&
        columnDentistId(a) === String(dentistId ?? '').trim() &&
        patientMatchesSearch(a)
    );

  const resolvePatientRecord = (a) => {
    if (a.patientId) return patients.find((p) => p.id === a.patientId) ?? null;
    const n = (a.patientName || '').trim().toLowerCase();
    if (!n) return null;
    return patients.find((p) => (p.name || '').trim().toLowerCase() === n) ?? null;
  };

  const getPatientDisplayName = (a) =>
    resolvePatientRecord(a)?.name || a.patientName || 'Пациент';

  const patientMatchesSearch = (a) => {
    if (!patientSearch.trim()) return true;
    const pr = resolvePatientRecord(a);
    const name = pr?.name || a.patientName || '';
    const phone = pr?.phone || '';
    const parentPhone = pr?.parentPhone || '';
    const notes = pr?.notes || '';
    const qTokens = patientSearch.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const haystack = `${name} ${phone} ${parentPhone} ${notes}`.toLowerCase();
    return qTokens.every((token) => haystack.includes(token));
  };

  const getAppointmentsForColumn = (dentistId) => {
    const did = String(dentistId ?? '').trim();
    const day = normalizeCalendarDateKey(dateStr);
    return appointments.filter(
      (a) =>
        columnDentistId(a) === did &&
        normalizeCalendarDateKey(a.date) === day &&
        patientMatchesSearch(a)
    );
  };

  const slotMinutes = SLOT_MINUTES ?? 15;
  const timeToOffset = (time) => {
    const [h, m] = time.split(':').map(Number);
    const totalM = (h - workingHours.start) * 60 + m;
    return (totalM / slotMinutes) * effectiveSlotHeight;
  };

  const [timeTick, setTimeTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTimeTick((x) => x + 1), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isToday = (currentDateKey ?? calendarDateKeyFromDate(currentDate)) === todayKey;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const rangeStart = workingHours.start * 60;
  const rangeEnd = workingHours.end * 60;
  const showNowLine = isToday && nowMinutes >= rangeStart && nowMinutes < rangeEnd;
  const nowLineTop = showNowLine
    ? ((nowMinutes - rangeStart) / slotMinutes) * effectiveSlotHeight
    : 0;

  const durationHeight = (start, end) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const minutes = (eh - sh) * 60 + (em - sm);
    return (minutes / slotMinutes) * effectiveSlotHeight;
  };

  let timelineMinHeightPx = slots.length * effectiveSlotHeight;
  const dentistIdsInView = dentists.map((d) => d.id);
  const dentistIdsInViewSet = new Set(dentistIdsInView);
  if (dentistIdsInView.length > 0) {
    for (const a of appointments) {
      const adate = normalizeCalendarDateKey(a.date);
      const dayOk =
        viewMode === 'week' ? weekDateKeys.some((k) => normalizeCalendarDateKey(k) === adate) : adate === normalizeCalendarDateKey(dateStr);
      if (!dayOk) continue;
      const apDid = columnDentistId(a);
      if (!apDid || !dentistIdsInViewSet.has(apDid)) continue;
      if (!patientMatchesSearch(a)) continue;
      const bottomPx = timeToOffset(a.start) + durationHeight(a.start, a.end);
      timelineMinHeightPx = Math.max(
        timelineMinHeightPx,
        bottomPx + Math.max(12, Math.min(effectiveSlotHeight * 0.45, 32))
      );
    }
  }

  const handleSlotClick = useCallback(
    (dentistId, slot, e, slotDateKey) => {
      if (ignoreNextSlotClickRef.current) {
        ignoreNextSlotClickRef.current = false;
        e?.preventDefault();
        e?.stopPropagation();
        return;
      }
      onSlotClick(dentistId, slot, slotDateKey ?? dateStr);
    },
    [onSlotClick, dateStr]
  );

  const handlePointerDown = useCallback((e, appointment, dentistColor) => {
    if (!canMoveAppointment) return;
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
  }, [canMoveAppointment]);

  const handleAppointmentClick = useCallback((e, appointment) => {
    e.stopPropagation();
    if (canMoveAppointment) return;
    if (onAppointmentClick) onAppointmentClick(appointment);
  }, [canMoveAppointment, onAppointmentClick]);

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
                          {getTypeDisplay(dragState.appointment.type)}
            </span>
          </div>,
          document.body
        )
      : null;

  const hoverTooltip = !isMobile && hoverInfo ? createPortal(
    <div
      className="fixed z-[9998] pointer-events-none px-2.5 py-2 rounded-lg border border-slate-200 bg-white shadow-xl text-xs text-slate-700 max-w-[260px]"
      style={{ left: hoverInfo.x + 10, top: hoverInfo.y + 12 }}
    >
      <div className="text-slate-500">Лекар: <span className="text-slate-700">{hoverInfo.dentist || '—'}</span></div>
      <div className="text-slate-500">Преглед: <span className="text-slate-700">{hoverInfo.type || '—'}</span></div>
      <div className="text-slate-500">Час: <span className="text-slate-700">{hoverInfo.time || '—'}</span></div>
      <div className="text-slate-500">Кабинет: <span className="text-slate-700">{hoverInfo.location || '—'}</span></div>
    </div>,
    document.body
  ) : null;

  if (viewMode === 'week') {
    const selectedInView = dentists.filter((d) => selectedDentistIds.includes(d.id));
    const singleSelectedDentistId = selectedInView.length === 1 ? selectedInView[0].id : null;
    const weekDentistIds = selectedInView.length > 0 ? selectedInView.map((d) => d.id) : dentists.map((d) => d.id);
    const primaryDentistId = singleSelectedDentistId;
    return (
      <>
        <div className="flex-1 flex flex-col min-w-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div ref={headerRowRef} className="flex border-b border-slate-200 bg-white sticky top-0 z-20 shrink-0 overflow-hidden">
            <div className="w-16 shrink-0 flex items-center justify-center border-r border-slate-200 py-3">
              <Clock className="w-4 h-4 text-slate-500" />
            </div>
            <div
              ref={headerScrollRef}
              className="flex-1 flex min-w-0 overflow-x-auto overflow-y-hidden scroll-thin overscroll-x-contain"
              style={{ scrollbarGutter: 'stable' }}
            >
              {weekDateKeys.map((dayKey) => {
                const d = new Date(`${dayKey}T12:00:00`);
                const label = d.toLocaleDateString('bg-BG', { weekday: 'short', day: 'numeric', month: 'short' });
                return (
                  <div
                    key={dayKey}
                    className="flex-1 min-w-[72px] sm:min-w-[100px] border-r border-slate-200 last:border-r-0 py-2 px-1 text-center"
                  >
                    <button
                      type="button"
                      className="w-full text-[11px] sm:text-xs font-semibold text-slate-900 leading-tight hover:text-emerald-700"
                      onClick={() => {
                        if (primaryDentistId && onOpenFreeSlotsForDate) onOpenFreeSlotsForDate(primaryDentistId, dayKey);
                      }}
                      title="Свободни часове за този ден"
                    >
                      {label}
                    </button>
                    {singleSelectedDentistId && (
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        {doctorDayLocations[`${singleSelectedDentistId}_${dayKey}`] || 'Дружба'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div
            ref={gridScrollRef}
            className="flex-1 overflow-auto scroll-thin min-h-0 touch-manipulation"
            style={{ WebkitOverflowScrolling: 'touch', scrollbarGutter: 'stable' }}
          >
            <div className="flex relative min-w-0" style={{ minHeight: timelineMinHeightPx }}>
              <div className="w-16 shrink-0 border-r border-slate-200 bg-white sticky left-0 z-[1]">
                {slots.map((slot) => (
                  <div
                    key={slot}
                    className="text-xs text-slate-500 text-right pr-2 flex items-center justify-end border-b border-slate-200"
                    style={{ height: effectiveSlotHeight }}
                  >
                    {slot}
                  </div>
                ))}
              </div>

              {weekDateKeys.map((dayKey) => {
                const vacation = singleSelectedDentistId ? isOnVacation(singleSelectedDentistId, dayKey) : false;
                const dayApps = appointments
                  .filter(
                    (a) =>
                      normalizeCalendarDateKey(a.date) === normalizeCalendarDateKey(dayKey) &&
                      weekDentistIds.includes(columnDentistId(a)) &&
                      patientMatchesSearch(a)
                  )
                  .map((x) => ({ ...x }));
                const laidOut = assignAppointmentLanes(dayApps);
                return (
                  <div
                    key={dayKey}
                    className={`flex-1 min-w-[72px] sm:min-w-[100px] relative border-r border-slate-200 last:border-r-0 ${
                      vacation ? 'bg-red-50' : 'bg-slate-50'
                    }`}
                  >
                    {slots.map((slot) => {
                      const available = singleSelectedDentistId ? isSlotAvailable(singleSelectedDentistId, slot, dayKey) : true;
                      const disabled = vacation || !singleSelectedDentistId || !available;
                      const isUnavailable = !vacation && !!singleSelectedDentistId && !available;
                      return (
                        <button
                          key={`${dayKey}-${slot}`}
                          type="button"
                          data-slot={slot}
                          data-dentist-id={singleSelectedDentistId}
                          data-day={dayKey}
                          onClick={(e) => {
                            if (disabled || !singleSelectedDentistId) return;
                            handleSlotClick(singleSelectedDentistId, slot, e, dayKey);
                          }}
                          className={`absolute left-0.5 right-0.5 rounded border border-transparent transition-colors ${
                            vacation
                              ? 'cursor-not-allowed opacity-50'
                              : isUnavailable
                                ? 'bg-rose-100 border-rose-300/70 cursor-not-allowed'
                                : 'hover:bg-emerald-500/20 hover:ring-1 hover:ring-emerald-400/50 hover:border-emerald-400/30'
                          }`}
                          style={{
                            top: timeToOffset(slot),
                            height: Math.max(effectiveSlotHeight - 2, 38),
                          }}
                        />
                      );
                    })}

                    {laidOut.map((a) => {
                      const dent = dentists.find((dent) => dent.id === columnDentistId(a)) || dentistsToShow[0];
                      const col = dent?.color || '#64748b';
                      const top = timeToOffset(a.start);
                      const rawH = durationHeight(a.start, a.end);
                      const h = Math.max(rawH, 38);
                      const lane = a._lane ?? 0;
                      const laneCount = a._laneCount || 1;
                      const wPct = 100 / laneCount;
                      const leftPct = lane * wPct;
                      const isNoShow = a.attendance === 'no_show';
                      const isNhif = a.insurance === 'nhif';
                      const hasNotes = Boolean(a.notes?.trim());
                      const locationLabel = a.location || null;
                      const prWeek = resolvePatientRecord(a);
                      const showBlacklist = Boolean(prWeek?.isBlacklisted);
                      const showUnreliable = Boolean(prWeek?.unreliablePatient);
                      return (
                        <div
                          key={a.id}
                          onMouseEnter={(e) => {
                            if (isMobile) return;
                            const dn = dentists.find((x) => x.id === columnDentistId(a))?.name || '—';
                            setHoverInfo({
                              x: e.clientX,
                              y: e.clientY,
                              dentist: dn,
                              type: getTypeDisplay(a.type),
                              time: `${a.start}${a.end ? ` - ${a.end}` : ''}`,
                              location: a.location || '',
                            });
                          }}
                          onPointerEnter={(e) => {
                            if (isMobile) return;
                            const dn = dentists.find((x) => x.id === columnDentistId(a))?.name || '—';
                            setHoverInfo({
                              x: e.clientX,
                              y: e.clientY,
                              dentist: dn,
                              type: getTypeDisplay(a.type),
                              time: `${a.start}${a.end ? ` - ${a.end}` : ''}`,
                              location: a.location || '',
                            });
                          }}
                          onMouseMove={(e) => {
                            if (isMobile) return;
                            setHoverInfo((h) => (h ? { ...h, x: e.clientX, y: e.clientY } : h));
                          }}
                          onPointerMove={(e) => {
                            if (isMobile) return;
                            setHoverInfo((h) => (h ? { ...h, x: e.clientX, y: e.clientY } : h));
                          }}
                          onPointerOver={(e) => {
                            if (isMobile) return;
                            const dn = dentists.find((x) => x.id === columnDentistId(a))?.name || '—';
                            setHoverInfo({
                              x: e.clientX,
                              y: e.clientY,
                              dentist: dn,
                              type: getTypeDisplay(a.type),
                              time: `${a.start}${a.end ? ` - ${a.end}` : ''}`,
                              location: a.location || '',
                            });
                          }}
                          onMouseLeave={() => { if (!isMobile) setHoverInfo(null); }}
                          onPointerLeave={() => { if (!isMobile) setHoverInfo(null); }}
                          onClick={(e) => handleAppointmentClick(e, a)}
                          onContextMenu={(e) => e.preventDefault()}
                          className="absolute z-[2] rounded-lg shadow-lg border border-white/20 overflow-hidden flex flex-col justify-center px-1 py-0.5 ring-1 ring-black/20"
                          style={{
                            top,
                            height: h - 2,
                            left: `calc(${leftPct}% + 1px)`,
                            width: `calc(${wPct}% - 2px)`,
                            backgroundColor: isNoShow ? '#b91c1c' : col,
                            color: '#fff',
                            cursor: 'pointer',
                          }}
                        >
                          <div className="flex items-start justify-between gap-0.5 min-w-0">
                            <span className="text-[10px] sm:text-xs font-medium truncate drop-shadow-sm leading-tight">
                              {getPatientDisplayName(a)}
                            </span>
                            {hasNotes && (
                              <StickyNote className="w-3 h-3 shrink-0 opacity-95" aria-hidden title="Има бележка за часа" />
                            )}
                          </div>
                          <span className="text-[9px] opacity-95 truncate drop-shadow-sm leading-tight">
                            {getTypeDisplay(a.type)}
                          </span>
                          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                            {locationLabel && (
                              <span className="text-[8px] font-semibold px-1 py-0.5 rounded bg-white/85 text-slate-900 tracking-wide">
                                {locationLabel}
                              </span>
                            )}
                            {isNhif && (
                              <span className="text-[8px] font-semibold px-1 py-0.5 rounded bg-emerald-500 text-slate-900 tracking-wide">
                                НЗОК
                              </span>
                            )}
                            {showBlacklist && (
                              <span className="text-[8px] font-semibold px-1 py-0.5 rounded bg-slate-900 text-white tracking-wide">ЧС</span>
                            )}
                            {showUnreliable && (
                              <span className="text-[8px] font-semibold px-1 py-0.5 rounded bg-amber-200 text-amber-900 tracking-wide">НЕРЕДОВЕН</span>
                            )}
                            {isNoShow && (
                              <span className="text-[8px] font-semibold uppercase tracking-wide drop-shadow-sm">НЕ СЕ ЯВИ</span>
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
        {hoverTooltip}
      </>
    );
  }

  return (
    <>
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isMobile && listForMobile.length > 0 && (
          <div ref={mobileDentistsRef} className="relative px-3 py-2 border-b border-slate-200 bg-slate-100/80 flex flex-col gap-2">
            {onDentistToggle ? (
              <>
                <button
                  type="button"
                  onClick={() => setMobileDentistsOpen((v) => !v)}
                  className="w-full flex items-center justify-between gap-2 py-2.5 pl-3 pr-3 bg-slate-100 border border-slate-300 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none"
                >
                  <span className="flex items-center gap-2 truncate">
                    <Stethoscope className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-slate-600">Лекари</span>
                    <span className="text-slate-900 font-medium">
                      ({selectedDentistIds.length} избрани)
                    </span>
                  </span>
                  <ChevronDown className={`w-4 h-4 shrink-0 text-slate-500 transition-transform ${mobileDentistsOpen ? 'rotate-180' : ''}`} />
                </button>
                {dentists.length > 1 && (
                  <div className="shrink-0">
                    <label className="text-xs text-slate-500 block mb-1">Преглед на графика:</label>
                    <select
                      value={focusedDentistId ?? dentists[0]?.id ?? ''}
                      onChange={(e) => setFocusedDentistId(e.target.value)}
                      className="w-full py-2 pl-3 pr-8 bg-slate-100 border border-slate-300 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500/40 outline-none appearance-none bg-no-repeat bg-[length:1rem] bg-[right_0.5rem_center]"
                      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")" }}
                    >
                      {dentists.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {mobileDentistsOpen && (
                  <div className="absolute left-3 right-3 top-full mt-1 z-50 rounded-lg border border-slate-300 bg-white shadow-xl overflow-hidden flex flex-col max-h-[min(70vh,360px)]">
                    <div className="p-2 border-b border-slate-200 flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const allSel = listForMobile.every((d) => selectedDentistIds.includes(d.id));
                          listForMobile.forEach((d) => {
                            if (allSel && selectedDentistIds.includes(d.id)) onDentistToggle(d.id);
                            if (!allSel && !selectedDentistIds.includes(d.id)) onDentistToggle(d.id);
                          });
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border bg-slate-100 text-slate-800 border-slate-300 hover:border-emerald-500 hover:text-emerald-700"
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
                              selected ? 'bg-slate-100 text-slate-900 border-emerald-500' : 'bg-slate-100 text-slate-800 border-slate-300'
                            }`}
                          >
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                            <span className="flex-1 truncate">{d.name}</span>
                            {selected && <span className="text-xs text-emerald-600 font-medium">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-600 shrink-0">Лекар:</label>
                <select
                  value={focusedDentistId ?? dentists[0]?.id ?? ''}
                  onChange={(e) => setFocusedDentistId(e.target.value)}
                  className="flex-1 min-w-0 py-2 pl-3 pr-8 bg-slate-100 border border-slate-300 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
                >
                  {dentists.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
        <div ref={headerRowRef} className="flex border-b border-slate-200 bg-white sticky top-0 z-20 shrink-0 overflow-hidden">
          <div className="w-16 shrink-0 flex items-center justify-center border-r border-slate-200 py-3">
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <div ref={headerScrollRef} className="flex-1 flex min-w-0 overflow-x-auto overflow-y-hidden scroll-thin overscroll-x-contain" style={{ scrollbarGutter: 'stable' }}>
          {dentistsToShow.map((d) => (
            <div
              key={d.id}
              className="flex-1 min-w-[140px] sm:min-w-[160px] border-r border-slate-200 last:border-r-0 py-2 sm:py-3 px-2 sm:px-3 text-center"
            >
              {onDentistNameClick && canManageVacation ? (
                <button
                  type="button"
                  onClick={() => onDentistNameClick(d)}
                  className="w-full font-semibold text-slate-900 truncate hover:text-emerald-700 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded px-1"
                  title="Профил на лекар"
                >
                  {d.name}
                </button>
              ) : (
                <div className="font-semibold text-slate-900 truncate" title={d.name}>
                  {d.name}
                </div>
              )}
            </div>
          ))}
          </div>
        </div>

        <div
          ref={gridScrollRef}
          className="flex-1 overflow-auto scroll-thin min-h-0 touch-manipulation"
          style={{ WebkitOverflowScrolling: 'touch', scrollbarGutter: 'stable' }}
          onTouchStart={(e) => {
            if (e.touches.length === 2) {
              const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
              lastPinchDist.current = d;
            }
          }}
          onTouchMove={(e) => {
            if (e.touches.length === 2 && lastPinchDist.current != null) {
              const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
              const delta = d / lastPinchDist.current;
              lastPinchDist.current = d;
              setZoom((z) => Math.max(0.6, Math.min(1.8, z * delta)));
            }
          }}
          onTouchEnd={(e) => {
            if (e.touches.length < 2) lastPinchDist.current = null;
          }}
          onTouchCancel={() => { lastPinchDist.current = null; }}
        >
          <div className="flex relative min-w-0" style={{ minHeight: timelineMinHeightPx }}>
            {showNowLine && (
              <div
                className="absolute left-0 right-0 h-0.5 bg-emerald-400 z-10 pointer-events-none"
                style={{ top: nowLineTop }}
                aria-hidden
              />
            )}
            <div className="w-16 shrink-0 border-r border-slate-200 bg-white sticky left-0 z-[1]">
              {slots.map((slot) => (
                <div
                  key={slot}
                  className="text-xs text-slate-500 text-right pr-2 flex items-center justify-end border-b border-slate-200"
                  style={{ height: effectiveSlotHeight }}
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
                  className={`flex-1 min-w-[140px] sm:min-w-[160px] relative border-r border-slate-200 last:border-r-0 ${
                    vacation ? 'bg-red-50' : 'bg-slate-50'
                  }`}
                >
                  {slots.map((slot) => {
                    const available = isSlotAvailable(d.id, slot);
                    const disabled = vacation || !available;
                    const isUnavailable = !vacation && !available;
                    return (
                    <button
                      key={slot}
                      type="button"
                      data-slot={slot}
                      data-dentist-id={d.id}
                      onClick={(e) => {
                        if (disabled) return;
                        handleSlotClick(d.id, slot, e, dateStr);
                      }}
                      className={`absolute left-0.5 right-0.5 rounded border border-transparent transition-colors ${
                        vacation
                          ? 'cursor-not-allowed opacity-50'
                          : isUnavailable
                            ? 'bg-rose-100 border-rose-300/70 cursor-not-allowed'
                            : 'hover:bg-emerald-500/20 hover:ring-1 hover:ring-emerald-400/50 hover:border-emerald-400/30'
                      }`}
                      style={{
                        top: timeToOffset(slot),
                        height: Math.max(effectiveSlotHeight - 2, 38),
                      }}
                    />
                  );})}

                  {getAppointmentsForColumn(d.id).map((a) => {
                    const top = timeToOffset(a.start);
                    const rawH = durationHeight(a.start, a.end);
                    const h = Math.max(rawH, 38);
                    const isDragging = dragState?.appointment?.id === a.id && dragState?.hasMoved;
                    const isNoShow = a.attendance === 'no_show';
                    const isNhif = a.insurance === 'nhif';
                    const hasNotes = Boolean(a.notes?.trim());
                    const locationLabel = a.location || null;
                    const prDay = resolvePatientRecord(a);
                    const showBlacklistDay = Boolean(prDay?.isBlacklisted);
                    const showUnreliableDay = Boolean(prDay?.unreliablePatient);
                    return (
                      <div
                        key={a.id}
                        onMouseEnter={(e) => {
                          if (isMobile) return;
                          setHoverInfo({
                            x: e.clientX,
                            y: e.clientY,
                            dentist: d.name || '—',
                            type: getTypeDisplay(a.type),
                            time: `${a.start}${a.end ? ` - ${a.end}` : ''}`,
                            location: a.location || '',
                          });
                        }}
                        onPointerEnter={(e) => {
                          if (isMobile) return;
                          setHoverInfo({
                            x: e.clientX,
                            y: e.clientY,
                            dentist: d.name || '—',
                            type: getTypeDisplay(a.type),
                            time: `${a.start}${a.end ? ` - ${a.end}` : ''}`,
                            location: a.location || '',
                          });
                        }}
                        onMouseMove={(e) => {
                          if (isMobile) return;
                          setHoverInfo((h) => (h ? { ...h, x: e.clientX, y: e.clientY } : h));
                        }}
                        onPointerMove={(e) => {
                          if (isMobile) return;
                          setHoverInfo((h) => (h ? { ...h, x: e.clientX, y: e.clientY } : h));
                        }}
                        onPointerOver={(e) => {
                          if (isMobile) return;
                          setHoverInfo({
                            x: e.clientX,
                            y: e.clientY,
                            dentist: d.name || '—',
                            type: getTypeDisplay(a.type),
                            time: `${a.start}${a.end ? ` - ${a.end}` : ''}`,
                            location: a.location || '',
                          });
                        }}
                        onMouseLeave={() => { if (!isMobile) setHoverInfo(null); }}
                        onPointerLeave={() => { if (!isMobile) setHoverInfo(null); }}
                        onPointerDown={canMoveAppointment ? (e) => handlePointerDown(e, a, d.color) : undefined}
                        onClick={!canMoveAppointment ? (e) => handleAppointmentClick(e, a) : undefined}
                        onContextMenu={(e) => e.preventDefault()}
                        className={`absolute left-1 right-1 rounded-lg shadow-lg border border-white/20 overflow-hidden flex flex-col justify-center px-2 py-1 ring-1 ring-black/20 transition-opacity duration-150 ${
                          canMoveAppointment ? 'touch-none select-none' : ''
                        } ${isDragging ? 'opacity-40 pointer-events-none' : ''} ${isNoShow ? 'ring-red-400/70' : ''}`}
                        style={{
                          top,
                          height: h - 2,
                          backgroundColor: isNoShow ? '#b91c1c' : d.color, // червено за „не се яви“
                          color: '#fff',
                          cursor: canMoveAppointment ? (dragState?.appointment?.id === a.id ? 'grabbing' : 'grab') : 'pointer',
                        }}
                      >
                        <div className="flex items-start justify-between gap-1 min-w-0">
                          <span className="text-xs font-medium truncate drop-shadow-sm">
                            {getPatientDisplayName(a)}
                          </span>
                          {hasNotes && (
                            <StickyNote className="w-3.5 h-3.5 shrink-0 opacity-95" aria-hidden title="Има бележка за часа" />
                          )}
                        </div>
                        <span className="text-[10px] opacity-95 truncate drop-shadow-sm">
                          {getTypeDisplay(a.type)}
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                          {locationLabel && (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-white/85 text-slate-900 tracking-wide">
                              {locationLabel}
                            </span>
                          )}
                          {isNhif && (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500 text-slate-900 tracking-wide">
                              НЗОК
                            </span>
                          )}
                          {showBlacklistDay && (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-900 text-white tracking-wide">ЧС</span>
                          )}
                          {showUnreliableDay && (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 tracking-wide">НЕРЕДОВЕН</span>
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
      {hoverTooltip}
    </>
  );
}
