/** Специален получател: съобщение от лекар към персонала. */
export const STAFF_DM_INBOX_DENTIST_ID = '__staff__';

export function groupMessagesByThread(messages) {
  const map = new Map();
  for (const m of messages || []) {
    const tid = m.thread_id;
    if (!tid) continue;
    if (!map.has(tid)) map.set(tid, []);
    map.get(tid).push(m);
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }
  return map;
}

/** Определя с кой лекар е нишката (първото съобщение към лекар или от лекар). */
export function threadDoctorId(messagesInThread) {
  const sorted = [...(messagesInThread || [])].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );
  for (const m of sorted) {
    if (m.to_dentist_id && m.to_dentist_id !== STAFF_DM_INBOX_DENTIST_ID) return m.to_dentist_id;
    if (m.from_dentist_id) return m.from_dentist_id;
  }
  return null;
}

export function threadPreview(messagesInThread) {
  const arr = messagesInThread || [];
  if (!arr.length) return '';
  const last = arr[arr.length - 1];
  return (last.body || '').trim().slice(0, 80);
}

export function threadLastAt(messagesInThread) {
  const arr = messagesInThread || [];
  if (!arr.length) return 0;
  return new Date(arr[arr.length - 1].created_at).getTime();
}

/**
 * Returns the to_dentist_id that a doctor should use when replying in a thread.
 * Handles both staff↔doctor and doctor↔doctor threads.
 */
export function getThreadRecipient(msgs, myDentistId) {
  if (!msgs || !msgs.length) return STAFF_DM_INBOX_DENTIST_ID;
  if (msgs.some((m) => m.to_dentist_id === STAFF_DM_INBOX_DENTIST_ID)) return STAFF_DM_INBOX_DENTIST_ID;
  if (msgs.some((m) => !m.from_dentist_id)) return STAFF_DM_INBOX_DENTIST_ID;
  for (const m of msgs) {
    if (m.from_dentist_id && String(m.from_dentist_id) !== String(myDentistId)) return m.from_dentist_id;
    if (m.to_dentist_id && m.to_dentist_id !== STAFF_DM_INBOX_DENTIST_ID && String(m.to_dentist_id) !== String(myDentistId)) return m.to_dentist_id;
  }
  return STAFF_DM_INBOX_DENTIST_ID;
}

/**
 * Returns display info for a thread: title and type ('staff' | 'doctor').
 */
export function getThreadInfo(msgs, perspective, myDentistId, dentists = []) {
  if (!msgs || !msgs.length) return { title: 'Разговор', type: 'staff' };

  if (perspective === 'dentist') {
    const isStaff = msgs.some((m) => m.to_dentist_id === STAFF_DM_INBOX_DENTIST_ID || !m.from_dentist_id);
    if (isStaff) {
      const staffMsg = msgs.find((m) => !m.from_dentist_id);
      return { title: staffMsg?.from_label || 'Регистратура', type: 'staff' };
    }
    let otherId = null;
    for (const m of msgs) {
      if (m.from_dentist_id && String(m.from_dentist_id) !== String(myDentistId)) { otherId = m.from_dentist_id; break; }
      if (m.to_dentist_id && m.to_dentist_id !== STAFF_DM_INBOX_DENTIST_ID && String(m.to_dentist_id) !== String(myDentistId)) { otherId = m.to_dentist_id; break; }
    }
    const doc = otherId ? dentists.find((d) => String(d.id) === String(otherId)) : null;
    return { title: doc?.name || (otherId ? `Лекар ${otherId}` : 'Разговор'), type: 'doctor', docId: otherId };
  }

  const doctorId =
    msgs.find((m) => m.from_dentist_id)?.from_dentist_id ||
    msgs.find((m) => m.to_dentist_id && m.to_dentist_id !== STAFF_DM_INBOX_DENTIST_ID)?.to_dentist_id;
  const doc = doctorId ? dentists.find((d) => String(d.id) === String(doctorId)) : null;
  return { title: doc?.name || (doctorId ? `Лекар ${doctorId}` : 'Разговор'), type: 'doctor', docId: doctorId };
}

/** Непрочетени за лекар: всички съобщения изпратени КЪМ него, непрочетени. */
export function countUnreadForDentist(messages, dentistId) {
  if (!dentistId) return 0;
  return (messages || []).filter(
    (m) => m.to_dentist_id === dentistId && !m.read_at
  ).length;
}

/** Непрочетени за персонал: лекар е писал към __staff__. */
export function countUnreadForStaff(messages) {
  return (messages || []).filter(
    (m) => m.to_dentist_id === STAFF_DM_INBOX_DENTIST_ID && m.from_dentist_id && !m.read_at
  ).length;
}
