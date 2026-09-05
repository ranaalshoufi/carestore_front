import React, { useState } from 'react';
import LabOrders from './LabOrders';
import LabResults from './LabResults'; // 👈 1. أضفنا استيراد النتائج هنا

const LaboratoryTab = ({ patient }) => {
  const [activeSubTab, setActiveSubTab] = useState('Orders');
  // حقل الطلب المختار لفتحه في شاشة النتائج (يستخدم من قسم المخبر الجانبي)
  const [selectedOrder, setSelectedOrder] = useState(null);

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setActiveSubTab('Results');
  };

  return (
    <div className="flex flex-col space-y-2">
      {/* التبويبات الفرعية */}
      <div className="flex space-x-8 border-b border-gray-200 px-2 mt-2">
        <button 
          onClick={() => { setActiveSubTab('Orders'); setSelectedOrder(null); }}
          className={`pb-3 text-sm font-bold uppercase tracking-wider relative transition-colors ${activeSubTab === 'Orders' ? 'text-[#0046B5]' : 'text-gray-500 hover:text-gray-800'}`}
        >
          Laboratory Orders
          {activeSubTab === 'Orders' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0046B5] rounded-t-md"></span>}
        </button>
        <button 
          onClick={() => { setActiveSubTab('Results'); setSelectedOrder(null); }}
          className={`pb-3 text-sm font-bold uppercase tracking-wider relative transition-colors ${activeSubTab === 'Results' ? 'text-[#0046B5]' : 'text-gray-500 hover:text-gray-800'}`}
        >
          Laboratory Results
          {activeSubTab === 'Results' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0046B5] rounded-t-md"></span>}
        </button>
      </div>

      {/* استدعاء الشاشات بناءً على التبويب */}
      {activeSubTab === 'Orders' && <LabOrders patient={patient} onSelectOrder={handleSelectOrder} />}
      
      {/* 👈 2. استدعينا الشاشة هنا */}
      {activeSubTab === 'Results' && <LabResults patient={patient} selectedOrder={selectedOrder} onBackToOrders={() => { setSelectedOrder(null); setActiveSubTab('Orders'); }} />}
    </div>
  );
};

export default LaboratoryTab;