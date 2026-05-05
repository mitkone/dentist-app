import { useState, useEffect, useCallback } from 'react';
import { X, Bug, Send, CheckCircle, Clock, MessageSquare, Inbox, ChevronDown, ChevronUp } from 'lucide-react';

const CATEGORIES = [
  { value: 'bug', label: 'Грешка / бъг' },
  { value: 'feature', label: 'Предложение' },
  { value: 'question', label: 'Въпрос' },
  { value: 'other', label: 'Друго' },
];

const STATUS_MAP = {
  open: { label: 'Отворен', color: 'bg-amber-100 text-amber-700' },
  in_progress: { label: 'В процес', color: 'bg-blue-100 text-blue-700' },
  resolved: { label: 'Решен', color: 'bg-emerald-100 text-emerald-700' },
  closed: { label: 'Затворен', color: 'bg-slate-100 text-slate-600' },
};

const CAT_MAP = {
  bug: { label: 'Грешка', color: 'bg-red-100 text-red-700' },
  feature: { label: 'Предложение', color: 'bg-blue-100 text-blue-700' },
  question: { label: 'Въпрос', color: 'bg-purple-100 text-purple-700' },
  other: { label: 'Друго', color: 'bg-slate-100 text-slate-600' },
};

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('bg-BG', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function FeedbackPage({
  open,
  onClose,
  supabase,
  fromLabel,
  fromDentistId,
  isAdmin = false,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);

  // Submit form state
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('bug');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState('');

  // Admin reply state
  const [replyText, setReplyText] = useState('');
  const [replyingId, setReplyingId] = useState(null);

  const loadItems = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const q = supabase.from('feedback').select('*').order('created_at', { ascending: false });
    if (!isAdmin) q.eq('from_dentist_id', fromDentistId ?? '__anon__');
    const { data } = await q;
    setItems(data || []);
    setLoading(false);
  }, [supabase, isAdmin, fromDentistId]);

  useEffect(() => {
    if (open) loadItems();
  }, [open, loadItems]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!body.trim() || !supabase) return;
    setSending(true);
    setSendError('');
    const { error } = await supabase.from('feedback').insert({
      from_label: fromLabel || 'Потребител',
      from_dentist_id: fromDentistId ?? null,
      body: body.trim(),
      category,
    });
    setSending(false);
    if (error) { setSendError('Неуспешно изпращане. Опитайте пак.'); return; }
    setBody('');
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    loadItems();
  };

  const handleReply = async (item) => {
    if (!replyText.trim() || !supabase) return;
    const { error } = await supabase.from('feedback')
      .update({ admin_reply: replyText.trim(), replied_at: new Date().toISOString(), status: 'resolved' })
      .eq('id', item.id);
    if (!error) {
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, admin_reply: replyText.trim(), replied_at: new Date().toISOString(), status: 'resolved' } : i));
      setReplyText('');
      setReplyingId(null);
    }
  };

  const changeStatus = async (id, status) => {
    if (!supabase) return;
    const { error } = await supabase.from('feedback').update({ status }).eq('id', id);
    if (!error) setItems((prev) => prev.map((i) => i.id === id ? { ...i, status } : i));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[290] bg-white flex flex-col">
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-slate-200 shrink-0 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Bug className="w-5 h-5 text-rose-500" />
          <h1 className="text-base font-bold text-slate-900">
            {isAdmin ? 'Сигнали от потребители' : 'Сигнали и предложения'}
          </h1>
        </div>
        <button type="button" onClick={onClose} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Submit form (always visible for non-admin, also visible for admin at top) */}
        {!isAdmin && (
          <div className="p-6 border-b border-slate-200 bg-slate-50">
            <h2 className="text-sm font-bold text-slate-900 mb-3">Изпрати сигнал до администратора</h2>
            {sent ? (
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm font-medium">
                <CheckCircle className="w-4 h-4 shrink-0" /> Сигналът е изпратен! Благодарим ти.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIES.map((c) => (
                    <button key={c.value} type="button"
                      onClick={() => setCategory(c.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                        ${category === c.value ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'}`}>
                      {c.label}
                    </button>
                  ))}
                </div>
                <textarea value={body} onChange={(e) => setBody(e.target.value)}
                  placeholder="Опиши проблема или предложението…"
                  rows={4}
                  className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-xl resize-none outline-none focus:ring-2 focus:ring-rose-500/30" />
                {sendError && <p className="text-xs text-red-500">{sendError}</p>}
                <button type="submit" disabled={!body.trim() || sending}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-500 disabled:opacity-50">
                  <Send className="w-4 h-4" />
                  {sending ? 'Изпращане…' : 'Изпрати'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* List of reports */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Inbox className="w-4 h-4 text-slate-400" />
              {isAdmin ? `Всички сигнали (${items.length})` : 'Мои сигнали'}
            </h2>
            <button type="button" onClick={loadItems} disabled={loading}
              className="text-xs text-slate-500 hover:text-slate-800 disabled:opacity-50">
              {loading ? 'Зареждане…' : 'Обнови'}
            </button>
          </div>

          {items.length === 0 && !loading && (
            <div className="py-12 text-center text-slate-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Няма сигнали.</p>
            </div>
          )}

          {items.map((item) => {
            const statusInfo = STATUS_MAP[item.status] || STATUS_MAP.open;
            const catInfo = CAT_MAP[item.category] || CAT_MAP.other;
            const isOpen = expanded === item.id;
            return (
              <div key={item.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <button type="button" className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-50"
                  onClick={() => setExpanded(isOpen ? null : item.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${catInfo.color}`}>{catInfo.label}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusInfo.color}`}>{statusInfo.label}</span>
                      {isAdmin && item.from_label && (
                        <span className="text-[10px] text-slate-400">от {item.from_label}</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-800 line-clamp-2">{item.body}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{fmtDate(item.created_at)}</p>
                  </div>
                  <div className="shrink-0 mt-0.5 text-slate-400">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 space-y-3">
                    <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">{item.body}</p>

                    {item.admin_reply && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                        <p className="text-[11px] font-semibold text-emerald-700 mb-1">Отговор от администратора:</p>
                        <p className="text-sm text-slate-800 whitespace-pre-wrap">{item.admin_reply}</p>
                        <p className="text-[11px] text-slate-400 mt-1">{fmtDate(item.replied_at)}</p>
                      </div>
                    )}

                    {/* Admin controls */}
                    {isAdmin && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-slate-600 font-medium">Статус:</span>
                          {['open', 'in_progress', 'resolved', 'closed'].map((s) => (
                            <button key={s} type="button"
                              onClick={() => changeStatus(item.id, s)}
                              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors
                                ${item.status === s ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-500'}`}>
                              {STATUS_MAP[s].label}
                            </button>
                          ))}
                        </div>
                        {replyingId === item.id ? (
                          <div className="space-y-2">
                            <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Напиши отговор…" rows={3}
                              className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-xl resize-none outline-none focus:ring-2 focus:ring-emerald-500/30" />
                            <div className="flex gap-2">
                              <button type="button" onClick={() => handleReply(item)}
                                disabled={!replyText.trim()}
                                className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-50">
                                Изпрати отговор
                              </button>
                              <button type="button" onClick={() => { setReplyingId(null); setReplyText(''); }}
                                className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">
                                Откажи
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button type="button" onClick={() => { setReplyingId(item.id); setReplyText(item.admin_reply || ''); }}
                            className="text-xs text-slate-600 bg-slate-100 rounded-lg px-3 py-1.5 hover:bg-slate-200">
                            {item.admin_reply ? 'Редактирай отговор' : 'Отговори'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
