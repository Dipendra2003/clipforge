import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function PlatformAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchPlatformAnalytics();
  }, []);

  const fetchPlatformAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL;

      const response = await axios.get(`${baseUrl}/api/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAnalytics(response.data);
    } catch (err) {
      console.error('Error fetching platform analytics:', err);
      setError('Failed to load platform analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading platform analytics...</p>
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
            onClick={fetchPlatformAnalytics}
            className="mt-2 text-red-600 hover:text-red-800 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const metrics = [
    { 
      label: 'Total Views', 
      value: analytics?.totalViews?.toLocaleString() || '0', 
      change: '+0%', 
      icon: '👁️' 
    },
    { 
      label: 'Total Storage', 
      value: analytics?.storage?.formatted || '0 GB', 
      change: '+0%', 
      icon: '💾' 
    },
    { 
      label: 'Total Videos', 
      value: analytics?.totalVideos?.toLocaleString() || '0', 
      change: '+0%', 
      icon: '🎬' 
    },
    { 
      label: 'Total Clips', 
      value: analytics?.totalClips?.toLocaleString() || '0', 
      change: '+0%', 
      icon: '✂️' 
    },
  ];

  // Prepare platform distribution data for chart
  const platformData = analytics?.platformDistribution?.map(p => ({
    platform: p.platform.charAt(0).toUpperCase() + p.platform.slice(1),
    posts: parseInt(p.post_count),
    videos: parseInt(p.video_count)
  })) || [];

  // Prepare processing time data
  const processingData = analytics?.processingStats ? [
    { name: 'Avg Time', value: parseFloat(analytics.processingStats.avgProcessingTime) || 0 },
    { name: 'Min Time', value: parseFloat(analytics.processingStats.minProcessingTime) || 0 },
    { name: 'Max Time', value: parseFloat(analytics.processingStats.maxProcessingTime) || 0 }
  ] : [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
        <button
          onClick={fetchPlatformAnalytics}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{metric.icon}</span>
            </div>
            <p className="text-sm text-gray-600">{metric.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{metric.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Platform Distribution */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Platform Distribution</h2>
          {platformData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="platform" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="posts" fill="#8b5cf6" name="Posts" />
                <Bar dataKey="videos" fill="#10b981" name="Videos" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No platform data available
            </div>
          )}
        </div>

        {/* Processing Time */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Processing Time (seconds)</h2>
          {processingData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={processingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No processing data available
            </div>
          )}
        </div>
      </div>

      {/* Platform Connections */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Platform Connections</h2>
        <div className="space-y-4">
          {analytics?.platformConnections?.map((conn) => (
            <div key={conn.platform} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">
                  {conn.platform === 'youtube' ? '▶️' : 
                   conn.platform === 'instagram' ? '📷' : 
                   conn.platform === 'tiktok' ? '🎵' : '📱'}
                </span>
                <span className="text-gray-700 font-medium capitalize">{conn.platform}</span>
              </div>
              <div className="flex items-center space-x-3 flex-1 max-w-md ml-4">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 rounded-full h-2" 
                    style={{ 
                      width: `${conn.total_connections > 0 ? (conn.active_connections / conn.total_connections * 100) : 0}%` 
                    }} 
                  />
                </div>
                <span className="text-sm text-gray-600 min-w-[80px]">
                  {conn.active_connections}/{conn.total_connections} active
                </span>
              </div>
            </div>
          )) || (
            <p className="text-gray-400 text-center py-4">No platform connections found</p>
          )}
        </div>
      </div>

      {/* User Activity */}
      {analytics?.userActivity && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">User Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600 font-medium">Total Users</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {analytics.userActivity.totalUsers || 0}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600 font-medium">Active Users (7 days)</p>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {analytics.userActivity.activeUsers7Days || 0}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-purple-600 font-medium">Active Today</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">
                {analytics.userActivity.activeUsersToday || 0}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlatformAnalytics;
