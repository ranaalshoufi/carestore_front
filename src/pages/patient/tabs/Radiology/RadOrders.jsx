import React, { useState, useEffect } from 'react';
import { ClipboardList, RefreshCw, Disc, Eye, Activity, BadgeCheck, ShieldCheck, Search, X } from 'lucide-react';
import api from '../../../../utils/api';
import { toast } from '../../../../utils/toast';
import VisitSelector from '../../../../components/VisitSelector';
import DataFilterBar from '../../../../components/DataFilterBar';
import { setActiveVisitId, resolveDefaultVisitId } from '../../../../utils/activeVisit';

// استخراج الاسم الإنجليزي لنوع الأشعة من اسم الإجراء (مثال: "أشعة سينية للصدر (Chest X-Ray)" -> "Chest X-Ray")
const extractEnglish = (name) => {
  if (!name) return 'Radiology Scan';
  const match = name.match(/\(([^)]+)\)/);
  if (match) return match[1].trim();
  // إن لم يوجد بين قوسين، حاول إرجاع جزء إنكليزي إن وُجد
  const eng = name.match(/[A-Za-z][A-Za-z \-']*/);
  if (eng && eng[0].trim().length > 1) return eng[0].trim();
  return name.trim();
};

const RadOrders = ({ patient, onSelectOrder }) => {
  const [patientData, setPatientData] = useState(patient);
  const [selectedVisitId, setSelectedVisitId] = useState(null);
  const [filterVisitId, setFilterVisitId] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const [radiologyTypes, setRadiologyTypes] = useState([]);
  const [selectedTypeIds, setSelectedTypeIds] = useState([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalWorkflows, setGlobalWorkflows] = useState([]);
  const [globalSearch, setGlobalSearch] = useState('');
  const [globalStatus, setGlobalStatus] = useState('ALL');

  useEffect(() => {
    setPatientData(patient);
  }, [patient]);

  const isGlobalView = !patientData;

  useEffect(() => {
    if (patientData && patientData.visits && patientData.visits.length > 0) {
      const resolved = resolveDefaultVisitId(patientData.patient_id, patientData.visits);
      setSelectedVisitId(resolved);
      setActiveVisitId(patientData.patient_id, resolved);
    }
  }, [patientData]);

  const visits = patientData && patientData.visits ? patientData.visits : [];
  const selectedVisit = visits.find((v) => Number(v.visit_id) === Number(selectedVisitId)) || null;

  useEffect(() => {
    const fetchRadiologyTypes = async () => {
      try {
        const response = await api.get('/radiology-types');
        setRadiologyTypes(response.data);
      } catch (error) {
        console.error('Error fetching radiology types:', error);
      }
    };
    fetchRadiologyTypes();

    if (isGlobalView) {
      const fetchGlobalRad = async () => {
        try {
          const res = await api.get('/department/radiology-orders');
          setGlobalWorkflows(res.data);
        } catch (error) {
          console.error('Error fetching global radiology orders:', error);
        }
      };
      fetchGlobalRad();
    }
  }, [isGlobalView]);

  // استخراج طلبات الأشعة من زيارات المريض أو العرض العام
  const workflows = [];
  if (isGlobalView) {
    globalWorkflows.forEach(req => {
      const englishModality = extractEnglish(req.modality);
      workflows.push({
        id: req.radiology_request_id,
        patientName: req.patientName,
        mrn: req.mrn,
        modality: req.notes ? `${englishModality} (${req.notes})` : englishModality,
        englishModality,
        notes: req.notes || '',
        report: req.report,
        image_path: req.image_path,
        statusCode: req.status,
        date: req.date,
        icon: <Activity className="h-4 w-4" />,
        priority: 'ROUTINE',
        priorityColor: 'bg-gray-100 text-gray-600',
        status: req.status.charAt(0) + req.status.slice(1).toLowerCase(),
        statusColor: req.status === 'COMPLETED' ? 'text-[#0046B5]' : 'text-teal-600'
      });
    });
  } else if (patientData && patientData.visits) {
    patientData.visits.forEach(visit => {
      if (visit.radiology_requests && visit.radiology_requests.length > 0) {
        const groups = {};
        visit.radiology_requests.forEach(req => {
          const timeKey = req.requested_at ? req.requested_at.substring(0, 19) : 'unknown';
          if (!groups[timeKey]) {
            groups[timeKey] = {
              id: req.radiology_request_id,
              radNames: [],
              notes: req.notes || '',
              status: req.status ? req.status.charAt(0).toUpperCase() + req.status.slice(1) : 'Requested',
              date: req.requested_at ? new Date(req.requested_at).toLocaleString() : 'N/A'
            };
          }
          const name = req.radiology_type ? req.radiology_type.procedure_name : 'Radiology Scan';
          let cleanName = name;
          if (name.includes('أشعة سينية') || name.includes('X-Ray')) cleanName = 'X-Ray';
          else if (name.includes('طبقي') || name.includes('CT')) cleanName = 'CT';
          else if (name.includes('رنين') || name.includes('MRI')) cleanName = 'MRI';
          else if (name.includes('إيكو') || name.includes('Ultrasound')) cleanName = 'Ultrasound';
          else if (name.includes('(')) cleanName = name.split('(')[0].trim();

          groups[timeKey].radNames.push(cleanName);
          if (req.notes) groups[timeKey].notes = req.notes;
        });

        Object.keys(groups).forEach(timeKey => {
          const group = groups[timeKey];
          const displayText = group.notes ? `${group.radNames.join(', ')} (${group.notes})` : group.radNames.join(', ');

          workflows.push({
            id: group.id,
            modality: displayText,
            date: group.date,
            icon: <Activity className="h-4 w-4" />,
            priority: 'ROUTINE',
            priorityColor: 'bg-gray-100 text-gray-600',
            status: group.status,
            statusColor: group.status === 'Completed' ? 'text-[#0046B5]' : 'text-teal-600',
            visitId: visit.visit_id,
            visitDate: visit.visit_date ? new Date(visit.visit_date.replace(' ', 'T')).toDateString() : ''
          });
        });
      }
    });
  }

  // فلترة طلبات الأشعة في ملف المريض أو العرض العام
  const filteredWorkflows = isGlobalView
    ? workflows.filter((w) => {
        const q = globalSearch.trim().toLowerCase();
        if (q) {
          const hay = `${w.patientName || ''} ${w.mrn || ''} ${w.modality || ''} ${w.notes || ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (globalStatus !== 'ALL') {
          const code = (w.statusCode || w.status || '').toUpperCase();
          if (globalStatus === 'PENDING') {
            if (!['REQUESTED', 'IN_PROGRESS', 'PENDING'].includes(code)) return false;
          } else if (code !== globalStatus) {
            return false;
          }
        }
        return true;
      })
    : workflows.filter((w) => {
        if (filterVisitId && Number(w.visitId) !== Number(filterVisitId)) return false;
        if (filterDate) {
          const fd = new Date(filterDate + 'T00:00:00').toDateString();
          if (w.visitDate && w.visitDate !== fd) return false;
        }
        return true;
      });

  const [orderForm, setOrderForm] = useState({
    patientName: patientData ? `${patientData.last_name}, ${patientData.first_name}` : '',
    mrn: patientData ? patientData.mrn : '',
    modality: '',
    priority: 'Routine',
    bodyPart: '',
    clinicalIndication: ''
  });

  const handleChange = (e) => {
    setOrderForm({ ...orderForm, [e.target.name]: e.target.value });
  };

  const setPriority = (level) => {
    setOrderForm({ ...orderForm, priority: level });
  };

  const handleToggleType = (id) => {
    setSelectedTypeIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isGlobalView) {
      toast.error('يرجى الدخول لملف المريض المحدد لطلب أشعة.');
      return;
    }

    if (selectedTypeIds.length === 0) {
      toast.error('يرجى اختيار نوع أشعة واحد على الأقل.');
      return;
    }

    setIsSubmitting(true);
    try {
      let visitId = selectedVisit ? selectedVisit.visit_id : null;

      // إنشاء زيارة تلقائياً للمريض فقط في حال عدم وجود أي زيارة
      if (!visitId && visits.length === 0) {
        const visitRes = await api.post('/visits', {
          patient_id: patientData.patient_id,
          chief_complaint: 'طلب تصوير شعاعي',
          status: 'open'
        });
        visitId = visitRes.data.visit.visit_id;
      }

      if (!visitId) {
        toast.error('يرجى فتح/اختيار الزيارة أولاً قبل إنشاء طلب الأشعة.');
        setIsSubmitting(false);
        return;
      }

      const payload = {
        radiology_type_ids: selectedTypeIds.map(id => parseInt(id)),
        notes: notes || orderForm.clinicalIndication || null
      };

      await api.post(`/visits/${visitId}/radiology-orders`, payload);
      toast.success('تم إرسال طلب الأشعة بنجاح!');
      setSelectedTypeIds([]);
      setNotes('');
      const res = await api.get(`/patients/${patientData.patient_id}`);
      setPatientData(res.data);
    } catch (error) {
      console.error('Error creating radiology order:', error);
      toast.error('فشل إرسال طلب الأشعة.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4 mt-2">
      {!isGlobalView && (
        <VisitSelector
          visits={visits}
          selectedVisitId={selectedVisitId}
          onChange={(id) => {
            setSelectedVisitId(id);
            setActiveVisitId(patientData.patient_id, id);
          }}
        />
      )}

      <div className={`grid gap-6 ${isGlobalView ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'}`}>

      {/* العمود الأيسر (الفورم) - يظهر فقط داخل ملف المريض */}
      {!isGlobalView && (
      <div className="lg:col-span-5 flex flex-col space-y-4">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <div className="flex items-center text-[#003B73] font-bold text-lg mb-5 border-b border-gray-100 pb-3">
            <ClipboardList className="h-5 w-5 mr-2" />
            Order Details
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Patient Name</label>
                <input type="text" name="patientName" value={orderForm.patientName} onChange={handleChange} disabled={!isGlobalView} placeholder="Full Name" className={`w-full border border-gray-200 rounded p-2 text-sm outline-none ${!isGlobalView ? 'bg-gray-50 cursor-not-allowed' : 'bg-white focus:border-[#0046B5]'}`} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Patient ID / MRN</label>
                <input type="text" name="mrn" value={orderForm.mrn} onChange={handleChange} disabled={!isGlobalView} placeholder="e.g. MRN-12345" className={`w-full border border-gray-200 rounded p-2 text-sm outline-none ${!isGlobalView ? 'bg-gray-50 cursor-not-allowed' : 'bg-white focus:border-[#0046B5]'}`} />
              </div>
            </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Radiology Types (Multiple Selection)</label>
                <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
                  {radiologyTypes.map(rt => (
                    <label key={rt.radiology_type_id} className="flex items-center space-x-2 text-sm font-semibold text-gray-700 cursor-pointer hover:text-[#0046B5] transition-colors">
                      <input 
                        type="checkbox" 
                        checked={selectedTypeIds.includes(rt.radiology_type_id)} 
                        onChange={() => handleToggleType(rt.radiology_type_id)}
                        className="h-4 w-4 rounded border-gray-300 text-[#0046B5] focus:ring-[#0046B5]" 
                      />
                      <span>{rt.procedure_name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Clinical Indication / Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="3" placeholder="Brief clinical summary and reason for exam..." className="w-full border border-gray-200 rounded p-2 text-sm outline-none focus:border-[#0046B5] bg-white resize-none"></textarea>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full py-2.5 bg-[#0046B5] text-white text-sm font-bold rounded hover:bg-blue-800 transition-colors mt-2 disabled:opacity-50">
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
          </form>
        </div>
        <div className="bg-[#EEF2FC] border border-[#D5E3F8] rounded-lg p-4 flex items-center">
          <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-[#0046B5] shadow-sm mr-4">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#0046B5] uppercase tracking-wider">QA Score (Avg)</p>
            <p className="text-xl font-bold text-[#003B73]">98.2%</p>
          </div>
        </div>
      </div>
      )}

      {/* العمود الأيمن (مسار العمل المحدث مع Date Issued) */}
      <div className={`bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden ${!isGlobalView ? 'lg:col-span-7' : ''}`}>
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <div className="flex items-center text-[#003B73] font-bold text-lg">
            <ClipboardList className="h-5 w-5 mr-2" />
            {isGlobalView ? 'Radiology Department - All Patient Imaging Requests' : 'Active Workflow'}
          </div>
          <button onClick={() => window.location.reload()} className="text-gray-400 hover:text-gray-700 transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {!isGlobalView && (
          <DataFilterBar
            visits={visits}
            visitFilter={filterVisitId}
            onVisitChange={setFilterVisitId}
            dateFilter={filterDate}
            onDateChange={setFilterDate}
            onReset={() => { setFilterVisitId(''); setFilterDate(''); }}
          />
        )}

        {/* فلتر العرض العام (قسم الأشعة): البحث وحالة الطلب */}
        {isGlobalView && (
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-[260px]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Search by patient name, MRN or modality..."
                  className="w-full border border-gray-200 rounded-lg bg-white pl-9 pr-3 py-2 text-sm text-gray-800 outline-none focus:border-[#0046B5]"
                />
                {globalSearch && (
                  <button
                    onClick={() => setGlobalSearch('')}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 mr-1">Status:</span>
              {['ALL', 'PENDING', 'COMPLETED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setGlobalStatus(st)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    globalStatus === st
                      ? 'bg-[#0046B5] text-white shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {st.charAt(0) + st.slice(1).toLowerCase()}
                </button>
              ))}
              <span className="ml-2 text-xs font-semibold px-2.5 py-1 bg-blue-50 text-[#0046B5] rounded-full">
                {filteredWorkflows.length} Request{filteredWorkflows.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-x-auto p-5 pt-0">
          <table className="w-full text-left border-collapse mt-2 min-w-[500px]">
            <thead>
              <tr className="border-b-2 border-[#003B73]">
                {isGlobalView && <th className="py-3 text-[11px] font-bold text-[#003B73] uppercase tracking-wider">Patient Name</th>}
                <th className="py-3 text-[11px] font-bold text-[#003B73] uppercase tracking-wider">Modality</th>
                <th className="py-3 text-[11px] font-bold text-[#003B73] uppercase tracking-wider">Date Issued</th>
                {!isGlobalView && <th className="py-3 text-[11px] font-bold text-[#003B73] uppercase tracking-wider">Visit</th>}
                <th className="py-3 text-[11px] font-bold text-[#003B73] uppercase tracking-wider text-center">Priority</th>
                <th className="py-3 text-[11px] font-bold text-[#003B73] uppercase tracking-wider text-right">Status</th>
                {isGlobalView && <th className="py-3 text-[11px] font-bold text-[#003B73] uppercase tracking-wider text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredWorkflows.length === 0 ? (
                <tr>
                  <td colSpan={isGlobalView ? 6 : 5} className="py-8 text-center text-gray-400">
                    {workflows.length === 0
                      ? 'No radiology requests recorded yet.'
                      : 'No radiology requests match the selected filters.'}
                  </td>
                </tr>
              ) : (
                filteredWorkflows.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onSelectOrder && onSelectOrder(item)}
                    className={`transition-colors ${isGlobalView ? 'cursor-pointer hover:bg-blue-50' : 'hover:bg-gray-50'}`}
                  >
                    {isGlobalView && <td className="py-4 text-sm font-bold text-gray-700 whitespace-nowrap">{item.patientName}</td>}
                    <td className="py-4 flex items-center text-sm font-semibold text-gray-800 whitespace-nowrap">
                      <span className="text-gray-500 mr-3">{item.icon}</span>
                      {item.modality}
                    </td>
                    <td className="py-4 text-sm text-gray-600 whitespace-nowrap">{item.date}</td>
                    {!isGlobalView && (
                      <td className="py-4 text-sm text-[#0046B5] font-semibold whitespace-nowrap">
                        Visit #{item.visitId}
                      </td>
                    )}
                    <td className="py-4 text-center">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${item.priorityColor}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className={`py-4 text-sm font-semibold text-right flex items-center justify-end whitespace-nowrap ${item.statusColor}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current mr-2"></span>
                      {item.status}
                    </td>
                    {isGlobalView && (
                      <td className="py-4 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); onSelectOrder && onSelectOrder(item); }}
                          className="inline-flex items-center px-3 py-1.5 bg-[#0046B5] text-white text-xs font-bold rounded hover:bg-blue-800 transition-colors"
                        >
                          Enter Results
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
};


export default RadOrders;