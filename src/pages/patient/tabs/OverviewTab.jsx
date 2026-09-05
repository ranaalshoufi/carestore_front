import React, { useState } from 'react';
import { User, IdCard, Phone, Activity, HeartPulse, RotateCcw, Pencil, Trash2, Plus, X, TimerReset, AlertCircle, Scissors, Stethoscope, Check } from 'lucide-react';
import api from '../../../utils/api';
import { toast } from '../../../utils/toast';

const STATUS_LABELS = {
  active: 'نشط',
  controlled: 'مسيطر عليه',
  resolved: 'تعافى',
};

const STATUS_STYLES = {
  active: 'bg-red-100 text-red-700',
  controlled: 'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700',
};

const SEVERITY_LABELS = {
  mild: 'خفيفة',
  moderate: 'متوسطة',
  severe: 'شديدة',
};

const SEVERITY_STYLES = {
  mild: 'bg-green-100 text-green-700',
  moderate: 'bg-amber-100 text-amber-700',
  severe: 'bg-red-100 text-red-700',
};

const EMPTY_CD = { disease_name: '', diagnosis_date: '', status: 'active', notes: '' };
const EMPTY_AL = { allergy_name: '', severity: 'moderate', reaction: '', notes: '' };
const EMPTY_SU = { surgery_name: '', facility_name: '', surgery_date: '', notes: '' };

const inputClass = "w-full border border-gray-200 rounded-lg bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5] focus:bg-white transition-colors";
const labelClass = "block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5";

const OverviewTab = ({ patient }) => {
  const [chronic, setChronic] = useState(Array.isArray(patient.chronic_diseases) ? patient.chronic_diseases : []);
  const [allergies, setAllergies] = useState(Array.isArray(patient.allergies) ? patient.allergies : []);
  const [surgeries, setSurgeries] = useState(Array.isArray(patient.surgeries) ? patient.surgeries : []);

  // نماذج الإضافة
  const [cdForm, setCdForm] = useState(EMPTY_CD);
  const [alForm, setAlForm] = useState(EMPTY_AL);
  const [suForm, setSuForm] = useState(EMPTY_SU);

  // حالة التعديل: { type, id, form }
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState({ cd: false, al: false, su: false });
  const [submitting, setSubmitting] = useState({ cd: false, al: false, su: false });

  const refresh = async () => {
    try {
      const res = await api.get(`/patients/${patient.patient_id}`);
      setChronic(res.data.chronic_diseases || []);
      setAllergies(res.data.allergies || []);
      setSurgeries(res.data.surgeries || []);
    } catch (e) {
      console.error('Error refreshing medical history:', e);
    }
  };

  const saveChronic = async (e) => {
    e.preventDefault();
    setSubmitting((s) => ({ ...s, cd: true }));
    try {
      if (editing?.type === 'cd') {
        await api.put(`/patients/chronic-diseases/${editing.id}`, cdForm);
        toast.success('تم تحديث المرض المزمن بنجاح');
      } else {
        await api.post(`/patients/${patient.patient_id}/chronic-diseases`, cdForm);
        toast.success('تم إضافة المرض المزمن بنجاح');
      }
      setCdForm(EMPTY_CD);
      setEditing(null);
      setShowForm((s) => ({ ...s, cd: false }));
      await refresh();
    } catch (err) {
      console.error(err);
      toast.error('فشل حفظ المرض المزمن');
    } finally {
      setSubmitting((s) => ({ ...s, cd: false }));
    }
  };

  const saveAllergy = async (e) => {
    e.preventDefault();
    setSubmitting((s) => ({ ...s, al: true }));
    try {
      if (editing?.type === 'al') {
        await api.put(`/patients/allergies/${editing.id}`, alForm);
        toast.success('تم تحديث الحساسية بنجاح');
      } else {
        await api.post(`/patients/${patient.patient_id}/allergies`, alForm);
        toast.success('تم إضافة الحساسية بنجاح');
      }
      setAlForm(EMPTY_AL);
      setEditing(null);
      setShowForm((s) => ({ ...s, al: false }));
      await refresh();
    } catch (err) {
      console.error(err);
      toast.error('فشل حفظ الحساسية');
    } finally {
      setSubmitting((s) => ({ ...s, al: false }));
    }
  };

  const saveSurgery = async (e) => {
    e.preventDefault();
    setSubmitting((s) => ({ ...s, su: true }));
    try {
      if (editing?.type === 'su') {
        await api.put(`/patients/surgeries/${editing.id}`, suForm);
        toast.success('تم تحديث العملية الجراحية بنجاح');
      } else {
        await api.post(`/patients/${patient.patient_id}/surgeries`, suForm);
        toast.success('تم إضافة العملية الجراحية بنجاح');
      }
      setSuForm(EMPTY_SU);
      setEditing(null);
      setShowForm((s) => ({ ...s, su: false }));
      await refresh();
    } catch (err) {
      console.error(err);
      toast.error('فشل حفظ العملية الجراحية');
    } finally {
      setSubmitting((s) => ({ ...s, su: false }));
    }
  };

  const startEdit = (type, id, form) => {
    setEditing({ type, id });
    if (type === 'cd') setCdForm(form);
    if (type === 'al') setAlForm(form);
    if (type === 'su') setSuForm(form);
    setShowForm({ cd: type === 'cd', al: type === 'al', su: type === 'su' });
  };

  const cancelEdit = (type) => {
    setEditing(null);
    if (type === 'cd') setCdForm(EMPTY_CD);
    if (type === 'al') setAlForm(EMPTY_AL);
    if (type === 'su') setSuForm(EMPTY_SU);
    setShowForm({ cd: false, al: false, su: false });
  };

  const removeRecord = async (type, id) => {
    if (!window.confirm('هل تريد حذف هذا السجل؟')) return;
    try {
      if (type === 'cd') await api.delete(`/patients/chronic-diseases/${id}`);
      if (type === 'al') await api.delete(`/patients/allergies/${id}`);
      if (type === 'su') await api.delete(`/patients/surgeries/${id}`);
      toast.success('تم الحذف بنجاح');
      await refresh();
    } catch (err) {
      console.error(err);
      toast.error('فشل الحذف');
    }
  };

  // ====== عارض السجلات الفرعية (شائع) ======
  const renderEmpty = (msg) => (
    <div className="text-center py-8">
      <div className="mx-auto h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
        <RotateCcw className="h-5 w-5 text-gray-300" />
      </div>
      <p className="text-sm text-gray-400 font-medium">{msg}</p>
    </div>
  );

  const formActions = (type, isEditing) => (
    <div className="flex items-center gap-3 justify-end pt-1">
      <button
        type="button"
        onClick={() => cancelEdit(type)}
        className="flex items-center px-4 py-2 text-xs font-bold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <X className="h-3.5 w-3.5 mr-1.5" />
        إلغاء
      </button>
      <button
        type="submit"
        disabled={submitting[type]}
        className="flex items-center px-5 py-2 text-xs font-bold text-white bg-[#0046B5] rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50"
      >
        <Check className="h-3.5 w-3.5 mr-1.5" />
        {submitting[type] ? 'حفظ...' : isEditing ? 'حفظ التعديل' : 'إضافة'}
      </button>
    </div>
  );

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-6 border-b border-gray-100 pb-3">
            <User className="h-5 w-5 text-[#0046B5] mr-2" />
            <h3 className="text-lg font-bold text-[#003B73]">Patient Demographics</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Full Name</p><p className="text-sm font-semibold text-gray-800">{patient.first_name} {patient.last_name}</p></div>
            <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Father Name</p><p className="text-sm font-semibold text-gray-800">{patient.father_name || 'N/A'}</p></div>
            <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Date of Birth</p><p className="text-sm font-semibold text-gray-800">{patient.birth_date}</p></div>
            <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Sex / Gender</p><p className="text-sm font-semibold text-gray-800">{patient.gender}</p></div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-6 border-b border-gray-100 pb-3">
            <IdCard className="h-5 w-5 text-[#0046B5] mr-2" />
            <h3 className="text-lg font-bold text-[#003B73]">Identifiers</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Medical Record Number (MRN)</p><p className="text-sm font-bold text-[#0046B5] bg-blue-50 w-fit px-2 py-1 rounded">{patient.mrn}</p></div>
            <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">National ID / SSN</p><p className="text-sm font-semibold text-gray-800">{patient.national_id}</p></div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-6 border-b border-gray-100 pb-3">
            <Phone className="h-5 w-5 text-[#0046B5] mr-2" />
            <h3 className="text-lg font-bold text-[#003B73]">Contact & Address</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Primary Phone</p><p className="text-sm font-semibold text-gray-800">{patient.phone || 'N/A'}</p></div>
            <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Physical Address</p><p className="text-sm font-semibold text-gray-800">{patient.address || 'N/A'}</p></div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-6 border-b border-gray-100 pb-3">
            <Activity className="h-5 w-5 text-[#0046B5] mr-2" />
            <h3 className="text-lg font-bold text-[#003B73]">Baseline Data</h3>
          </div>
          <div className="grid grid-cols-1 gap-6">
            <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Blood Type</p><p className="text-sm font-bold text-red-500">{patient.blood_type}</p></div>
            <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Height</p><p className="text-sm font-semibold text-gray-800">{patient.height} cm</p></div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-6 border-b border-gray-100 pb-3">
            <HeartPulse className="h-5 w-5 text-[#0046B5] mr-2" />
            <h3 className="text-lg font-bold text-[#003B73]">Emergency Contact</h3>
          </div>
          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
            <p className="text-sm font-bold text-gray-800 mb-2">{patient.emergency_contact?.split(' - ')[0] || 'N/A'}</p>
            <div className="flex items-center text-sm font-medium text-gray-600">
              <Phone className="h-3.5 w-3.5 mr-2 text-gray-400" />
              {patient.emergency_contact?.split(' - ')[1] || 'N/A'}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* ====== السجل الطبي بعرض الصفحة الكامل ====== */}
    <div className="mt-6">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-2 border-b border-gray-100 pb-3">
          <Stethoscope className="h-5 w-5 text-[#0046B5] mr-2" />
          <h3 className="text-lg font-bold text-[#003B73]">Medical History</h3>
          <span className="text-xs font-semibold text-gray-400 mr-auto">{chronic.length + allergies.length + surgeries.length} records</span>
        </div>
          <p className="text-sm text-gray-500 mb-5 mt-3">Chronic diseases, allergies and previous surgeries for this patient.</p>

          {/* ==== الأمراض المزمنة ==== */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#0046B5]" />
                <h4 className="text-sm font-bold text-gray-800">الأمراض المزمنة</h4>
                <span className="text-[11px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{chronic.length}</span>
              </div>
              {!showForm.cd && (
                <button
                  type="button"
                  onClick={() => { setShowForm({ cd: true }); setEditing(null); setCdForm(EMPTY_CD); }}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#0046B5] border border-[#0046B5]/30 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  إضافة مرض مزمن
                </button>
              )}
            </div>

            {showForm.cd && (
              <form onSubmit={saveChronic} className="border border-blue-100 bg-blue-50/40 rounded-lg p-4 mb-3 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className={labelClass}>اسم المرض *</label>
                    <input required className={inputClass} name="disease_name" value={cdForm.disease_name} onChange={(e) => setCdForm({ ...cdForm, disease_name: e.target.value })} placeholder="مثال: سكري من النوع الثاني" />
                  </div>
                  <div>
                    <label className={labelClass}>تاريخ التشخيص</label>
                    <input type="date" className={inputClass} name="diagnosis_date" value={cdForm.diagnosis_date} onChange={(e) => setCdForm({ ...cdForm, diagnosis_date: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>الحالة</label>
                    <select className={inputClass} name="status" value={cdForm.status} onChange={(e) => setCdForm({ ...cdForm, status: e.target.value })}>
                      <option value="active">نشط</option>
                      <option value="controlled">مسيطر عليه</option>
                      <option value="resolved">تعافى</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>ملاحظات</label>
                  <textarea rows={2} className={inputClass} name="notes" value={cdForm.notes} onChange={(e) => setCdForm({ ...cdForm, notes: e.target.value })} placeholder="ملاحظات إضافية (اختياري)" />
                </div>
                {formActions('cd', editing?.type === 'cd')}
              </form>
            )}

            {chronic.length === 0 ? (
              renderEmpty('لا توجد أمراض مزمنة مسجلة')
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {chronic.map((c) => (
                  <div key={c.chronic_id} className="border border-gray-200 rounded-lg p-4 bg-gray-50/40 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-gray-800">{c.disease_name}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">تشخيص: {c.diagnosis_date || '—'}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${STATUS_STYLES[c.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[c.status] || c.status}
                      </span>
                    </div>
                    {c.notes && <p className="text-xs text-gray-500 mt-2">{c.notes}</p>}
                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100">
                      <button type="button" onClick={() => startEdit('cd', c.chronic_id, { disease_name: c.disease_name, diagnosis_date: c.diagnosis_date || '', status: c.status || 'active', notes: c.notes || '' })} className="flex items-center gap-1 text-[11px] font-bold text-[#0046B5] px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                        <Pencil className="h-3 w-3" /> تعديل
                      </button>
                      <button type="button" onClick={() => removeRecord('cd', c.chronic_id)} className="flex items-center gap-1 text-[11px] font-bold text-red-500 px-2 py-1 rounded hover:bg-red-50 transition-colors">
                        <Trash2 className="h-3 w-3" /> حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 my-2" />

          {/* ==== الحساسية ==== */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-[#0046B5]" />
                <h4 className="text-sm font-bold text-gray-800">الحساسية</h4>
                <span className="text-[11px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{allergies.length}</span>
              </div>
              {!showForm.al && (
                <button
                  type="button"
                  onClick={() => { setShowForm({ al: true }); setEditing(null); setAlForm(EMPTY_AL); }}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#0046B5] border border-[#0046B5]/30 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  إضافة حساسية
                </button>
              )}
            </div>

            {showForm.al && (
              <form onSubmit={saveAllergy} className="border border-blue-100 bg-blue-50/40 rounded-lg p-4 mb-3 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className={labelClass}>اسم الحساسية *</label>
                    <input required className={inputClass} name="allergy_name" value={alForm.allergy_name} onChange={(e) => setAlForm({ ...alForm, allergy_name: e.target.value })} placeholder="مثال: بنسلين" />
                  </div>
                  <div>
                    <label className={labelClass}>الشدة</label>
                    <select className={inputClass} name="severity" value={alForm.severity} onChange={(e) => setAlForm({ ...alForm, severity: e.target.value })}>
                      <option value="mild">خفيفة</option>
                      <option value="moderate">متوسطة</option>
                      <option value="severe">شديدة</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>التفاعل</label>
                    <input className={inputClass} name="reaction" value={alForm.reaction} onChange={(e) => setAlForm({ ...alForm, reaction: e.target.value })} placeholder="مثال: طفح جلدي" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>ملاحظات</label>
                  <textarea rows={2} className={inputClass} name="notes" value={alForm.notes} onChange={(e) => setAlForm({ ...alForm, notes: e.target.value })} placeholder="ملاحظات إضافية (اختياري)" />
                </div>
                {formActions('al', editing?.type === 'al')}
              </form>
            )}

            {allergies.length === 0 ? (
              renderEmpty('لا توجد حساسيات مسجلة')
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {allergies.map((a) => (
                  <div key={a.allergy_id} className="border border-gray-200 rounded-lg p-4 bg-gray-50/40 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-gray-800">{a.allergy_name}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">التفاعل: {a.reaction || '—'}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${SEVERITY_STYLES[a.severity] || 'bg-gray-100 text-gray-600'}`}>
                        {SEVERITY_LABELS[a.severity] || a.severity}
                      </span>
                    </div>
                    {a.notes && <p className="text-xs text-gray-500 mt-2">{a.notes}</p>}
                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100">
                      <button type="button" onClick={() => startEdit('al', a.allergy_id, { allergy_name: a.allergy_name, severity: a.severity || 'moderate', reaction: a.reaction || '', notes: a.notes || '' })} className="flex items-center gap-1 text-[11px] font-bold text-[#0046B5] px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                        <Pencil className="h-3 w-3" /> تعديل
                      </button>
                      <button type="button" onClick={() => removeRecord('al', a.allergy_id)} className="flex items-center gap-1 text-[11px] font-bold text-red-500 px-2 py-1 rounded hover:bg-red-50 transition-colors">
                        <Trash2 className="h-3 w-3" /> حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 my-2" />

          {/* ==== العمليات الجراحية السابقة ==== */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Scissors className="h-4 w-4 text-[#0046B5]" />
                <h4 className="text-sm font-bold text-gray-800">العمليات الجراحية السابقة</h4>
                <span className="text-[11px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{surgeries.length}</span>
              </div>
              {!showForm.su && (
                <button
                  type="button"
                  onClick={() => { setShowForm({ su: true }); setEditing(null); setSuForm(EMPTY_SU); }}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#0046B5] border border-[#0046B5]/30 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  إضافة عملية جراحية
                </button>
              )}
            </div>

            {showForm.su && (
              <form onSubmit={saveSurgery} className="border border-blue-100 bg-blue-50/40 rounded-lg p-4 mb-3 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className={labelClass}>اسم العملية *</label>
                    <input required className={inputClass} name="surgery_name" value={suForm.surgery_name} onChange={(e) => setSuForm({ ...suForm, surgery_name: e.target.value })} placeholder="مثال: استئصال الزائدة" />
                  </div>
                  <div>
                    <label className={labelClass}>المنشأة / المستشفى</label>
                    <input className={inputClass} name="facility_name" value={suForm.facility_name} onChange={(e) => setSuForm({ ...suForm, facility_name: e.target.value })} placeholder="اسم المستشفى" />
                  </div>
                  <div>
                    <label className={labelClass}>التاريخ</label>
                    <input type="date" className={inputClass} name="surgery_date" value={suForm.surgery_date} onChange={(e) => setSuForm({ ...suForm, surgery_date: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>ملاحظات</label>
                  <textarea rows={2} className={inputClass} name="notes" value={suForm.notes} onChange={(e) => setSuForm({ ...suForm, notes: e.target.value })} placeholder="ملاحظات إضافية (اختياري)" />
                </div>
                {formActions('su', editing?.type === 'su')}
              </form>
            )}

            {surgeries.length === 0 ? (
              renderEmpty('لا توجد عمليات جراحية مسجلة')
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {surgeries.map((s) => (
                  <div key={s.surgery_id} className="border border-gray-200 rounded-lg p-4 bg-gray-50/40 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-gray-800">{s.surgery_name}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{s.facility_name || 'المكان غير محدد'} • {s.surgery_date || '—'}</p>
                      </div>
                      <TimerReset className="h-4 w-4 text-gray-300" />
                    </div>
                    {s.notes && <p className="text-xs text-gray-500 mt-2">{s.notes}</p>}
                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100">
                      <button type="button" onClick={() => startEdit('su', s.surgery_id, { surgery_name: s.surgery_name, facility_name: s.facility_name || '', surgery_date: s.surgery_date || '', notes: s.notes || '' })} className="flex items-center gap-1 text-[11px] font-bold text-[#0046B5] px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                        <Pencil className="h-3 w-3" /> تعديل
                      </button>
                      <button type="button" onClick={() => removeRecord('su', s.surgery_id)} className="flex items-center gap-1 text-[11px] font-bold text-red-500 px-2 py-1 rounded hover:bg-red-50 transition-colors">
                        <Trash2 className="h-3 w-3" /> حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
    </div>
    </>
  );
};

export default OverviewTab;