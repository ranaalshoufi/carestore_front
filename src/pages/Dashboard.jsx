import React, { useState, useEffect } from 'react';
import { 
  Users, CalendarCheck, BriefcaseMedical, 
  Microscope, CalendarDays, TrendingUp, Clock, FileText, UserPlus 
} from 'lucide-react';
import api from '../utils/api';

const Dashboard = () => {
  const [stats, setStats] = useState([
    { title: 'Total Patients', value: '...', subtext: 'loading...', subIcon: TrendingUp, icon: Users, subColor: 'text-[#0046B5]' },
    { title: "Today's Visits", value: '...', subtext: 'loading...', subIcon: null, icon: CalendarCheck, subColor: 'text-gray-500' },
    { title: 'Total Doctors', value: '...', subtext: 'loading...', subIcon: null, icon: BriefcaseMedical, subColor: 'text-gray-500' },
    { title: 'Lab Orders', value: '...', subtext: 'loading...', subIcon: Clock, icon: Microscope, subColor: 'text-teal-600' },
    { title: 'Radiology Orders', value: '...', subtext: 'loading...', subIcon: null, icon: CalendarDays, subColor: 'text-gray-500' },
  ]);

  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // بيانات المخطط (يوم/شهر)
  const [chartPeriod, setChartPeriod] = useState('day');
  const [chartLabels, setChartLabels] = useState([]);
  const [chartValues, setChartValues] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/dashboard-stats');
        const data = response.data;
        
        // ربط الإحصائيات مع الأيقونات الثابتة
        const icons = [Users, CalendarCheck, BriefcaseMedical, Microscope, CalendarDays];
        const subIcons = [TrendingUp, null, null, Clock, null];

        const updatedStats = data.stats.map((item, index) => ({
          ...item,
          icon: icons[index] || Users,
          subIcon: subIcons[index] || null
        }));

        setStats(updatedStats);

        // ربط الأنشطة الأخيرة مع الأيقونات
        const formattedActivities = data.recentActivities.map(act => ({
          ...act,
          icon: act.icon === 'UserPlus' ? UserPlus : FileText
        }));
        setRecentActivities(formattedActivities);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // جلب بيانات المخطط حسب الفترة (يوم/شهر)
  useEffect(() => {
    const fetchChart = async () => {
      try {
        const res = await api.get(`/dashboard-visits/${chartPeriod}`);
        setChartLabels(res.data.labels || []);
        setChartValues(res.data.values || []);
      } catch (error) {
        console.error('Error fetching dashboard visits:', error);
        setChartLabels([]);
        setChartValues([]);
      }
    };
    fetchChart();
  }, [chartPeriod]);

  const maxChartValue = Math.max(...chartValues, 1);
  const barColor = (i) => (i === chartValues.length - 1 ? 'bg-[#0046B5]' : 'bg-[#82AAD8]');

  return (
    <div className="space-y-6">
      
      {/* 5 Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const SubIcon = stat.subIcon;
          return (
            <div key={index} className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 relative">
              <Icon className="h-5 w-5 text-[#0046B5] absolute top-5 right-5" />
              <p className="text-xs font-semibold text-gray-500 mb-2">{stat.title}</p>
              <p className="text-3xl font-bold text-gray-900 mb-3">{stat.value}</p>
              <div className={`flex items-center text-xs font-medium ${stat.subColor}`}>
                {SubIcon && <SubIcon className="h-3 w-3 mr-1" />}
                <span>{stat.subtext}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Chart & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bar Chart Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-lg font-bold text-[#003B73]">Visit Statistics</h2>
            <div className="flex bg-gray-100 rounded-md p-1">
              <button
                onClick={() => setChartPeriod('day')}
                className={`px-4 py-1 text-xs font-bold rounded transition-colors ${chartPeriod === 'day' ? 'bg-[#0046B5] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Daily
              </button>
              <button
                onClick={() => setChartPeriod('month')}
                className={`px-4 py-1 text-xs font-bold rounded transition-colors ${chartPeriod === 'month' ? 'bg-[#0046B5] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Monthly
              </button>
            </div>
          </div>
          
          {/* Bar Chart */}
          <div className="flex-1 flex items-end justify-between gap-2 px-4 pb-2 mt-auto h-48 bg-gray-50/50 rounded-lg pt-8">
            {chartLabels.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
                {isLoading ? 'Loading...' : 'No data available'}
              </div>
            ) : (
              chartLabels.map((label, i) => {
                const heightPct = Math.max((chartValues[i] / maxChartValue) * 100, 4);
                return (
                  <div key={i} className="w-full flex flex-col items-center justify-end h-full">
                    <span className="text-[10px] font-bold text-gray-500">{chartValues[i]}</span>
                    <div
                      className={`w-full ${barColor(i)} rounded-t-sm mt-1`}
                      style={{ height: `${heightPct}%` }}
                    ></div>
                    <span className="text-[10px] text-gray-400 mt-2 font-medium">{label}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 lg:col-span-1">
          <h2 className="text-lg font-bold text-[#003B73] mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivities.map((activity) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-50 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg mr-4 ${activity.iconBg}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        {activity.action} <span className="font-bold text-gray-900">{activity.name}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;