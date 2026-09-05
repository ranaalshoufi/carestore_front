import React, { useState, useEffect } from 'react';
import { FileText, BriefcaseMedical, History, CheckCircle } from 'lucide-react';
import api from '../../../utils/api';
import { toast } from '../../../utils/toast';
import VisitSelector from '../../../components/VisitSelector';
import { getActiveVisitId, setActiveVisitId, resolveDefaultVisitId } from '../../../utils/activeVisit';

const MedicationAdministrationTab = ({ patient }) => {
  const [patientData, setPatientData] = useState(patient);
  const [selectedVisitId, setSelectedVisitId] = useState(null);
  const [adminForm, setAdminForm] = useState({
    itemId: '',
    administrationTime: '',
    route: 'Oral',
    status: 'given',
    notes: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setPatientData(patient);
  }, [patient]);

  useEffect(() => {
    const visitsArr = patient && patient.visits ? patient.visits : [];
    if (visitsArr.length > 0) {
      const resolved = resolveDefaultVisitId(patient.patient_id, visitsArr);
      setSelectedVisitId(resolved);
      setActiveVisitId(patient.patient_id, resolved);
    }
  }, [patient]);

  const visits = (patientData && patientData.visits) ? patientData.visits : [];
  const selectedVisit = visits.find((v) => Number(v.visit_id) === Number(selectedVisitId)) || null;

  // عناصر الأدوية الموصوفة الخاصة بالزيارة المحددة فقط
  const prescribedMedications = [];
  if (selectedVisit && selectedVisit.prescriptions) {
    selectedVisit.prescriptions.forEach((pres) => {
      if (pres.prescription_items) {
        pres.prescription_items.forEach((item) => {
          prescribedMedications.push({
            id: item.item_id,
            prescriptionId: pres.prescription_id,
            medication: item.medication_name || 'Medication',
            dose: item.dosage || '—',
            frequency: item.frequency || '—',
            route: item.route || '—',
            duration: item.duration || '—',
            status: item.status || 'active',
            administrations: item.administrations || []
          });
        });
      }
    });
  }

  // سجل الإعطاءات الخاصة بهذه الزيارة فقط
  const administrationLog = [];
  prescribedMedications.forEach((med) => {
    med.administrations.forEach((adm) => {
      const nurse = adm.nurse;
      administrationLog.push({
        id: adm.administration_id,
        medication: med.medication,
        time: adm.administration_time ? new Date(adm.administration_time).toLocaleString() : 'N/A',
        status: adm.status || 'given',
        notes: adm.notes || '',
        nurseName: nurse ? `${nurse.first_name} ${nurse.last_name}` : 'Nursing Staff',
        dose: med.dose
      });
    });
  });
  administrationLog.sort((a, b) => new Date(b.time) - new Date(a.time));

  const statusConfig = {
    given: { label: 'Administered', color: 'bg-green-100 text-green-700' },
    refused: { label: 'Refused', color: 'bg-red-100 text-red-700' },
    missed: { label: 'Missed', color: 'bg-yellow-100 text-yellow-700' },
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setAdminForm((prev) => {
      const next = { ...prev, [e.target.name]: val };
      if (e.target.name === 'itemId') {
        const med = prescribedMedications.find((m) => String(m.id) === val);
        if (med && med.route && med.route !== '—') next.route = med.route;
      }
      return next;
    });
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!adminForm.itemId) {
      toast.error('يرجى اختيار الدواء الذي سيُعطى.');
      return;
    }
    if (!adminForm.administrationTime) {
      toast.error('يرجى تحديد تاريخ ووقت الإعطاء.');
      return;
    }
    setIsSaving(true);
    try {
      await api.post('/medication-administrations', {
        item_id: adminForm.itemId,
        administration_time: adminForm.administrationTime,
        status: adminForm.status,
        notes: adminForm.notes
      });
      toast.success('تم تسجيل إعطاء الدواء بنجاح!');
      setAdminForm((f) => ({ ...f, administrationTime: '', notes: '' }));
      const res = await api.get(`/patients/${patientData.patient_id}`);
      setPatientData(res.data);
    } catch (error) {
      console.error('Error saving medication administration:', error);
      toast.error('فشل تسجيل إعطاء الدواء.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6 mt-4">

      {/* الترويسة */}
      <div>
        <h2 className="text-2xl font-bold text-[#003B73]">Medication Administration</h2>
        <p className="text-sm text-gray-500 mt-1">Daily Schedule</p>
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

      {/* 1. جدول الأدوية الموصوفة */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-center p-4 bg-[#F8F9FB] border-b border-gray-100">
          <FileText className="h-5 w-5 mr-2 text-[#0046B5]" />
          <h3 className="text-lg font-bold text-[#003B73]">Prescribed Medications</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Medication</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Dose</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Frequency</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Route</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Duration</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {prescribedMedications.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                    {selectedVisit
                      ? 'No prescribed medications found for this visit.'
                      : 'Select a visit to view its prescribed medications.'}
                  </td>
                </tr>
              ) : (
                prescribedMedications.map((med) => (
                  <tr key={med.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{med.medication}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{med.dose}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{med.frequency}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{med.route}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{med.duration}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${med.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {med.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. فورم تسجيل إعطاء الدواء */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="flex items-center text-[#003B73] font-bold text-lg mb-6">
          <BriefcaseMedical className="h-5 w-5 mr-2 text-[#0046B5]" />
          Administer Medication
        </div>

        <form onSubmit={handleConfirm} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Medication</label>
              <select name="itemId" value={adminForm.itemId} onChange={handleChange} disabled={!selectedVisit || prescribedMedications.length === 0} className="w-full border border-gray-300 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5] disabled:opacity-50">
                <option value="">Select Medication...</option>
                {prescribedMedications.map((med) => (
                  <option key={med.id} value={String(med.id)}>
                    {med.medication} ({med.dose})
                  </option>
                ))}
              </select>
              {prescribedMedications.length === 0 && selectedVisit && (
                <p className="text-[11px] text-amber-600 mt-1 font-medium">No prescriptions for this visit. Please add a prescription first.</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Date & Time</label>
              <input type="datetime-local" name="administrationTime" value={adminForm.administrationTime} onChange={handleChange} disabled={!selectedVisit} className="w-full border border-gray-300 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5] disabled:opacity-50" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Route</label>
              <select name="route" value={adminForm.route} onChange={handleChange} disabled={!selectedVisit} className="w-full border border-gray-300 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5] disabled:opacity-50">
                <option value="Oral">Oral</option>
                <option value="IV">IV</option>
                <option value="IM">IM</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
              <select name="status" value={adminForm.status} onChange={handleChange} disabled={!selectedVisit} className="w-full border border-gray-300 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5] disabled:opacity-50">
                <option value="given">Administered</option>
                <option value="refused">Refused</option>
                <option value="missed">Missed</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-end mt-2">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-gray-700 mb-1">Notes</label>
              <input type="text" name="notes" placeholder="Add administration notes..." value={adminForm.notes} onChange={handleChange} disabled={!selectedVisit} className="w-full border border-gray-300 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5] disabled:opacity-50" />
            </div>
            <button type="submit" disabled={isSaving || !selectedVisit} className="flex items-center justify-center px-6 py-2.5 bg-[#003B73] text-white text-sm font-bold rounded hover:bg-blue-900 transition-colors whitespace-nowrap disabled:opacity-50">
              <CheckCircle className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Confirm Administration'}
            </button>
          </div>
        </form>
      </div>

      {/* 3. سجل الإعطاءات السابقة */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-center p-4 bg-[#F8F9FB] border-b border-gray-100">
          <History className="h-5 w-5 mr-2 text-[#0046B5]" />
          <h3 className="text-lg font-bold text-[#003B73]">Medication Administration Log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Medication</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Admin Time</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Notes</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Nurse Name</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {administrationLog.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                    {selectedVisit
                      ? 'No medication administrations recorded yet for this visit.'
                      : 'Select a visit to view its medication administration log.'}
                  </td>
                </tr>
              ) : (
                administrationLog.map((log) => {
                  const cfg = statusConfig[log.status] || statusConfig.given;
                  return (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">{log.medication} <span className="text-gray-400 text-xs">({log.dose})</span></td>
                      <td className="px-6 py-4 text-sm text-gray-900">{log.time}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{log.notes || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{log.nurseName}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default MedicationAdministrationTab;
