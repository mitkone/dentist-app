import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { X, Send, Plus, ArrowLeft, MessageCircle, Search, Trash2, Pencil, MoreVertical, Check } from 'lucide-react';
import { groupMessagesByThread, threadLastAt, getThreadInfo, STAFF_DM_INBOX_DENTIST_ID } from '../lib/doctorMessaging';

function fmtTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Вчера';
  if (diffDays < 7) return d.toLocaleDateString('bg-BG', { weekday: 'short' });
  return d.toLocaleDateString('bg-BG', { day: '2-digit', month: 'short' });
}

function fmtFull(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('bg-BG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function getUnreadCount(msgs, perspective, myDentistId) {
  if (perspective === 'dentist') {
    return (msgs || []).filter((m) => m.to_dentist_id === myDentistId && !m.read_at).length;
  }
  return (msgs || []).filter((m) => m.to_dentist_id === STAFF_DM_INBOX_DENTIST_ID && m.from_dentist_id && !m.read_at).length;
}

function bubbleSide(m, perspective, myDentistId) {
  if (perspective === 'dentist') {
    return m.from_dentist_id && String(m.from_dentist_id) === String(myDentistId) ? 'right' : 'left';
  }
  return m.from_dentist_id ? 'left' : 'right';
}

function senderLabel(m, dentists) {
  if (m.from_dentist_id) {
    const doc = dentists.find((d) => String(d.id) === String(m.from_dentist_id));
    return doc?.name || m.from_label || 'Лекар';
  }
  return m.from_label || 'Регистратура';
}

/** Determines if the current user is the author of a message */
function isMine(m, perspective, myDentistId, isAdmin) {
  if (perspective === 'dentist') return m.from_dentist_id && String(m.from_dentist_id) === String(myDentistId);
  if (isAdmin) return !m.from_dentist_id && m.from_label === 'Админ';
  return !m.from_dentist_id && m.from_label !== 'Админ';
}

function Avatar({ name, type, size = 'md' }) {
  const sizeClass = size === 'sm' ? 'w-7 h-7 text-xs' : size === 'lg' ? 'w-10 h-10 text-sm' : 'w-9 h-9 text-sm';
  const colorClass = type === 'staff' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700';
  return (
    <div className={`${sizeClass} ${colorClass} rounded-full flex items-center justify-center font-bold shrink-0`}>
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

/** Small floating context menu */
function MsgContextMenu({ x, y, onEdit, onDelete, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('touchstart', handler); };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-[400] bg-white border border-slate-200 rounded-xl shadow-xl py-1 min-w-[140px]"
      style={{ left: x, top: y }}
    >
      {onEdit && (
        <button
          type="button"
          onClick={() => { onEdit(); onClose(); }}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          <Pencil className="w-3.5 h-3.5 text-slate-400" />
          Редактирай
        </button>
      )}
      <button
        type="button"
        onClick={() => { onDelete(); onClose(); }}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Изтрий
      </button>
    </div>
  );
}

export default function ChatPage({
  open,
  onClose,
  messages = [],
  perspective,
  myDentistId,
  dentists = [],
  isAdmin = false,
  onSendReply,
  onStartConversation,
  onMarkThreadRead,
  onDeleteMessage,
  onEditMessage,
  onDeleteThread,
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
  const [sendError, setSendError] = useState('');
  const [showMobileList, setShowMobileList] = useState(true);
  const [showNewConv, setShowNewConv] = useState(false);
  const [newRecipient, setNewRecipient] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newSending, setNewSending] = useState(false);
  const [newError, setNewError] = useState('');
  const [search, setSearch] = useState('');

  // Context menu state
  const [ctxMenu, setCtxMenu] = useState(null); // { messageId, x, y }
  const longPressTimer = useRef(null);

  // Inline editing state
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editDraft, setEditDraft] = useState('');

  const messagesEndRef = useRef(null);
  const draftRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    if (threadIds.length === 0) { setSelectedThreadId(''); return; }
    setSelectedThreadId((cur) => (cur && threadIds.includes(cur) ? cur : threadIds[0]));
  }, [threadIds, open]);

  useEffect(() => {
    if (selectedThreadId && onMarkThreadRead) void onMarkThreadRead(selectedThreadId);
  }, [selectedThreadId, onMarkThreadRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedThreadId, messages.length]);

  const currentMsgs = selectedThreadId ? (byThread.get(selectedThreadId) || []) : [];

  const handleSelectThread = (tid) => {
    setSelectedThreadId(tid);
    setShowMobileList(false);
    setDraft('');
    setSendError('');
    setEditingMsgId(null);
    setTimeout(() => draftRef.current?.focus(), 100);
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !selectedThreadId || !onSendReply) return;
    setSending(true);
    setSendError('');
    try {
      await onSendReply({ threadId: selectedThreadId, body: text });
      setDraft('');
    } catch (err) {
      setSendError(err?.message || 'Грешка при изпращане');
    } finally {
      setSending(false);
    }
  };

  const handleStartConversation = async () => {
    const text = newBody.trim();
    if (!newRecipient) { setNewError('Изберете получател.'); return; }
    if (!text) { setNewError('Въведете съобщение.'); return; }
    setNewSending(true);
    setNewError('');
    try {
      await onStartConversation({ toDentistId: newRecipient, body: text });
      setShowNewConv(false);
      setNewBody('');
      setNewRecipient('');
    } catch (err) {
      setNewError(err?.message || 'Грешка при изпращане');
    } finally {
      setNewSending(false);
    }
  };

  const cancelNewConv = () => { setShowNewConv(false); setNewBody(''); setNewRecipient(''); setNewError(''); };

  // Context menu helpers
  const openCtxMenu = useCallback((messageId, e) => {
    e.preventDefault();
    const x = Math.min(e.clientX ?? e.touches?.[0]?.clientX ?? 0, window.innerWidth - 160);
    const y = Math.min(e.clientY ?? e.touches?.[0]?.clientY ?? 0, window.innerHeight - 100);
    setCtxMenu({ messageId, x, y });
  }, []);

  const startLongPress = useCallback((messageId, e) => {
    longPressTimer.current = setTimeout(() => {
      const touch = e.touches?.[0];
      if (touch) openCtxMenu(messageId, { clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => {} });
    }, 500);
  }, [openCtxMenu]);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  }, []);

  const handleDeleteMsg = async (msgId) => {
    if (!window.confirm('Изтриване на това съобщение?')) return;
    await onDeleteMessage?.(msgId);
  };

  const handleStartEdit = (m) => {
    setEditingMsgId(m.id);
    setEditDraft(m.body || '');
  };

  const handleSaveEdit = async (msgId) => {
    if (!editDraft.trim()) return;
    await onEditMessage?.(msgId, editDraft);
    setEditingMsgId(null);
    setEditDraft('');
  };

  const handleDeleteThread = async (tid) => {
    if (!window.confirm('Изтриване на целия разговор и всички съобщения в него?')) return;
    if (tid === selectedThreadId) { setSelectedThreadId(''); setShowMobileList(true); }
    await onDeleteThread?.(tid);
  };

  if (!open) return null;

  const threadInfo = selectedThreadId
    ? getThreadInfo(byThread.get(selectedThreadId) || [], perspective, myDentistId, dentists)
    : null;

  const recipientOptions = [];
  if (perspective === 'dentist') {
    recipientOptions.push({ value: STAFF_DM_INBOX_DENTIST_ID, label: 'Регистратура / Персонал' });
    dentists.forEach((d) => { if (String(d.id) !== String(myDentistId)) recipientOptions.push({ value: d.id, label: d.name }); });
  } else {
    dentists.forEach((d) => recipientOptions.push({ value: d.id, label: d.name }));
  }

  const filteredThreadIds = search.trim()
    ? threadIds.filter((tid) => {
        const info = getThreadInfo(byThread.get(tid) || [], perspective, myDentistId, dentists);
        const lastBody = (byThread.get(tid) || []).slice(-1)[0]?.body || '';
        const q = search.toLowerCase();
        return info.title.toLowerCase().includes(q) || lastBody.toLowerCase().includes(q);
      })
    : threadIds;

  return (
    <div className="fixed inset-0 z-[300] bg-white flex flex-col">
      {/* Context menu */}
      {ctxMenu && (() => {
        const msg = messages.find((m) => m.id === ctxMenu.messageId);
        const mine = msg && isMine(msg, perspective, myDentistId, isAdmin);
        const canDelete = mine || isAdmin;
        return (
          <MsgContextMenu
            x={ctxMenu.x}
            y={ctxMenu.y}
            onEdit={mine ? () => { const m = messages.find((x) => x.id === ctxMenu.messageId); if (m) handleStartEdit(m); } : null}
            onDelete={canDelete ? () => handleDeleteMsg(ctxMenu.messageId) : null}
            onClose={() => setCtxMenu(null)}
          />
        );
      })()}

      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-slate-200 bg-white shrink-0 shadow-sm">
        <div className="flex items-center gap-2.5">
          <MessageCircle className="w-5 h-5 text-emerald-600" />
          <h1 className="text-base font-bold text-slate-900">
            Вътрешен чат {isAdmin && <span className="ml-1 text-xs font-normal text-slate-400">(Админ)</span>}
          </h1>
        </div>
        <button type="button" onClick={onClose} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Затвори">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* ---- Left panel: conversation list ---- */}
        <div className={`w-full md:w-72 lg:w-80 shrink-0 border-r border-slate-200 flex flex-col bg-white ${showMobileList ? 'flex' : 'hidden'} md:flex`}>

          {/* New conversation */}
          <div className="p-3 border-b border-slate-200 space-y-2">
            {!showNewConv ? (
              <button
                type="button"
                onClick={() => setShowNewConv(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Нов разговор
              </button>
            ) : (
              <div className="space-y-2 bg-emerald-50 rounded-xl p-3 border border-emerald-200">
                <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">Нов разговор</p>
                <select
                  value={newRecipient}
                  onChange={(e) => { setNewRecipient(e.target.value); setNewError(''); }}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  <option value="">— до кого? —</option>
                  {recipientOptions.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <textarea
                  value={newBody}
                  onChange={(e) => { setNewBody(e.target.value); setNewError(''); }}
                  rows={2}
                  placeholder="Съобщение…"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white resize-none outline-none focus:ring-2 focus:ring-emerald-500/30"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleStartConversation(); } }}
                />
                {newError && <p className="text-xs text-red-500">{newError}</p>}
                <div className="flex gap-2">
                  <button type="button" onClick={cancelNewConv} className="flex-1 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                    Отказ
                  </button>
                  <button type="button" onClick={() => void handleStartConversation()} disabled={newSending}
                    className="flex-1 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-50 flex items-center justify-center gap-1">
                    <Send className="w-3 h-3" />
                    {newSending ? 'Изпращане…' : 'Изпрати'}
                  </button>
                </div>
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Търси разговор…"
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-800 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Thread list */}
          <div className="flex-1 overflow-y-auto">
            {filteredThreadIds.length === 0 ? (
              <p className="p-6 text-sm text-slate-400 text-center">{threadIds.length === 0 ? 'Няма разговори.' : 'Няма резултати.'}</p>
            ) : (
              filteredThreadIds.map((tid) => {
                const msgs = byThread.get(tid) || [];
                const info = getThreadInfo(msgs, perspective, myDentistId, dentists);
                const unread = getUnreadCount(msgs, perspective, myDentistId);
                const lastMsg = msgs[msgs.length - 1];
                const isSelected = tid === selectedThreadId;
                return (
                  <div
                    key={tid}
                    className={`group relative border-b border-slate-100 ${isSelected ? 'bg-emerald-50 border-l-[3px] border-l-emerald-500' : 'hover:bg-slate-50'}`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectThread(tid)}
                      className="w-full text-left px-3 py-3.5 flex gap-3 items-start pr-10"
                    >
                      <Avatar name={info.title} type={info.type} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className={`text-sm truncate ${unread > 0 ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                            {info.title}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">{fmtTime(lastMsg?.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs truncate flex-1 ${unread > 0 ? 'text-slate-600' : 'text-slate-400'}`}>
                            {(lastMsg?.body || '').slice(0, 45)}{(lastMsg?.body || '').length > 45 ? '…' : ''}
                          </span>
                          {unread > 0 && (
                            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                              {unread > 9 ? '9+' : unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                    {/* Delete thread button */}
                    {(isAdmin || onDeleteThread) && (
                      <button
                        type="button"
                        title="Изтрий разговора"
                        onClick={(e) => { e.stopPropagation(); void handleDeleteThread(tid); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ---- Right panel: message view ---- */}
        <div className={`flex-1 flex flex-col min-w-0 ${!showMobileList ? 'flex' : 'hidden'} md:flex`}>
          {!selectedThreadId ? (
            <div className="flex-1 flex items-center justify-center bg-slate-50">
              <div className="text-center text-slate-400 p-8">
                <MessageCircle className="w-14 h-14 mx-auto mb-4 opacity-20" />
                <p className="text-base font-medium">Изберете разговор</p>
                <p className="text-sm mt-1 opacity-70">или започнете нов от бутона вляво</p>
              </div>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="h-14 px-4 flex items-center gap-3 border-b border-slate-200 bg-white shrink-0 shadow-sm">
                <button type="button" onClick={() => setShowMobileList(true)} className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <Avatar name={threadInfo?.title} type={threadInfo?.type} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 leading-tight truncate">{threadInfo?.title}</p>
                  <p className="text-[11px] text-slate-400">
                    {threadInfo?.type === 'staff'
                      ? (perspective === 'dentist' ? 'Регистратура / Персонал' : 'Персонал')
                      : 'Лекар'}
                  </p>
                </div>
                {(isAdmin || onDeleteThread) && (
                  <button
                    type="button"
                    title="Изтрий разговора"
                    onClick={() => void handleDeleteThread(selectedThreadId)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 bg-slate-50">
                {currentMsgs.map((m) => {
                  const side = bubbleSide(m, perspective, myDentistId);
                  const isRight = side === 'right';
                  const label = senderLabel(m, dentists);
                  const mine = isMine(m, perspective, myDentistId, isAdmin);
                  const canAct = mine || isAdmin;
                  const isEditing = editingMsgId === m.id;

                  return (
                    <div
                      key={m.id}
                      className={`flex group ${isRight ? 'justify-end' : 'justify-start'}`}
                      onContextMenu={(e) => { if (canAct) openCtxMenu(m.id, e); }}
                      onTouchStart={(e) => { if (canAct) startLongPress(m.id, e); }}
                      onTouchEnd={cancelLongPress}
                      onTouchMove={cancelLongPress}
                    >
                      <div className={`max-w-[78%] ${isRight ? '' : 'flex gap-2.5 items-start'}`}>
                        {!isRight && <Avatar name={label} type={m.from_dentist_id ? 'doctor' : 'staff'} size="sm" />}
                        <div>
                          <p className={`text-[10px] mb-1 ${isRight ? 'text-right text-slate-400' : 'text-slate-400'}`}>
                            {label} · {fmtFull(m.created_at)}
                          </p>

                          {isEditing ? (
                            /* ---- Inline edit ---- */
                            <div className="space-y-1.5">
                              <textarea
                                value={editDraft}
                                onChange={(e) => setEditDraft(e.target.value)}
                                rows={2}
                                autoFocus
                                className="w-full text-sm px-3 py-2 rounded-xl border-2 border-emerald-400 bg-white resize-none outline-none leading-relaxed"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSaveEdit(m.id); }
                                  if (e.key === 'Escape') { setEditingMsgId(null); setEditDraft(''); }
                                }}
                              />
                              <div className="flex gap-1.5 justify-end">
                                <button type="button" onClick={() => { setEditingMsgId(null); setEditDraft(''); }}
                                  className="px-2.5 py-1 text-xs text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">
                                  Отказ
                                </button>
                                <button type="button" onClick={() => void handleSaveEdit(m.id)}
                                  className="px-2.5 py-1 text-xs text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Запази
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* ---- Normal bubble ---- */
                            <div className="relative">
                              <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm
                                ${isRight ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-white text-slate-900 border border-slate-200 rounded-bl-sm'}`}>
                                <p className="whitespace-pre-wrap">{m.body}</p>
                              </div>
                              {/* Action button — visible on hover (desktop) or always on touch */}
                              {canAct && (
                                <button
                                  type="button"
                                  onClick={(e) => openCtxMenu(m.id, e)}
                                  className={`absolute top-1 ${isRight ? '-left-7' : '-right-7'} p-1 rounded-lg bg-white border border-slate-200 shadow-sm text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity`}
                                  title="Опции"
                                >
                                  <MoreVertical className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="px-4 py-3 border-t border-slate-200 bg-white shrink-0">
                {sendError && <p className="text-xs text-red-500 mb-2">{sendError}</p>}
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={draftRef}
                    value={draft}
                    onChange={(e) => { setDraft(e.target.value); setSendError(''); }}
                    rows={2}
                    placeholder="Напишете съобщение… (Enter за изпращане, Shift+Enter за нов ред)"
                    className="flex-1 text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 outline-none resize-none leading-relaxed"
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); } }}
                  />
                  <button
                    type="button"
                    disabled={sending || !draft.trim()}
                    onClick={() => void handleSend()}
                    className="h-[72px] px-4 flex flex-col items-center justify-center gap-1 rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-40 transition-colors"
                  >
                    <Send className="w-5 h-5" />
                    <span className="text-[10px] font-medium">{sending ? '…' : 'Изпрати'}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
