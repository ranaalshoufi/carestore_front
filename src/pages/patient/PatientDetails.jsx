import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit, User } from 'lucide-react';
import api from '../../utils/api';
import { toast } from '../../utils/toast';

// الاستيراد الصحيح لأن مجلد tabs أصبح بجانب هذا الملف مباشرة
import OverviewTab from './tabs/OverviewTab';
import VisitHistory from './tabs/Visit/VisitHistory';
import Diagnoses from './tabs/Visit/Diagnoses';
import VitalSignsTab from './tabs/VitalSignsTab';
import PrescriptionsTab from './tabs/PrescriptionsTab';
import NursingCareTab from './tabs/NursingCareTab';
import MedicationAdministrationTab from './tabs/MedicationAdministrationTab';
import LaboratoryTab from './tabs/Laboratory/LaboratoryTab';
import RadiologyTab from './tabs/Radiology/RadiologyTab';

const PatientDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // الحالات الأساسية للتبويبات
  const [activeInnerTab, setActiveInnerTab] = useState('Overview');
  const [activeVisitSubTab, setActiveVisitSubTab] = useState('VisitHistory'); // لإدارة التبويبات الفرعية للزيارة
  
  const [isLoading, setIsLoading] = useState(true);
  const [patient, setPatient] = useState(null);

  const innerTabs = [
    'Overview', 'Visit', 'Vital Signs', 'Prescriptions', 'Nursing Care', 
    'Medication Administration', 'Laboratory', 'Radiology'
  ];

  const calculateAge = (birthDate) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // جلب بيانات المريض الفعلية من الباك إند (يتم تحديثها تلقائياً عند تغيير التبويب لضمان المزامنة)
  const fetchPatientDetails = async () => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const roleId = user ? Number(user.role_id) : 1;

    if (roleId === 6) {
      toast.error('غير مسموح لموظف الاستقبال استعراض تفاصيل وملفات المرضى.');
      navigate('/patients');
      return;
    }

    try {
      const response = await api.get(`/patients/${id}`);
      const patientData = response.data;
      patientData.age = calculateAge(patientData.birth_date);
      setPatient(patientData);
    } catch (error) {
      console.error('Error fetching patient details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const roleId = user ? Number(user.role_id) : 1;

    if (roleId === 6) {
      toast.error('غير مسموح لموظف الاستقبال استعراض تفاصيل وملفات المرضى.');
      navigate('/patients');
      return;
    }

    if (id) {
      fetchPatientDetails();
    }
  }, [id, activeInnerTab]);

  if (isLoading || !patient) {
    return (
      <div className="flex items-center justify-center h-full bg-[#F8F9FB]">
        <div className="animate-spin text-[#0046B5] text-4xl">⏳</div>
      </div>
    );
  }

  return (
    <div className="font-sans flex flex-col h-full bg-[#F8F9FB] p-4">
      
      {/* 1. التبويبات العلوية الرئيسية للتنقل بين الصفحات */}
      <div className="flex space-x-8 border-b border-gray-200 mb-6 px-2">
        <button 
          onClick={() => navigate('/patients')} 
          className="pb-3 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
        >
          Patient List
        </button>
        <button 
          onClick={() => navigate('/patients/add')} 
          className="pb-3 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
        >
          Add/Edit Patient
        </button>
        <button 
          className="pb-3 text-sm font-bold text-[#0046B5] relative border-b-2 border-[#0046B5]"
        >
          Patient Details
        </button>
      </div>

      {/* 2. بطاقة معلومات المريض العلوية */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4 justify-between items-center">
        <div className="flex flex-wrap gap-8 items-center">
          <div className="h-12 w-12 rounded-lg bg-blue-50 text-[#0046B5] flex items-center justify-center mr-2">
            <User className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Patient Name</p>
            <p className="text-sm font-bold text-[#0046B5]">{patient.last_name}, {patient.first_name}</p>
          </div>
          <div className="border-l border-gray-200 pl-8">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Age / Sex</p>
            <p className="text-sm font-bold text-gray-900">{patient.age}Y / {patient.gender}</p>
          </div>
          <div className="border-l border-gray-200 pl-8">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">ID Number</p>
            <p className="text-sm font-bold text-gray-900">{patient.mrn}</p>
          </div>
        </div>
        <button 
          onClick={() => navigate(`/patients/edit/${patient.patient_id}`)}
          className="flex items-center text-[#0046B5] text-sm font-bold hover:text-blue-800 transition-colors"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Profile
        </button>
      </div>

      {/* 3. شريط التبويبات الداخلية الثمانية */}
      <div className="flex flex-wrap gap-x-8 gap-y-4 border-b border-gray-200 mb-6 px-2">
        {innerTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveInnerTab(tab)}
            className={`pb-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap ${
              activeInnerTab === tab 
                ? 'text-[#0046B5] border-b-2 border-[#0046B5]' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 4. منطقة العرض (استدعاء المكونات الفرعية بناءً على التبويب النشط) */}
      <div className="mt-2">
        
        {/* عرض تبويب Overview */}
        {activeInnerTab === 'Overview' && <OverviewTab patient={patient} />}
        
        {/* عرض تبويب Visit مع شريطه الفرعي */}
        {activeInnerTab === 'Visit' && (
          <div className="flex flex-col space-y-4">
            
            {/* أزرار التنقل الفرعية الخاصة بالزيارة */}
            <div className="flex space-x-6 border-b border-gray-200 px-2">
              <button 
                onClick={() => setActiveVisitSubTab('VisitHistory')} 
                className={`pb-2 text-sm font-bold relative transition-colors ${activeVisitSubTab === 'VisitHistory' ? 'text-[#0046B5]' : 'text-gray-500 hover:text-gray-800'}`}
              >
                Visit History
                {activeVisitSubTab === 'VisitHistory' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0046B5] rounded-t-md"></span>}
              </button>
              <button 
                onClick={() => setActiveVisitSubTab('Diagnoses')} 
                className={`pb-2 text-sm font-bold relative transition-colors ${activeVisitSubTab === 'Diagnoses' ? 'text-[#0046B5]' : 'text-gray-500 hover:text-gray-800'}`}
              >
                Diagnoses
                {activeVisitSubTab === 'Diagnoses' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0046B5] rounded-t-md"></span>}
              </button>
            </div>

            {/* استدعاء مكونات الزيارة بناءً على التبويب الفرعي */}
            {activeVisitSubTab === 'VisitHistory' && <VisitHistory patient={patient} />}
            {activeVisitSubTab === 'Diagnoses' && <Diagnoses patient={patient} />}
            
          </div>
        )}
        
        
        {/* للعلامات الحيوية  قمنا بإضافة الاستدعاء هنا ليظهر التصميم الذي برمجناه */}
        {activeInnerTab === 'Vital Signs' && <VitalSignsTab patient={patient} />}
        
        {/*  قمنا بإضافة الاستدعاء هنا ليظهر التصميم الذي برمجناه للوصفة*/}
        {activeInnerTab === 'Prescriptions' && <PrescriptionsTab patient={patient} />}

        {/*  قمنا بإضافة الاستدعاء هنا ليظهر التصميم الذي برمجناه للعناية التمريضية*/}

        {activeInnerTab === 'Nursing Care' && <NursingCareTab patient={patient} />}
        
        {/*  قمنا بإضافة الاستدعاء هنا ليظهر التصميم الذي برمجناه لادارة اعطاء الدواء اي توثيق ما اعطي */}
        
        {activeInnerTab === 'Medication Administration' && <MedicationAdministrationTab patient={patient} />}

        {activeInnerTab === 'Laboratory' && <LaboratoryTab patient={patient} />}

        {activeInnerTab === 'Radiology' && <RadiologyTab patient={patient}/>}

      </div>

    </div>
  );
};

export default PatientDetails;