import React, { useState, useEffect } from 'react';
import { Search, FileQuestion, Download, ImageIcon, ArrowLeft, Eye, Upload, Send, CheckCircle2 } from 'lucide-react';
import api from '../../../../utils/api';
import { toast } from '../../../../utils/toast';
import DataFilterBar from '../../../../components/DataFilterBar';

// استخراج الاسم الإنجليزي لنوع الأشعة من اسم الإجراء
const extractEnglish = (name) => {
  if (!name) return 'Radiology Study';
  const match = name.match(/\(([^)]+)\)/);
  if (match) return match[1].trim();
  const eng = name.match(/[A-Za-z][A-Za-z \-']*/);
  if (eng && eng[0].trim().length > 1) return eng[0].trim();
  return name.trim();
};

const getFullImageUrl = (pathOrUrl) => {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }
  return `http://127.0.0.1:8000${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
};

const RadResults = ({ patient, selectedOrder, onBackToOrders }) => {
  const isGlobalView = !patient;
  const [searchQuery, setSearchQuery] = useState('');
  const [isResultVisible, setIsResultVisible] = useState(!isGlobalView);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filterVisitId, setFilterVisitId] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const visits = patient && patient.visits ? patient.visits : [];

  // حالة نموذج إدخال النتائج (قسم الأشعة الجانبي)
  const [reportText, setReportText] = useState(selectedOrder && selectedOrder.report ? selectedOrder.report : '');
  const [file, setFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim() !== '') {
      setIsResultVisible(true);
    }
  };

  const patientInitials = patient ? `${patient.first_name[0]}${patient.last_name[0]}` : 'JD';
  const patientName = patient
    ? `${patient.first_name} ${patient.last_name}`
    : (selectedOrder ? selectedOrder.patientName : 'Patient Records');
  const patientDOB = patient ? patient.birth_date : 'N/A';

  // قائمة الفحوصات الشعاعية الحقيقية (من زيارات المريض)
  const pastExams = [];
  if (patient && patient.visits) {
    patient.visits.forEach(visit => {
      if (visit.radiology_requests) {
        visit.radiology_requests.forEach(req => {
          if (req.status === 'completed' || req.report) {
            const rawName = req.radiology_type ? req.radiology_type.procedure_name : 'Radiology Scan';
            pastExams.push({
              id: req.radiology_request_id,
              date: req.completed_at ? new Date(req.completed_at).toLocaleDateString() : (req.requested_at ? new Date(req.requested_at).toLocaleDateString() : 'N/A'),
              modality: extractEnglish(rawName),
              bodyPart: req.notes || 'Imaging Study',
              status: 'Final',
              report: req.report || 'No written report available for this study.',
              image_path: req.image_url || req.image_path,
              visitId: visit.visit_id,
              visitDate: visit.visit_date ? new Date(visit.visit_date.replace(' ', 'T')).toDateString() : ''
            });
          }
        });
      }
    });
  }

  useEffect(() => {
    if (!isGlobalView && selectedOrder && pastExams.length > 0) {
      const match = pastExams.find(e => Number(e.id) === Number(selectedOrder.id || selectedOrder.radiology_request_id));
      if (match) setSelectedReport(match);
    }
  }, [selectedOrder, pastExams]);

  // فلترة الفحوصات في ملف المريض
  const filteredExams = isGlobalView
    ? pastExams
    : pastExams.filter((exam) => {
        if (selectedOrder) {
          const matchId = Number(exam.id) === Number(selectedOrder.id || selectedOrder.radiology_request_id);
          if (!matchId) return false;
        }
        if (filterVisitId && Number(exam.visitId) !== Number(filterVisitId)) return false;
        if (filterDate) {
          const fd = new Date(filterDate + 'T00:00:00').toDateString();
          if (exam.visitDate && exam.visitDate !== fd) return false;
        }
        return true;
      });

  const isSelectedDone = selectedOrder && (selectedOrder.statusCode === 'COMPLETED' || !!selectedOrder.report || !!selectedOrder.image_path);

  // حفظ نتيجة الأشعة (تقرير + صورة/فيديو)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!reportText.trim()) {
      toast.error('يرجى كتابة تقرير قراءة الصورة قبل الحفظ.');
      return;
    }
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('report', reportText.trim());
      if (file) formData.append('image', file);
      await api.post(`/radiology-requests/${selectedOrder.id}/complete`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('تم حفظ تقرير ونتيجة الأشعة بنجاح!');
    } catch (error) {
      console.error('Error saving radiology result:', error);
      toast.error('فشل حفظ النتيجة.');
    } finally {
      setIsSaving(false);
    }
  };

  // ============ نموذج إدخال النتائج للطلب المختار (قسم الأشعة الجانبي) ============
  if (isGlobalView && selectedOrder) {
    const hasExistingMedia = !!selectedOrder.image_path;
    const isImage = selectedOrder.image_path && /\.(jpg|jpeg|png|webp|gif)$/i.test(selectedOrder.image_path);
    const isVideo = selectedOrder.image_path && /\.(mp4|webm|mov|mpeg|avi|m4v)$/i.test(selectedOrder.image_path);
    const selectedFileType = file ? (file.type.startsWith('video') ? 'video' : (file.type.startsWith('image') ? 'image' : 'other')) : null;

    return (
      <div className="flex flex-col space-y-6 mt-4">
        {/* زر العودة لقائمة الطلبات */}
        <button
          onClick={onBackToOrders}
          className="flex items-center text-sm font-bold text-gray-500 hover:text-[#0046B5] transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Radiology Orders
        </button>

        {/* رأس معلومات المريض والطلب */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-wrap gap-6 items-center justify-between">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-[#42C2DE] rounded-lg flex items-center justify-center text-white font-bold mr-4">
              {patientInitials}
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#003B73]">{patientName}</h3>
              <p className="text-xs text-gray-500">{selectedOrder.mrn} • {selectedOrder.modality} • {selectedOrder.date}</p>
            </div>
          </div>
          {isSelectedDone ? (
            <span className="text-xs font-semibold px-3 py-1.5 bg-green-50 text-green-600 rounded-full flex items-center">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Completed
            </span>
          ) : (
            <span className="text-xs font-semibold px-3 py-1.5 bg-cyan-50 text-cyan-600 rounded-full">
              Pending Result
            </span>
          )}
        </div>

        {/* نموذج إدخال/تعديل نتيجة الأشعة */}
        <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          {/* رأس عارض الصورة */}
          <div className="flex items-center p-5 border-b border-gray-200 bg-[#F8F9FB]">
            <ImageIcon className="h-5 w-5 mr-2 text-[#0046B5]" />
            <h3 className="text-lg font-bold text-[#0046B5]">Imaging & Report</h3>
          </div>

          <div className="p-6 space-y-6">
            {/* منطقة الصورة/الفيديو */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Attach Image / Video (optional)
              </label>

              {/* معاينة المرفق الحالي أو المختار */}
              <div className="bg-black rounded-lg shadow-sm border border-gray-800 relative flex items-center justify-center overflow-hidden h-72">
                {file ? (
                  selectedFileType === 'video' ? (
                    <video src={URL.createObjectURL(file)} controls className="w-full h-full object-contain" />
                  ) : file.type === 'application/pdf' ? (
                    <iframe src={URL.createObjectURL(file)} className="w-full h-full bg-white" title="PDF Preview" />
                  ) : (
                    <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-contain" />
                  )
                ) : selectedOrder.image_path && isVideo ? (
                  <video src={getFullImageUrl(selectedOrder.image_path)} controls className="w-full h-full object-contain" />
                ) : selectedOrder.image_path && /\.pdf$/i.test(selectedOrder.image_path) ? (
                  <iframe src={getFullImageUrl(selectedOrder.image_path)} className="w-full h-full bg-white" title="PDF Preview" />
                ) : selectedOrder.image_path && isImage ? (
                  <img src={getFullImageUrl(selectedOrder.image_path)} alt="Imaging" className="w-full h-full object-contain" />
                ) : selectedOrder.image_path ? (
                  <a href={getFullImageUrl(selectedOrder.image_path)} target="_blank" rel="noopener noreferrer" className="text-white text-sm font-semibold underline">
                    View attached file
                  </a>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40">
                    <ImageIcon className="h-16 w-16 text-gray-400 mb-2" />
                    <span className="text-gray-400 text-xs uppercase">{selectedOrder.modality}</span>
                  </div>
                )}
              </div>

              {/* أزرار الرفع */}
              {!isSelectedDone && (
                <div className="flex items-center gap-3 mt-3">
                  <label className="inline-flex items-center px-4 py-2 bg-[#0046B5] text-white text-sm font-bold rounded hover:bg-blue-800 transition-colors cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    {hasExistingMedia ? 'Replace File' : 'Upload Image / Video'}
                    <input
                      type="file"
                      accept="image/*,video/*,.pdf"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files[0] || null)}
                    />
                  </label>
                  {file && (
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="px-4 py-2 border border-gray-300 text-sm font-bold text-gray-700 rounded hover:bg-gray-50 transition-colors"
                    >
                      Cancel File
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* تقرير قراءة الصورة */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Radiological Reading / Report *
              </label>
              <textarea
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                rows="6"
                disabled={isSelectedDone}
                placeholder="Write the radiological findings and interpretation here..."
                className="w-full border border-gray-200 rounded bg-[#F8F9FB] p-3 text-sm outline-none focus:border-[#0046B5] resize-none"
              />
            </div>

            {/* أزرار الحفظ */}
            {!isSelectedDone && (
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center px-6 py-2.5 bg-[#0046B5] text-white text-sm font-bold rounded hover:bg-blue-800 transition-colors disabled:opacity-50"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Result'}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    );
  }

  // ============ عرض عام بدون طلب محدد (قسم الأشعة الجانبي - قبل الاختيار) ============
  if (isGlobalView) {
    return (
      <div className="flex flex-col space-y-6 mt-4">
        <div className="bg-white border border-gray-200 rounded-lg p-16 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-4">
            <FileQuestion className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-700">No Order Selected</h3>
          <p className="text-sm text-gray-500 mt-1">Select a radiology order from the Orders tab to enter its results.</p>
        </div>
      </div>
    );
  }

  // ============ عرض نتائج المريض (تبويب ملف المريض) ============
  return (
    <div className="flex flex-col space-y-6 mt-4">

      {/* منطقة البحث */}
      {isGlobalView && !isResultVisible && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#003B73]">Search Radiology Results</h2>
            <p className="text-sm text-gray-500 mt-1">Enter Patient MRN to view their imaging history.</p>
          </div>
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input type="text" placeholder="e.g. MRN-12345..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full border border-gray-300 rounded bg-[#F8F9FB] pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#0046B5]" />
            </div>
            <button type="submit" className="px-6 py-2.5 bg-[#003B73] text-white text-sm font-bold rounded hover:bg-blue-900 transition-colors">Search</button>
          </form>
        </div>
      )}

      {isGlobalView && !isResultVisible && (
        <div className="bg-white border border-gray-200 rounded-lg p-16 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-4">
            <FileQuestion className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-700">No Patient Selected</h3>
        </div>
      )}

      {/* عرض النتائج بعد إيجاد المريض */}
      {isResultVisible && (
        <div className="animate-in fade-in duration-500 space-y-6">

          {/* 1. قائمة الفحوصات */}
          {!selectedReport ? (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-200 bg-[#F8F9FB] flex justify-between items-center">
                <h3 className="text-lg font-bold text-[#003B73]">Patient Imaging History</h3>
                <span className="px-3 py-1 bg-blue-50 text-[#0046B5] text-xs font-bold rounded-full">
                  {filteredExams.length} Result{filteredExams.length === 1 ? '' : 's'}
                </span>
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

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Modality</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Body Part</th>
                      {!isGlobalView && <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Visit</th>}
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredExams.length === 0 ? (
                      <tr>
                        <td colSpan={isGlobalView ? 5 : 6} className="px-6 py-12 text-center text-gray-400">
                          {pastExams.length === 0
                            ? 'No completed radiology results available yet for this patient.'
                            : 'No radiology results match the selected filters.'}
                        </td>
                      </tr>
                    ) : (
                    filteredExams.map((exam) => (
                      <tr key={exam.id} className="hover:bg-blue-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900">{exam.date}</td>
                        <td className="px-6 py-4 text-sm font-bold text-[#003B73]">{exam.modality}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{exam.bodyPart}</td>
                        {!isGlobalView && (
                          <td className="px-6 py-4 text-sm text-[#0046B5] font-semibold whitespace-nowrap">
                            Visit #{exam.visitId}
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">{exam.status}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedReport(exam)}
                            className="inline-flex items-center px-3 py-1.5 bg-white border border-[#0046B5] text-[#0046B5] text-xs font-bold rounded hover:bg-blue-50 transition-colors"
                          >
                            <Eye className="h-3 w-3 mr-1.5" />
                            View Report
                          </button>
                        </td>
                      </tr>
                    ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (

            /* 2. عرض تفاصيل الفحص */
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">

              <button
                onClick={() => setSelectedReport(null)}
                className="flex items-center text-sm font-bold text-gray-500 hover:text-[#0046B5] transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back to Imaging History
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="col-span-1 bg-white border border-gray-200 rounded-lg p-5 shadow-sm h-fit">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-[#42C2DE] rounded flex items-center justify-center text-white font-bold text-lg">
                      {patientInitials}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{patientName}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">DOB: {patientDOB}</p>
                    </div>
                  </div>
                </div>

                <div className="col-span-1 lg:col-span-3 bg-black rounded-lg shadow-sm border border-gray-800 min-h-[350px] relative flex flex-col justify-end overflow-hidden p-4 group cursor-crosshair">
                  {selectedReport.image_path && /\.(mp4|webm|mov|mpeg|avi)$/i.test(selectedReport.image_path) ? (
                    <video src={getFullImageUrl(selectedReport.image_path)} controls className="absolute inset-0 w-full h-full object-contain" />
                  ) : selectedReport.image_path && /\.pdf$/i.test(selectedReport.image_path) ? (
                    <iframe src={getFullImageUrl(selectedReport.image_path)} className="absolute inset-0 w-full h-full bg-white" title="PDF Viewer" />
                  ) : selectedReport.image_path ? (
                    <img
                      src={getFullImageUrl(selectedReport.image_path)}
                      alt={selectedReport.modality}
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30">
                      <ImageIcon className="h-20 w-20 text-gray-400 mb-2" />
                      <span className="text-gray-400 text-xs tracking-widest uppercase">{selectedReport.modality} Viewer</span>
                    </div>
                  )}
                  <div className="relative z-10 flex items-center text-white text-[10px] font-mono w-full space-x-3 opacity-80 group-hover:opacity-100 transition-opacity">
                    <span>{selectedReport.modality}</span>
                    <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-[#0046B5] w-[100%]"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
                <div className="flex justify-between items-start border-b border-gray-200 pb-6 mb-6">
                  <h2 className="text-lg font-bold text-gray-800">Radiology Report - {selectedReport.modality}</h2>
                  <div className="text-right">
                    {selectedReport.image_path && (
                      <a
                        href={getFullImageUrl(selectedReport.image_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-end px-4 py-2 bg-[#0046B5] text-white text-sm font-bold rounded hover:bg-blue-800 transition-colors mb-2"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        View File
                      </a>
                    )}
                    <p className="text-[10px] text-gray-500">Exam Date: {selectedReport.date}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-[#4970A1] uppercase tracking-wider mb-2">Body Part / Indication</h3>
                    <p className="text-sm text-gray-800 leading-relaxed">{selectedReport.bodyPart}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#4970A1] uppercase tracking-wider mb-2">Findings / Report</h3>
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{selectedReport.report}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default RadResults;