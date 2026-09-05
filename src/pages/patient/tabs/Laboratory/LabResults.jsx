import React, { useState } from 'react';
import { User, Download, FlaskConical, ArrowLeft, CheckCircle2, FileQuestion } from 'lucide-react';
import api from '../../../../utils/api';
import { toast } from '../../../../utils/toast';
import DataFilterBar from '../../../../components/DataFilterBar';

// استخراج الرمز الإنجليزي من اسم التحليل (مثال: "تعداد الدم الكامل (CBC)" -> "CBC")
const extractCode = (name) => {
  if (!name) return '';
  const match = name.match(/\(([^)]+)\)/);
  if (match) return match[1].trim();
  return name.trim();
};

const LabResults = ({ patient, selectedOrder, onBackToOrders }) => {
  const isGlobalView = !patient;
  // حالة تعبئة النتائج لكل طلب (المفتاح هو lab_request_id)
  const [values, setValues] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [filterVisitId, setFilterVisitId] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const visits = patient && patient.visits ? patient.visits : [];

  // استخراج قائمة التحاليل المطلوبة للطلب المختار (مع فصل التحاليل المتعددة بفاصلة)
  const expandedRequests = [];
  if (selectedOrder && selectedOrder.requests) {
    selectedOrder.requests.forEach(req => {
      const rawName = req.testName || '';
      const subTests = (rawName.includes(',') || rawName.includes('،')) 
        ? rawName.split(/[,،]+/).map(s => s.trim()).filter(Boolean) 
        : [rawName];
      
      subTests.forEach((subName, idx) => {
        expandedRequests.push({
          ...req,
          uniqueKey: `${req.lab_request_id}_${idx}`,
          testName: subName
        });
      });
    });
  }

  // استخراج نتائج التحاليل الحقيقية من زيارات المريض (مع فصل التحاليل المتعددة بفاصلة لتظهر كل نتيجة بشكل منفصل)
  const resultsList = [];
  if (patient && patient.visits) {
    patient.visits.forEach(visit => {
      if (visit.lab_requests) {
        visit.lab_requests.forEach(req => {
          if (selectedOrder) {
            const matchesId = selectedOrder.requestIds?.includes(req.lab_request_id) ||
                              selectedOrder.requests?.some(r => r.lab_request_id === req.lab_request_id) || 
                              selectedOrder.id === req.lab_request_id || 
                              selectedOrder.id === `#LAB-${req.lab_request_id}` ||
                              selectedOrder.id === String(req.lab_request_id);
            if (!matchesId) return;
          }

          if (req.status === 'completed' || req.results) {
            const rawName = req.custom_test_name ? extractCode(req.custom_test_name) : (req.lab_test_type ? extractCode(req.lab_test_type.test_name) : 'Lab Test');
            const subTests = (rawName.includes(',') || rawName.includes('،')) 
              ? rawName.split(/[,،]+/).map(s => s.trim()).filter(Boolean) 
              : [rawName];

            subTests.forEach((subName, idx) => {
              resultsList.push({
                id: `${req.lab_request_id}_${idx}`,
                realRequestId: req.lab_request_id,
                testName: subName,
                result: req.results && req.results.trim() !== '' ? req.results : '__',
                range: 'Normal Range',
                date: req.completed_at ? new Date(req.completed_at).toLocaleString() : (req.requested_at ? new Date(req.requested_at).toLocaleString() : 'N/A'),
                status: 'normal',
                filePath: req.file_path,
                visitId: visit.visit_id,
                visitDate: visit.visit_date ? new Date(visit.visit_date.replace(' ', 'T')).toDateString() : ''
              });
            });
          }
        });
      }
    });
  }

  // فلترة النتائج في ملف المريض
  const filteredResults = isGlobalView
    ? resultsList
    : resultsList.filter((r) => {
        if (filterVisitId && Number(r.visitId) !== Number(filterVisitId)) return false;
        if (filterDate) {
          const fd = new Date(filterDate + 'T00:00:00').toDateString();
          if (r.visitDate && r.visitDate !== fd) return false;
        }
        return true;
      });

  const patientName = patient
    ? `${patient.last_name}, ${patient.first_name}`
    : (selectedOrder ? selectedOrder.patientName : 'Patient Records');

  const handleValueChange = (id, value) => {
    setValues(prev => ({ ...prev, [id]: value }));
  };

  const [isSavingAll, setIsSavingAll] = useState(false);

  // حفظ جميع نتائج التحاليل دفعة واحدة (يشترط إدخال جميع القيم ولا يسمح بترك أي تحليل فارغ)
  const handleSaveAllResults = async () => {
    for (const req of expandedRequests) {
      const existingDone = req.results && req.results !== '__' && req.results.trim() !== '';
      const enteredVal = (values[req.uniqueKey] ?? '').trim();
      if (!existingDone && !enteredVal) {
        toast.error(`يرجى إدخال نتيجة للتحليل: "${req.testName}" قبل الحفظ. لا يمكن حفظ الطلب ما لم يتم إدخال نتائج كافة التحاليل.`);
        return;
      }
    }

    setIsSavingAll(true);
    try {
      for (const req of expandedRequests) {
        const enteredVal = values[req.uniqueKey];
        if (enteredVal !== undefined && enteredVal.trim() !== '') {
          await api.post(`/lab-requests/${req.lab_request_id}/complete`, {
            results: enteredVal.trim()
          });
        }
      }
      toast.success('تم حفظ جميع نتائج التحاليل بنجاح!');
      if (onBackToOrders) onBackToOrders();
    } catch (error) {
      console.error('Error saving lab results:', error);
      toast.error('فشل حفظ النتائج.');
    } finally {
      setIsSavingAll(false);
    }
  };

  // ============ عرض إدخال النتائج لطلب مختار (قسم المخبر الجانبي) ============
  if (isGlobalView && selectedOrder && expandedRequests.length > 0) {
    return (
      <div className="flex flex-col space-y-6 mt-4">
        {/* زر العودة لقائمة الطلبات */}
        <button
          onClick={onBackToOrders}
          className="flex items-center text-sm font-bold text-gray-500 hover:text-[#0046B5] transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Laboratory Orders
        </button>

        {/* رأس معلومات المريض والطلب */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-wrap gap-6 items-center justify-between">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center text-[#0046B5] mr-4">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#003B73]">{patientName}</h3>
              <p className="text-xs text-gray-500">{selectedOrder.mrn} • {selectedOrder.date}</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 bg-blue-50 text-[#0046B5] rounded-full">
            {expandedRequests.length} test(s)
          </span>
        </div>

        {/* نموذج تعبئة النتائج */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center p-4 bg-[#F8F9FB] border-b border-[#0046B5] border-b-2">
            <FlaskConical className="h-5 w-5 mr-2 text-[#0046B5]" />
            <h3 className="text-lg font-bold text-[#0046B5]">Enter Laboratory Results</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500">Test Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500">Result Value</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expandedRequests.map((req) => {
                  const hasResult = req.results && req.results.trim() !== '' && req.results !== '__';
                  const currentValue = values[req.uniqueKey] ?? (hasResult ? req.results : '') ?? '';
                  return (
                    <tr key={req.uniqueKey} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-[#003B73]">{req.testName}</td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={currentValue}
                          onChange={(e) => handleValueChange(req.uniqueKey, e.target.value)}
                          placeholder="Enter result value (or leave blank for __)..."
                          className="w-full max-w-md border border-gray-200 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5]"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {hasResult ? (
                          <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-green-50 text-green-600 border border-green-200 uppercase">
                            Completed
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-cyan-50 text-cyan-600 border border-cyan-200 uppercase">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* زر حفظ الكل في أسفل الجدول */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button
              onClick={handleSaveAllResults}
              disabled={isSavingAll}
              className="inline-flex items-center px-6 py-2.5 bg-[#0046B5] text-white text-sm font-bold rounded hover:bg-blue-800 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {isSavingAll ? 'Saving All Results...' : 'Save All Results'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============ عرض عام بدون طلب محدد (قسم المخبر الجانبي - قبل الاختيار) ============
  if (isGlobalView) {
    return (
      <div className="flex flex-col space-y-6 mt-4">
        <div className="bg-white border border-gray-200 rounded-lg p-16 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-4">
            <FileQuestion className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-700">No Order Selected</h3>
          <p className="text-sm text-gray-500 mt-1">Select a laboratory order from the Orders tab to enter its results.</p>
        </div>
      </div>
    );
  }

  // ============ عرض نتائج المريض (تبويب ملف المريض) ============
  return (
    <div className="flex flex-col space-y-6 mt-4">

      {selectedOrder && onBackToOrders && (
        <button
          onClick={onBackToOrders}
          className="flex items-center text-sm font-bold text-gray-500 hover:text-[#0046B5] transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Laboratory Orders
        </button>
      )}

      {/* بطاقة معلومات المريض أو العينات */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-wrap gap-6 items-center">
        <div className="flex items-center">
          <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center text-[#0046B5] mr-4">
            <User className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-[#003B73]">{patientName}</h3>
        </div>
      </div>

      {/* جدول النتائج التفصيلية */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-[#F8F9FB] border-b border-[#0046B5] border-b-2">
          <div className="flex items-center">
            <FlaskConical className="h-5 w-5 mr-2 text-[#0046B5]" />
            <h3 className="text-lg font-bold text-[#0046B5]">Laboratory Test Results</h3>
          </div>
          <span className="px-3 py-1 bg-blue-50 text-[#0046B5] text-xs font-bold rounded-full">
            {filteredResults.length} Result{filteredResults.length === 1 ? '' : 's'}
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
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-bold text-gray-500">Test Name</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500">Result</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500">Result Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500">Visit</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 text-right">Attachment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                    {resultsList.length === 0
                      ? 'No completed laboratory results available yet for this patient.'
                      : 'No laboratory results match the selected filters.'}
                  </td>
                </tr>
              ) : (
                filteredResults.map((test) => (
                  <tr key={test.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-[#003B73]">{test.testName}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{test.result}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-green-50 text-green-600 border border-green-200 uppercase">
                        Completed
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{test.date}</td>
                    <td className="px-6 py-4 text-sm text-[#0046B5] font-semibold whitespace-nowrap">Visit #{test.visitId}</td>
                    <td className="px-6 py-4 text-right">
                      {test.filePath ? (
                        <a href={`http://127.0.0.1:8000${test.filePath}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 bg-blue-50 text-[#0046B5] text-xs font-bold rounded hover:bg-blue-100 transition-colors">
                          <Download className="h-3.5 w-3.5 mr-1" />
                          View File
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">No file</span>
                      )}
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

export default LabResults;