import React from 'react';
import { Calendar, X } from 'lucide-react';

// فلتر مشترك (حسب الزيارة و التاريخ) يُستخدم في جداول التبويبات السريرية
// مكوّن مراقَب (Controlled): القيم والحدِّثات تُدار من الصفحة الأب
const DataFilterBar = ({ visits, visitFilter, onVisitChange, dateFilter, onDateChange, onReset }) => {
  const sortedVisits = [...(visits || [])].sort((a, b) => b.visit_id - a.visit_id);
  const hasFilter = !!visitFilter || !!dateFilter;

  return (
    <div className="border-b border-gray-100 bg-[#F8F9FB] p-3.5 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 bg-gradient-to-br from-[#0046B5] to-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm">
          <Calendar className="h-4.5 w-4.5" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={visitFilter || ''}
            onChange={(e) => onVisitChange(e.target.value)}
            className="border border-gray-300 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-800 outline-none transition-all focus:border-[#0046B5] focus:ring-2 focus:ring-blue-100 shadow-sm"
          >
            <option value="">All Visits</option>
            {sortedVisits.map((v) => {
              const date = v.visit_date ? new Date(v.visit_date.replace(' ', 'T')).toLocaleDateString() : 'N/A';
              return (
                <option key={v.visit_id} value={String(v.visit_id)}>
                  Visit #{v.visit_id} — {date}
                </option>
              );
            })}
          </select>

          <div className="relative">
            <input
              type="date"
              value={dateFilter || ''}
              onChange={(e) => onDateChange(e.target.value)}
              className="appearance-none border border-gray-300 rounded-lg bg-white px-3.5 py-2 pr-9 text-sm font-medium text-gray-800 outline-none transition-all focus:border-[#0046B5] focus:ring-2 focus:ring-blue-100 shadow-sm"
              style={{ colorScheme: 'light' }}
            />
            {dateFilter && (
              <button
                onClick={() => onDateChange('')}
                title="Clear date"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-gray-200 hover:bg-red-100 hover:text-red-600 text-gray-500 flex items-center justify-center transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {hasFilter && (
        <button
          onClick={onReset}
          className="ml-auto inline-flex items-center px-3 py-1.5 text-sm font-semibold text-[#0046B5] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <X className="h-4 w-4 mr-1.5" />
          Reset
        </button>
      )}
    </div>
  );
};

export default DataFilterBar;
