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

/** Непрочетени за лекар: персоналът е изпратил към този лекар. */
export function countUnreadForDentist(messages, dentistId) {
  if (!dentistId) return 0;
  return (messages || []).filter(
    (m) => m.to_dentist_id === dentistId && !m.from_dentist_id && !m.read_at
  ).length;
}

/** Непрочетени за персонал: лекар е писал към __staff__. */
export function countUnreadForStaff(messages) {
  return (messages || []).filter(
    (m) => m.to_dentist_id === STAFF_DM_INBOX_DENTIST_ID && m.from_dentist_id && !m.read_at
  ).length;
}
