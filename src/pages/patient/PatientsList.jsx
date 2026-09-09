import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, Activity, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import AddEditPatient from './AddEditPatient'; // استدعاء مكون مودل الإضافة
import { toast } from '../../utils/toast';

const PatientsList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';

  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  
  // حالة التحكم بفتح وإغلاق المودل
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. جلب قائمة المرضى عند تحميل الصفحة أو تغيير البحث
  const fetchPatients = async (search = '') => {
    try {
      setIsLoading(true);
      const endpoint = search ? `/patients?search=${encodeURIComponent(search)}` : '/patients';
      const response = await api.get(endpoint);
      setPatients(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError('فشل في جلب بيانات المرضى. يرجى التأكد من تشغيل الخادم (Backend).');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients(urlSearch);
  }, [urlSearch]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    fetchPatients(value);
  };

  // 2. دالة لاستقبال المريض الجديد من المودل وإضافته للجدول فوراً
  const handlePatientAdded = (newPatient) => {
    // إضافة المريض الجديد في بداية المصفوفة لكي يظهر أولاً في الجدول
    setPatients([newPatient, ...patients]);
  };

  return (
    <div className="font-sans h-full bg-[#F3F4F6] p-6 flex flex-col">
      
      {/* الترويسة وشريط البحث */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#003B73]">Patients Directory</h2>
          <p className="text-sm text-gray-500 mt-1">Manage all registered patients and clinical records.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by MRN, Name, or Phone..." 
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#0046B5] bg-white" 
            />
          </div>
          {/* زر فتح المودل */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-5 py-2 bg-[#0046B5] text-white text-sm font-bold rounded hover:bg-blue-800 transition-colors whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
          </button>
        </div>
      </div>

      {/* حالات التحميل والخطأ وعرض البيانات */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex-1 overflow-hidden flex flex-col">
        
        {isLoading ? (
          // حالة التحميل
          <div className="flex flex-col items-center justify-center flex-1 p-12">
            <Activity className="h-8 w-8 text-[#0046B5] animate-pulse mb-4" />
            <p className="text-gray-500 font-medium">Loading patients data...</p>
          </div>
        ) : error ? (
          // حالة الخطأ
          <div className="flex flex-col items-center justify-center flex-1 p-12 text-center">
            <div className="h-12 w-12 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-4">
              <X className="h-6 w-6" />
            </div>
            <p className="text-red-600 font-bold mb-2">Error Connection</p>
            <p className="text-gray-500 text-sm max-w-md">{error}</p>
          </div>
        ) : patients.length === 0 ? (
          // حالة عدم وجود مرضى
          <div className="flex flex-col items-center justify-center flex-1 p-12 text-center">
            <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-4">
              <Search className="h-8 w-8" />
            </div>
            <p className="text-gray-700 font-bold mb-2">No Patients Found</p>
            <p className="text-gray-500 text-sm">Click 'Add Patient' to register a new patient in the system.</p>
          </div>
        ) : (
          // حالة عرض الجدول
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-200 bg-[#F8F9FB]">
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">MRN</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Patient Name</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Gender</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Birth Date</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {patients.map((patient) => {
                  const userStr = localStorage.getItem('user');
                  const user = userStr ? JSON.parse(userStr) : null;
                  const roleId = user ? Number(user.role_id) : 1;

                  return (
                    <tr 
                      key={patient.patient_id || patient.mrn} 
                      onClick={() => {
                        if (roleId === 6) {
                          toast.info('موظف الاستقبال مخصص لإضافة والبحث عن المرضى فقط، ولا يمتلك صلاحية استعراض الملفات الطبية والتفصيلية.');
                          return;
                        }
                        navigate(`/patients/${patient.patient_id}`);
                      }}
                      className={`transition-colors ${roleId === 6 ? 'cursor-default hover:bg-white' : 'hover:bg-blue-50 cursor-pointer'}`}
                    >
                    <td className="px-6 py-4 text-sm font-bold text-[#0046B5] font-mono">
                      {patient.mrn || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      {patient.first_name} {patient.last_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{patient.gender}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{patient.birth_date}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-mono">{patient.phone}</td>
                    <td className="px-6 py-4">
                      {patient.is_temporary ? (
                        <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded uppercase tracking-wider border border-amber-100">Temporary</span>
                      ) : (
                        <span className="px-2 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded uppercase tracking-wider border border-green-100">Registered</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-gray-400 hover:text-gray-700 transition-colors">
                        <MoreVertical className="h-5 w-5 mx-auto" />
                      </button>
                    </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* استدعاء المودل وتمرير الدوال إليه */}
      {isModalOpen && (
        <AddEditPatient 
          setIsModalOpen={setIsModalOpen} 
          onPatientAdded={handlePatientAdded} 
        />
      )}

    </div>
  );
};

export default PatientsList;