import React, { useState, useEffect } from 'react';
import { Plus, FileText } from 'lucide-react';
import api from '../../../utils/api';
import { toast } from '../../../utils/toast';
import VisitSelector from '../../../components/VisitSelector';
import DataFilterBar from '../../../components/DataFilterBar';
import { getActiveVisitId, setActiveVisitId, resolveDefaultVisitId } from '../../../utils/activeVisit';

const PrescriptionsTab = ({ patient }) => {
  const [patientData, setPatientData] = useState(patient);
  const [selectedVisitId, setSelectedVisitId] = useState(null);
  const [filterVisitId, setFilterVisitId] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [prescriptionForm, setPrescriptionForm] = useState({
    medication_name: '',
    dosage: '',
    frequency: 'Once Daily',
    duration: '',
    route: 'Oral',
    instructions: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // صلاحية إضافة الوصفات: مدير النظام (1) أو الطبيب (2) فقط
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const roleId = user && user.role_id ? Number(user.role_id) : 1;
  const canPrescribe = roleId === 1 || roleId === 2;

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

  // استخراج كل الوصفات الطبية من جميع زيارات المريض
  const currentPrescriptions = [];
  visits.forEach(visit => {
    if (visit.prescriptions) {
      visit.prescriptions.forEach(presc => {
        const items = presc.prescription_items || presc.items || [];
        items.forEach(item => {
          currentPrescriptions.push({
            id: item.item_id,
            medication: item.medication_name || 'Medication',
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            route: item.route || 'Oral',
            instructions: item.instructions || 'N/A',
            visitId: visit.visit_id,
            visitDate: visit.visit_date ? new Date(visit.visit_date.replace(' ', 'T')).toDateString() : ''
          });
        });
      });
    }
  });

  // تطبيق الفلترين (حسب الزيارة و التاريخ) على الجدول
  const filteredPrescriptions = currentPrescriptions.filter((p) => {
    if (filterVisitId && Number(p.visitId) !== Number(filterVisitId)) return false;
    if (filterDate) {
      const fd = new Date(filterDate + 'T00:00:00').toDateString();
      if (p.visitDate && p.visitDate !== fd) return false;
    }
    return true;
  });

  const handleChange = (e) => {
    setPrescriptionForm({ ...prescriptionForm, [e.target.name]: e.target.value });
  };

  const handleAddPrescription = async (e) => {
    e.preventDefault();
    if (!canPrescribe) {
      toast.error('ليس لديك الصلاحية لإضافة وصفة طبية.');
      return;
    }

    setIsSubmitting(true);

    try {
      let visitId = selectedVisit ? selectedVisit.visit_id : null;

      // إنشاء زيارة تلقائياً فقط إذا لم يكن هناك أي زيارة مسجلة
      if (!visitId && visits.length === 0) {
        const visitRes = await api.post('/visits', {
          patient_id: patientData.patient_id,
          chief_complaint: 'وصفة طبية جديدة',
          status: 'open'
        });
        visitId = visitRes.data.visit.visit_id;
      }

      if (!visitId) {
        toast.error('يرجى فتح/اختيار الزيارة أولاً قبل إضافة الوصفة الطبية.');
        setIsSubmitting(false);
        return;
      }

      const payload = {
        items: [prescriptionForm]
      };

      await api.post(`/visits/${visitId}/prescriptions`, payload);
      toast.success('تمت إضافة الوصفة الطبية بنجاح!');
      setPrescriptionForm({ medication_name: '', dosage: '', frequency: 'Once Daily', duration: '', route: 'Oral', instructions: '' });
      const res = await api.get(`/patients/${patientData.patient_id}`);
      setPatientData(res.data);
    } catch (error) {
      console.error('Error adding prescription:', error);
      toast.error('فشل إضافة الوصفة الطبية، يرجى التأكد من تعبئة جميع الحقول بشكل صحيح.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6 mt-4">
      
      {/* عنوان الصفحة */}
      <div>
        <h2 className="text-2xl font-bold text-[#003B73]">Prescription Management</h2>
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

      {/* فورم إدخال الوصفة الطبية الأساسي (يظهر فقط لمدير النظام والطبيب) */}
      {canPrescribe ? (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <form onSubmit={handleAddPrescription} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Medication Name</label>
                <input type="text" name="medication_name" placeholder="Search medication..." value={prescriptionForm.medication_name} onChange={handleChange} required className="w-full border border-gray-200 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Dosage</label>
                <input type="text" name="dosage" placeholder="e.g. 500mg" value={prescriptionForm.dosage} onChange={handleChange} className="w-full border border-gray-200 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Frequency</label>
                <select name="frequency" value={prescriptionForm.frequency} onChange={handleChange} className="w-full border border-gray-200 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5]">
                  <option value="Once Daily">Once Daily</option>
                  <option value="Twice Daily">Twice Daily</option>
                  <option value="Three times Daily">Three times Daily</option>
                  <option value="As Needed">As Needed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Duration</label>
                <input type="text" name="duration" placeholder="e.g. 10 days" value={prescriptionForm.duration} onChange={handleChange} className="w-full border border-gray-200 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5]" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Route</label>
                <select name="route" value={prescriptionForm.route} onChange={handleChange} className="w-full border border-gray-200 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5]">
                  <option value="Oral">Oral</option>
                  <option value="Intravenous (IV)">Intravenous (IV)</option>
                  <option value="Intramuscular (IM)">Intramuscular (IM)</option>
                  <option value="Topical">Topical</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Instructions</label>
                <input type="text" name="instructions" placeholder="Additional notes or instructions..." value={prescriptionForm.instructions} onChange={handleChange} className="w-full border border-gray-200 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5]" />
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={isSubmitting} className="flex items-center px-6 py-2.5 bg-[#003B73] text-white text-sm font-bold rounded hover:bg-blue-900 transition-colors disabled:opacity-50">
                <Plus className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Adding...' : 'Add to Prescription'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs font-semibold text-[#0046B5]">
          Note: You are viewing prescriptions in read-only mode. Only Doctors can write new prescriptions.
        </div>
      )}

      {/* جدول الأدوية الحالية */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mt-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-[#0046B5]" />
            <h3 className="text-lg font-bold text-[#003B73]">Current Prescription Medications</h3>
          </div>
          <span className="px-3 py-1 bg-blue-50 text-[#0046B5] text-xs font-bold rounded-full">
            {filteredPrescriptions.length} Medication{filteredPrescriptions.length === 1 ? '' : 's'}
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
              <tr className="bg-[#F4F5F9] border-b border-gray-200">
                <th className="px-6 py-3 text-xs font-bold text-[#003B73] uppercase">Medication</th>
                <th className="px-6 py-3 text-xs font-bold text-[#003B73] uppercase">Dosage</th>
                <th className="px-6 py-3 text-xs font-bold text-[#003B73] uppercase">Frequency</th>
                <th className="px-6 py-3 text-xs font-bold text-[#003B73] uppercase">Duration</th>
                <th className="px-6 py-3 text-xs font-bold text-[#003B73] uppercase">Route</th>
                <th className="px-6 py-3 text-xs font-bold text-[#003B73] uppercase">Instructions</th>
                <th className="px-6 py-3 text-xs font-bold text-[#003B73] uppercase">Visit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPrescriptions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-400">
                    {currentPrescriptions.length === 0
                      ? 'No prescriptions recorded yet for this patient.'
                      : 'No prescriptions match the selected filters.'}
                  </td>
                </tr>
              ) : (
                filteredPrescriptions.map((med) => (
                  <tr key={med.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-[#0046B5]">{med.medication}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">{med.dosage}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{med.frequency}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{med.duration}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{med.route}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{med.instructions}</td>
                    <td className="px-6 py-4 text-sm text-[#0046B5] font-semibold whitespace-nowrap">Visit #{med.visitId}</td>
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

export default PrescriptionsTab;
