import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from '../../utils/toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function Scheduled() {
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [recentlyPublished, setRecentlyPublished] = useState(new Set());

  useEffect(() => {
    fetchScheduledPosts();
  }, []);

  // Update current time every second for live countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-refresh when any post's scheduled time has passed OR when posts are uploading
  useEffect(() => {
    const checkAndRefresh = () => {
      const now = new Date();
      
      // Check if any posts are still uploading
      const hasUploadingPosts = scheduledPosts.some(post => 
        post.status === 'pending' || post.status === 'uploading'
      );
      
      // Check if any posts should have been published
      const shouldRefresh = scheduledPosts.some(post => {
        const scheduledDate = new Date(post.scheduled_for);
        const timeDiff = scheduledDate - now;
        // Refresh 5 seconds after scheduled time
        return timeDiff < -5000 && timeDiff > -10000;
      });

      if ((shouldRefresh || hasUploadingPosts) && !refreshing) {
        fetchScheduledPosts();
      }
    };

    const interval = setInterval(checkAndRefresh, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [scheduledPosts, refreshing]);

  const fetchScheduledPosts = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/api/post/scheduled`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        const newPosts = response.data.posts;
        
        // Check if any posts were published (count decreased)
        if (!loading && scheduledPosts.length > newPosts.length) {
          const publishedCount = scheduledPosts.length - newPosts.length;
          toast.success(`${publishedCount} post${publishedCount > 1 ? 's' : ''} published successfully! 🎉`);
          
          // Find which posts were published
          const newPostIds = new Set(newPosts.map(p => p.id));
          const publishedIds = scheduledPosts
            .filter(p => !newPostIds.has(p.id))
            .map(p => p.id);
          
          // Mark as recently published
          setRecentlyPublished(new Set(publishedIds));
          
          // Clear after 5 seconds
          setTimeout(() => {
            setRecentlyPublished(new Set());
          }, 5000);
        }
        
        setScheduledPosts(newPosts);
      }
    } catch (error) {
      if (!loading) {
        toast.error('Failed to load scheduled posts');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCancelPost = async (postId) => {
    if (!confirm('Are you sure you want to cancel this scheduled post?')) {
      return;
    }

    setCancelling(postId);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_URL}/api/post/${postId}/cancel`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Scheduled post cancelled');
        setScheduledPosts(prev => prev.filter(post => post.id !== postId));
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to cancel post';
      toast.error(errorMessage);
    } finally {
      setCancelling(null);
    }
  };

  const getTimeRemaining = (timestamp) => {
    const scheduledDate = new Date(timestamp);
    const diffMs = scheduledDate - currentTime;
    
    if (diffMs < 0) {
      return {
        isPast: true,
        display: 'Publishing soon...',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50'
      };
    }

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    let display = '';
    if (days > 0) {
      display = `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      display = `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      display = `${minutes}m ${seconds % 60}s`;
    } else {
      display = `${seconds}s`;
    }

    return {
      isPast: false,
      display,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    };
  };

  const formatScheduledTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin text-4xl mb-2">⏳</div>
          <p className="text-gray-600">Loading scheduled posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Scheduled Posts</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage your scheduled YouTube posts. Posts will be automatically published at the scheduled time.
          </p>
        </div>
        
        {/* Refresh Button */}
        <button
          onClick={fetchScheduledPosts}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Auto-refresh indicator */}
      {refreshing && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2 text-sm text-blue-800">
          <span className="animate-spin">⏳</span>
          <span>Checking for published posts...</span>
        </div>
      )}

      {scheduledPosts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 sm:p-12 text-center">
          <div className="text-5xl sm:text-6xl mb-4">�</div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No scheduled posts</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-6">
            Schedule your clips to be posted automatically
          </p>
          <a
            href="/dashboard/clips"
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium text-sm sm:text-base"
          >
            Go to Clips
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {scheduledPosts.map((post) => {
            const timeRemaining = getTimeRemaining(post.scheduled_for);
            
            return (
              <div
                key={post.id}
                className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition"
              >
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">
                    📺
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 break-words">
                      {post.title}
                    </h3>
                    
                    {post.caption && (
                      <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2 break-words">
                        {post.caption}
                      </p>
                    )}

                    {/* Info Grid - Responsive */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <span>🎬</span>
                        <span className="truncate">{post.clip_title || 'Clip'}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-purple-600 font-medium">
                        <span>📅</span>
                        <span className="truncate">{formatScheduledTime(post.scheduled_for)}</span>
                      </div>

                      {/* Upload Status */}
                      {post.status === 'pending' && (
                        <div className="flex items-center gap-1 text-orange-600 font-medium">
                          <span className="animate-spin">⏳</span>
                          <span>Uploading to YouTube...</span>
                        </div>
                      )}
                      
                      {post.status === 'uploading' && (
                        <div className="flex items-center gap-1 text-orange-600 font-medium">
                          <span className="animate-spin">⏳</span>
                          <span>Uploading to YouTube...</span>
                        </div>
                      )}

                      {post.status === 'scheduled' && post.platform_video_id && (
                        <div className="flex items-center gap-1 text-green-600 font-medium">
                          <span>✅</span>
                          <span>Ready to publish</span>
                        </div>
                      )}

                      {post.status === 'failed' && (
                        <div className="flex items-center gap-1 text-red-600 font-medium">
                          <span>❌</span>
                          <span>Upload failed</span>
                        </div>
                      )}

                      {/* Live Countdown - Desktop inline */}
                      {post.status === 'scheduled' && (
                        <div className={`hidden lg:flex items-center gap-1 font-semibold ${timeRemaining.color}`}>
                          <span>{timeRemaining.isPast ? '⚡' : '⏳'}</span>
                          <span>{timeRemaining.display}</span>
                        </div>
                      )}
                    </div>

                    {/* Upload Status Badge */}
                    {post.status === 'pending' && (
                      <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg text-xs">
                        <span className="animate-spin">⏳</span>
                        <span className="text-orange-700 font-medium">
                          Uploading video in background... This may take a few minutes
                        </span>
                      </div>
                    )}

                    {post.status === 'uploading' && (
                      <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg text-xs">
                        <span className="animate-spin">⏳</span>
                        <span className="text-orange-700 font-medium">
                          Uploading video in background... This may take a few minutes
                        </span>
                      </div>
                    )}

                    {post.status === 'scheduled' && post.platform_video_id && (
                      <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-xs">
                        <span>🎥</span>
                        <span className="text-green-700 font-medium">
                          Video uploaded • Will publish at scheduled time
                        </span>
                      </div>
                    )}

                    {post.status === 'failed' && (
                      <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs">
                        <span>❌</span>
                        <span className="text-red-700 font-medium">
                          Upload failed: {post.error_message || 'Unknown error'}
                        </span>
                      </div>
                    )}

                    {/* Time Remaining Badge - Mobile & Tablet */}
                    <div className={`mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg ${timeRemaining.bgColor} lg:hidden`}>
                      <span className="text-lg">{timeRemaining.isPast ? '⚡' : '⏰'}</span>
                      <div>
                        <p className={`text-xs font-semibold ${timeRemaining.color}`}>
                          {timeRemaining.isPast ? 'Publishing Soon' : 'Time Remaining'}
                        </p>
                        <p className={`text-sm font-bold ${timeRemaining.color}`}>
                          {timeRemaining.display}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 w-full sm:w-auto">
                    <button
                      onClick={() => handleCancelPost(post.id)}
                      disabled={cancelling === post.id}
                      className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {cancelling === post.id ? (
                        <>
                          <span className="inline-block animate-spin mr-1">⏳</span>
                          Cancelling...
                        </>
                      ) : (
                        '❌ Cancel'
                      )}
                    </button>
                  </div>
                </div>

                {/* Time Remaining Badge - Desktop Large */}
                <div className={`hidden lg:flex mt-4 items-center gap-3 px-4 py-3 rounded-lg ${timeRemaining.bgColor}`}>
                  <span className="text-2xl">{timeRemaining.isPast ? '⚡' : '⏰'}</span>
                  <div className="flex-1">
                    <p className={`text-xs font-semibold ${timeRemaining.color} uppercase tracking-wide`}>
                      {timeRemaining.isPast ? 'Publishing Soon' : 'Time Remaining'}
                    </p>
                    <p className={`text-xl font-bold ${timeRemaining.color}`}>
                      {timeRemaining.display}
                    </p>
                  </div>
                  {timeRemaining.isPast && (
                    <button
                      onClick={fetchScheduledPosts}
                      className="px-3 py-1.5 bg-white text-purple-600 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                    >
                      Check Status
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="text-xl sm:text-2xl flex-shrink-0">ℹ️</div>
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 mb-1 text-sm sm:text-base">How Scheduling Works</h4>
            <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
              <li>• ⚡ Instant scheduling - you get immediate confirmation without waiting for upload</li>
              <li>• Videos are uploaded in the background as PRIVATE after you schedule</li>
              <li>• Our scheduler checks every minute and publishes them at the exact scheduled time</li>
              <li>• This page auto-refreshes to show upload progress and publish status</li>
              <li>• You can also manually refresh using the button above</li>
              <li>• All times are displayed in your local timezone (IST in database)</li>
              <li>• You can cancel a scheduled post before it's published (video will be deleted)</li>
              <li>• Once published, the post will appear in your regular posts list</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Scheduled;
