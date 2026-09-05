import React, { useState } from 'react';
import { FileText, Save, Calendar, X } from 'lucide-react';
import api from '../../../../utils/api';
import { toast } from '../../../../utils/toast';

const VisitHistory = ({ patient }) => {
  const [visitForm, setVisitForm] = useState({
    weight: '', chief_complaint: '', status: 'open'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateFilter, setDateFilter] = useState('');

  const visits = patient.visits || [];

  // تطبيق فلتر التاريخ على الزيارات
  const filteredVisits = dateFilter
    ? visits.filter((v) => {
        if (!v.visit_date) return false;
        const visitDate = new Date(v.visit_date.replace(' ', 'T'));
        const filterDate = new Date(dateFilter + 'T00:00:00');
        return visitDate.toDateString() === filterDate.toDateString();
      })
    : visits;

  const handleVisitChange = (e) => {
    const { name, value } = e.target;
    setVisitForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveVisit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        patient_id: patient.patient_id,
        chief_complaint: visitForm.chief_complaint,
        weight: parseFloat(visitForm.weight) || null,
        status: 'open'
      };

      const response = await api.post('/visits', payload);
      toast.success('تم فتح الزيارة الطبية بنجاح!');
      
      // تحديث قائمة الزيارات محلياً أو إعادة تحميل الصفحة
      window.location.reload();
    } catch (error) {
      console.error('Error creating visit:', error);
      toast.error('حدث خطأ أثناء فتح الزيارة.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6 mt-4">
      {/* عنوان وتفاصيل القسم */}
      <div>
        <h2 className="text-xl font-bold text-[#003B73]">Patient Encounters</h2>
        <p className="text-sm text-gray-500 mt-1">Review and manage clinical visits and encounter history.</p>
      </div>

      {/* قسم الفلاتر - حسب التاريخ فقط */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3.5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 bg-gradient-to-br from-[#0046B5] to-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm">
            <Calendar className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-700 leading-none mb-1">Visit Date</p>
            <p className="text-[10px] text-gray-400 leading-none">Filter encounters by day</p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="appearance-none border border-gray-200 rounded-lg bg-white px-3.5 py-2 pr-9 text-sm font-medium text-gray-800 outline-none transition-all focus:border-[#0046B5] focus:ring-2 focus:ring-blue-100 shadow-sm"
              style={{ colorScheme: 'light' }}
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                title="Clear date"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-gray-200 hover:bg-red-100 hover:text-red-600 text-gray-500 flex items-center justify-center transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <span className={`hidden sm:inline-block px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${dateFilter ? 'bg-blue-50 text-[#0046B5]' : 'bg-gray-100 text-gray-400'}`}>
            {dateFilter ? new Date(dateFilter + 'T00:00:00').toLocaleDateString() : 'All dates'}
          </span>
        </div>
      </div>

      {/* بطاقة إضافة زيارة جديدة */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <div className="flex items-center text-[#0046B5] font-bold text-sm">
            <FileText className="h-4 w-4 mr-2" />
            New Visit Entry
          </div>
          <span className="text-xs text-gray-400">Drafting encounter details</span>
        </div>
        
        <form onSubmit={handleSaveVisit} className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Weight (KG)</label>
              <input type="number" step="0.1" name="weight" value={visitForm.weight} onChange={handleVisitChange} placeholder="e.g. 70.5" className="w-full border border-gray-200 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Chief Complaint</label>
              <input type="text" name="chief_complaint" value={visitForm.chief_complaint} onChange={handleVisitChange} required placeholder="Describe the primary reason for visit..." className="w-full border border-gray-200 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5]" />
            </div>
          </div>
          
          <div className="flex justify-end">
            <button type="submit" disabled={isSubmitting} className="flex items-center justify-center px-6 py-2.5 bg-[#00607A] text-white text-sm font-bold rounded hover:bg-teal-800 transition-colors whitespace-nowrap disabled:opacity-50">
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Save new Visit'}
            </button>
          </div>
        </form>
      </div>

      {/* جدول الزيارات السابقة */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8F9FB] border-b border-gray-200">
              <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Date & Time</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Attending Physician</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Facility</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Chief Complaint</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider text-right">Visit ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredVisits.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                  {visits.length === 0 ? 'No visits recorded yet for this patient.' : 'No visits match the selected date.'}
                </td>
              </tr>
            ) : (
              filteredVisits.map((v) => (
                <tr key={v.visit_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-900">{v.visit_date ? new Date(v.visit_date).toLocaleDateString() : 'N/A'}</p>
                    <p className="text-xs text-gray-500">{v.visit_date ? new Date(v.visit_date.replace(' ', 'T')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{v.doctor ? `Dr. ${v.doctor.first_name} ${v.doctor.last_name}` : 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">Central Hospital</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{v.chief_complaint}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center px-3 py-1 text-xs font-bold rounded bg-[#0046B5]/10 text-[#0046B5]">
                      Visit #{v.visit_id}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default VisitHistory;