import React from 'react';

const Input = ({ label, id, error, type = 'text', className = '', ...props }) => {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label htmlFor={id} className="mb-1 text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        className={`px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors text-gray-800 ${
          error 
            ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
        }`}
        {...props}
      />
      {/* عرض رسالة الخطأ إن وجدت */}
      {error && <span className="mt-1 text-xs text-red-500 font-medium">{error}</span>}
    </div>
  );
};

export default Input;