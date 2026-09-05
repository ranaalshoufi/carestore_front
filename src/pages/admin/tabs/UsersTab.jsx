import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import api from '../../../utils/api';
import { toast } from '../../../utils/toast';

const UsersTab = () => {
  const [activeInnerTab, setActiveInnerTab] = useState('Users List');
  const [users, setUsers] = useState([]);
  const [metadata, setMetadata] = useState({ roles: [], departments: [], facilities: [] });
  const [loading, setLoading] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);

  const [userForm, setUserForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role_id: '',
    department_id: '',
    facility_id: '',
    status: 'active',
    password: '',
  });

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchMetadata = async () => {
    try {
      const res = await api.get('/users-metadata');
      setMetadata(res.data);
    } catch (err) {
      console.error('Error fetching metadata:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchMetadata();
  }, []);

  const handleChange = (e) => {
    setUserForm({ ...userForm, [e.target.name]: e.target.value });
  };

  const handleEditClick = (user) => {
    setEditingUserId(user.user_id);
    setUserForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone: user.phone || '',
      role_id: user.role_id || '',
      department_id: user.department_id || '',
      facility_id: user.facility_id || '',
      status: user.status || 'active',
      password: '',
    });
    setActiveInnerTab('Add / Edit User');
  };

  const handleNewUserClick = () => {
    setEditingUserId(null);
    setUserForm({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role_id: '',
      department_id: '',
      facility_id: '',
      status: 'active',
      password: '',
    });
    setActiveInnerTab('Add / Edit User');
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingUserId) {
        await api.put(`/users/${editingUserId}`, userForm);
        toast.success('تم تحديث بيانات المستخدم بنجاح!');
      } else {
        await api.post('/users', userForm);
        toast.success('تم إضافة المستخدم بنجاح!');
      }
      fetchUsers();
      setActiveInnerTab('Users List');
    } catch (err) {
      console.error('Error saving user:', err);
      toast.error('فشل حفظ المستخدم، يرجى التأكد من صحة البيانات.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    try {
      await api.delete(`/users/${userId}`);
      toast.success('تم حذف المستخدم بنجاح!');
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      toast.error(err.response?.data?.message || 'فشل حذف المستخدم.');
    }
  };

  return (
    <div className="flex flex-col mt-6">
      
      {/* الترويسة وزر الإضافة */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-3xl font-bold text-[#003B73]">Users Management</h2>
          <p className="text-sm text-gray-500 mt-1">Manage clinical staff, system access, and roles.</p>
        </div>
        <button
          onClick={handleNewUserClick}
          className="flex items-center px-4 py-2.5 bg-[#003B73] text-white text-sm font-semibold rounded hover:bg-blue-900 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New User
        </button>
      </div>

      {/* التبويبات الداخلية */}
      <div className="flex space-x-6 border-b border-gray-200 mb-6">
        <button 
          onClick={() => setActiveInnerTab('Users List')}
          className={`pb-3 text-sm font-bold relative transition-colors ${activeInnerTab === 'Users List' ? 'text-[#0046B5]' : 'text-gray-500 hover:text-gray-800'}`}
        >
          Users List
          {activeInnerTab === 'Users List' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0046B5] rounded-t-md"></span>}
        </button>
        <button 
          onClick={() => { if (!editingUserId) handleNewUserClick(); else setActiveInnerTab('Add / Edit User'); }}
          className={`pb-3 text-sm font-bold relative transition-colors ${activeInnerTab === 'Add / Edit User' ? 'text-[#0046B5]' : 'text-gray-500 hover:text-gray-800'}`}
        >
          {editingUserId ? 'Edit User' : 'Add New User'}
          {activeInnerTab === 'Add / Edit User' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0046B5] rounded-t-md"></span>}
        </button>
      </div>

      {/* محتوى التبويب: Users List */}
      {activeInnerTab === 'Users List' && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-200 bg-[#F8F9FB]">
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Facility</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
                    return (
                      <tr key={user.user_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-blue-100 text-[#0046B5] flex items-center justify-center font-bold text-xs mr-3">
                              {initials}
                            </div>
                            <span className="text-sm font-semibold text-gray-900">{user.first_name} {user.last_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-mono">{user.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{user.role?.role_name || '—'}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{user.facility?.name || '—'}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{user.department?.name || '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${user.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end space-x-3 text-gray-400">
                            <button onClick={() => handleEditClick(user)} title="Edit" className="hover:text-[#0046B5] transition-colors"><Edit2 className="h-4 w-4" /></button>
                            <button onClick={() => handleDeleteUser(user.user_id)} title="Delete" className="hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
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
      )}

      {/* محتوى التبويب: Add / Edit User */}
      {activeInnerTab === 'Add / Edit User' && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
          <h3 className="text-xl font-bold text-[#003B73] mb-6">{editingUserId ? 'Edit User Details' : 'Add New User'}</h3>
          <form onSubmit={handleSaveUser} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">First Name *</label>
                <input type="text" name="first_name" value={userForm.first_name} onChange={handleChange} required placeholder="Enter first name" className="w-full border border-gray-200 rounded bg-[#F8F9FB] p-3 text-sm outline-none focus:border-[#0046B5]" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">Last Name *</label>
                <input type="text" name="last_name" value={userForm.last_name} onChange={handleChange} required placeholder="Enter last name" className="w-full border border-gray-200 rounded bg-[#F8F9FB] p-3 text-sm outline-none focus:border-[#0046B5]" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">Email *</label>
                <input type="email" name="email" value={userForm.email} onChange={handleChange} required placeholder="Enter email address" className="w-full border border-gray-200 rounded bg-[#F8F9FB] p-3 text-sm outline-none focus:border-[#0046B5]" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">Phone Number</label>
                <input type="text" name="phone" value={userForm.phone} onChange={handleChange} placeholder="Enter phone number" className="w-full border border-gray-200 rounded bg-[#F8F9FB] p-3 text-sm outline-none focus:border-[#0046B5]" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">Role *</label>
                <select name="role_id" value={userForm.role_id} onChange={handleChange} required className="w-full border border-gray-200 rounded bg-white text-gray-900 p-3 text-sm outline-none focus:border-[#0046B5]" style={{ colorScheme: 'light' }}>
                  <option value="">Select role</option>
                  {metadata.roles.map(r => (
                    <option key={r.role_id} value={r.role_id}>{r.role_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">Department</label>
                <select name="department_id" value={userForm.department_id} onChange={handleChange} className="w-full border border-gray-200 rounded bg-white text-gray-900 p-3 text-sm outline-none focus:border-[#0046B5]" style={{ colorScheme: 'light' }}>
                  <option value="">Select department</option>
                  {metadata.departments.map(d => (
                    <option key={d.department_id} value={d.department_id}>{d.name} ({d.description})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">Healthcare Facility</label>
                <select name="facility_id" value={userForm.facility_id} onChange={handleChange} className="w-full border border-gray-200 rounded bg-white text-gray-900 p-3 text-sm outline-none focus:border-[#0046B5]" style={{ colorScheme: 'light' }}>
                  <option value="">Select facility</option>
                  {metadata.facilities.map(f => (
                    <option key={f.facility_id} value={f.facility_id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">Status</label>
                <select name="status" value={userForm.status} onChange={handleChange} className="w-full border border-gray-200 rounded bg-white text-gray-900 p-3 text-sm outline-none focus:border-[#0046B5]" style={{ colorScheme: 'light' }}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">Password {editingUserId ? '(leave blank to keep current)' : '*'}</label>
                <input type="password" name="password" value={userForm.password} onChange={handleChange} required={!editingUserId} placeholder="Enter password" className="w-full border border-gray-200 rounded bg-[#F8F9FB] p-3 text-sm outline-none focus:border-[#0046B5]" />
              </div>
            </div>

            {/* الأزرار السفلية */}
            <div className="flex justify-end items-center gap-4 pt-6 border-t border-gray-100">
              <button 
                type="button"
                onClick={() => setActiveInnerTab('Users List')}
                className="px-6 py-2.5 border border-gray-300 text-sm font-semibold text-gray-700 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="px-8 py-2.5 bg-[#003B73] text-white text-sm font-bold rounded hover:bg-blue-900 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save User'}
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
};

export default UsersTab;
