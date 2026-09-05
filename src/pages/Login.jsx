import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import api from '../utils/api';
import myLogo from '../assets/logo.png';

const Login = () => {
  const navigate = useNavigate();
  
  // تعريف الحالات (States) لحفظ المدخلات وأخطاء الاتصال
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      // إرسال الطلب عبر نسخة Axios المخصصة (api)
      const response = await api.post('/login', {
        email: email,
        password: password
      });

      console.log("رد السيرفر عند تسجيل الدخول:", response.data);
      
      // حفظ التوكن وبيانات المستخدم في localStorage
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      // الانتقال للوحة التحكم أو قائمة المرضى
      navigate('/dashboard');

    } catch (error) {
      if (error.response) {
        // خطأ قادم من السيرفر (مثل بيانات غير صحيحة 401 أو 422)
        setErrorMessage(error.response.data.message || 'فشل تسجيل الدخول، تأكد من البيانات.');
      } else {
        // خطأ في الشبكة أو أن السيرفر لا يعمل
        setErrorMessage('تعذر الاتصال بالخادم، تأكد من تشغيل الباك إند.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center font-sans bg-[#F8F9FB] p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-10">
        
        {/* منطقة اللوغو مع تقليص المسافات السفلية */}
        <div className="text-center flex flex-col items-center mb-8">
          <img src={myLogo} alt="Carestory Logo" className="h-20 w-auto mb-2 object-contain" />
          <h2 className="text-2xl font-bold text-[#003B73]">Welcome Back</h2>
          <p className="text-gray-500 mt-1 text-sm">Please sign in to your clinical account.</p>
        </div>

        {/* عرض رسالة الخطأ إن وجدت */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg text-center">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@carestory.com"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0046B5] transition-colors text-sm bg-[#F8F9FB]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-bold text-gray-700">Password</label>
              <a href="#" className="text-xs font-semibold text-[#0046B5] hover:text-blue-800">Forgot password?</a>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0046B5] transition-colors text-sm bg-[#F8F9FB]"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              className="h-4 w-4 text-[#0046B5] focus:ring-[#0046B5] border-gray-300 rounded cursor-pointer"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer">
              Remember me
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-[#0046B5] hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0046B5] transition-colors mt-2 disabled:opacity-50"
          >
            <LogIn className="h-5 w-5 mr-2" />
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
          
        </form>
      </div>
    </div>
  );
};

export default Login;