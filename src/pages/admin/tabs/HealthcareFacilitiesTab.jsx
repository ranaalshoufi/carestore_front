import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import api from '../../../utils/api';
import { toast } from '../../../utils/toast';

const HealthcareFacilitiesTab = () => {
  const [facilities, setFacilities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFacilityId, setEditingFacilityId] = useState(null);

  const [facilityForm, setFacilityForm] = useState({
    name: '',
    type: 'General Hospital',
    status: 'Operational',
    city: '',
    address: '',
    phone: '',
    email: ''
  });

  const fetchFacilities = async () => {
    try {
      const res = await api.get('/facilities');
      setFacilities(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching facilities:', err);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const handleChange = (e) => {
    setFacilityForm({ ...facilityForm, [e.target.name]: e.target.value });
  };

  const handleOpenAddModal = () => {
    setEditingFacilityId(null);
    setFacilityForm({
      name: '',
      type: 'General Hospital',
      status: 'Operational',
      city: '',
      address: '',
      phone: '',
      email: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (fac) => {
    setEditingFacilityId(fac.facility_id);
    setFacilityForm({
      name: fac.name || '',
      type: fac.type || 'General Hospital',
      status: fac.status === 'active' ? 'Operational' : 'Maintenance',
      city: fac.city || '',
      address: fac.address || '',
      phone: fac.phone || '',
      email: fac.email || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveFacility = async (e) => {
    e.preventDefault();
    try {
      if (editingFacilityId) {
        await api.put(`/facilities/${editingFacilityId}`, facilityForm);
        toast.success('تم تحديث المنشأة الصحية بنجاح!');
      } else {
        await api.post('/facilities', facilityForm);
        toast.success('تم إضافة المنشأة الصحية بنجاح!');
      }
      setIsModalOpen(false);
      fetchFacilities();
    } catch (err) {
      console.error('Error saving facility:', err);
      toast.error('فشل حفظ المنشأة الصحية.');
    }
  };

  const handleDeleteFacility = async (facilityId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المنشأة؟')) return;
    try {
      await api.delete(`/facilities/${facilityId}`);
      toast.success('تم حذف المنشأة بنجاح!');
      fetchFacilities();
    } catch (err) {
      console.error('Error deleting facility:', err);
      toast.error(err.response?.data?.message || 'فشل حذف المنشأة (قد تكون مرتبطة بمستخدمين أو أقسام).');
    }
  };

  const filteredFacilities = facilities.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.city && f.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (f.type && f.type.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col mt-6 relative">
      
      {/* الترويسة */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-[#003B73]">Facilities Management</h2>
          <p className="text-sm text-gray-500 mt-1">Oversee affiliated hospitals, clinics, and specialized medical centers.</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="flex items-center px-5 py-2.5 bg-[#003B73] text-white text-xs font-bold rounded hover:bg-blue-900 transition-colors uppercase tracking-wider"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Facility
        </button>
      </div>

      {/* الحاوية الرئيسية */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        
        {/* شريط الأدوات */}
        <div className="p-5 border-b border-gray-100 flex flex-wrap gap-4 justify-between items-center bg-white">
          <h3 className="text-lg font-bold text-[#003B73]">Facility Directory</h3>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search facilities..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded bg-[#F8F9FB] text-sm focus:outline-none focus:border-[#0046B5] w-64" 
              />
            </div>
          </div>
        </div>

        {/* جدول المنشآت */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-gray-200 bg-[#F8F9FB]">
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Facility Name</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">City</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredFacilities.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-400">
                    No facilities found.
                  </td>
                </tr>
              ) : (
                filteredFacilities.map((facility) => {
                  const isActive = facility.status === 'active';
                  const statusColor = isActive ? 'bg-cyan-50 text-cyan-600 border border-cyan-100' : 'bg-red-50 text-red-600 border border-red-100';
                  return (
                    <tr key={facility.facility_id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-5">
                        <span className="text-sm font-bold text-gray-900 leading-tight block">{facility.name}</span>
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-700">{facility.type || '—'}</td>
                      <td className="px-6 py-5 text-sm text-gray-700">{facility.city || '—'}</td>
                      <td className="px-6 py-5 text-sm text-gray-700">{facility.address || '—'}</td>
                      <td className="px-6 py-5 text-sm text-gray-700 font-mono">{facility.phone || '—'}</td>
                      <td className="px-6 py-5 text-sm text-[#0046B5] hover:underline cursor-pointer">{facility.email || '—'}</td>
                      <td className="px-6 py-5">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded uppercase tracking-wider ${statusColor}`}>
                          {isActive ? 'OPERATIONAL' : 'MAINTENANCE'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end space-x-3 text-gray-400">
                          <button onClick={() => handleOpenEditModal(facility)} className="hover:text-amber-500 transition-colors" title="Edit"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => handleDeleteFacility(facility.facility_id)} className="hover:text-red-500 transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
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

      {/* ==================== مودل إضافة/تعديل منشأة ==================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden flex flex-col">
            
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-[#003B73]">{editingFacilityId ? 'Edit Facility' : 'Add New Healthcare Facility'}</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveFacility} className="p-6 space-y-5">
              
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Facility Name *</label>
                <input 
                  type="text" 
                  name="name" 
                  value={facilityForm.name} 
                  onChange={handleChange} 
                  required
                  placeholder="e.g. Central General Hospital" 
                  className="w-full border border-gray-200 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5]" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Facility Type</label>
                  <select name="type" value={facilityForm.type} onChange={handleChange} className="w-full border border-gray-200 rounded bg-white text-gray-900 p-2.5 text-sm outline-none focus:border-[#0046B5]" style={{ colorScheme: 'light' }}>
                    <option value="General Hospital">General Hospital</option>
                    <option value="Hospital">Hospital</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Diagnostic">Diagnostic</option>
                    <option value="Clinic">Clinic</option>
                    <option value="Medical Center">Medical Center</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Status</label>
                  <select name="status" value={facilityForm.status} onChange={handleChange} className="w-full border border-gray-200 rounded bg-white text-gray-900 p-2.5 text-sm outline-none focus:border-[#0046B5]" style={{ colorScheme: 'light' }}>
                    <option value="Operational">Operational</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">City</label>
                  <input type="text" name="city" value={facilityForm.city} onChange={handleChange} placeholder="City name" className="w-full border border-gray-200 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5]" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Address</label>
                  <input type="text" name="address" value={facilityForm.address} onChange={handleChange} placeholder="Street address" className="w-full border border-gray-200 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5]" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number</label>
                  <input type="text" name="phone" value={facilityForm.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" className="w-full border border-gray-200 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5]" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                  <input type="email" name="email" value={facilityForm.email} onChange={handleChange} placeholder="admin@facility.org" className="w-full border border-gray-200 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5]" />
                </div>
              </div>
              
              <div className="flex justify-end gap-4 pt-4">
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
                  Save Facility
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default HealthcareFacilitiesTab;
