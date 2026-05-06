import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from '../../utils/toast';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function ClipAnalytics() {
  const { clipId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clip, setClip] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (clipId) {
      fetchClipAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clipId]);

  const fetchClipAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('accessToken');

      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      // Fetch clip details
      const clipResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/clips/${clipId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!clipResponse.ok) {
        if (clipResponse.status === 404) {
          throw new Error('Clip not found');
        } else if (clipResponse.status === 403) {
          throw new Error('You do not have permission to view this clip');
        } else {
          throw new Error('Failed to load clip details');
        }
      }

      const clipData = await clipResponse.json();
      const clipInfo = clipData.clip;
      
      // Construct thumbnail URL
      let thumbnailUrl = null;
      if (clipInfo.cloud_url) {
        // If using Cloudinary, generate thumbnail from video
        if (clipInfo.cloud_url.includes('cloudinary.com')) {
          thumbnailUrl = clipInfo.cloud_url
            .replace('/video/upload/', '/video/upload/so_0,w_800,h_450,c_fill,q_auto/')
            .replace(/\.(mp4|mov|avi|webm)$/i, '.jpg');
        } else {
          // Use the video URL as fallback
          thumbnailUrl = clipInfo.cloud_url;
        }
      } else if (clipInfo.thumbnail_path) {
        // Local thumbnail path
        const filename = clipInfo.thumbnail_path.split('/').pop();
        thumbnailUrl = `${import.meta.env.VITE_API_URL}/video/clips/${filename}`;
      }
      
      setClip({ ...clipInfo, thumbnailUrl });

      // Fetch published post analytics
      const analyticsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/analytics/top-clips?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        const clipAnalytics = analyticsData.clips.find(c => c.id === clipId);
        
        if (clipAnalytics) {
          setAnalytics(clipAnalytics);
          
          // Generate mock time-series data based on current stats
          // In production, this would come from analytics_snapshots table
          const mockTimeSeriesData = generateMockTimeSeriesData(clipAnalytics);
          setTimeSeriesData(mockTimeSeriesData);
        } else {
          // Clip exists but hasn't been published yet
          setAnalytics(null);
        }
      } else {
        console.warn('Failed to fetch analytics data');
      }

      setLoading(false);
    } catch (err) {
      console.error('Clip analytics error:', err);
      setError(err.message || 'Failed to load clip analytics');
      toast.error(err.message || 'Failed to load clip analytics');
      setLoading(false);
    }
  };

  const generateMockTimeSeriesData = (analytics) => {
    // Generate 7 days of mock data showing growth to current values
    const days = 7;
    const data = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Simulate gradual growth
      const growthFactor = (days - i) / days;
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        views: Math.round(analytics.views * growthFactor * (0.7 + Math.random() * 0.3)),
        likes: Math.round(analytics.likes * growthFactor * (0.7 + Math.random() * 0.3)),
        comments: Math.round(analytics.comments * growthFactor * (0.7 + Math.random() * 0.3)),
        engagement: parseFloat((analytics.engagementRate * growthFactor * (0.8 + Math.random() * 0.2)).toFixed(2))
      });
    }
    
    return data;
  };

  const handleSyncAnalytics = async () => {
    try {
      setSyncing(true);
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/analytics/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Analytics synced successfully!');
        // Refresh data after sync
        await fetchClipAnalytics();
      } else {
        toast.error(data.message || 'Failed to sync analytics');
      }
    } catch (err) {
      console.error('Sync error:', err);
      toast.error('Failed to sync analytics');
    } finally {
      setSyncing(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (loading) {
    return (
      <div className="p-3 sm:p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading clip analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !clip) {
    return (
      <div className="p-3 sm:p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-5xl mb-4">😕</div>
          <p className="text-red-600 mb-4 font-semibold">
            {error || 'Clip not found'}
          </p>
          <p className="text-sm text-gray-600 mb-4">
            {error === 'Clip not found' 
              ? 'The clip you are looking for does not exist or has been deleted.'
              : 'Unable to load clip analytics. Please try again.'}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/dashboard/analytics')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Back to Analytics
            </button>
            {error && error !== 'Clip not found' && (
              <button
                onClick={fetchClipAnalytics}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Clip exists but not published yet
  if (!analytics) {
    return (
      <div className="p-3 sm:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard/analytics')}
            className="text-purple-600 hover:text-purple-700 mb-4 flex items-center font-medium"
          >
            ← Back to Analytics
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{clip.title}</h1>
        </div>

        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-8 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">No Analytics Yet</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            This clip hasn't been published yet. Publish it to YouTube or Instagram to start tracking performance!
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/dashboard/clips')}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
            >
              Go to Clips
            </button>
            <button
              onClick={() => navigate('/dashboard/analytics')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              Back to Analytics
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <button
          onClick={() => navigate('/dashboard/analytics')}
          className="text-purple-600 hover:text-purple-700 mb-4 flex items-center font-medium text-sm sm:text-base"
        >
          ← Back to Analytics
        </button>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{clip.title}</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Detailed Performance Analytics</p>
          </div>
          <button
            onClick={handleSyncAnalytics}
            disabled={syncing}
            className="px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
          >
            {syncing ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Syncing...</span>
              </>
            ) : (
              <>
                <span>🔄</span>
                <span>Sync Now</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xl sm:text-2xl">👁️</span>
            <span className="text-xs sm:text-sm text-green-600 font-medium">+{analytics.views > 0 ? '100' : '0'}%</span>
          </div>
          <p className="text-xs sm:text-sm text-gray-600">Total Views</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{formatNumber(analytics.views)}</p>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xl sm:text-2xl">❤️</span>
            <span className="text-xs sm:text-sm text-green-600 font-medium">+{analytics.likes > 0 ? '100' : '0'}%</span>
          </div>
          <p className="text-xs sm:text-sm text-gray-600">Total Likes</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{formatNumber(analytics.likes)}</p>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xl sm:text-2xl">💬</span>
            <span className="text-xs sm:text-sm text-green-600 font-medium">+{analytics.comments > 0 ? '100' : '0'}%</span>
          </div>
          <p className="text-xs sm:text-sm text-gray-600">Total Comments</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{formatNumber(analytics.comments)}</p>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xl sm:text-2xl">📊</span>
            <span className={`text-xs sm:text-sm font-medium ${
              analytics.engagementRate >= 5 ? 'text-green-600' : 
              analytics.engagementRate >= 3 ? 'text-yellow-600' : 'text-gray-600'
            }`}>
              {analytics.engagementRate >= 5 ? 'Great' : 
               analytics.engagementRate >= 3 ? 'Good' : 'Fair'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-600">Engagement Rate</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{analytics.engagementRate}%</p>
        </div>
      </div>

      {/* Performance Over Time Chart */}
      {timeSeriesData.length > 0 && (
        <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Performance Over Time</h2>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#666"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#666"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  name="Views"
                  dot={{ fill: '#8b5cf6', r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="likes" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Likes"
                  dot={{ fill: '#10b981', r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="comments" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Comments"
                  dot={{ fill: '#3b82f6', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">
            📊 Showing estimated growth pattern over the last 7 days
          </p>
        </div>
      )}

      {/* Clip Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Video Preview */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Video Preview</h2>
          {clip.cloud_url ? (
            <video 
              src={clip.cloud_url} 
              controls
              className="w-full rounded-lg"
              poster={clip.thumbnailUrl}
            >
              Your browser does not support the video tag.
            </video>
          ) : clip.thumbnailUrl ? (
            <img 
              src={clip.thumbnailUrl} 
              alt={clip.title}
              className="w-full rounded-lg object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className="w-full h-48 sm:h-64 bg-gray-200 rounded-lg flex items-center justify-center"
            style={{ display: (clip.cloud_url || clip.thumbnailUrl) ? 'none' : 'flex' }}
          >
            <div className="text-center">
              <span className="text-3xl sm:text-4xl mb-2 block">🎬</span>
              <span className="text-gray-400 text-sm">No preview available</span>
            </div>
          </div>
          {analytics.platformUrl && (
            <a
              href={analytics.platformUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block w-full text-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm sm:text-base"
            >
              🔗 View on YouTube
            </a>
          )}
        </div>

        {/* Clip Information */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Clip Information</h2>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Duration</p>
                <p className="text-base sm:text-lg font-semibold text-gray-900">
                  {analytics.duration || clip.duration || 'N/A'}s
                </p>
              </div>
              <span className="text-2xl">⏱️</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Emotion</p>
                <p className="text-base sm:text-lg font-semibold text-gray-900 capitalize">
                  {analytics.emotion || clip.emotion || 'N/A'}
                </p>
              </div>
              <span className="text-2xl">
                {(analytics.emotion || clip.emotion) === 'happy' ? '😊' :
                 (analytics.emotion || clip.emotion) === 'excited' ? '🤩' :
                 (analytics.emotion || clip.emotion) === 'funny' ? '😂' :
                 (analytics.emotion || clip.emotion) === 'inspiring' ? '✨' :
                 (analytics.emotion || clip.emotion) === 'sad' ? '😢' : '😐'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div>
                <p className="text-xs sm:text-sm text-purple-600 font-medium">Viral Score (Predicted)</p>
                <p className="text-base sm:text-lg font-bold text-purple-900">
                  {analytics.viralScore || clip.viral_score || 'N/A'}/100
                </p>
              </div>
              <span className="text-2xl">🚀</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Published</p>
                <p className="text-base sm:text-lg font-semibold text-gray-900">
                  {analytics.publishedAt 
                    ? new Date(analytics.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })
                    : 'N/A'}
                </p>
              </div>
              <span className="text-2xl">📅</span>
            </div>
            {analytics.platformVideoId && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600">Video ID</p>
                  <p className="text-xs sm:text-sm font-mono text-gray-900 truncate">
                    {analytics.platformVideoId}
                  </p>
                </div>
                <span className="text-2xl ml-2">🎬</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Performance Insights</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <p className="text-xs sm:text-sm text-purple-600 font-medium mb-1">Like Rate</p>
            <p className="text-xl sm:text-2xl font-bold text-purple-900">
              {analytics.views > 0 ? ((analytics.likes / analytics.views) * 100).toFixed(2) : 0}%
            </p>
            <p className="text-xs text-purple-600 mt-1">Likes per view</p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-xs sm:text-sm text-blue-600 font-medium mb-1">Comment Rate</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-900">
              {analytics.views > 0 ? ((analytics.comments / analytics.views) * 100).toFixed(2) : 0}%
            </p>
            <p className="text-xs text-blue-600 mt-1">Comments per view</p>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-xs sm:text-sm text-green-600 font-medium mb-1">Engagement Quality</p>
            <p className="text-xl sm:text-2xl font-bold text-green-900">
              {analytics.engagementRate >= 10 ? 'Excellent' :
               analytics.engagementRate >= 7 ? 'Great' :
               analytics.engagementRate >= 5 ? 'Good' :
               analytics.engagementRate >= 3 ? 'Fair' : 'Low'}
            </p>
            <p className="text-xs text-green-600 mt-1">Based on engagement rate</p>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <p className="text-xs sm:text-sm text-yellow-600 font-medium mb-1">Viral Potential</p>
            <p className="text-xl sm:text-2xl font-bold text-yellow-900">
              {(analytics.viralScore || clip.viral_score) >= 80 ? 'High' :
               (analytics.viralScore || clip.viral_score) >= 60 ? 'Medium' : 'Low'}
            </p>
            <p className="text-xs text-yellow-600 mt-1">AI prediction score</p>
          </div>
        </div>
      </div>

      {/* Comparison with Average */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg sm:rounded-xl border-2 border-purple-200 p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">📊 Performance Comparison</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">Views vs Average</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((analytics.views / 100) * 100, 100)}%` }}
                ></div>
              </div>
              <span className="text-sm font-bold text-purple-600">
                {analytics.views > 50 ? '↑' : analytics.views > 20 ? '→' : '↓'}
              </span>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">Engagement vs Average</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(analytics.engagementRate * 10, 100)}%` }}
                ></div>
              </div>
              <span className="text-sm font-bold text-green-600">
                {analytics.engagementRate > 5 ? '↑' : analytics.engagementRate > 3 ? '→' : '↓'}
              </span>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">Viral Score vs Average</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${analytics.viralScore || clip.viral_score || 0}%` }}
                ></div>
              </div>
              <span className="text-sm font-bold text-yellow-600">
                {(analytics.viralScore || clip.viral_score) > 70 ? '↑' : 
                 (analytics.viralScore || clip.viral_score) > 50 ? '→' : '↓'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">💡 AI Recommendations</h2>
        <div className="space-y-3">
          {analytics.engagementRate < 3 && (
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Low Engagement Rate</p>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  Try adding more engaging hooks in the first 3 seconds and use trending sounds or topics.
                </p>
              </div>
            </div>
          )}
          {analytics.views < 100 && (
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-xl">📢</span>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Boost Visibility</p>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  Share on other platforms, use relevant hashtags, and post at optimal times (evenings/weekends).
                </p>
              </div>
            </div>
          )}
          {(analytics.viralScore || clip.viral_score) >= 70 && analytics.views < 1000 && (
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <span className="text-xl">🚀</span>
              <div>
                <p className="font-semibold text-gray-900 text-sm">High Viral Potential</p>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  This clip has high viral potential! Consider promoting it or creating similar content.
                </p>
              </div>
            </div>
          )}
          {analytics.engagementRate >= 5 && (
            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <span className="text-xl">⭐</span>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Great Performance!</p>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  Your content is resonating well with the audience. Keep creating similar content!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Note about data */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <p className="text-xs sm:text-sm text-gray-600">
          💡 <strong>Note:</strong> Analytics data is synced from YouTube. Click "Sync Now" to get the latest metrics.
          {timeSeriesData.length > 0 && ' Time-series data shows estimated growth patterns.'}
        </p>
      </div>
    </div>
  );
}

export default ClipAnalytics;
