import { OTHER_APPOINTMENT_TYPE_KEY, OTHER_APPOINTMENT_LABEL } from '../data/mockData';

export function withOtherOption(appointmentTypes) {
  const list = Array.isArray(appointmentTypes) ? appointmentTypes : [];
  if (list.some((o) => o.key === OTHER_APPOINTMENT_TYPE_KEY)) return list;
  return [...list, { key: OTHER_APPOINTMENT_TYPE_KEY, label_bg: OTHER_APPOINTMENT_LABEL }];
}

export function resolveTypeForSave(selectedKey, customOther, typeOptions) {
  if (selectedKey === OTHER_APPOINTMENT_TYPE_KEY) {
    const t = (customOther || '').trim();
    return t || OTHER_APPOINTMENT_LABEL;
  }
  return selectedKey;
}

export function parseTypeFromAppointment(storedType, typeOptions) {
  if (!storedType) {
    const first = typeOptions[0];
    return { key: first?.key ?? 'Checkup', custom: '' };
  }
  const match = typeOptions.find((o) => o.key === storedType || o.label_bg === storedType);
  if (match) return { key: match.key, custom: '' };
  return { key: OTHER_APPOINTMENT_TYPE_KEY, custom: storedType };
}
