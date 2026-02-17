/**
 * Log activity to Supabase activity_log table (fire-and-forget).
 * @param {object} supabase - Supabase client
 * @param {{ action: string, entity_type?: string, entity_id?: string, details?: object }} payload
 */
export function logActivity(supabase, payload) {
  if (!supabase || !payload?.action) return;
  supabase
    .from('activity_log')
    .insert({
      action: payload.action,
      entity_type: payload.entity_type ?? null,
      entity_id: payload.entity_id ?? null,
      details: payload.details ?? null,
    })
    .then(({ error }) => {
      if (error) console.warn('Activity log failed:', error.message);
    });
}

export const ACTIVITY_ACTIONS = {
  APPOINTMENT_CREATED: 'appointment_created',
  APPOINTMENT_UPDATED: 'appointment_updated',
  APPOINTMENT_DELETED: 'appointment_deleted',
  APPOINTMENT_MOVED: 'appointment_moved',
  VACATION_ADDED: 'vacation_added',
  VACATION_DELETED: 'vacation_deleted',
  PATIENT_ADDED: 'patient_added',
  PATIENT_UPDATED: 'patient_updated',
  DENTIST_ADDED: 'dentist_added',
  DENTIST_DELETED: 'dentist_deleted',
  FILE_UPLOADED: 'file_uploaded',
  FILE_DELETED: 'file_deleted',
};
