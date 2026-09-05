// إدارة الزيارة النشطة المعروضة في التبويبات السريرية
// تُخزّن في localStorage حتى تبقى متزامنة بين التبويبات
const ACTIVE_VISIT_KEY = 'active_visit_';

export function getActiveVisitId(patientId) {
  const value = localStorage.getItem(ACTIVE_VISIT_KEY + patientId);
  return value ? Number(value) : null;
}

export function setActiveVisitId(patientId, visitId) {
  localStorage.setItem(ACTIVE_VISIT_KEY + patientId, String(visitId));
}

// تحديد الزيارة الافتراضية: الزيارة النشطة المخزنة، أو أحدث زيارة
export function resolveDefaultVisitId(patientId, visits) {
  if (!visits || visits.length === 0) return null;
  const stored = getActiveVisitId(patientId);
  if (stored && visits.some((v) => Number(v.visit_id) === Number(stored))) {
    return Number(stored);
  }
  const latest = visits.reduce((a, b) => (a.visit_id > b.visit_id ? a : b));
  return Number(latest.visit_id);
}
