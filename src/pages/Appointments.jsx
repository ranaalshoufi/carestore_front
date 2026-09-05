import React, { useState, useEffect } from 'react';
import { PlusCircle, Hourglass, CheckCircle, CheckCircle2, UserCheck, MoreVertical } from 'lucide-react';
import api from '../utils/api';
import { toast } from '../utils/toast';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [counts, setCounts] = useState({ total: 0, waiting: 0, confirmed: 0, completed: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // 1. حالة فورم إضافة موعد جديد
  const [appointmentForm, setAppointmentForm] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_date: '',
    notes: ''
  });
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/appointments');
      setAppointments(res.data.appointments);
      setCounts(res.data.counts);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    loadFormOptions();
  }, []);

  const loadFormOptions = async () => {
    try {
      const [patRes, docRes] = await Promise.all([
        api.get('/patients'),
        api.get('/doctors')
      ]);
      setPatients(Array.isArray(patRes.data) ? patRes.data : (patRes.data.patients || []));
      setDoctors(docRes.data.doctors || []);
    } catch (error) {
      console.error('Error loading form options:', error);
    }
  };

  const handleFormChange = (e) => {
    setAppointmentForm({ ...appointmentForm, [e.target.name]: e.target.value });
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    try {
      await api.post('/appointments', appointmentForm);
      toast.success('تم جدولة الموعد بنجاح!');
      setAppointmentForm({ patient_id: '', doctor_id: '', appointment_date: '', notes: '' });
      fetchAppointments();
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      toast.error('فشل جدولة الموعد، تأكد من البيانات.');
    }
  };

  // 3. دالة تحويل الموعد إلى زيارة (Check-in Logic)
  const handleCheckIn = async (appointmentId) => {
    try {
      await api.post(`/appointments/${appointmentId}/check-in`);
      toast.success('تم تحويل الموعد إلى زيارة بنجاح!');
      fetchAppointments();
    } catch (error) {
      console.error('Error checking in appointment:', error);
      toast.error('فشل تحويل الموعد إلى زيارة.');
    }
  };

  return (
    <div className="font-sans h-full bg-[#F3F4F6] p-6">
      
      {/* الترويسة */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#003B73]">Appointment Schedule</h2>
        <p className="text-sm text-gray-500 mt-1">Manage clinical consultations and patient flow for October 24, 2023</p>
      </div>

      {/* 1. فورم إضافة موعد جديد */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center text-[#003B73] font-bold text-lg mb-5">
          <PlusCircle className="h-5 w-5 mr-2 text-[#0046B5]" />
          Schedule New Appointment
        </div>
        
        <form onSubmit={handleSchedule} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Patient</label>
              <select name="patient_id" value={appointmentForm.patient_id} onChange={handleFormChange} className="w-full border border-gray-200 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5]">
                <option value="">Select Patient</option>
                {patients.map((p) => (
                  <option key={p.patient_id} value={p.patient_id}>
                    {p.first_name} {p.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Doctor</label>
              <select name="doctor_id" value={appointmentForm.doctor_id} onChange={handleFormChange} className="w-full border border-gray-200 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5]">
                <option value="">Select Doctor</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Date &amp; Time</label>
              <input type="datetime-local" name="appointment_date" value={appointmentForm.appointment_date} onChange={handleFormChange} className="w-full border border-gray-200 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5]" />
            </div>
          </div>
          
          <div className="flex justify-end pt-2">
            <button type="submit" className="px-6 py-2.5 bg-[#003B73] text-white text-sm font-bold rounded hover:bg-blue-900 transition-colors">
              Schedule Appointment
            </button>
          </div>
        </form>
      </div>

      {/* 2. بطاقات الإحصائيات (Stat Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col justify-between">
          <p className="text-sm font-bold text-gray-700">Total Appointments</p>
          <div className="flex justify-between items-end mt-2">
            <span className="text-3xl font-bold text-gray-900">{counts.total}</span>
            <span className="text-xs font-bold text-[#0046B5]">Active system</span>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col justify-between">
          <p className="text-sm font-bold text-gray-700">Scheduled</p>
          <div className="flex justify-between items-end mt-2">
            <span className="text-3xl font-bold text-teal-600">{counts.waiting}</span>
            <Hourglass className="h-5 w-5 text-teal-600" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col justify-between">
          <p className="text-sm font-bold text-gray-700">Confirmed</p>
          <div className="flex justify-between items-end mt-2">
            <span className="text-3xl font-bold text-[#0046B5]">{counts.confirmed}</span>
            <CheckCircle className="h-5 w-5 text-[#0046B5]" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col justify-between">
          <p className="text-sm font-bold text-gray-700">Completed</p>
          <div className="flex justify-between items-end mt-2">
            <span className="text-3xl font-bold text-gray-500">{counts.completed}</span>
            <CheckCircle2 className="h-5 w-5 text-gray-500" />
          </div>
        </div>
      </div>

      {/* 3. جدول المواعيد */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-200 bg-white">
                <th className="px-6 py-4 text-[10px] font-bold text-[#003B73] uppercase tracking-wider">Patient Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#003B73] uppercase tracking-wider">Doctor</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#003B73] uppercase tracking-wider">Time</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#003B73] uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#003B73] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#003B73] uppercase tracking-wider">Check-In</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#003B73] uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-sm text-gray-500">Loading appointments...</td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-sm text-gray-500">No appointments found.</td>
                </tr>
              ) : (
              appointments.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className={`h-10 w-10 ${app.avatarBg} rounded-full flex items-center justify-center text-white font-bold mr-3 shrink-0`}>
                        {app.initials}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{app.patient}</p>
                        <p className="text-xs text-gray-500">ID: {app.patientId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{app.doctor}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-700">{app.time}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-[#EEF2FC] text-[#0046B5] text-xs font-bold rounded">
                      {app.department}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center text-xs font-bold ${app.statusColor}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current mr-2"></span>
                      {app.status}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {/* العرض المشروط (Conditional Rendering) بناءً على الكاردينالية */}
                    {!app.hasVisit ? (
                      <button 
                        onClick={() => handleCheckIn(app.id)}
                        className="flex items-center justify-center px-4 py-2 bg-cyan-100 text-cyan-700 text-sm font-bold rounded hover:bg-cyan-200 transition-colors"
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Check-in
                      </button>
                    ) : (
                      <span className="text-sm italic text-gray-400 font-medium px-4">
                        Checked in
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="text-gray-400 hover:text-gray-700 transition-colors">
                      <MoreVertical className="h-5 w-5 mx-auto" />
                    </button>
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

export default Appointments;