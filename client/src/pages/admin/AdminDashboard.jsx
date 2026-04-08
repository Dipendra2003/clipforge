import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [contentStats, setContentStats] = useState(null);
  const [platformStats, setPlatformStats] = useState(null);
  const [schedulingStats, setSchedulingStats] = useState(null);
  const [errorStats, setErrorStats] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

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

      const baseUrl = import.meta.env.VITE_API_URL;

      // Fetch all data in parallel
      const [
        overviewRes,
        userStatsRes,
        contentStatsRes,
        platformStatsRes,
        schedulingStatsRes,
        errorStatsRes,
        systemStatsRes
      ] = await Promise.all([
        axios.get(`${baseUrl}/api/admin/stats/overview`, config),
        axios.get(`${baseUrl}/api/admin/stats/users`, config),
        axios.get(`${baseUrl}/api/admin/stats/content`, config),
        axios.get(`${baseUrl}/api/admin/stats/platform`, config),
        axios.get(`${baseUrl}/api/admin/stats/scheduling`, config),
        axios.get(`${baseUrl}/api/admin/stats/errors`, config),
        axios.get(`${baseUrl}/api/admin/stats/system`, config)
      ]);

      setOverview(overviewRes.data);
      setUserStats(userStatsRes.data);
      setContentStats(contentStatsRes.data);
      setPlatformStats(platformStatsRes.data);
      setSchedulingStats(schedulingStatsRes.data);
      setErrorStats(errorStatsRes.data);
      setSystemStats(systemStatsRes.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* System Health Alert */}
      {systemStats && !systemStats.database.connected && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-center">
            <span className="text-2xl mr-3">⚠️</span>
            <div>
              <p className="font-semibold text-red-800">System Alert</p>
              <p className="text-red-700 text-sm">Database connection issue detected</p>
            </div>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Users"
          value={overview?.totalUsers || 0}
          icon="👥"
          color="blue"
        />
        <MetricCard
          label="Active Today"
          value={overview?.activeUsersToday || 0}
          icon="✅"
          color="green"
          subtitle={`${overview?.activeUsers7Days || 0} this week`}
        />
        <MetricCard
          label="Total Videos"
          value={overview?.totalVideos || 0}
          icon="🎬"
          color="purple"
        />
        <MetricCard
          label="Total Clips"
          value={overview?.totalClips || 0}
          icon="✂️"
          color="indigo"
        />
        <MetricCard
          label="Total Posts"
          value={overview?.totalPosts || 0}
          icon="📤"
          color="pink"
        />
        <MetricCard
          label="Scheduled Posts"
          value={overview?.scheduledPosts || 0}
          icon="📅"
          color="yellow"
        />
        <MetricCard
          label="Success Rate"
          value={`${platformStats?.successRate?.successRate || 0}%`}
          icon="📊"
          color="green"
        />
        <MetricCard
          label="Storage Used"
          value={systemStats?.storage?.formatted || '0 Bytes'}
          icon="💾"
          color="gray"
          isText
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <ChartCard title="User Growth (Last 30 Days)">
          {userStats?.growthTrend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={userStats.growthTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No user growth data" />
          )}
        </ChartCard>

        {/* Clip Generation Trend */}
        <ChartCard title="Clip Generation (Last 30 Days)">
          {contentStats?.clipTrend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={contentStats.clipTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Area type="monotone" dataKey="count" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No clip generation data" />
          )}
        </ChartCard>

        {/* Posting Activity */}
        <ChartCard title="Posting Activity (Last 30 Days)">
          {platformStats?.postingTrend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={platformStats.postingTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Bar dataKey="count" fill="#EC4899" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No posting activity data" />
          )}
        </ChartCard>

        {/* Viral Score Distribution */}
        <ChartCard title="Viral Score Distribution">
          {contentStats?.viralScoreDistribution?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={contentStats.viralScoreDistribution}
                  dataKey="count"
                  nameKey="score_range"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {contentStats.viralScoreDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getScoreColor(entry.score_range)} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No viral score data" />
          )}
        </ChartCard>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Insights */}
        <InsightCard title="User Insights" icon="👥">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">New Users</span>
              <span className="font-semibold text-green-600">
                {userStats?.newVsReturning?.newUsers || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Returning Users</span>
              <span className="font-semibold text-blue-600">
                {userStats?.newVsReturning?.returningUsers || 0}
              </span>
            </div>
            <div className="pt-3 border-t">
              <p className="text-sm font-medium text-gray-700 mb-2">Top Users</p>
              {userStats?.topUsers?.slice(0, 5).map((user) => (
                <div key={user.id} className="flex justify-between text-sm py-1">
                  <span className="text-gray-600 truncate">{user.name}</span>
                  <span className="text-gray-900 font-medium">{user.video_count} videos</span>
                </div>
              ))}
            </div>
          </div>
        </InsightCard>

        {/* Content Insights */}
        <InsightCard title="Content Insights" icon="🎬">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Avg Clips/Video</span>
              <span className="font-semibold">
                {overview?.totalVideos > 0 
                  ? (overview.totalClips / overview.totalVideos).toFixed(1)
                  : '0'}
              </span>
            </div>
            <div className="pt-3 border-t">
              <p className="text-sm font-medium text-gray-700 mb-2">Top Videos</p>
              {contentStats?.topVideos?.slice(0, 5).map((video) => (
                <div key={video.id} className="flex justify-between text-sm py-1">
                  <span className="text-gray-600 truncate max-w-[150px]">{video.title}</span>
                  <span className="text-gray-900 font-medium">{video.clip_count} clips</span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t">
              <p className="text-sm font-medium text-gray-700 mb-2">Emotions</p>
              {contentStats?.emotionDistribution?.slice(0, 3).map((emotion) => (
                <div key={emotion.emotion} className="flex justify-between text-sm py-1">
                  <span className="text-gray-600 capitalize">{emotion.emotion || 'Unknown'}</span>
                  <span className="text-gray-900 font-medium">{emotion.count}</span>
                </div>
              ))}
            </div>
          </div>
        </InsightCard>

        {/* Platform Insights */}
        <InsightCard title="Platform Performance" icon="📱">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Posts</span>
              <span className="font-semibold">{platformStats?.successRate?.totalPosts || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Successful</span>
              <span className="font-semibold text-green-600">
                {platformStats?.successRate?.successful || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Failed</span>
              <span className="font-semibold text-red-600">
                {platformStats?.successRate?.failed || 0}
              </span>
            </div>
            <div className="pt-3 border-t">
              <p className="text-sm font-medium text-gray-700 mb-2">Connections</p>
              {platformStats?.connections?.map((conn) => (
                <div key={conn.platform} className="flex justify-between text-sm py-1">
                  <span className="text-gray-600 capitalize">{conn.platform}</span>
                  <span className="text-gray-900 font-medium">
                    {conn.active}/{conn.total_connections}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </InsightCard>
      </div>

      {/* Scheduling Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Scheduling Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-medium">Total Scheduled</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">
              {schedulingStats?.totalScheduled || 0}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">Upcoming (7 days)</p>
            <p className="text-2xl font-bold text-green-900 mt-1">
              {schedulingStats?.upcomingScheduled || 0}
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-red-600 font-medium">Failed</p>
            <p className="text-2xl font-bold text-red-900 mt-1">
              {schedulingStats?.failedScheduled || 0}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600 font-medium">Scheduled vs Immediate</p>
            <p className="text-2xl font-bold text-purple-900 mt-1">
              {schedulingStats?.scheduledVsImmediate?.scheduled || 0}/
              {schedulingStats?.scheduledVsImmediate?.immediate || 0}
            </p>
          </div>
        </div>

        {schedulingStats?.upcomingPosts?.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Upcoming Posts</h3>
            <div className="space-y-2">
              {schedulingStats.upcomingPosts.map((post) => (
                <div key={post.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{post.title || post.clip_title}</p>
                    <p className="text-sm text-gray-500 capitalize">{post.platform}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(post.scheduled_for).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(post.scheduled_for).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Alerts & Errors */}
      {(errorStats?.failedVideos?.length > 0 || errorStats?.failedPosts?.length > 0) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Alerts & Errors</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Failed Videos */}
            {errorStats?.failedVideos?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-red-700 mb-3">
                  Failed Video Uploads ({errorStats.errorCounts.failedVideos})
                </h3>
                <div className="space-y-2">
                  {errorStats.failedVideos.slice(0, 5).map((video) => (
                    <div key={video.id} className="bg-red-50 rounded-lg p-3">
                      <p className="font-medium text-gray-900 text-sm">{video.title}</p>
                      <p className="text-xs text-red-600 mt-1">{video.error_message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(video.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Failed Posts */}
            {errorStats?.failedPosts?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-red-700 mb-3">
                  Failed Posts ({errorStats.errorCounts.failedPosts})
                </h3>
                <div className="space-y-2">
                  {errorStats.failedPosts.slice(0, 5).map((post) => (
                    <div key={post.id} className="bg-red-50 rounded-lg p-3">
                      <p className="font-medium text-gray-900 text-sm">{post.title}</p>
                      <p className="text-xs text-red-600 mt-1">{post.error_message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(post.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* System Health */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">System Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${systemStats?.database?.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <div>
              <p className="text-sm text-gray-600">Database</p>
              <p className="font-semibold text-gray-900">
                {systemStats?.database?.connected ? 'Connected' : 'Disconnected'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <div>
              <p className="text-sm text-gray-600">Storage</p>
              <p className="font-semibold text-gray-900">
                {systemStats?.storage?.formatted || '0 Bytes'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <div>
              <p className="text-sm text-gray-600">Avg Processing Time</p>
              <p className="font-semibold text-gray-900">
                {systemStats?.performance?.avgProcessingTimeFormatted || '0s'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Components
function MetricCard({ label, value, icon, color, subtitle, isText = false }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    pink: 'bg-pink-50 text-pink-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    gray: 'bg-gray-50 text-gray-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className={`${isText ? 'text-xl' : 'text-3xl'} font-bold text-gray-900 mt-2`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`text-4xl ${colorClasses[color]} p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function InsightCard({ title, icon, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-2xl">{icon}</span>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="h-[250px] flex items-center justify-center text-gray-400">
      {message}
    </div>
  );
}

// Helper functions
function getScoreColor(scoreRange) {
  const colors = {
    'High': '#10B981',
    'Medium': '#F59E0B',
    'Low': '#EF4444'
  };
  return colors[scoreRange] || '#6B7280';
}

export default AdminDashboard;
