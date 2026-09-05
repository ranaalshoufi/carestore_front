import axios from 'axios';

// إنشاء نسخة مخصصة من Axios مع الرابط الأساسي للباك إند
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api', // الرابط الأساسي من وثيقة الـ API
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// معترض الطلبات (Request Interceptor): لإرفاق الـ Token تلقائياً قبل إرسال أي طلب
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// معترض الردود (Response Interceptor): للتعامل مع الأخطاء العامة مثل انتهاء صلاحية الجلسة
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // إذا كان الخطأ 401 (غير مصرح)، نقوم بمسح الـ Token وتحويل المستخدم لصفحة الدخول
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;