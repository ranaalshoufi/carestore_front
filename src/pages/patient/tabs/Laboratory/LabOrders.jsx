import React, { useState, useEffect } from 'react';
import { User, Plus, X, Search } from 'lucide-react';
import api from '../../../../utils/api';
import { toast } from '../../../../utils/toast';
import VisitSelector from '../../../../components/VisitSelector';
import DataFilterBar from '../../../../components/DataFilterBar';
import { setActiveVisitId, resolveDefaultVisitId } from '../../../../utils/activeVisit';

const LabOrders = ({ patient, onSelectOrder }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [labTypes, setLabTypes] = useState([]);
  const [selectedTestIds, setSelectedTestIds] = useState([]);
  const [customTestInput, setCustomTestInput] = useState('');
  const [customTestsList, setCustomTestsList] = useState([]);
  const [priority, setPriority] = useState('Routine');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalOrders, setGlobalOrders] = useState([]);
  const [patientData, setPatientData] = useState(patient);
  const [selectedVisitId, setSelectedVisitId] = useState(null);
  const [filterVisitId, setFilterVisitId] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [globalStatus, setGlobalStatus] = useState('ALL');

  // مزامنة بيانات المريض عند تغييرها من الصفحة الأب
  useEffect(() => {
    setPatientData(patient);
  }, [patient]);

  const isGlobalView = !patientData;

  // تحديد الزيارة الافتراضية في ملف المريض
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
    const fetchLabTypes = async () => {
      try {
        const response = await api.get('/lab-test-types');
        setLabTypes(response.data);
      } catch (error) {
        console.error('Error fetching lab test types:', error);
      }
    };
    fetchLabTypes();

    if (isGlobalView) {
      const fetchGlobalOrders = async () => {
        try {
          const res = await api.get('/department/lab-orders');
          setGlobalOrders(res.data);
        } catch (error) {
          console.error('Error fetching global lab orders:', error);
        }
      };
      fetchGlobalOrders();
    }
  }, [isGlobalView]);

  // استخراج الرمز الإنجليزي من اسم التحليل (مثال: "تعداد الدم الكامل (CBC)" -> "CBC")
  const extractCode = (name) => {
    if (!name) return '';
    const match = name.match(/\(([^)]+)\)/);
    if (match) return match[1].trim();
    return name.trim();
  };

  // استخراج طلبات المختبر من زيارات المريض أو العرض العام
  const orders = [];
  if (isGlobalView) {
    // تجميع الطلبات العامة حسب (المريض + وقت الطلب) بحيث كل طلب في سطر واحد
    const groups = new Map();
    globalOrders.forEach(req => {
      const timeKey = req.requested_at ? req.requested_at : 'unknown';
      const groupKey = `${req.patient_id}-${timeKey}`;
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          id: req.id,
          patientName: req.patientName,
          mrn: req.mrn,
          testNames: [],
          requests: [],
          status: req.status,
          statusColor: req.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-cyan-50 text-cyan-700 border border-cyan-100',
          date: req.date
        });
      }
      groups.get(groupKey).testNames.push(extractCode(req.testName));
      groups.get(groupKey).requests.push({
        lab_request_id: req.lab_request_id,
        testName: extractCode(req.testName),
        results: req.results,
        status: req.status
      });
    });
    groups.forEach(group => {
      orders.push({
        id: group.id,
        patientName: group.patientName,
        mrn: group.mrn,
        test: group.testNames.join(', '),
        status: group.status,
        statusColor: group.statusColor,
        date: group.date,
        requests: group.requests
      });
    });
  } else if (patientData && patientData.visits) {
    patientData.visits.forEach(visit => {
      if (visit.lab_requests && visit.lab_requests.length > 0) {
        const groups = {};
        visit.lab_requests.forEach(req => {
          const timeKey = req.requested_at ? req.requested_at.substring(0, 19) : 'unknown';
          if (!groups[timeKey]) {
            groups[timeKey] = {
              id: req.lab_request_id,
              requestIds: [],
              testNames: [],
              status: req.status ? req.status.toUpperCase() : 'PENDING',
              date: req.requested_at ? new Date(req.requested_at).toLocaleString() : 'N/A'
            };
          }
          groups[timeKey].requestIds.push(req.lab_request_id);
          const name = req.custom_test_name 
            ? extractCode(req.custom_test_name) 
            : (req.lab_test_type ? extractCode(req.lab_test_type.test_name) : 'Lab Test');
          groups[timeKey].testNames.push(name);
        });

        Object.keys(groups).forEach(timeKey => {
          const group = groups[timeKey];
          orders.push({
            id: `#LAB-${group.id}`,
            requestIds: group.requestIds,
            test: group.testNames.join(', '),
            status: group.status,
            statusColor: group.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-cyan-50 text-cyan-700 border border-cyan-100',
            date: group.date,
            visitId: visit.visit_id,
            visitDate: visit.visit_date ? new Date(visit.visit_date.replace(' ', 'T')).toDateString() : ''
          });
        });
      }
    });
  }

  // فلترة الطلبات في عرض ملف المريض والعرض العام
  const filteredOrders = isGlobalView
    ? orders.filter((o) => {
        if (globalSearch.trim()) {
          const q = globalSearch.toLowerCase().trim();
          const pName = (o.patientName || '').toLowerCase();
          const mrn = (o.mrn || '').toLowerCase();
          const test = (o.test || '').toLowerCase();
          if (!pName.includes(q) && !mrn.includes(q) && !test.includes(q)) return false;
        }
        if (globalStatus && globalStatus !== 'ALL') {
          const statusUpper = (o.status || '').toUpperCase();
          if (globalStatus === 'COMPLETED') {
            if (statusUpper !== 'COMPLETED') return false;
          } else if (globalStatus === 'PENDING') {
            if (statusUpper === 'COMPLETED') return false;
          }
        }
        return true;
      })
    : orders.filter((o) => {
        if (filterVisitId && Number(o.visitId) !== Number(filterVisitId)) return false;
        if (filterDate) {
          const fd = new Date(filterDate + 'T00:00:00').toDateString();
          if (o.visitDate && o.visitDate !== fd) return false;
        }
        return true;
      });

  const handleToggleTest = (id) => {
    setSelectedTestIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleAddCustomTest = () => {
    if (customTestInput.trim()) {
      if (!customTestsList.includes(customTestInput.trim())) {
        setCustomTestsList([...customTestsList, customTestInput.trim()]);
      }
      setCustomTestInput('');
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (isGlobalView) {
      return;
    }

    const allCustomTests = [...customTestsList];
    if (customTestInput.trim() && !allCustomTests.includes(customTestInput.trim())) {
      allCustomTests.push(customTestInput.trim());
    }
    const finalCustomTestName = allCustomTests.join(', ');

    if (selectedTestIds.length === 0 && !finalCustomTestName) {
      toast.error('يرجى اختيار تحليل واحد على الأقل أو كتابة تحليل مخصص.');
      return;
    }

    setIsSubmitting(true);
    try {
      let visitId = selectedVisit ? selectedVisit.visit_id : null;

      // إنشاء زيارة تلقائياً للمريض فقط إذا لم توجد أي زيارات سابقة
      if (!visitId && visits.length === 0) {
        const visitRes = await api.post('/visits', {
          patient_id: patientData.patient_id,
          chief_complaint: 'طلب تحليل مخبري',
          status: 'open'
        });
        visitId = visitRes.data.visit.visit_id;
      }

      if (!visitId) {
        toast.error('يرجى فتح/اختيار الزيارة أولاً قبل إنشاء طلب المختبر.');
        setIsSubmitting(false);
        return;
      }

      const payload = {
        test_type_ids: selectedTestIds.map(id => parseInt(id)),
        custom_test_name: finalCustomTestName || null,
        notes: notes ? `[Priority: ${priority}] ${notes}` : `[Priority: ${priority}]`
      };

      await api.post(`/visits/${visitId}/lab-orders`, payload);
      toast.success('تم إنشاء طلب المختبر بنجاح!');
      setIsModalOpen(false);
      setSelectedTestIds([]);
      setCustomTestInput('');
      setCustomTestsList([]);
      setNotes('');
      setPriority('Routine');
      const res = await api.get(`/patients/${patientData.patient_id}`);
      setPatientData(res.data);
    } catch (error) {
      console.error('Error creating lab order:', error);
      toast.error('فشل إنشاء طلب المختبر.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6 mt-4 relative">
      
      {/* الترويسة الذكية: تتغير حسب مكان فتح الصفحة */}
      {isGlobalView ? (
        // 1. ترويسة القسم العام (من الشريط الجانبي) - بدون زر إضافة
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-[#003B73]">Central Laboratory Dashboard</h2>
            <p className="text-sm text-gray-500">Overview of all patient laboratory orders and statuses</p>
          </div>
        </div>
      ) : (
        // 2. ترويسة ملف المريض الخاص (كما برمجناها سابقاً)
        <>
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-6 flex-1">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-cyan-50 rounded-lg flex items-center justify-center text-cyan-600 mr-4">
                  <User className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 whitespace-nowrap">{patientData.last_name}, {patientData.first_name}</h3>
              </div>
              <div className="hidden lg:block h-10 w-px bg-gray-200 mx-2"></div>
              <div className="hidden md:grid flex-1 grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">MRN Number</p>
                  <p className="text-sm font-bold text-gray-900">{patientData.mrn}</p>
                </div>
              </div>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="flex items-center px-4 py-2.5 bg-[#003B73] text-white text-sm font-semibold rounded hover:bg-blue-900 transition-colors">
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </button>
          </div>

          {/* محدد الزيارة المشترك */}
          <VisitSelector
            visits={visits}
            selectedVisitId={selectedVisitId}
            onChange={(id) => {
              setSelectedVisitId(id);
              setActiveVisitId(patientData.patient_id, id);
            }}
          />
        </>
      )}

      {/* جدول طلبات المختبر */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-bold text-[#003B73]">
            {isGlobalView ? 'Laboratory Department - All Patient Orders' : 'Laboratory Orders'}
          </h3>
          {isGlobalView ? (
            <span className="text-xs font-semibold px-3 py-1 bg-blue-50 text-[#0046B5] rounded-full">
              Sorted by Urgency & Time
            </span>
          ) : (
            <span className="text-xs font-semibold px-3 py-1 bg-blue-50 text-[#0046B5] rounded-full">
              {filteredOrders.length} Order{filteredOrders.length === 1 ? '' : 's'}
            </span>
          )}
        </div>

        {/* فلتر الجدول المشترك في ملف المريض فقط */}
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

        {/* فلتر العرض العام (قسم المختبر): البحث وحالة الطلب */}
        {isGlobalView && (
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-[260px]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Search by patient name, MRN or test..."
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
                {filteredOrders.length} Order{filteredOrders.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-bold text-gray-900">Order ID</th>
                {isGlobalView && <th className="px-6 py-4 text-xs font-bold text-gray-900">Patient Name</th>}
                <th className="px-6 py-4 text-xs font-bold text-gray-900">Test Name</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-900">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-900">Date</th>
                {!isGlobalView && <th className="px-6 py-4 text-xs font-bold text-gray-900">Visit</th>}
                {isGlobalView && <th className="px-6 py-4 text-xs font-bold text-gray-900 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={isGlobalView ? 6 : 5} className="px-6 py-8 text-center text-gray-400">
                    {orders.length === 0
                      ? 'No laboratory orders recorded yet.'
                      : 'No laboratory orders match the selected filters.'}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, index) => (
                  <tr
                    key={index}
                    onClick={() => {
                      if (isGlobalView || order.status === 'COMPLETED') {
                        onSelectOrder && onSelectOrder(order);
                      }
                    }}
                    className={`transition-colors ${isGlobalView || order.status === 'COMPLETED' ? 'cursor-pointer hover:bg-blue-50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-6 py-4 text-sm text-[#0046B5] font-medium">{order.id}</td>
                    {isGlobalView && <td className="px-6 py-4 text-sm font-bold text-gray-700">{order.patientName}</td>}
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{order.test}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${order.statusColor}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{order.date}</td>
                    {!isGlobalView && (
                      <td className="px-6 py-4 text-sm text-[#0046B5] font-semibold whitespace-nowrap">
                        Visit #{order.visitId}
                      </td>
                    )}
                    {isGlobalView && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); onSelectOrder && onSelectOrder(order); }}
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

      {/* مودل إضافة طلب جديد */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] border border-gray-100">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-base font-bold text-[#1E293B]">Add New Laboratory Order</h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateOrder} className="p-6 space-y-4 overflow-y-auto flex-1 text-left">
              
              {/* Patient Info */}
              {isGlobalView ? (
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">SEARCH PATIENT</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input type="text" placeholder="Search by MRN or Name..." className="w-full bg-[#F0F3FA] rounded-lg pl-9 pr-3 py-2 text-xs text-gray-800 outline-none focus:ring-1 focus:ring-blue-400 border-0" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">PATIENT NAME</label>
                    <input 
                      type="text" 
                      disabled 
                      value={`${patient.last_name}, ${patient.first_name}`} 
                      className="w-full bg-[#F0F3FA] rounded-lg px-3 py-2 text-xs font-semibold text-gray-800 border-0 cursor-not-allowed" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">PATIENT ID / MRN</label>
                    <input 
                      type="text" 
                      disabled 
                      value={patient.mrn} 
                      className="w-full bg-[#F0F3FA] rounded-lg px-3 py-2 text-xs font-semibold text-gray-800 border-0 cursor-not-allowed" 
                    />
                  </div>
                </div>
              )}

              {/* Priority */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">PRIORITY</label>
                <div className="relative">
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-[#F0F3FA] appearance-none rounded-lg px-3 py-2 text-xs font-semibold text-gray-800 border-0 outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer pr-8"
                  >
                    <option value="Routine">Routine</option>
                    <option value="Urgent">Urgent</option>
                    <option value="STAT">STAT</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Select Tests Container */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">SELECT TESTS</label>
                <div className="bg-[#F0F3FA] p-3.5 rounded-xl border-0 max-h-56 overflow-y-auto">
                  <div className="grid grid-cols-3 gap-2">
                    {labTypes.map(t => {
                      const isSelected = selectedTestIds.includes(t.test_type_id);
                      return (
                        <button
                          key={t.test_type_id}
                          type="button"
                          onClick={() => handleToggleTest(t.test_type_id)}
                          className={`text-[11px] font-bold uppercase tracking-tight py-2 px-3 rounded-lg border transition-colors ${
                            isSelected
                              ? 'bg-[#003B73] text-white border-[#003B73] shadow-sm'
                              : 'bg-white text-[#1E293B] border-gray-200 hover:border-[#003B73] hover:text-[#003B73]'
                          }`}
                        >
                          {t.test_name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Test Name + Add Button */}
                <div className="flex gap-2 mt-2.5">
                  <input 
                    type="text" 
                    value={customTestInput} 
                    onChange={(e) => setCustomTestInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomTest();
                      }
                    }}
                    placeholder="Enter custom test name..." 
                    className="flex-1 bg-[#F0F3FA] rounded-lg px-3 py-2 text-xs text-gray-800 placeholder-gray-400 border-0 outline-none focus:ring-1 focus:ring-blue-400" 
                  />
                  <button 
                    type="button"
                    onClick={handleAddCustomTest}
                    className="bg-[#003B73] hover:bg-[#002B5C] text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center justify-center transition-colors whitespace-nowrap"
                  >
                    + Add
                  </button>
                </div>

                {/* Badges for added custom tests */}
                {customTestsList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {customTestsList.map((ct, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 bg-blue-100 text-[#003B73] text-[10px] font-bold px-2.5 py-1 rounded-md">
                        {ct}
                        <button type="button" onClick={() => setCustomTestsList(customTestsList.filter((_, i) => i !== idx))} className="hover:text-red-500 ml-1">
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">NOTES</label>
                <textarea 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  placeholder="Enter clinical notes..." 
                  rows="3" 
                  className="w-full bg-[#F0F3FA] rounded-lg p-3 text-xs text-gray-800 placeholder-gray-400 border-0 outline-none focus:ring-1 focus:ring-blue-400 resize-none"
                ></textarea>
              </div>

              {/* Footer */}
              <div className="flex justify-end items-center gap-3 pt-3 border-t border-gray-100 mt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-5 py-2.5 bg-white border border-gray-300 text-xs font-semibold text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="px-6 py-2.5 bg-[#003B73] hover:bg-[#002B5C] text-white text-xs font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabOrders;