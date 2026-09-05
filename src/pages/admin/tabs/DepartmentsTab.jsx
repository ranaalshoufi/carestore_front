import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit2, Trash2, X } from 'lucide-react';
import api from '../../../utils/api';
import { toast } from '../../../utils/toast';

const DepartmentsTab = () => {
  const [departments, setDepartments] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState(null);

  const [deptForm, setDeptForm] = useState({
    name: '',
    facility_id: '',
    status: 'Active',
    description: ''
  });

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      setDepartments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const fetchFacilities = async () => {
    try {
      const res = await api.get('/facilities');
      setFacilities(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching facilities:', err);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchFacilities();
  }, []);

  const handleChange = (e) => {
    setDeptForm({ ...deptForm, [e.target.name]: e.target.value });
  };

  const handleOpenAddModal = () => {
    setEditingDeptId(null);
    setDeptForm({
      name: '',
      facility_id: facilities.length > 0 ? facilities[0].facility_id : '',
      status: 'Active',
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (dept) => {
    setEditingDeptId(dept.department_id);
    setDeptForm({
      name: dept.name || '',
      facility_id: dept.facility_id || '',
      status: dept.status || 'Active',
      description: dept.description || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveDepartment = async (e) => {
    e.preventDefault();
    try {
      if (editingDeptId) {
        await api.put(`/departments/${editingDeptId}`, deptForm);
        toast.success('تم تحديث القسم بنجاح!');
      } else {
        await api.post('/departments', deptForm);
        toast.success('تم إضافة القسم بنجاح!');
      }
      setIsModalOpen(false);
      fetchDepartments();
    } catch (err) {
      console.error('Error saving department:', err);
      toast.error('فشل حفظ القسم.');
    }
  };

  const handleDeleteDepartment = async (deptId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا القسم؟')) return;
    try {
      await api.delete(`/departments/${deptId}`);
      toast.success('تم حذف القسم بنجاح!');
      fetchDepartments();
    } catch (err) {
      console.error('Error deleting department:', err);
      toast.error(err.response?.data?.message || 'فشل حذف القسم (قد يكون مرتبطاً بمستخدمين).');
    }
  };

  const filteredDepartments = departments.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (d.facility && d.facility.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col mt-6 relative">
      
      {/* الترويسة وزر الإضافة */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-3xl font-bold text-[#003B73]">Departments Management</h2>
          <p className="text-sm text-gray-500 mt-1">Oversee hospital resources, clinical staffing, and operational capacity.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search departments..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#0046B5] w-64 bg-white" 
            />
          </div>
          <button 
            onClick={handleOpenAddModal}
            className="flex items-center px-5 py-2.5 bg-[#003B73] text-white text-sm font-bold rounded hover:bg-blue-900 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Department
          </button>
        </div>
      </div>

      {/* جدول الأقسام */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-200 bg-[#F8F9FB]">
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Department Name</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Affiliated Facility</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDepartments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                    No departments found.
                  </td>
                </tr>
              ) : (
                filteredDepartments.map((dept) => {
                  const status = dept.status || 'Active';
                  let statusColor = 'text-green-600 bg-green-50 border border-green-100';
                  if (status === 'Full') statusColor = 'text-red-600 bg-red-50 border border-red-100';
                  if (status === 'Inactive') statusColor = 'text-gray-600 bg-gray-100 border border-gray-200';

                  return (
                    <tr key={dept.department_id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-[#003B73]">{dept.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{dept.facility?.name || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{dept.description || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded ${statusColor}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-3 text-gray-400">
                          <button onClick={() => handleOpenEditModal(dept)} className="hover:text-amber-500 transition-colors" title="Edit"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => handleDeleteDepartment(dept.department_id)} className="hover:text-red-500 transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== مودل إضافة/تعديل قسم ==================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl mx-4 overflow-hidden flex flex-col">
            
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-[#003B73]">{editingDeptId ? 'Edit Department' : 'Add New Department'}</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveDepartment} className="p-6 space-y-5">
              
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Department Name *</label>
                <input 
                  type="text" 
                  name="name" 
                  value={deptForm.name} 
                  onChange={handleChange} 
                  required
                  placeholder="e.g. Cardiology" 
                  className="w-full border border-gray-200 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5]" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Affiliated Facility *</label>
                  <select name="facility_id" value={deptForm.facility_id} onChange={handleChange} required className="w-full border border-gray-200 rounded bg-white text-gray-900 p-2.5 text-sm outline-none focus:border-[#0046B5]" style={{ colorScheme: 'light' }}>
                    <option value="">Select facility</option>
                    {facilities.map(f => (
                      <option key={f.facility_id} value={f.facility_id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Status</label>
                  <select name="status" value={deptForm.status} onChange={handleChange} className="w-full border border-gray-200 rounded bg-white text-gray-900 p-2.5 text-sm outline-none focus:border-[#0046B5]" style={{ colorScheme: 'light' }}>
                    <option value="Active">Active</option>
                    <option value="Full">Full</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                <textarea 
                  name="description" 
                  value={deptForm.description} 
                  onChange={handleChange} 
                  rows="4" 
                  placeholder="Describe the department's function..." 
                  className="w-full border border-gray-200 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5] resize-none" 
                ></textarea>
              </div>
              
              <div className="flex justify-end gap-4 pt-4 mt-2">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 text-sm font-bold text-[#0046B5] hover:bg-blue-50 rounded transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-[#003B73] text-white text-sm font-bold rounded hover:bg-blue-900 transition-colors"
                >
                  Save Department
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default DepartmentsTab;
