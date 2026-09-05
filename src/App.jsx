import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// استيراد المكونات والصفحات
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PatientsList from './pages/patient/PatientsList';
import AddEditPatient from './pages/patient/AddEditPatient';
import PatientDetails from './pages/patient/PatientDetails';
import Laboratory from './pages/Laboratory';
import Radiology from './pages/Radiology';
import Appointments from './pages/Appointments';
import AdminSettings from './pages/AdminSettings';
import MyProfile from './pages/MyProfile';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* مسار صفحة تسجيل الدخول (واجهة مستقلة بدون القائمة الجانبية) */}
        <Route path="/login" element={<Login />} />

        {/* المسارات التي تتطلب الهيكل الأساسي (Main Layout) */}
        <Route element={<MainLayout />}>
          {/* التوجيه التلقائي من المسار الجذر إلى لوحة التحكم */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/patients" element={<PatientsList />} />
          <Route path="/patients/add" element={<AddEditPatient />} />
          <Route path="/patients/edit/:id" element={<AddEditPatient />} />
          <Route path="/patients/:id" element={<PatientDetails />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/laboratory" element={<Laboratory />} />
          <Route path="/radiology" element={<Radiology />} /> 
          <Route path="/admin-settings" element={<AdminSettings />} />
          <Route path="/profile" element={<MyProfile />} />
        </Route>

        {/* مسار بديل للتعامل مع الروابط الخاطئة (404) */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;