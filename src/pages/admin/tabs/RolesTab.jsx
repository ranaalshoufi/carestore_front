import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import api from '../../../utils/api';
import { toast } from '../../../utils/toast';

const RolesTab = () => {
  const [roles, setRoles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [roleForm, setRoleForm] = useState({
    role_name: '',
    description: '',
  });

  const fetchRoles = async () => {
    try {
      const res = await api.get('/roles');
      setRoles(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleChange = (e) => {
    setRoleForm({ ...roleForm, [e.target.name]: e.target.value });
  };

  const handleOpenAddModal = () => {
    setEditingRoleId(null);
    setRoleForm({ role_name: '', description: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (role) => {
    setEditingRoleId(role.role_id);
    setRoleForm({ role_name: role.role_name || '', description: role.description || '' });
    setIsModalOpen(true);
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    try {
      if (editingRoleId) {
        await api.put(`/roles/${editingRoleId}`, roleForm);
        toast.success('تم تحديث الدور بنجاح!');
      } else {
        await api.post('/roles', roleForm);
        toast.success('تم إضافة الدور بنجاح!');
      }
      setIsModalOpen(false);
      fetchRoles();
    } catch (err) {
      console.error('Error saving role:', err);
      toast.error('فشل حفظ الدور، تأكد من عدم تكرار الاسم.');
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الدور؟')) return;
    try {
      await api.delete(`/roles/${roleId}`);
      toast.success('تم حذف الدور بنجاح!');
      fetchRoles();
    } catch (err) {
      console.error('Error deleting role:', err);
      toast.error(err.response?.data?.message || 'فشل حذف الدور (قد يكون مرتبطاً بمستخدمين).');
    }
  };

  const filteredRoles = roles.filter(r => 
    r.role_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col mt-6 relative">
      
      {/* الترويسة وشريط البحث وزر الإضافة */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-3xl font-bold text-[#003B73]">Roles Management</h2>
          <p className="text-sm text-gray-500 mt-1">Manage and configure system access levels and roles.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search roles..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#0046B5] w-64 bg-white" 
            />
          </div>
          <button 
            onClick={handleOpenAddModal}
            className="flex items-center px-5 py-2.5 bg-[#0046B5] text-white text-xs font-bold rounded hover:bg-blue-800 transition-colors uppercase tracking-wider"
          >
            <Plus className="h-4 w-4 mr-2" />
            ADD NEW ROLE
          </button>
        </div>
      </div>

      {/* جدول الأدوار */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-200 bg-white">
                <th className="px-6 py-4 text-xs font-bold text-[#003B73] uppercase tracking-wider">Role Name</th>
                <th className="px-6 py-4 text-xs font-bold text-[#003B73] uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-xs font-bold text-[#003B73] uppercase tracking-wider">Associated Users</th>
                <th className="px-6 py-4 text-xs font-bold text-[#003B73] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                    No roles found.
                  </td>
                </tr>
              ) : (
                filteredRoles.map((role) => (
                  <tr key={role.role_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gray-900">{role.role_name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{role.description || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-50 text-[#0046B5] text-xs font-bold rounded-full">
                        {role.users_count || 0} user(s)
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-4 text-gray-400">
                        <button onClick={() => handleOpenEditModal(role)} title="Edit" className="hover:text-[#0046B5] transition-colors"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => handleDeleteRole(role.role_id)} title="Delete" className="hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* مودل إضافة/تعديل دور */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden flex flex-col">
            
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-[#003B73]">{editingRoleId ? 'Edit Role' : 'Add New Role'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveRole} className="p-6 space-y-5">
              
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">Role Name *</label>
                <input 
                  type="text" 
                  name="role_name" 
                  value={roleForm.role_name} 
                  onChange={handleChange} 
                  required 
                  placeholder="e.g. Senior Resident" 
                  className="w-full border border-gray-200 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5]" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">Description</label>
                <textarea 
                  name="description" 
                  value={roleForm.description} 
                  onChange={handleChange} 
                  rows="3" 
                  placeholder="Describe the responsibilities of this role..." 
                  className="w-full border border-gray-200 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5] resize-none" 
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-[#0046B5] hover:bg-blue-50 rounded transition-colors uppercase tracking-wider">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 bg-[#0046B5] text-white text-sm font-bold rounded hover:bg-blue-800 transition-colors uppercase tracking-wider">
                  Save Role
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default RolesTab;
