import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, User, Calendar, FlaskConical, 
  Activity, Settings, UserCircle, LogOut, Search 
} from 'lucide-react';

import myLogo from '../../assets/logo.png';
import api from '../../utils/api';

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [globalQuery, setGlobalQuery] = React.useState('');

  const handleGlobalSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      const q = globalQuery.trim();
      navigate(`/patients${q ? `?search=${encodeURIComponent(q)}` : ''}`);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  // جلب دور المستخدم الحالي من localStorage
  // 1: Admin, 2: Doctor, 3: Nurse, 4: Lab Tech, 5: Radiologist, 6: Receptionist
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const roleId = user && user.role_id ? Number(user.role_id) : 1;

  const allMenuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: [1, 2, 3, 4, 5, 6] },
    { name: 'Patients', path: '/patients', icon: User, roles: [1, 2, 3, 6] },
    { name: 'Appointments', path: '/appointments', icon: Calendar, roles: [1, 2, 3, 6] },
    { name: 'Laboratory', path: '/laboratory', icon: FlaskConical, roles: [1, 4] },
    { name: 'Radiology', path: '/radiology', icon: Activity, roles: [1, 5] },
    { name: 'Admin Settings', path: '/admin-settings', icon: Settings, roles: [1] },
    { name: 'My Profile', path: '/profile', icon: UserCircle, roles: [1, 2, 3, 4, 5, 6] },
  ];

  const menuItems = allMenuItems.filter(item => item.roles.includes(roleId));

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans">
      
      {/* الشريط الجانبي */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between">
        <div>
          
          {/* الشعار */}
          <div className="flex flex-col items-center justify-center mt-8 mb-6">
            <img src={myLogo} alt="Carestory Logo" className="h-20 w-auto mb-1 object-contain" />
            <div className="text-center">
              <h2 className="text-xl font-bold text-[#003B73] tracking-wide">Carestory</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                {user?.role?.role_name || 'Clinical Portal'}
              </p>
            </div>
          </div>

          {/* روابط التصفح */}
          <nav className="flex flex-col mt-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.includes(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center px-6 py-4 transition-colors ${
                    isActive 
                      ? 'text-[#0046B5] bg-[#EEF2FC] border-r-4 border-[#0046B5] font-semibold' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 border-r-4 border-transparent'
                  }`}
                >
                  <Icon className={`h-5 w-5 mr-4 ${isActive ? 'text-[#0046B5]' : 'text-gray-400'}`} />
                  <span className="text-sm">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* زر تسجيل الخروج */}
        <div className="p-6 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="flex items-center text-sm font-medium text-gray-500 hover:text-red-600 transition-colors w-full cursor-pointer"
          >
            <LogOut className="h-5 w-5 mr-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* المحتوى الرئيسي */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* الشريط العلوي (البحث) */}
        <header className="h-20 bg-[#F3F4F6] flex items-center px-8 z-10">
          <div className="relative w-full max-w-xl">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={globalQuery}
              onChange={(e) => setGlobalQuery(e.target.value)}
              onKeyDown={handleGlobalSearchKeyDown}
              placeholder="Search by MRN, National ID, Name (Press Enter)..."
              className="block w-full pl-10 pr-3 py-2.5 border-none rounded-md bg-white text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0046B5] sm:text-sm placeholder-gray-400"
            />
          </div>
        </header>

        {/* مساحة عرض الصفحات */}
        <main className="flex-1 overflow-y-auto p-8 pt-2">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
