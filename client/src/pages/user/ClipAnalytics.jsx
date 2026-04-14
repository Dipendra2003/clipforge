import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from '../../utils/toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function ClipAnalytics() {
  const { clipId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clip, setClip] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [timeSeriesData, setTimeSeriesData] = useState([]);

  useEffect(() => {
    fetchClipAnalytics();
  }, [clipId]);

  const fetchClipAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');

      // Fetch clip details
      const clipResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/clips/${clipId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!clipResponse.ok) {
        throw new Error('Clip not found');
      }

      const clipData = await clipResponse.json();
      const clipInfo = clipData.clip;
      
      // Construct thumbnail URL
      let thumbnailUrl = null;
      if (clipInfo.cloud_url) {
        // If using Cloudinary, generate thumbnail from video
        // Cloudinary video URLs can be transformed to get a thumbnail
        // Example: https://res.cloudinary.com/demo/video/upload/v1234/sample.mp4
        // Thumbnail: https://res.cloudinary.com/demo/video/upload/so_0/v1234/sample.jpg
        if (clipInfo.cloud_url.includes('cloudinary.com')) {
          thumbnailUrl = clipInfo.cloud_url
            .replace('/video/upload/', '/video/upload/so_0,w_800,h_450,c_fill/')
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
        setAnalytics(clipAnalytics);

        // Fetch time-series data for this clip
        // Note: This would require a new endpoint, for now we'll use mock data structure
        setTimeSeriesData([]);
      }

      setLoading(false);
    } catch (err) {
      console.error('Clip analytics error:', err);
      toast.error('Failed to load clip analytics');
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading clip analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!clip || !analytics) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 mb-4">❌ Clip analytics not found</p>
          <button
            onClick={() => navigate('/analytics')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Back to Analytics
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard/analytics')}
          className="text-purple-600 hover:text-purple-700 mb-4 flex items-center font-medium"
        >
          ← Back to Analytics
        </button>
        <h1 className="text-3xl font-bold text-gray-900">{clip.title}</h1>
        <p className="text-gray-600 mt-1">Detailed Performance Analytics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">👁️</span>
          </div>
          <p className="text-sm text-gray-600">Total Views</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{formatNumber(analytics.views)}</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">❤️</span>
          </div>
          <p className="text-sm text-gray-600">Total Likes</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{formatNumber(analytics.likes)}</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">💬</span>
          </div>
          <p className="text-sm text-gray-600">Total Comments</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{formatNumber(analytics.comments)}</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-sm text-gray-600">Engagement Rate</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.engagementRate}%</p>
        </div>
      </div>

      {/* Clip Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Video Preview */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Video Preview</h2>
          {clip.thumbnailUrl ? (
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
            className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center"
            style={{ display: clip.thumbnailUrl ? 'none' : 'flex' }}
          >
            <div className="text-center">
              <span className="text-4xl mb-2 block">🎬</span>
              <span className="text-gray-400">No thumbnail available</span>
            </div>
          </div>
          {analytics.platformUrl && (
            <a
              href={analytics.platformUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block w-full text-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              View on YouTube
            </a>
          )}
        </div>

        {/* Clip Information */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Clip Information</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Duration</p>
              <p className="text-lg font-semibold text-gray-900">{analytics.duration || clip.duration || 'N/A'}s</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Emotion</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">{analytics.emotion || clip.emotion || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Viral Score (Predicted)</p>
              <p className="text-lg font-semibold text-gray-900">{analytics.viralScore || clip.viralScore || 'N/A'}/100</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Published</p>
              <p className="text-lg font-semibold text-gray-900">
                {analytics.publishedAt ? new Date(analytics.publishedAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Performance Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <p className="text-sm text-purple-600 font-medium mb-1">Like Rate</p>
            <p className="text-2xl font-bold text-purple-900">
              {analytics.views > 0 ? ((analytics.likes / analytics.views) * 100).toFixed(2) : 0}%
            </p>
            <p className="text-xs text-purple-600 mt-1">Likes per view</p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-600 font-medium mb-1">Comment Rate</p>
            <p className="text-2xl font-bold text-blue-900">
              {analytics.views > 0 ? ((analytics.comments / analytics.views) * 100).toFixed(2) : 0}%
            </p>
            <p className="text-xs text-blue-600 mt-1">Comments per view</p>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-sm text-green-600 font-medium mb-1">Engagement Quality</p>
            <p className="text-2xl font-bold text-green-900">
              {analytics.engagementRate >= 10 ? 'Excellent' :
               analytics.engagementRate >= 7 ? 'Great' :
               analytics.engagementRate >= 5 ? 'Good' :
               analytics.engagementRate >= 3 ? 'Fair' : 'Low'}
            </p>
            <p className="text-xs text-green-600 mt-1">Based on engagement rate</p>
          </div>
        </div>
      </div>

      {/* Note about time-series data */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-600">
          💡 Day-by-day performance tracking coming soon! This will show how your clip performed over time.
        </p>
      </div>
    </div>
  );
}

export default ClipAnalytics;
