import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from '../../utils/toast';
import ViewsLineChart from '../../components/charts/ViewsLineChart';
import PlatformBarChart from '../../components/charts/PlatformBarChart';
import EngagementPieChart from '../../components/charts/EngagementPieChart';
import EngagementAreaChart from '../../components/charts/EngagementAreaChart';
import EngagementGauge from '../../components/charts/EngagementGauge';
import AnalyticsInsights from '../../components/analytics/AnalyticsInsights';
import AIInsights from '../../components/analytics/AIInsights';
import ViralScoreAccuracy from '../../components/analytics/ViralScoreAccuracy';
import PerformanceComparison from '../../components/analytics/PerformanceComparison';
import BestPostingTime from '../../components/analytics/BestPostingTime';
import ContentBreakdown from '../../components/analytics/ContentBreakdown';

function Analytics() {
  const navigate = useNavigate();
  // State for analytics data
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({
    totalViews: 0,
    totalLikes: 0,
    totalDislikes: 0,
    totalComments: 0,
    totalShares: 0,
    totalPosts: 0,
    engagementRate: 0,
    changes: {
      views: 0,
      likes: 0,
      dislikes: 0,
      comments: 0
    },
    lastSyncedAt: null,
    hasData: false
  });

  const [topClips, setTopClips] = useState([]);
  const [platformData, setPlatformData] = useState({
    youtube: {
      postsCount: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      avgViews: '0',
      avgLikes: '0',
      engagementRate: 0
    },
    instagram: {
      postsCount: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalReach: 0,
      totalSaved: 0,
      avgViews: '0',
      avgLikes: '0',
      engagementRate: 0
    }
  });
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [dateRange, setDateRange] = useState(30); // Default 30 days
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });

  // Fetch analytics data on mount
  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchTimeSeriesData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/analytics/timeseries?days=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTimeSeriesData(data.data || []);
      }
    } catch (err) {
      console.error('Time-series fetch error:', err);
    }
  };

  // Fetch time-series data when date range changes
  useEffect(() => {
    fetchTimeSeriesData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      // Fetch all analytics data in parallel for better performance
      const [overviewResponse, clipsResponse, platformResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/analytics/overview`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL}/api/analytics/top-clips?limit=10`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL}/api/analytics/platform`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      // Handle overview data
      if (!overviewResponse.ok) {
        throw new Error('Failed to fetch analytics overview');
      }
      const overviewData = await overviewResponse.json();
      setAnalyticsData(overviewData);

      // Handle clips data
      if (clipsResponse.ok) {
        const clipsData = await clipsResponse.json();
        setTopClips(clipsData.clips || []);
      } else {
        console.warn('Failed to fetch top clips');
        setTopClips([]);
      }

      // Handle platform data
      if (platformResponse.ok) {
        const platformData = await platformResponse.json();
        setPlatformData(platformData);
      } else {
        console.warn('Failed to fetch platform data');
        // Keep default platform data structure instead of setting to null
      }

      setLoading(false);
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err.message);
      setLoading(false);
      toast.error('Failed to load analytics data');
    }
  };

  const handleSyncAnalytics = async () => {
    try {
      setSyncing(true);
      setSyncProgress({ current: 0, total: 0 });
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/analytics/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setSyncProgress({ current: data.synced || 0, total: data.total || 0 });
        toast.success(data.message || 'Analytics synced successfully!');
        // Refresh data after sync
        await fetchAnalyticsData();
        await fetchTimeSeriesData();
      } else {
        toast.error(data.message || 'Failed to sync analytics');
      }
    } catch (err) {
      console.error('Sync error:', err);
      toast.error('Failed to sync analytics');
    } finally {
      setSyncing(false);
      setSyncProgress({ current: 0, total: 0 });
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/analytics/export?format=csv`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `clipforge-analytics-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Analytics exported successfully!');
      } else {
        toast.error('Failed to export analytics');
      }
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export analytics');
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeSinceSync = (dateString) => {
    if (!dateString) return null;
    const now = new Date();
    const syncDate = new Date(dateString);
    const diffMs = now - syncDate;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const metrics = [
    { 
      label: 'Total Views', 
      value: formatNumber(analyticsData.totalViews), 
      change: analyticsData.changes.views >= 0 ? `+${analyticsData.changes.views}%` : `${analyticsData.changes.views}%`,
      icon: '👁️',
      trend: analyticsData.changes.views >= 0 ? 'up' : 'down'
    },
    { 
      label: 'Total Likes', 
      value: formatNumber(analyticsData.totalLikes), 
      change: analyticsData.changes.likes >= 0 ? `+${analyticsData.changes.likes}%` : `${analyticsData.changes.likes}%`,
      icon: '👍',
      trend: analyticsData.changes.likes >= 0 ? 'up' : 'down'
    },
    { 
      label: 'Total Dislikes', 
      value: formatNumber(analyticsData.totalDislikes || 0), 
      change: (analyticsData.changes?.dislikes !== undefined && analyticsData.changes.dislikes >= 0) ? `+${analyticsData.changes.dislikes}%` : `${analyticsData.changes?.dislikes || 0}%`,
      icon: '👎',
      trend: (analyticsData.changes?.dislikes || 0) >= 0 ? 'down' : 'up', // Inverted: more dislikes = bad
      isNegative: true // Mark as negative metric
    },
    { 
      label: 'Total Comments', 
      value: formatNumber(analyticsData.totalComments), 
      change: analyticsData.changes.comments >= 0 ? `+${analyticsData.changes.comments}%` : `${analyticsData.changes.comments}%`,
      icon: '💬',
      trend: analyticsData.changes.comments >= 0 ? 'up' : 'down'
    },
    { 
      label: 'Total Posts', 
      value: formatNumber(analyticsData.totalPosts || 0), 
      change: '+0%', 
      icon: '📝',
      trend: 'neutral'
    },
    { 
      label: 'Engagement Rate', 
      value: `${analyticsData.engagementRate}%`, 
      change: '+0%', 
      icon: '📊',
      trend: 'neutral'
    },
  ];

  // Loading state
  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Analytics</h1>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Analytics</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 mb-4">❌ {error}</p>
          <button
            onClick={fetchAnalyticsData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state when no published posts
  if (!loading && !error && !analyticsData.hasData) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Analytics</h1>
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">No Analytics Yet</h2>
            <p className="text-gray-600 mb-6">
              Publish your first clip to YouTube to start tracking performance! 
              Once published, click "Sync Now" to fetch your analytics data.
            </p>
            <div className="space-y-3 text-left bg-white rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">1️⃣</span>
                <div>
                  <p className="font-semibold text-gray-900">Upload & Process Video</p>
                  <p className="text-sm text-gray-600">Upload a video and generate clips</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-2xl">2️⃣</span>
                <div>
                  <p className="font-semibold text-gray-900">Publish to YouTube</p>
                  <p className="text-sm text-gray-600">Post your clips to YouTube Shorts</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-2xl">3️⃣</span>
                <div>
                  <p className="font-semibold text-gray-900">Sync Analytics</p>
                  <p className="text-sm text-gray-600">Come back here and click "Sync Now"</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard/videos')}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
            >
              Go to Videos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto">
      {/* Header with Sync Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
        <div className="w-full sm:w-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Analytics</h1>
          {analyticsData.lastSyncedAt && (
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="text-xs sm:text-sm text-gray-500">
                Last synced: {formatDate(analyticsData.lastSyncedAt)}
              </p>
              <span className="text-xs text-gray-400">•</span>
              <p className="text-xs sm:text-sm text-purple-600 font-medium">
                {getTimeSinceSync(analyticsData.lastSyncedAt)}
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={handleExport}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center justify-center gap-2 text-sm"
          >
            <span>📥</span>
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">Export</span>
          </button>
          <button
            onClick={handleSyncAnalytics}
            disabled={syncing}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            {syncing ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="hidden sm:inline">
                  {syncProgress.total > 0 
                    ? `Syncing ${syncProgress.current}/${syncProgress.total}...` 
                    : 'Syncing...'}
                </span>
                <span className="sm:hidden">Syncing...</span>
              </>
            ) : (
              <>
                <span>🔄</span>
                <span className="hidden sm:inline">Sync Now</span>
                <span className="sm:hidden">Sync</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-6 mb-6 sm:mb-8">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-white rounded-lg sm:rounded-xl shadow p-3 sm:p-6">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-xl sm:text-2xl">{metric.icon}</span>
              <span className={`text-xs sm:text-sm font-medium ${
                metric.isNegative 
                  ? (metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : 'text-gray-600')
                  : (metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : 'text-gray-600')
              }`}>
                {metric.change}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 truncate">{metric.label}</p>
            <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{metric.value}</p>
            {metric.label === 'Total Dislikes' && (
              <p className="text-xs text-gray-400 mt-1" title="YouTube removed public dislike counts in 2021">
                ℹ️ Not available
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Platform Performance */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Performance by Platform</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* YouTube */}
            <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg sm:text-xl">▶️</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">YouTube</h3>
                  <p className="text-xs sm:text-sm text-gray-500">{platformData.youtube.postsCount} posts</p>
                </div>
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Total Views</span>
                  <span className="font-semibold">{formatNumber(platformData.youtube.totalViews)}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Total Likes</span>
                  <span className="font-semibold">{formatNumber(platformData.youtube.totalLikes)}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Avg Views/Post</span>
                  <span className="font-semibold">{platformData.youtube.avgViews}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Engagement Rate</span>
                  <span className="font-semibold">{platformData.youtube.engagementRate}%</span>
                </div>
              </div>
            </div>

            {/* Instagram */}
            <div className={`border border-gray-200 rounded-lg p-3 sm:p-4 ${platformData.instagram.postsCount === 0 ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg sm:text-xl">📷</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Instagram</h3>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {platformData.instagram.postsCount > 0 
                      ? `${platformData.instagram.postsCount} posts` 
                      : 'No posts yet'}
                  </p>
                </div>
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Total Views</span>
                  <span className="font-semibold">
                    {platformData.instagram.postsCount > 0 
                      ? formatNumber(platformData.instagram.totalViews) 
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Total Likes</span>
                  <span className="font-semibold">
                    {platformData.instagram.postsCount > 0 
                      ? formatNumber(platformData.instagram.totalLikes) 
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Avg Views/Post</span>
                  <span className="font-semibold">
                    {platformData.instagram.postsCount > 0 
                      ? platformData.instagram.avgViews 
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Engagement Rate</span>
                  <span className="font-semibold">
                    {platformData.instagram.postsCount > 0 
                      ? `${platformData.instagram.engagementRate}%` 
                      : '-'}
                  </span>
                </div>
                {platformData.instagram.postsCount > 0 && platformData.instagram.totalReach > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-600">Total Reach</span>
                    <span className="font-semibold">{formatNumber(platformData.instagram.totalReach)}</span>
                  </div>
                )}
              </div>
            </div>
        </div>
      </div>

      {/* AI-Powered Insights */}
      {analyticsData.totalPosts > 0 && <AIInsights />}

      {/* Analytics Insights */}
      <AnalyticsInsights 
        analyticsData={analyticsData} 
        topClips={topClips} 
        platformData={platformData} 
      />

      {/* Viral Score Accuracy */}
      {analyticsData.totalPosts > 0 && <ViralScoreAccuracy />}

      {/* Performance Comparison */}
      <PerformanceComparison topClips={topClips} />

      {/* Best Posting Time */}
      <BestPostingTime topClips={topClips} />

      {/* Content Breakdown */}
      <ContentBreakdown topClips={topClips} />

      {/* Top Performing Clips */}
      {topClips.length > 0 && (
        <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Top Performing Clips</h2>
          <div className="space-y-3 sm:space-y-4">
            {topClips.map((clip, index) => (
              <div key={clip.id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="font-bold text-purple-600 text-xs sm:text-base">#{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">{clip.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1">
                    <span className="text-xs sm:text-sm text-gray-500">👁️ {formatNumber(clip.views)}</span>
                    <span className="text-xs sm:text-sm text-gray-500">❤️ {formatNumber(clip.likes)}</span>
                    <span className="text-xs sm:text-sm text-gray-500">💬 {formatNumber(clip.comments)}</span>
                    <span className="text-xs sm:text-sm text-purple-600 font-medium">{clip.engagementRate}% engagement</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <button
                    onClick={() => navigate(`/dashboard/analytics/clip/${clip.id}`)}
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition whitespace-nowrap"
                  >
                    Details
                  </button>
                  {clip.platformUrl && (
                    <a
                      href={clip.platformUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition whitespace-nowrap text-center"
                    >
                      View
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Engagement Rate Gauge */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Engagement Rate Analysis</h2>
        <EngagementGauge engagementRate={analyticsData.engagementRate} loading={loading} />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Views Over Time - Line Chart */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Views Over Time</h2>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(parseInt(e.target.value))}
              className="w-full sm:w-auto px-3 py-1.5 sm:py-1 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
          <ViewsLineChart data={timeSeriesData} loading={loading} />
        </div>

        {/* Platform Performance - Bar Chart */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Platform Comparison</h2>
          <PlatformBarChart platformData={platformData} loading={loading} />
        </div>
      </div>

      {/* Engagement Breakdown - Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Engagement Breakdown</h2>
          <EngagementPieChart analyticsData={analyticsData} loading={loading} />
        </div>

        {/* Engagement Over Time - Area Chart */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Engagement Over Time</h2>
          <EngagementAreaChart data={timeSeriesData} loading={loading} />
        </div>
      </div>
    </div>
  );
}

export default Analytics;
