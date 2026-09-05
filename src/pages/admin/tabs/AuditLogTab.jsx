import React, { useState, useEffect } from 'react';
import { Search, Calendar, User, Filter, RefreshCw } from 'lucide-react';
import api from '../../../utils/api';

const METHOD_LABELS = {
  POST: { label: 'إنشاء', color: 'bg-green-100 text-green-700', dot: 'bg-green-600' },
  PUT: { label: 'تعديل', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  PATCH: { label: 'تعديل', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  DELETE: { label: 'حذف', color: 'bg-red-100 text-red-700', dot: 'bg-red-600' },
};

const MODEL_LABELS = {
  Auth: 'تسجيل الدخول / الخروج',
  PatientApi: 'المرضى',
  DepartmentApi: 'الأقسام',
  FacilityApi: 'المرافق الصحية',
  HealthcareFacilityApi: 'المرافق الصحية',
  RoleApi: 'الأدوار',
  UserApi: 'المستخدمين',
  AppointmentApi: 'المواعيد',
  ClinicalApi: 'السجلات السريرية',
  ResultsApi: 'النتائج الطبية (المختبر/الأشعة)',
  RadiologyController: 'الأشعة',
};

const AuditLogTab = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  const fetchLogs = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedUserId) params.user_id = selectedUserId;
      const res = await api.get('/audit-logs', { params });
      setAuditLogs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching users for filter:', err);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchUsers();
  }, []);

  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleRefresh = () => {
    setSearch('');
    setSelectedUserId('');
    fetchLogs();
  };

  return (
    <div className="flex flex-col mt-6 space-y-6">
      
      {/* الترويسة */}
      <div>
        <h2 className="text-3xl font-bold text-[#003B73]">System Audit Log</h2>
        <p className="text-sm text-gray-500 mt-1">Real-time clinical access and system event monitoring</p>
      </div>

      {/* شريط الفلترة */}
      <form onSubmit={handleApplyFilters} className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col flex-1 min-w-[200px]">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search action or model..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#0046B5] bg-white" 
            />
          </div>
        </div>

        <div className="flex flex-col flex-1 min-w-[200px]">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">User</label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <select 
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded text-sm appearance-none focus:outline-none focus:border-[#0046B5] bg-white text-gray-900"
              style={{ colorScheme: 'light' }}
            >
              <option value="">All Users</option>
              {users.map(u => (
                <option key={u.user_id} value={u.user_id}>{u.first_name} {u.last_name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button type="submit" className="flex items-center px-6 py-2 bg-[#00707D] text-white text-sm font-bold rounded hover:bg-[#005a65] transition-colors h-[38px]">
            <Filter className="h-4 w-4 mr-2" />
            Apply Filters
          </button>
          <button type="button" onClick={handleRefresh} className="flex items-center justify-center p-2 border border-gray-200 text-gray-500 rounded hover:bg-gray-50 transition-colors h-[38px] w-[38px]" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </form>

      {/* جدول السجلات */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-200 bg-white">
                <th className="px-6 py-4 text-[11px] font-bold text-[#0046B5] uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#0046B5] uppercase tracking-wider">Operation Type</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#0046B5] uppercase tracking-wider">Table / Model</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#0046B5] uppercase tracking-wider">Record ID</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#0046B5] uppercase tracking-wider">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                    No audit logs recorded yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => {
                  const u = log.user;
                  const initials = u ? `${u.first_name?.[0] || ''}${u.last_name?.[0] || ''}`.toUpperCase() : 'SYS';
                  const userName = u ? `${u.first_name} ${u.last_name}` : 'System / Guest';
                  const timeStr = log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A';

                  const actionText = log.action || '';
                  const method = actionText.split(' ')[0].toUpperCase();
                  const methodMeta = METHOD_LABELS[method] || { label: method, color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-500' };

                  const rawModel = log.model_affected || '';
                  const modelName = MODEL_LABELS[rawModel] || rawModel;

                  return (
                    <tr key={log.log_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-7 w-7 bg-gray-100 rounded text-[10px] font-bold text-gray-700 flex items-center justify-center mr-3 border border-gray-200">
                            {initials}
                          </div>
                          <span className="text-sm font-bold text-gray-900">{userName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${methodMeta.color}`} title={actionText}>
                            <span className={`h-1.5 w-1.5 rounded-full ${methodMeta.dot}`}></span>
                            {methodMeta.label}
                          </span>
                          <span className="text-[11px] text-gray-400 font-mono">{actionText}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-800">{modelName}</span>
                        {rawModel && rawModel !== modelName && (
                          <div className="text-[11px] text-gray-400 font-mono">{rawModel}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{log.record_id ? `ID: ${log.record_id}` : '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono">{timeStr}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AuditLogTab;
