import React from 'react';

const StatusBadge = ({ status }) => {
  // قواميس الألوان حسب الحالة السريرية أو الإدارية
  const statusConfig = {
    'Active': "bg-green-100 text-green-800",
    'Completed': "bg-blue-100 text-blue-800",
    'Pending': "bg-yellow-100 text-yellow-800",
    'Cancelled': "bg-red-100 text-red-800",
    'Emergency': "bg-red-600 text-white animate-pulse", // نبض للحالات الإسعافية
    'Temporary': "bg-orange-100 text-orange-800"
  };

  // اللون الافتراضي في حال كانت الحالة غير موجودة في القاموس
  const defaultStyle = "bg-gray-100 text-gray-800";
  const appliedStyle = statusConfig[status] || defaultStyle;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${appliedStyle}`}>
      {status}
    </span>
  );
};

export default StatusBadge;