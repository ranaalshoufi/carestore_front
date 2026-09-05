import React, { useState } from 'react';
import RadOrders from './RadOrders';
import RadResults from './RadResults'; // 👈 استيراد النتائج

const RadiologyTab = ({ patient }) => {
  const [activeSubTab, setActiveSubTab] = useState('Orders');
  // حقل الطلب المختار لفتحه في شاشة النتائج (يستخدم من قسم الأشعة الجانبي)
  const [selectedOrder, setSelectedOrder] = useState(null);

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setActiveSubTab('Results');
  };

  return (
    <div className="flex flex-col space-y-2 mt-2">
      {/* التبويبات الفرعية */}
      <div className="flex space-x-8 border-b border-gray-200 px-2">
        <button 
          onClick={() => { setActiveSubTab('Orders'); setSelectedOrder(null); }} 
          className={`pb-3 text-sm font-bold relative transition-colors ${activeSubTab === 'Orders' ? 'text-[#0046B5]' : 'text-gray-500 hover:text-gray-800'}`}
        >
          Radiology Orders
          {activeSubTab === 'Orders' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0046B5] rounded-t-md"></span>}
        </button>
        <button 
          onClick={() => { setActiveSubTab('Results'); setSelectedOrder(null); }} 
          className={`pb-3 text-sm font-bold relative transition-colors ${activeSubTab === 'Results' ? 'text-[#0046B5]' : 'text-gray-500 hover:text-gray-800'}`}
        >
          Radiology Results
          {activeSubTab === 'Results' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0046B5] rounded-t-md"></span>}
        </button>
      </div>

      {/* استدعاء الشاشات بناءً على التبويب */}
      {activeSubTab === 'Orders' && <RadOrders patient={patient} onSelectOrder={handleSelectOrder} />}
      
      {/* 👈 استدعاء شاشة النتائج */}
      {activeSubTab === 'Results' && <RadResults patient={patient} selectedOrder={selectedOrder} onBackToOrders={() => { setSelectedOrder(null); setActiveSubTab('Orders'); }} />}
    </div>
  );
};

export default RadiologyTab;