import React, { useState, useEffect } from 'react';
import { PlusCircle, History, Plus } from 'lucide-react';
import api from '../../../../utils/api';
import { toast } from '../../../../utils/toast';
import VisitSelector from '../../../../components/VisitSelector';
import DataFilterBar from '../../../../components/DataFilterBar';
import { getActiveVisitId, setActiveVisitId, resolveDefaultVisitId } from '../../../../utils/activeVisit';

const Diagnoses = ({ patient }) => {
  const [patientData, setPatientData] = useState(patient);
  const [selectedVisitId, setSelectedVisitId] = useState(null);
  const [filterVisitId, setFilterVisitId] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [diagnosisForm, setDiagnosisForm] = useState({
    diagnosis_name: '', icd_code: '', notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const selectedVisit = visits.find((v) => Number(v.visit_id) === Number(selectedVisitId)) || null;

  // استخراج قائمة كل التشخيصات السابقة للمريض من جميع الزيارات
  const allDiagnoses = [];
  visits.forEach(visit => {
    if (visit.diagnoses) {
      visit.diagnoses.forEach(diag => {
        allDiagnoses.push({
          id: diag.diagnosis_id,
          condition: diag.diagnosis_name,
          notes: diag.notes || 'No clinical notes provided',
          icd10: diag.icd_code || 'N/A',
          onset: diag.created_at ? new Date(diag.created_at).toLocaleDateString() : 'N/A',
          status: visit.status === 'completed' ? 'RESOLVED' : 'ACTIVE',
          visitId: visit.visit_id,
          visitDate: visit.visit_date ? new Date(visit.visit_date.replace(' ', 'T')).toDateString() : ''
        });
      });
    }
  });

  // تطبيق الفلترين (حسب الزيارة و التاريخ) على جدول التاريخ المرضي
  const filteredDiagnoses = allDiagnoses.filter((d) => {
    if (filterVisitId && Number(d.visitId) !== Number(filterVisitId)) return false;
    if (filterDate) {
      const fd = new Date(filterDate + 'T00:00:00').toDateString();
      if (d.visitDate && d.visitDate !== fd) return false;
    }
    return true;
  });

  const handleDiagnosisChange = (e) => {
    setDiagnosisForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddDiagnosis = async (e) => {
    e.preventDefault();
    if (!selectedVisit) {
      toast.error('يرجى فتح/اختيار الزيارة أولاً قبل إضافة التشخيص!');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/visits/${selectedVisit.visit_id}/diagnoses`, diagnosisForm);
      toast.success('تم إضافة التشخيص بنجاح!');
      setDiagnosisForm({ diagnosis_name: '', icd_code: '', notes: '' });
      const res = await api.get(`/patients/${patientData.patient_id}`);
      setPatientData(res.data);
    } catch (error) {
      console.error('Error adding diagnosis:', error);
      toast.error('فشل إضافة التشخيص.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6 mt-4">
      {/* الترويسة */}
      <div>
        <h2 className="text-2xl font-bold text-[#003B73]">
          <span className="text-gray-400 font-normal">Visit Record / </span>
          Diagnosis History & Active Conditions
        </h2>
        <p className="text-sm text-gray-500 mt-1">Comprehensive clinical record for patient clinical management.</p>
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

      {/* فورم إضافة تشخيص */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="flex items-center text-[#003B73] font-bold text-lg mb-6">
          <PlusCircle className="h-6 w-6 mr-2 text-[#0046B5]" />
          New Diagnosis Entry
        </div>
        
        <form onSubmit={handleAddDiagnosis} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Condition/Diagnosis Name</label>
              <input type="text" name="diagnosis_name" value={diagnosisForm.diagnosis_name} onChange={handleDiagnosisChange} required placeholder="e.g. Type 2 Diabetes" className="w-full border border-gray-300 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">ICD-10 Code (Optional)</label>
              <input type="text" name="icd_code" value={diagnosisForm.icd_code} onChange={handleDiagnosisChange} placeholder="e.g. E11.9" className="w-full border border-gray-300 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Notes/Description</label>
            <textarea name="notes" value={diagnosisForm.notes} onChange={handleDiagnosisChange} rows="2" placeholder="Enter clinical notes..." className="w-full border border-gray-300 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5] resize-none"></textarea>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={isSubmitting} className="flex items-center px-6 py-2.5 bg-[#0046B5] text-white text-sm font-bold rounded-md hover:bg-blue-800 transition-colors disabled:opacity-50">
              <Plus className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Adding...' : 'Add Diagnosis'}
            </button>
          </div>
        </form>
      </div>

      {/* جدول التاريخ المرضي */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center text-lg font-bold text-[#003B73]">
            <History className="h-5 w-5 mr-2 text-gray-500" />
            Historical / Resolved Diagnoses
          </div>
          <span className="px-3 py-1 bg-blue-50 text-[#0046B5] text-xs font-bold rounded-full">
            {filteredDiagnoses.length} Diagnosis{filteredDiagnoses.length === 1 ? '' : 'es'}
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
                <th className="px-6 py-4 text-xs font-bold text-[#003B73]">Condition</th>
                <th className="px-6 py-4 text-xs font-bold text-[#003B73]">ICD-10</th>
                <th className="px-6 py-4 text-xs font-bold text-[#003B73]">Visit</th>
                <th className="px-6 py-4 text-xs font-bold text-[#003B73]">Onset</th>
                <th className="px-6 py-4 text-xs font-bold text-[#003B73]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDiagnoses.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                    {allDiagnoses.length === 0
                      ? 'No diagnoses recorded yet for this patient.'
                      : 'No diagnoses match the selected filters.'}
                  </td>
                </tr>
              ) : (
                filteredDiagnoses.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-[#003B73]">{d.condition}</p>
                      <p className="text-[10px] text-gray-500 mt-1">{d.notes}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{d.icd10}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">Visit #{d.visitId}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{d.onset}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-[10px] font-bold rounded-full ${d.status === 'ACTIVE' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-gray-200 text-gray-600 border border-gray-300'}`}>{d.status}</span>
                    </td>
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

export default Diagnoses;