import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import api from '../../utils/api';
import { toast } from '../../utils/toast';

// نمرر setIsModalOpen لإغلاق المودل بعد الحفظ، و onPatientAdded لتحديث الجدول في الصفحة الأب
const AddEditPatient = ({ setIsModalOpen, onPatientAdded }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    if (typeof setIsModalOpen === 'function') {
      setIsModalOpen(false);
    } else {
      navigate('/patients');
    }
  };

  const [patientForm, setPatientForm] = useState({
    national_id: '',
    first_name: '',
    last_name: '',
    gender: 'Male',
    birth_date: '',
    blood_type: 'O+',
    height: '',
    phone: '',
    address: '',
    emergency_contact: '',
    is_temporary: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPatientForm({
      ...patientForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        ...patientForm,
        height: parseFloat(patientForm.height) || 0.0
      };

      // إرسال الطلب عبر نسخة Axios المخصصة (api)
      const response = await api.post('/patients', payload);

      if (response.status === 201 || response.status === 200) {
        const newPatient = response.data.patient || response.data;
        toast.success(`تم إضافة المريض بنجاح! رقم الملف الطبي (MRN): ${newPatient.mrn}`);
        
        // استدعاء الدالة الممررة لتحديث الجدول في PatientsList.jsx
        if (onPatientAdded) {
            onPatientAdded(newPatient);
        }
        
        handleClose();
      }
    } catch (error) {
      console.error('API Connection Error:', error);
      if (error.response) {
        toast.error(`حدث خطأ: ${JSON.stringify(error.response.data.message || error.response.data)}`);
      } else if (error.request) {
        toast.error('لم يتم تلقي استجابة من الخادم. تأكدي من عمل الـ Backend.');
      } else {
        toast.error('حدث خطأ غير متوقع أثناء إعداد الطلب.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 overflow-hidden flex flex-col">
        
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-[#003B73]">Add New Patient</h3>
          <button type="button" onClick={handleClose} className="text-gray-400 hover:text-gray-700 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleAddPatient} className="p-6 space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">First Name</label>
              <input type="text" name="first_name" value={patientForm.first_name} onChange={handleChange} required className="w-full border rounded p-2.5 text-sm outline-none focus:border-[#0046B5]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Last Name</label>
              <input type="text" name="last_name" value={patientForm.last_name} onChange={handleChange} required className="w-full border rounded p-2.5 text-sm outline-none focus:border-[#0046B5]" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">National ID</label>
              <input type="text" name="national_id" value={patientForm.national_id} onChange={handleChange} required className="w-full border rounded p-2.5 text-sm outline-none focus:border-[#0046B5]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Birth Date</label>
              <input type="date" name="birth_date" value={patientForm.birth_date} onChange={handleChange} required className="w-full border rounded p-2.5 text-sm outline-none focus:border-[#0046B5]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Gender</label>
              <select name="gender" value={patientForm.gender} onChange={handleChange} className="w-full border rounded p-2.5 text-sm outline-none focus:border-[#0046B5]">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Blood Type</label>
              <select name="blood_type" value={patientForm.blood_type} onChange={handleChange} className="w-full border rounded p-2.5 text-sm outline-none focus:border-[#0046B5]">
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Height (cm)</label>
              <input type="number" step="0.1" name="height" value={patientForm.height} onChange={handleChange} className="w-full border rounded p-2.5 text-sm outline-none focus:border-[#0046B5]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
              <input type="text" name="phone" value={patientForm.phone} onChange={handleChange} className="w-full border rounded p-2.5 text-sm outline-none focus:border-[#0046B5]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Emerg. Contact</label>
              <input type="text" name="emergency_contact" value={patientForm.emergency_contact} onChange={handleChange} className="w-full border rounded p-2.5 text-sm outline-none focus:border-[#0046B5]" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Address</label>
            <input type="text" name="address" value={patientForm.address} onChange={handleChange} className="w-full border rounded p-2.5 text-sm outline-none focus:border-[#0046B5]" />
          </div>

          <div className="flex items-center">
            <input type="checkbox" name="is_temporary" checked={patientForm.is_temporary} onChange={handleChange} className="h-4 w-4 text-[#0046B5]" />
            <label className="ml-2 text-sm font-bold text-gray-700">Temporary Patient (No National ID required)</label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 border text-sm font-bold text-gray-700 rounded hover:bg-gray-50 transition-colors cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="px-6 py-2.5 bg-[#003B73] text-white text-sm font-bold rounded disabled:opacity-50 hover:bg-blue-900 transition-colors cursor-pointer">
              {isLoading ? 'Saving...' : 'Save Patient'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddEditPatient;