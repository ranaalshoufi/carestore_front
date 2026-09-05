import React, { useState } from 'react';
import UsersTab from './admin/tabs/UsersTab';
import RolesTab from './admin/tabs/RolesTab';
import HealthcareFacilitiesTab from './admin/tabs/HealthcareFacilitiesTab';
import DepartmentsTab from './admin/tabs/DepartmentsTab';
import AuditLogTab from './admin/tabs/AuditLogTab';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('Users');
  
  const mainTabs = ['Users', 'Roles', 'Healthcare Facilities', 'Departments', 'Audit Log'];

  return (
    <div className="font-sans h-full bg-[#F3F4F6] p-6">
      
      {/* شريط التبويبات العلوية */}
      <div className="flex space-x-8 border-b border-gray-200 px-2 bg-transparent">
        {mainTabs.map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)} 
            className={`pb-4 text-sm font-bold relative transition-colors ${activeTab === tab ? 'text-[#0046B5]' : 'text-gray-500 hover:text-gray-800'}`}
          >
            {tab}
            {activeTab === tab && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0046B5] rounded-t-md"></span>}
          </button>
        ))}
      </div>

      {/* منطقة عرض المحتوى بناءً على التبويب النشط */}
      <div>
        {activeTab === 'Users' && <UsersTab />}
        {activeTab === 'Roles' && <RolesTab />}
        {activeTab === 'Healthcare Facilities' && <HealthcareFacilitiesTab />}
        {activeTab === 'Departments' && <DepartmentsTab />}
        {activeTab === 'Audit Log' && <AuditLogTab />}
      </div>

    </div>
  );
};

export default AdminSettings;