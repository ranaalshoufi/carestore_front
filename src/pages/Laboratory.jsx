import React from 'react';
import LaboratoryTab from './patient/tabs/Laboratory/LaboratoryTab';

const Laboratory = () => {
  return (
    <div className="font-sans h-full bg-[#F3F4F6]">
      {/* استدعاء مكون المختبر مباشرة ليعمل كصفحة مستقلة */}
      <LaboratoryTab />
    </div>
  );
};

export default Laboratory;