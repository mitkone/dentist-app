import { useMemo, useState, useEffect, useCallback } from 'react';
import { Send } from 'lucide-react';
import { groupMessagesByThread, threadDoctorId, threadPreview, threadLastAt } from '../lib/doctorMessaging';

function fmtShort(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('bg-BG', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function MessagingChatPanel({
  messages = [],
  perspective,
  myDentistId,
  dentists = [],
  onSendReply,
  onMarkThreadRead,
  replyPlaceholder = 'Отговор…',
  /** По-малък max-height когато панелът е над „Промени в графика“. */
  embedded = false,
}) {
  const byThread = useMemo(() => groupMessagesByThread(messages), [messages]);
  const threadIds = useMemo(() => {
    const ids = [...byThread.keys()];
    ids.sort((a, b) => threadLastAt(byThread.get(b)) - threadLastAt(byThread.get(a)));
    return ids;
  }, [byThread]);

  const [selectedThreadId, setSelectedThreadId] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (threadIds.length === 0) {
      setSelectedThreadId('');
      return;
    }
    setSelectedThreadId((cur) => (cur && threadIds.includes(cur) ? cur : threadIds[0]));
  }, [threadIds]);

  useEffect(() => {
    if (selectedThreadId && onMarkThreadRead) void onMarkThreadRead(selectedThreadId);
  }, [selectedThreadId, onMarkThreadRead]);

  const currentMsgs = selectedThreadId ? byThread.get(selectedThreadId) || [] : [];

  const doctorMeta = useCallback(
    (dentistId) => dentists.find((d) => String(d.id) === String(dentistId)),
    [dentists]
  );

  const threadTitle = useCallback(
    (tid) => {
      const msgs = byThread.get(tid);
      const did = threadDoctorId(msgs);
      const name = did ? doctorMeta(did)?.name || did : '—';
      return perspective === 'dentist' ? `Чат с регистратурата` : name;
    },
    [byThread, doctorMeta, perspective]
  );

  const bubbleSide = (m) => {
    if (perspective === 'dentist') {
      const mine = m.from_dentist_id && String(m.from_dentist_id) === String(myDentistId);
      return mine ? 'right' : 'left';
    }
    const fromDoc = Boolean(m.from_dentist_id);
    return fromDoc ? 'left' : 'right';
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !selectedThreadId || !onSendReply) return;
    setSending(true);
    try {
      await onSendReply({ threadId: selectedThreadId, body: text });
      setDraft('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className={`flex flex-col min-h-[10rem] bg-slate-50 ${
        embedded
          ? 'max-h-[min(42vh,19rem)] sm:max-h-[min(46vh,21rem)]'
          : 'max-h-[min(70vh,28rem)] sm:max-h-[min(75vh,34rem)]'
      }`}
    >
      <div className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shrink-0">
        <p className="text-[11px] font-bold uppercase tracking-wide opacity-95">Вътрешен чат</p>
        <p className="text-xs opacity-90">
          {perspective === 'dentist' ? 'Регистратура и колеги' : 'Лекари в клиниката'}
        </p>
      </div>

      {threadIds.length === 0 ? (
        <p className="p-4 text-sm text-slate-600">Няма разговори.</p>
      ) : (
        <>
          <div className="px-2 py-2 border-b border-slate-200 bg-white shrink-0">
            <label htmlFor="dm-thread" className="sr-only">
              Избор на разговор
            </label>
            <select
              id="dm-thread"
              value={selectedThreadId}
              onChange={(e) => setSelectedThreadId(e.target.value)}
              className="w-full text-sm px-2 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-medium"
            >
              {threadIds.map((tid) => (
                <option key={tid} value={tid}>
                  {perspective === 'staff' ? `${threadTitle(tid)} · ` : ''}
                  {threadPreview(byThread.get(tid)).slice(0, 48)}
                  {threadPreview(byThread.get(tid)).length > 48 ? '…' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-3 space-y-3 scroll-thin bg-slate-100/90">
            {currentMsgs.map((m) => {
              const side = bubbleSide(m);
              const isRight = side === 'right';
              const label = m.from_dentist_id
                ? doctorMeta(m.from_dentist_id)?.name || `Лекар ${m.from_dentist_id}`
                : m.from_label || 'Регистратура';
              return (
                <div key={m.id} className={`flex ${isRight ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[90%] rounded-2xl px-3 py-2 shadow-sm text-sm ${
                      isRight
                        ? 'bg-emerald-600 text-white rounded-br-md'
                        : 'bg-white text-slate-900 border border-slate-200 rounded-bl-md'
                    }`}
                  >
                    <div
                      className={`text-[10px] font-semibold mb-0.5 ${isRight ? 'text-emerald-100' : 'text-slate-500'}`}
                    >
                      {label} · {fmtShort(m.created_at)}
                    </div>
                    <p className="whitespace-pre-wrap leading-snug">{m.body}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-2 border-t border-slate-200 bg-white shrink-0 space-y-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              placeholder={replyPlaceholder}
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-emerald-500/30 outline-none resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
            />
            <button
              type="button"
              disabled={sending || !draft.trim()}
              onClick={() => void handleSend()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-45"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Изпращане…' : 'Изпрати'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
