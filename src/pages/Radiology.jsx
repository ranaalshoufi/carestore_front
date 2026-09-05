import React from 'react';
import RadiologyTab from './patient/tabs/Radiology/RadiologyTab';

const Radiology = () => {
  return (
    <div className="font-sans h-full bg-[#F3F4F6] p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-[#003B73]">Radiology Department</h2>
        <p className="text-sm text-gray-500 mt-1">Manage imaging orders and view diagnostic results.</p>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-4">
        <RadiologyTab />
      </div>
    </div>
  );
};

export default Radiology;