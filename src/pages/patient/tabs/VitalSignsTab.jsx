import React, { useState, useEffect } from 'react';
import { Activity, Heart, Thermometer, Wind, FileText, PlusCircle, Save } from 'lucide-react';
import api from '../../../utils/api';
import { toast } from '../../../utils/toast';
import VisitSelector from '../../../components/VisitSelector';
import DataFilterBar from '../../../components/DataFilterBar';
import { getActiveVisitId, setActiveVisitId, resolveDefaultVisitId } from '../../../utils/activeVisit';

const VitalSignsTab = ({ patient }) => {
  const [patientData, setPatientData] = useState(patient);
  const [selectedVisitId, setSelectedVisitId] = useState(null);
  const [filterVisitId, setFilterVisitId] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [vitalsForm, setVitalsForm] = useState({
    temperature: '36.5',
    blood_pressure: '120/80',
    heart_rate: '72',
    respiratory_rate: '16',
    oxygen_saturation: '98',
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

  // استخراج سجل العلامات الحيوية من جميع زيارات المريض
  const vitalsHistory = [];
  visits.forEach(visit => {
    if (visit.vital_signs) {
      visit.vital_signs.forEach(vs => {
        vitalsHistory.push({
          id: vs.vital_id,
          time: vs.measurement_time,
          bp: vs.blood_pressure || 'N/A',
          hr: vs.heart_rate || 'N/A',
          temp: vs.temperature || 'N/A',
          spo2: vs.oxygen_saturation || 'N/A',
          rr: vs.respiratory_rate || 'N/A',
          staff: vs.nurse ? `Nurse ${vs.nurse.first_name}` : 'Medical Staff',
          isAbnormal: (vs.temperature > 37.5 || vs.heart_rate > 100),
          visitId: visit.visit_id,
          visitDate: visit.visit_date ? new Date(visit.visit_date.replace(' ', 'T')).toDateString() : ''
        });
      });
    }
  });

  // تطبيق الفلترين (حسب الزيارة و التاريخ) على جدول التاريخ
  const filteredVitals = vitalsHistory.filter((v) => {
    if (filterVisitId && Number(v.visitId) !== Number(filterVisitId)) return false;
    if (filterDate) {
      const fd = new Date(filterDate + 'T00:00:00').toDateString();
      if (v.visitDate && v.visitDate !== fd) return false;
    }
    return true;
  });

  // أحدث تسجيل عُلّق في الجدول ليُعرض في البطاقات العلوية
  const latestVital = [...vitalsHistory].sort((a, b) => {
    const ta = a.time ? new Date(a.time.replace(' ', 'T')).getTime() : 0;
    const tb = b.time ? new Date(b.time.replace(' ', 'T')).getTime() : 0;
    return tb - ta;
  })[0] || null;

  // تقييم درجة الانحراف عن الطبيعي وإعطاء درجات اللون الأحمر التدريجية
  const getCardStyle = (type, val) => {
    if (!latestVital) return { bg: 'bg-white border-gray-200 text-gray-900', label: 'Normal' };

    if (type === 'temp') {
      const t = parseFloat(val);
      if (t > 40.0 || t < 34.0) return { bg: 'bg-red-200 border-red-400 text-red-950', label: 'Critical' };
      if (t > 38.5 || t < 35.0) return { bg: 'bg-red-100 border-red-300 text-red-900', label: 'Abnormal' };
      if (t > 37.5 || t < 36.5) return { bg: 'bg-red-50 border-red-200 text-red-800', label: 'Mild' };
    }
    if (type === 'hr') {
      const h = parseInt(val);
      if (h > 150 || h < 40) return { bg: 'bg-red-200 border-red-400 text-red-950', label: 'Critical' };
      if (h > 125 || h < 50) return { bg: 'bg-red-100 border-red-300 text-red-900', label: 'Abnormal' };
      if (h > 100 || h < 60) return { bg: 'bg-red-50 border-red-200 text-red-800', label: 'Mild' };
    }
    if (type === 'bp') {
      const parts = String(val).split('/');
      const sys = parseInt(parts[0]) || 120;
      const dia = parseInt(parts[1]) || 80;
      if (sys > 170 || dia > 110) return { bg: 'bg-red-200 border-red-400 text-red-950', label: 'Critical' };
      if (sys > 145 || dia > 95) return { bg: 'bg-red-100 border-red-300 text-red-900', label: 'Abnormal' };
      if (sys > 120 || dia > 80) return { bg: 'bg-red-50 border-red-200 text-red-800', label: 'Mild' };
    }
    if (type === 'spo2') {
      const s = parseInt(val);
      if (s < 85) return { bg: 'bg-red-200 border-red-400 text-red-950', label: 'Critical' };
      if (s < 90) return { bg: 'bg-red-100 border-red-300 text-red-900', label: 'Abnormal' };
      if (s < 95) return { bg: 'bg-red-50 border-red-200 text-red-800', label: 'Mild' };
    }
    if (type === 'rr') {
      const r = parseInt(val);
      if (r > 30 || r < 8) return { bg: 'bg-red-200 border-red-400 text-red-950', label: 'Critical' };
      if (r > 24 || r < 10) return { bg: 'bg-red-100 border-red-300 text-red-900', label: 'Abnormal' };
      if (r > 20 || r < 12) return { bg: 'bg-red-50 border-red-200 text-red-800', label: 'Mild' };
    }
    return { bg: 'bg-white border-gray-200 text-gray-900', label: 'Normal' };
  };

  const bpStyle = getCardStyle('bp', latestVital ? latestVital.bp : '120/80');
  const hrStyle = getCardStyle('hr', latestVital ? latestVital.hr : '72');
  const tempStyle = getCardStyle('temp', latestVital ? latestVital.temp : '36.8');
  const spo2Style = getCardStyle('spo2', latestVital ? latestVital.spo2 : '98');
  const rrStyle = getCardStyle('rr', latestVital ? latestVital.rr : '16');

  const handleChange = (e) => {
    setVitalsForm({ ...vitalsForm, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedVisit) {
      toast.error('يرجى فتح/اختيار الزيارة أولاً قبل تسجيل العلامات الحيوية!');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        temperature: parseFloat(vitalsForm.temperature),
        blood_pressure: vitalsForm.blood_pressure,
        heart_rate: parseInt(vitalsForm.heart_rate),
        respiratory_rate: parseInt(vitalsForm.respiratory_rate),
        oxygen_saturation: parseInt(vitalsForm.oxygen_saturation),
      };

      await api.post(`/visits/${selectedVisit.visit_id}/vital-signs`, payload);
      toast.success('تم حفظ العلامات الحيوية بنجاح!');
      const res = await api.get(`/patients/${patientData.patient_id}`);
      setPatientData(res.data);
    } catch (error) {
      console.error('Error saving vital signs:', error);
      toast.error('فشل حفظ العلامات الحيوية.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6 mt-4">
      
      {/* عنوان الصفحة */}
      <div>
        <h2 className="text-2xl font-bold text-[#003B73]">Vital Signs Monitoring</h2>
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

      {/* 1. البطاقات الخمس العلوية (Summary Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Blood Pressure */}
        <div className={`border rounded-lg p-4 shadow-sm flex flex-col justify-between transition-colors ${bpStyle.bg}`}>
          <div className="flex justify-between items-start mb-2">
            <div className="h-8 w-8 bg-blue-50 rounded flex items-center justify-center text-[#0046B5]">
              <Activity className="h-4 w-4" />
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${bpStyle.label === 'Normal' ? 'bg-green-100 text-green-700' : 'bg-red-200 text-red-900'}`}>{bpStyle.label}</span>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Blood Pressure</p>
            <div className="flex items-baseline">
              <span className={`text-3xl font-bold ${bpStyle.text}`}>{latestVital ? latestVital.bp : '120/80'}</span>
              <span className="text-xs text-gray-500 ml-1">mmHg</span>
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-gray-200/50 text-[10px] font-semibold text-gray-600">
            Normal: 90-120 / 60-80
          </div>
        </div>

        {/* Heart Rate */}
        <div className={`border rounded-lg p-4 shadow-sm flex flex-col justify-between transition-colors ${hrStyle.bg}`}>
          <div className="flex justify-between items-start mb-2">
            <div className="h-8 w-8 bg-red-50 rounded flex items-center justify-center text-red-500">
              <Heart className="h-4 w-4 fill-current" />
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${hrStyle.label === 'Normal' ? 'bg-green-100 text-green-700' : 'bg-red-200 text-red-900'}`}>{hrStyle.label}</span>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Heart Rate</p>
            <div className="flex items-baseline">
              <span className={`text-3xl font-bold ${hrStyle.text}`}>{latestVital ? latestVital.hr : '72'}</span>
              <span className="text-xs text-gray-500 ml-1">bpm</span>
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-gray-200/50 text-[10px] font-semibold text-gray-600">
            Normal: 60 - 100 bpm
          </div>
        </div>

        {/* Temperature */}
        <div className={`border rounded-lg p-4 shadow-sm flex flex-col justify-between transition-colors ${tempStyle.bg}`}>
          <div className="flex justify-between items-start mb-2">
            <div className="h-8 w-8 bg-teal-50 rounded flex items-center justify-center text-teal-500">
              <Thermometer className="h-4 w-4" />
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${tempStyle.label === 'Normal' ? 'bg-green-100 text-green-700' : 'bg-red-200 text-red-900'}`}>{tempStyle.label}</span>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Temperature</p>
            <div className="flex items-baseline">
              <span className={`text-3xl font-bold ${tempStyle.text}`}>{latestVital ? latestVital.temp : '36.8'}</span>
              <span className="text-xs text-gray-500 ml-1">°C</span>
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-gray-200/50 text-[10px] font-semibold text-gray-600">
            Normal: 36.5 - 37.5 °C
          </div>
        </div>

        {/* SPO2 */}
        <div className={`border rounded-lg p-4 shadow-sm flex flex-col justify-between transition-colors ${spo2Style.bg}`}>
          <div className="flex justify-between items-start mb-2">
            <div className="h-8 w-8 bg-purple-50 rounded flex items-center justify-center text-purple-500">
              <Wind className="h-4 w-4" />
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${spo2Style.label === 'Normal' ? 'bg-green-100 text-green-700' : 'bg-red-200 text-red-900'}`}>{spo2Style.label}</span>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">SPO2</p>
            <div className="flex items-baseline">
              <span className={`text-3xl font-bold ${spo2Style.text}`}>{latestVital ? latestVital.spo2 : '98'}</span>
              <span className="text-xs text-gray-500 ml-1">%</span>
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-gray-200/50 text-[10px] font-semibold text-gray-600">
            Normal: 95 - 100 %
          </div>
        </div>

        {/* Respiratory Rate */}
        <div className={`border rounded-lg p-4 shadow-sm flex flex-col justify-between transition-colors ${rrStyle.bg}`}>
          <div className="flex justify-between items-start mb-2">
            <div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center text-gray-600">
              <FileText className="h-4 w-4" />
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${rrStyle.label === 'Normal' ? 'bg-green-100 text-green-700' : 'bg-red-200 text-red-900'}`}>{rrStyle.label}</span>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Respiratory Rate</p>
            <div className="flex items-baseline">
              <span className={`text-3xl font-bold ${rrStyle.text}`}>{latestVital ? latestVital.rr : '16'}</span>
              <span className="text-xs text-gray-500 ml-1">bpm</span>
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-gray-200/50 text-[10px] font-semibold text-gray-600">
            Normal: 12 - 20 bpm
          </div>
        </div>

      </div>

      {/* 2. فورم الإدخال السريع (Quick Entry) */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="flex items-center text-[#003B73] font-bold text-lg mb-6">
          <PlusCircle className="h-5 w-5 mr-2 text-[#0046B5]" />
          Quick Entry: New Vitals
        </div>
        
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Temperature (°C)</label>
              <input type="number" step="0.1" name="temperature" value={vitalsForm.temperature} onChange={handleChange} className="w-full border border-gray-200 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5]" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Blood Pressure (MMHG)</label>
              <input type="text" name="blood_pressure" value={vitalsForm.blood_pressure} onChange={handleChange} className="w-full border border-gray-200 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5]" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Heart Rate (BPM)</label>
              <input type="number" name="heart_rate" value={vitalsForm.heart_rate} onChange={handleChange} className="w-full border border-gray-200 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5]" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Respiratory Rate (BPM)</label>
              <input type="number" name="respiratory_rate" value={vitalsForm.respiratory_rate} onChange={handleChange} className="w-full border border-gray-200 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5]" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Oxygen Saturation (%)</label>
              <input type="number" name="oxygen_saturation" value={vitalsForm.oxygen_saturation} onChange={handleChange} className="w-full border border-gray-200 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5]" />
            </div>
          </div>
          
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={isSubmitting} className="flex items-center px-6 py-2.5 bg-[#0046B5] text-white text-sm font-bold rounded hover:bg-blue-800 transition-colors disabled:opacity-50">
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Save Vitals'}
            </button>
          </div>
        </form>
      </div>

      {/* 3. جدول التاريخ (Chronological History) */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-[#003B73]">Chronological History</h3>
          <span className="px-3 py-1 bg-blue-50 text-[#0046B5] text-xs font-bold rounded-full">
            {filteredVitals.length} Record{filteredVitals.length === 1 ? '' : 's'}
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
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">BP (MMHG)</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">HR (BPM)</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Temp (°C)</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">SPO2 (%)</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">RR (BPM)</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Visit</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Staff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVitals.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-400">
                    {vitalsHistory.length === 0
                      ? 'No vital signs recorded yet for this patient.'
                      : 'No vital signs match the selected filters.'}
                  </td>
                </tr>
              ) : (
                filteredVitals.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-700">{v.time}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{v.bp}</td>
                    <td className={`px-6 py-4 text-sm font-bold ${v.isAbnormal ? 'text-red-500' : 'text-gray-700'}`}>{v.hr}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{v.temp}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{v.spo2}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{v.rr}</td>
                    <td className="px-6 py-4 text-sm text-[#0046B5] font-semibold whitespace-nowrap">Visit #{v.visitId}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{v.staff}</td>
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

export default VitalSignsTab;
