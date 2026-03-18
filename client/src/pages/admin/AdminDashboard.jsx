import { useState, useEffect } from 'react';
import axios from 'axios';

function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    videosProcessed: 0,
    totalClips: 0,
    revenue: 0
  });
  const [userGrowth, setUserGrowth] = useState([]);
  const [videoStats, setVideoStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // Fetch all data in parallel
      const [metricsRes, userGrowthRes, videoStatsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/metrics`, config),
        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/user-growth`, config),
        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/video-stats`, config)
      ]);

      setMetrics(metricsRes.data);
      setUserGrowth(userGrowthRes.data);
      setVideoStats(videoStatsRes.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const metricCards = [
    { 
      label: 'Total Users', 
      value: metrics.totalUsers.toLocaleString(), 
      icon: '👥', 
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    { 
      label: 'Active Users', 
      value: metrics.activeUsers.toLocaleString(), 
      icon: '✅', 
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      subtitle: 'Last 30 days'
    },
    { 
      label: 'Videos Processed', 
      value: metrics.videosProcessed.toLocaleString(), 
      icon: '🎬', 
      color: 'purple',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    { 
      label: 'Total Clips', 
      value: metrics.totalClips.toLocaleString(), 
      icon: '✂️', 
      color: 'indigo',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600'
    },
  ];

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="mt-2 text-red-600 hover:text-red-800 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metricCards.map((metric) => (
          <div key={metric.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{metric.value}</p>
                {metric.subtitle && (
                  <p className="text-xs text-gray-500 mt-1">{metric.subtitle}</p>
                )}
              </div>
              <div className={`text-4xl ${metric.bgColor} p-3 rounded-lg`}>
                {metric.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">User Growth (Last 30 Days)</h2>
          <div className="h-64">
            {userGrowth.length > 0 ? (
              <SimpleLineChart 
                data={userGrowth} 
                dataKey="count" 
                labelKey="date"
                color="#3B82F6"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                No user growth data available
              </div>
            )}
          </div>
        </div>

        {/* Video Processing Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Video Processing (Last 30 Days)</h2>
          <div className="h-64">
            {videoStats.length > 0 ? (
              <SimpleBarChart 
                data={videoStats} 
                color="#8B5CF6"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                No video processing data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Avg. Clips per Video</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {metrics.videosProcessed > 0 
                ? (metrics.totalClips / metrics.videosProcessed).toFixed(1)
                : '0'}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">User Engagement Rate</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {metrics.totalUsers > 0 
                ? ((metrics.activeUsers / metrics.totalUsers) * 100).toFixed(1)
                : '0'}%
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Processing Success Rate</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {videoStats.length > 0 
                ? calculateSuccessRate(videoStats)
                : '0'}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple Line Chart Component
function SimpleLineChart({ data, dataKey, labelKey, color }) {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d[dataKey]));
  const chartHeight = 200;
  const chartWidth = 100;

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * chartWidth;
    const y = chartHeight - ((item[dataKey] / maxValue) * chartHeight);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative h-full">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((percent) => (
          <line
            key={percent}
            x1="0"
            y1={(percent / 100) * chartHeight}
            x2={chartWidth}
            y2={(percent / 100) * chartHeight}
            stroke="#E5E7EB"
            strokeWidth="0.5"
          />
        ))}
        
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Points */}
        {data.map((item, index) => {
          const x = (index / (data.length - 1)) * chartWidth;
          const y = chartHeight - ((item[dataKey] / maxValue) * chartHeight);
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              fill={color}
            />
          );
        })}
      </svg>
      
      {/* Labels */}
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>{formatDate(data[0][labelKey])}</span>
        <span>{formatDate(data[data.length - 1][labelKey])}</span>
      </div>
    </div>
  );
}

// Simple Bar Chart Component
function SimpleBarChart({ data, color }) {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => parseInt(d.total) || 0));
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex items-end justify-around gap-1 px-2">
        {data.slice(-14).map((item, index) => {
          const total = parseInt(item.total) || 0;
          const completed = parseInt(item.completed) || 0;
          const height = maxValue > 0 ? (total / maxValue) * 100 : 0;
          const completedHeight = maxValue > 0 ? (completed / maxValue) * 100 : 0;
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center justify-end h-full group relative">
              <div 
                className="w-full bg-gray-300 rounded-t transition-all hover:opacity-80"
                style={{ height: `${height}%`, minHeight: total > 0 ? '4px' : '0' }}
              >
                <div 
                  className="w-full rounded-t"
                  style={{ 
                    height: `${(completedHeight / height) * 100}%`,
                    backgroundColor: color,
                    minHeight: completed > 0 ? '2px' : '0'
                  }}
                />
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                <div>Total: {total}</div>
                <div>Completed: {completed}</div>
                <div className="text-gray-400">{formatDate(item.date)}</div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex justify-center gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-300 rounded"></div>
          <span className="text-gray-600">Total</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: color }}></div>
          <span className="text-gray-600">Completed</span>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { 
    timeZone: 'Asia/Kolkata',
    month: 'short', 
    day: 'numeric' 
  });
}

function calculateSuccessRate(videoStats) {
  const totals = videoStats.reduce((acc, stat) => {
    acc.total += parseInt(stat.total) || 0;
    acc.completed += parseInt(stat.completed) || 0;
    return acc;
  }, { total: 0, completed: 0 });

  if (totals.total === 0) return '0';
  return ((totals.completed / totals.total) * 100).toFixed(1);
}

export default AdminDashboard;
