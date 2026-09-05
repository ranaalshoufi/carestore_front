import React, { useState, useEffect, useRef } from 'react';
import { User, Edit2, X, Camera, Trash2, Loader } from 'lucide-react';
import api from '../utils/api';
import { toast } from '../utils/toast';

const MyProfile = () => {
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    employeeId: '',
    phone: '',
    department: ''
  });

  const [userId, setUserId] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarDeleting, setAvatarDeleting] = useState(false);
  const fileInputRef = useRef(null);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const avatarCacheKey = (id) => `user_avatar_${id}`;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/user');
        const u = res.data;
        setProfileData({
          fullName: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
          email: u.email || '',
          employeeId: u.user_id ? `EMP-${String(u.user_id).padStart(5, '0')}` : '',
          phone: u.phone || '',
          department: (u.department && u.department.name) || (u.role && u.role.role_name) || 'General'
        });
        setUserId(u.user_id);
        // الصورة خاصة بالمستخدم وتأتي من الخادم (المصدر الأساسي)
        setAvatar(u.avatar_url || null);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordChangeInput = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // معاينة فورية
    const reader = new FileReader();
    reader.onloadend = () => setAvatar(reader.result);
    reader.readAsDataURL(file);

    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await api.post('/user/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = res.data.avatar_url || res.data.avatar;
      setAvatar(url);
      if (userId) localStorage.setItem(avatarCacheKey(userId), url || '');
      toast.success('تم تحديث الصورة الشخصية بنجاح');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error(error.response?.data?.message || 'فشل رفع الصورة الشخصية');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAvatar = async () => {
    if (!userId || !window.confirm('هل تريد حذف الصورة الشخصية؟')) return;
    setAvatarDeleting(true);
    try {
      await api.delete('/user/avatar');
      setAvatar(null);
      localStorage.removeItem(avatarCacheKey(userId));
      toast.success('تم حذف الصورة الشخصية بنجاح');
    } catch (error) {
      console.error('Error deleting avatar:', error);
      toast.error(error.response?.data?.message || 'فشل حذف الصورة الشخصية');
    } finally {
      setAvatarDeleting(false);
    }
  };

  const handleSaveChanges = (e) => {
    e.preventDefault();
    toast.success('تم حفظ التعديلات بنجاح!');
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('كلمة المرور الجديدة غير مطابقة لتأكيد كلمة المرور.');
      return;
    }
    if (passwordForm.new_password.length < 6) {
      toast.error('يجب أن تكون كلمة المرور الجديدة 6 أحرف على الأقل.');
      return;
    }

    setIsSubmittingPassword(true);
    try {
      await api.put('/user/password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });
      toast.success('تم تغيير كلمة المرور بنجاح!');
      setIsPasswordModalOpen(false);
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      console.error('Error updating password:', error);
      const msg = error.response?.data?.message || 'فشل تغيير كلمة المرور. تأكد من صحة كلمة المرور الحالية.';
      toast.error(msg);
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  return (
    <div className="font-sans h-full bg-[#F3F4F6] p-8">
      
      {/* الترويسة */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-[#003B73]">Account Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Manage your professional profile.</p>
      </div>

      {/* تبويب Profile */}
      <div className="border-b border-gray-200 mb-6">
        <button className="pb-3 text-sm font-bold text-[#0046B5] border-b-2 border-[#0046B5]">
          Profile
        </button>
      </div>

      {/* بطاقة نموذج الملف الشخصي */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 max-w-5xl">
        <form onSubmit={handleSaveChanges}>
          <div className="flex flex-col md:flex-row gap-8">
            
            {/* الجزء الأيسر: الصورة الشخصية */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="h-28 w-28 bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden cursor-pointer group relative shadow-inner"
                  title="Click to change profile picture"
                >
                  {avatar ? (
                    <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-12 w-12 text-gray-400 group-hover:text-[#0046B5] transition-colors" />
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Camera className="h-6 w-6" />
                  </div>
                  {avatarUploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader className="h-7 w-7 text-white animate-spin" />
                    </div>
                  )}
                </div>

                {/* زر تعديل الصورة */}
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 h-8 w-8 bg-[#0046B5] text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm hover:bg-blue-800 transition-colors"
                  title="Upload picture"
                >
                  <Edit2 className="h-4 w-4" />
                </button>

                {/* زر حذف الصورة */}
                {avatar && (
                  <button 
                    type="button"
                    onClick={handleDeleteAvatar}
                    disabled={avatarDeleting}
                    className="absolute -top-2 -right-2 h-7 w-7 bg-red-600 text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                    title="Delete picture"
                  >
                    {avatarDeleting ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                )}

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-3 text-center">الصورة خاصة بحسابك أنت فقط</p>
            </div>

            {/* الجزء الأيمن: حقول الإدخال */}
            <div className="flex-1 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">Full Name</label>
                  <input 
                    type="text" 
                    name="fullName" 
                    value={profileData.fullName} 
                    onChange={handleChange} 
                    className="w-full border border-gray-200 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5]" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={profileData.email} 
                    onChange={handleChange} 
                    className="w-full border border-gray-200 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5]" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">Employee ID</label>
                  <input 
                    type="text" 
                    name="employeeId" 
                    value={profileData.employeeId} 
                    onChange={handleChange} 
                    className="w-full border border-gray-200 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5]" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">Phone Number</label>
                  <input 
                    type="text" 
                    name="phone" 
                    value={profileData.phone} 
                    onChange={handleChange} 
                    className="w-full border border-gray-200 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5]" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">Department</label>
                  <input 
                    type="text" 
                    name="department" 
                    value={`${profileData.department} (read only)`} 
                    readOnly 
                    className="w-full border border-gray-200 rounded bg-[#F1F3F8] p-2.5 text-sm text-gray-500 cursor-not-allowed outline-none" 
                  />
                </div>
              </div>

            </div>
          </div>

          {/* الأزرار السفلية */}
          <div className="flex justify-end items-center gap-4 pt-8 mt-4 border-t border-gray-100">
            <button 
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="px-6 py-2.5 border border-gray-300 text-sm font-bold text-gray-700 rounded hover:bg-gray-50 transition-colors"
            >
              Change Password
            </button>
            <button 
              type="submit" 
              className="px-6 py-2.5 bg-[#003B73] text-white text-sm font-bold rounded hover:bg-blue-900 transition-colors"
            >
              Save changes
            </button>
          </div>

        </form>
      </div>

      {/* مودل تغيير كلمة المرور */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-[#003B73]">Change Password</h3>
              <button onClick={() => setIsPasswordModalOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdatePassword} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Current Password</label>
                <input 
                  type="password" 
                  name="current_password"
                  value={passwordForm.current_password}
                  onChange={handlePasswordChangeInput}
                  required
                  placeholder="Enter current password" 
                  className="w-full border border-gray-200 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5]" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">New Password</label>
                <input 
                  type="password" 
                  name="new_password"
                  value={passwordForm.new_password}
                  onChange={handlePasswordChangeInput}
                  required
                  placeholder="At least 6 characters" 
                  className="w-full border border-gray-200 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5]" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Confirm New Password</label>
                <input 
                  type="password" 
                  name="confirm_password"
                  value={passwordForm.confirm_password}
                  onChange={handlePasswordChangeInput}
                  required
                  placeholder="Re-enter new password" 
                  className="w-full border border-gray-200 rounded bg-[#F8F9FB] p-2.5 text-sm outline-none focus:border-[#0046B5]" 
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsPasswordModalOpen(false)} 
                  className="px-5 py-2 border border-gray-300 text-sm font-semibold text-gray-700 rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmittingPassword} 
                  className="px-5 py-2 bg-[#003B73] text-white text-sm font-bold rounded hover:bg-blue-900 transition-colors disabled:opacity-50"
                >
                  {isSubmittingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyProfile;
