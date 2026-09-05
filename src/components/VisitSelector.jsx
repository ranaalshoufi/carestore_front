import React from 'react';
import { CalendarClock } from 'lucide-react';

// محدد الزيارة: يظهر في كل تبويب سريري لاختيار الزيارة الخاصة بالمريض
const VisitSelector = ({ visits, selectedVisitId, onChange }) => {
  if (!visits || visits.length === 0) {
    return (
      <div className="bg-white border border-amber-200 rounded-lg px-4 py-3 shadow-sm flex items-center text-sm text-amber-700">
        <CalendarClock className="h-4 w-4 mr-2" />
        لا توجد زيارات مسجلة لهذا المريض حتى الآن. يرجى فتح زيارة أولاً.
      </div>
    );
  }

  const sorted = [...visits].sort((a, b) => b.visit_id - a.visit_id);

  return (
    <div className="flex flex-wrap items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
      <div className="flex items-center text-[#003B73]">
        <CalendarClock className="h-4 w-4 mr-2 text-[#0046B5]" />
        <span className="text-sm font-bold">Visit:</span>
      </div>
      <select
        value={selectedVisitId !== null && selectedVisitId !== undefined ? String(selectedVisitId) : ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className="flex-1 min-w-[220px] border border-gray-300 rounded bg-[#F8F9FB] p-2 text-sm outline-none focus:border-[#0046B5]"
      >
        {sorted.map((v) => {
          const date = v.visit_date ? new Date(v.visit_date.replace(' ', 'T')).toLocaleDateString() : 'N/A';
          return (
            <option key={v.visit_id} value={String(v.visit_id)}>
              Visit #{v.visit_id} — {date} — {v.chief_complaint || 'General'}
            </option>
          );
        })}
      </select>
      {selectedVisitId && (
        <span className="text-xs text-gray-500">
          Showing records for this visit only
        </span>
      )}
    </div>
  );
};

export default VisitSelector;
