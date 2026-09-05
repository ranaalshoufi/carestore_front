import React, { useState, useEffect } from 'react';
import { PlusCircle, ClipboardCheck, Save } from 'lucide-react';
import api from '../../../utils/api';
import { toast } from '../../../utils/toast';
import VisitSelector from '../../../components/VisitSelector';
import DataFilterBar from '../../../components/DataFilterBar';
import { getActiveVisitId, setActiveVisitId, resolveDefaultVisitId } from '../../../utils/activeVisit';

const NursingCareTab = ({ patient }) => {
  const [patientData, setPatientData] = useState(patient);
  const [procedureTypes, setProcedureTypes] = useState([]);
  const [selectedVisitId, setSelectedVisitId] = useState(null);
  const [filterVisitId, setFilterVisitId] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [procedureForm, setProcedureForm] = useState({
    procedureTypeId: '',
    dateTime: '',
    notes: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  // مزامنة بيانات المريض عند تغييرها من الصفحة الأب
  useEffect(() => {
    setPatientData(patient);
  }, [patient]);

  const visits = (patientData && patientData.visits) ? patientData.visits : [];

  // تحديد الزيارة الافتراضية عند تحميل البيانات
  useEffect(() => {
    const visitsArr = patient && patient.visits ? patient.visits : [];
    if (visitsArr.length > 0) {
      const resolved = resolveDefaultVisitId(patient.patient_id, visitsArr);
      setSelectedVisitId(resolved);
      setActiveVisitId(patient.patient_id, resolved);
    }
  }, [patient]);

  // جلب أنواع الإجراءات التمريضية
  useEffect(() => {
    const loadProcedureTypes = async () => {
      try {
        const res = await api.get('/nursing-procedure-types');
        const types = Array.isArray(res.data) ? res.data : [];
        setProcedureTypes(types);
        if (types.length > 0) {
          setProcedureForm((f) => ({ ...f, procedureTypeId: String(types[0].procedure_type_id) }));
        }
      } catch (error) {
        console.error('Error loading procedure types:', error);
      }
    };
    loadProcedureTypes();
  }, []);

  const selectedVisit = visits.find((v) => Number(v.visit_id) === Number(selectedVisitId)) || null;

  // قائمة إجراءات جميع زيارات المريض (لجدول السجل مع الفلتر)
  const completedProcedures = [];
  visits.forEach((visit) => {
    if (visit.nursing_care_records) {
      visit.nursing_care_records.forEach((rec) => {
        const nurse = rec.nurse;
        completedProcedures.push({
          id: rec.record_id,
          type: rec.procedure_type ? rec.procedure_type.procedure_name : 'Nursing Procedure',
          executionTime: rec.performed_at ? new Date(rec.performed_at).toLocaleString() : 'N/A',
          performedBy: nurse ? `${nurse.first_name} ${nurse.last_name}` : 'Nursing Staff',
          notes: rec.notes || '',
          visitId: visit.visit_id,
          visitDate: visit.visit_date ? new Date(visit.visit_date.replace(' ', 'T')).toDateString() : ''
        });
      });
    }
  });
  completedProcedures.sort((a, b) => new Date(b.executionTime) - new Date(a.executionTime));

  // تطبيق الفلترين (حسب الزيارة و التاريخ) على الجدول
  const filteredProcedures = completedProcedures.filter((p) => {
    if (filterVisitId && Number(p.visitId) !== Number(filterVisitId)) return false;
    if (filterDate) {
      const fd = new Date(filterDate + 'T00:00:00').toDateString();
      if (p.visitDate && p.visitDate !== fd) return false;
    }
    return true;
  });

  const handleChange = (e) => {
    setProcedureForm({ ...procedureForm, [e.target.name]: e.target.value });
  };

  const handleAddProcedure = async (e) => {
    e.preventDefault();
    if (!selectedVisit) {
      toast.error('يرجى فتح/اختيار الزيارة أولاً قبل تسجيل الإجراء التمريضي.');
      return;
    }
    if (!procedureForm.dateTime) {
      toast.error('يرجى تحديد تاريخ ووقت الإجراء.');
      return;
    }
    setIsSaving(true);
    try {
      await api.post('/nursing-care-records', {
        visit_id: selectedVisit.visit_id,
        procedure_type_id: procedureForm.procedureTypeId,
        performed_at: procedureForm.dateTime,
        notes: procedureForm.notes
      });
      toast.success('تم تسجيل الإجراء التمريضي بنجاح!');
      setProcedureForm((f) => ({ ...f, dateTime: '', notes: '' }));
      // إعادة جلب بيانات المريض لتحديث الجدول
      const res = await api.get(`/patients/${patientData.patient_id}`);
      setPatientData(res.data);
    } catch (error) {
      console.error('Error saving nursing care record:', error);
      toast.error('فشل تسجيل الإجراء التمريضي.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6 mt-4">

      {/* عنوان الصفحة */}
      <div>
        <h2 className="text-2xl font-bold text-[#003B73]">Nursing Care</h2>
      </div>

      {/* محدد الزيارة */}
      <VisitSelector
        visits={visits}
        selectedVisitId={selectedVisitId}
        onChange={(id) => {
          setSelectedVisitId(id);
          setActiveVisitId(patientData.patient_id, id);
        }}
      />

      {/* فورم تسجيل إجراء جديد */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="flex items-center text-[#003B73] font-bold text-lg mb-6">
          <PlusCircle className="h-5 w-5 mr-2 text-[#0046B5]" />
          Record New Procedure
        </div>

        <form onSubmit={handleAddProcedure} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Procedure Type</label>
              <select
                name="procedureTypeId"
                value={procedureForm.procedureTypeId}
                onChange={handleChange}
                disabled={!selectedVisit}
                className="w-full border border-gray-300 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5] disabled:opacity-50"
              >
                {procedureTypes.length === 0 && <option value="">No procedures available</option>}
                {procedureTypes.map((pt) => (
                  <option key={pt.procedure_type_id} value={String(pt.procedure_type_id)}>
                    {pt.procedure_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Date & Time</label>
              <input
                type="datetime-local"
                name="dateTime"
                value={procedureForm.dateTime}
                onChange={handleChange}
                disabled={!selectedVisit}
                className="w-full border border-gray-300 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5] disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Visit</label>
              <input
                type="text"
                value={selectedVisit ? `Visit #${selectedVisit.visit_id} - ${selectedVisit.chief_complaint || 'General'}` : 'No visit selected'}
                disabled
                className="w-full border border-gray-300 rounded bg-gray-100 p-2.5 text-sm text-gray-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Notes/Observations</label>
            <textarea
              name="notes"
              value={procedureForm.notes}
              onChange={handleChange}
              disabled={!selectedVisit}
              rows="3"
              placeholder="Enter clinical observations and procedure details..."
              className="w-full border border-gray-300 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5] resize-none disabled:opacity-50"
            ></textarea>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={isSaving || !selectedVisit} className="flex items-center px-6 py-2.5 bg-[#0046B5] text-white text-sm font-bold rounded hover:bg-blue-800 transition-colors disabled:opacity-50">
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Add Procedure'}
            </button>
          </div>
        </form>
      </div>

      {/* جدول الإجراءات المكتملة */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mt-4">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center">
            <ClipboardCheck className="h-5 w-5 mr-2 text-[#0046B5]" />
            <h3 className="text-lg font-bold text-[#003B73]">Completed Nursing Procedures</h3>
          </div>
          <span className="px-4 py-1.5 bg-blue-50 text-[#0046B5] text-xs font-bold rounded-full">
            {filteredProcedures.length} Procedure{filteredProcedures.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* فلتر الجدول المشترك: حسب الزيارة و التاريخ */}
        <DataFilterBar
          visits={visits}
          visitFilter={filterVisitId}
          onVisitChange={setFilterVisitId}
          dateFilter={filterDate}
          onDateChange={setFilterDate}
          onReset={() => { setFilterVisitId(''); setFilterDate(''); }}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#F8F9FB] border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-bold text-[#003B73]">Procedure Type</th>
                <th className="px-6 py-4 text-xs font-bold text-[#003B73]">Execution Time</th>
                <th className="px-6 py-4 text-xs font-bold text-[#003B73]">Performed By</th>
                <th className="px-6 py-4 text-xs font-bold text-[#003B73]">Visit</th>
                <th className="px-6 py-4 text-xs font-bold text-[#003B73]">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProcedures.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                    {completedProcedures.length === 0
                      ? 'No nursing procedures recorded yet for this patient.'
                      : 'No nursing procedures match the selected filters.'}
                  </td>
                </tr>
              ) : (
                filteredProcedures.map((proc) => (
                  <tr key={proc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-[#003B73] whitespace-nowrap">{proc.type}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{proc.executionTime}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{proc.performedBy}</td>
                    <td className="px-6 py-4 text-sm text-[#0046B5] font-semibold whitespace-nowrap">Visit #{proc.visitId}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-md">{proc.notes || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default NursingCareTab;
