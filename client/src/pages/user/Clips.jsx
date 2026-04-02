import { useState, useEffect } from 'react';
import toast from '../../utils/toast';
import { getVideoUrl, formatDuration } from '../../utils/videoUrl';
import { getEmotionColor } from '../../utils/helpers';
import axios from 'axios';
import PostModal from '../../components/PostModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function Clips() {
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingClip, setEditingClip] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [platformConnections, setPlatformConnections] = useState([]);
  const [showPostSuccess, setShowPostSuccess] = useState(null);
  const [showPostModal, setShowPostModal] = useState(null);
  const [postedClips, setPostedClips] = useState({});
  
  // Filtering & Sorting States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState('all');
  const [viralScoreRange, setViralScoreRange] = useState([0, 100]);
  const [sortBy, setSortBy] = useState('date-desc');
  
  // Bulk Actions States
  const [selectedClips, setSelectedClips] = useState([]);
  const [bulkActionMode, setBulkActionMode] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchClips();
    fetchPlatformConnections();
    fetchPublishedPosts();
  }, []);

  // Auto-refresh when there are pending/uploading posts
  useEffect(() => {
    const hasPendingPosts = Object.values(postedClips).some(post => 
      post.status === 'pending' || post.status === 'uploading'
    );

    if (hasPendingPosts) {
      const interval = setInterval(() => {
        console.log('Auto-refreshing clips due to pending uploads...');
        fetchPublishedPosts();
        fetchClips(); // Also refresh clips to update UI
      }, 3000); // Check every 3 seconds for faster updates

      return () => clearInterval(interval);
    }
  }, [postedClips]);

  const fetchClips = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.error('No authentication token found');
        toast.error('Please log in again');
        return;
      }

      console.log('📥 Fetching clips from database...');
      
      const response = await fetch('http://localhost:5000/api/clips/my-clips', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Clips response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Loaded ${data.clips.length} clips from database`);
        console.log('Sample clip data:', data.clips[0]);
        setClips(data.clips);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to load clips:', errorData);
        toast.error(`Failed to load clips: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching clips:', error);
      toast.error(`Failed to load clips: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatformConnections = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/platform/connections`);
      setPlatformConnections(response.data.connections || []);
    } catch (error) {
      console.error('Error fetching platform connections:', error);
    }
  };

  const fetchPublishedPosts = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${API_URL}/api/post/my-posts`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      console.log('Fetched posts:', response.data.posts); // Debug log
      
      // Create map of clipId -> post data for published/scheduled posts
      const postsMap = {};
      response.data.posts.forEach(post => {
        // Include published, scheduled, pending, and uploading posts
        if (['published', 'scheduled', 'pending', 'uploading'].includes(post.status) && post.clip_id) {
          postsMap[post.clip_id] = post;
          console.log(`Added post for clip ${post.clip_id}:`, post); // Debug log
        }
      });
      console.log('Posted clips map:', postsMap); // Debug log
      setPostedClips(postsMap);
    } catch (error) {
      console.error('Error fetching published posts:', error);
    }
  };

  const isYouTubeConnected = () => {
    const youtubeConn = platformConnections.find(conn => conn.platform === 'youtube');
    return youtubeConn && youtubeConn.platformUserId && !youtubeConn.isExpired;
  };

  const getYouTubeConnectionStatus = () => {
    const youtubeConn = platformConnections.find(conn => conn.platform === 'youtube');
    if (!youtubeConn) return { connected: false, message: 'Not connected' };
    if (!youtubeConn.platformUserId) return { connected: false, message: 'Invalid connection' };
    if (youtubeConn.isExpired) return { connected: false, message: 'Connection expired' };
    return { connected: true, message: 'Connected' };
  };

  const isClipPosted = (clipId) => {
    return !!postedClips[clipId];
  };

  const getPostData = (clipId) => {
    return postedClips[clipId];
  };

  const handleOpenPostModal = (clip) => {
    const status = getYouTubeConnectionStatus();
    
    if (!status.connected) {
      if (status.message === 'Connection expired') {
        toast.error('YouTube connection expired. Please reconnect in Settings.');
      } else if (status.message === 'Invalid connection') {
        toast.error('YouTube connection is invalid. Please reconnect in Settings.');
      } else {
        toast.error('Please connect YouTube in Settings first');
      }
      return;
    }

    setShowPostModal(clip);
  };

  const handlePostSuccess = (postData) => {
    console.log('Post success data:', postData); // Debug log
    
    // Update posted clips map immediately
    const clipId = postData.post?.clipId || postData.post?.clip_id;
    if (clipId) {
      setPostedClips(prev => ({
        ...prev,
        [clipId]: postData.post
      }));
    }
    
    // Refresh clips and posts to get latest status
    fetchClips();
    fetchPublishedPosts();
    
    // Show success message
    toast.success(postData.message || 'Posted successfully!');
  };

  const handleDeletePost = async (clip) => {
    const postData = getPostData(clip.id);
    if (!postData || !postData.id) {
      toast.error('Post data not found');
      return;
    }

    if (!window.confirm('Delete this post record? This will allow you to post this clip again.\n\nNote: This does NOT delete the video from YouTube. You must delete it manually from YouTube first.')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.delete(
        `${API_URL}/api/post/${postData.id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Post deleted. You can now post this clip again!');
        
        // Remove from posted clips map
        setPostedClips(prev => {
          const newMap = { ...prev };
          delete newMap[clip.id];
          return newMap;
        });
        
        // Refresh data
        fetchClips();
        fetchPublishedPosts();
      }
    } catch (error) {
      console.error('Delete post error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to delete post';
      toast.error(errorMessage);
    }
  };

  const handleVerifyVideo = async (clip) => {
    const postData = getPostData(clip.id);
    if (!postData || !postData.id) {
      toast.error('Post data not found');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${API_URL}/api/post/${postData.id}/verify`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.exists) {
        toast.success('Video exists on YouTube! ✅');
      } else {
        toast.info('Video was deleted from YouTube. Post record updated.');
        
        // Remove from posted clips map
        setPostedClips(prev => {
          const newMap = { ...prev };
          delete newMap[clip.id];
          return newMap;
        });
        
        // Refresh data
        fetchClips();
        fetchPublishedPosts();
      }
    } catch (error) {
      console.error('Verify video error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to verify video';
      toast.error(errorMessage);
    }
  };

  const handleEditClip = (clip) => {
    setEditingClip(clip.id);
    setEditTitle(clip.title);
  };

  const handleSaveEdit = async (clipId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5000/api/clips/${clipId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: editTitle })
      });

      if (response.ok) {
        toast.success('Clip updated successfully!');
        setEditingClip(null);
        fetchClips(); // Reload clips
      } else {
        toast.error('Failed to update clip');
      }
    } catch (error) {
      console.error('Error updating clip:', error);
      toast.error('Failed to update clip');
    }
  };

  const handleDeleteClip = async (clipId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5000/api/clips/${clipId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Clip deleted successfully!');
        setShowDeleteConfirm(null);
        fetchClips(); // Reload clips
      } else {
        toast.error('Failed to delete clip');
      }
    } catch (error) {
      console.error('Error deleting clip:', error);
      toast.error('Failed to delete clip');
    }
  };

  // Get unique emotions from clips
  const uniqueEmotions = [...new Set(clips.map(clip => clip.emotion).filter(Boolean))];

  // Filter and Sort Clips
  const getFilteredAndSortedClips = () => {
    let filtered = [...clips];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(clip => 
        clip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (clip.video_title && clip.video_title.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Emotion filter
    if (selectedEmotion !== 'all') {
      filtered = filtered.filter(clip => clip.emotion === selectedEmotion);
    }

    // Viral score filter
    filtered = filtered.filter(clip => {
      const score = Number(clip.viral_score) || 0;
      return score >= viralScoreRange[0] && score <= viralScoreRange[1];
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'date-asc':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'viral-desc':
          return (Number(b.viral_score) || 0) - (Number(a.viral_score) || 0);
        case 'viral-asc':
          return (Number(a.viral_score) || 0) - (Number(b.viral_score) || 0);
        case 'duration-desc':
          return b.duration - a.duration;
        case 'duration-asc':
          return a.duration - b.duration;
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredClips = getFilteredAndSortedClips();

  // Bulk Actions
  const toggleClipSelection = (clipId) => {
    setSelectedClips(prev => 
      prev.includes(clipId) 
        ? prev.filter(id => id !== clipId)
        : [...prev, clipId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedClips.length === filteredClips.length) {
      setSelectedClips([]);
    } else {
      setSelectedClips(filteredClips.map(clip => clip.id));
    }
  };

  const handleBulkDownload = async () => {
    if (selectedClips.length === 0) {
      toast.error('Please select clips to download');
      return;
    }

    toast.success(`Downloading ${selectedClips.length} clips...`);
    
    for (const clipId of selectedClips) {
      const clip = clips.find(c => c.id === clipId);
      if (clip) {
        const url = getVideoUrl(clip.file_path, clip.cloud_url);
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `${clip.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.mp4`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
          await new Promise(resolve => setTimeout(resolve, 500)); // Delay between downloads
        } catch (error) {
          console.error('Download error:', error);
        }
      }
    }
    
    setSelectedClips([]);
    setBulkActionMode(false);
  };

  const handleBulkDelete = async () => {
    if (selectedClips.length === 0) {
      toast.error('Please select clips to delete');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      let successCount = 0;
      
      for (const clipId of selectedClips) {
        const response = await fetch(`http://localhost:5000/api/clips/${clipId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          successCount++;
        }
      }
      
      toast.success(`${successCount} clips deleted successfully!`);
      setSelectedClips([]);
      setBulkActionMode(false);
      setShowBulkDeleteConfirm(false);
      fetchClips();
    } catch (error) {
      console.error('Error deleting clips:', error);
      toast.error('Failed to delete some clips');
    }
  };

  const handleBulkPost = () => {
    if (selectedClips.length === 0) {
      toast.error('Please select clips to post');
      return;
    }

    if (!isYouTubeConnected()) {
      toast.error('Please connect YouTube in Settings first');
      return;
    }

    const firstClip = clips.find(c => c.id === selectedClips[0]);
    if (firstClip) {
      setShowPostModal(firstClip);
      // Note: For now, posting one at a time. Can be enhanced for batch posting
      toast.info(`Posting ${selectedClips.length} clips one by one...`);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Clips</h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <button
            onClick={() => {
              setBulkActionMode(!bulkActionMode);
              setSelectedClips([]);
            }}
            className={`px-3 sm:px-4 py-2 rounded-lg transition text-sm font-medium ${
              bulkActionMode 
                ? 'bg-gray-600 text-white hover:bg-gray-700' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {bulkActionMode ? '✕ Cancel' : '☑️ Bulk'}
          </button>
          <button
            onClick={() => {
              fetchClips();
              fetchPublishedPosts();
              toast.success('Refreshed!');
            }}
            className="px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
          >
            🔄 Refresh
          </button>
          <div className="text-sm text-gray-600 font-medium">
            {filteredClips.length} of {clips.length}
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {bulkActionMode && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedClips.length === filteredClips.length && filteredClips.length > 0}
                  onChange={toggleSelectAll}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                />
                <span className="font-medium text-gray-700 text-sm sm:text-base">
                  Select All <span className="text-purple-600">({selectedClips.length})</span>
                </span>
              </label>
            </div>
            
            {selectedClips.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleBulkDownload}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-xs sm:text-sm font-medium"
                >
                  📥 Download ({selectedClips.length})
                </button>
                <button
                  onClick={handleBulkPost}
                  disabled={!isYouTubeConnected()}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ▶️ Post ({selectedClips.length})
                </button>
                <button
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-xs sm:text-sm font-medium"
                >
                  🗑️ Delete ({selectedClips.length})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Bulk Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {selectedClips.length} selected clips? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleBulkDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                Yes, Delete All
              </button>
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white rounded-xl shadow p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Search */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">🔍 Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm"
            />
          </div>

          {/* Emotion Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">😊 Emotion</label>
            <select
              value={selectedEmotion}
              onChange={(e) => setSelectedEmotion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm"
            >
              <option value="all">All Emotions</option>
              {uniqueEmotions.map(emotion => (
                <option key={emotion} value={emotion}>
                  {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Viral Score Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">🔥 Viral Score</label>
            <select
              value={`${viralScoreRange[0]}-${viralScoreRange[1]}`}
              onChange={(e) => {
                const [min, max] = e.target.value.split('-').map(Number);
                setViralScoreRange([min, max]);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm"
            >
              <option value="0-100">All Scores (0% - 100%)</option>
              <option value="80-100">Excellent (80% - 100%)</option>
              <option value="60-79">Good (60% - 79%)</option>
              <option value="40-59">Average (40% - 59%)</option>
              <option value="20-39">Below Average (20% - 39%)</option>
              <option value="0-19">Low (0% - 19%)</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">📊 Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="viral-desc">Highest Viral Score</option>
              <option value="viral-asc">Lowest Viral Score</option>
              <option value="duration-desc">Longest Duration</option>
              <option value="duration-asc">Shortest Duration</option>
            </select>
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchQuery || selectedEmotion !== 'all' || viralScoreRange[0] !== 0 || viralScoreRange[1] !== 100 || sortBy !== 'date-desc') && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Active Filters:</span>
              
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  Search: "{searchQuery}"
                  <button
                    onClick={() => setSearchQuery('')}
                    className="hover:text-purple-900"
                  >
                    ✕
                  </button>
                </span>
              )}
              
              {selectedEmotion !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  Emotion: {selectedEmotion}
                  <button
                    onClick={() => setSelectedEmotion('all')}
                    className="hover:text-purple-900"
                  >
                    ✕
                  </button>
                </span>
              )}
              
              {(viralScoreRange[0] !== 0 || viralScoreRange[1] !== 100) && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  Score: {viralScoreRange[0]}%-{viralScoreRange[1]}%
                  <button
                    onClick={() => setViralScoreRange([0, 100])}
                    className="hover:text-purple-900"
                  >
                    ✕
                  </button>
                </span>
              )}
              
              {sortBy !== 'date-desc' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  Sort: {sortBy.replace('-', ' ')}
                  <button
                    onClick={() => setSortBy('date-desc')}
                    className="hover:text-purple-900"
                  >
                    ✕
                  </button>
                </span>
              )}
              
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedEmotion('all');
                  setViralScoreRange([0, 100]);
                  setSortBy('date-desc');
                }}
                className="ml-auto px-3 py-1 text-sm text-purple-600 hover:text-purple-700 font-medium hover:bg-purple-50 rounded-lg transition"
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>

      {clips.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <div className="text-6xl mb-4">✂️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No clips yet</h3>
          <p className="text-gray-500 mb-6">Process a video to generate viral clips</p>
        </div>
      ) : filteredClips.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No clips found</h3>
          <p className="text-gray-500 mb-6">Try adjusting your filters</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedEmotion('all');
              setViralScoreRange([0, 100]);
              setSortBy('date-desc');
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClips.map((clip) => (
            <div key={clip.id} className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden">
              {/* Bulk Selection Checkbox */}
              {bulkActionMode && (
                <div className="p-3 bg-gray-50 border-b border-gray-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedClips.includes(clip.id)}
                      onChange={() => toggleClipSelection(clip.id)}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Select this clip</span>
                  </label>
                </div>
              )}
              
              <div className="aspect-video bg-gray-900 relative">
                <video 
                  key={clip.id || clip.file_path}
                  src={(() => {
                    const url = getVideoUrl(clip.file_path, clip.cloud_url);
                    console.log('🎥 Rendering video:', {
                      clipId: clip.id,
                      clipTitle: clip.title,
                      dbFilePath: clip.file_path,
                      cloudUrl: clip.cloud_url,
                      constructedUrl: url
                    });
                    return url;
                  })()}
                  className="w-full h-full object-cover"
                  controls
                  preload="metadata"
                  onPlay={(e) => {
                    // Pause all other videos when this one plays
                    const allVideos = document.querySelectorAll('video');
                    allVideos.forEach(video => {
                      if (video !== e.target) {
                        video.pause();
                      }
                    });
                  }}
                  onLoadStart={() => {
                    console.log('✅ Video loading started:', clip.id);
                  }}
                  onError={(e) => {
                    console.error('❌ Video load error:', {
                      clipId: clip.id,
                      filePath: clip.file_path,
                      attemptedUrl: e.target.src,
                      error: e
                    });
                    
                    // Try to fetch the URL to see the actual error
                    fetch(e.target.src)
                      .then(r => console.log('Fetch test status:', r.status))
                      .catch(err => console.error('Fetch test error:', err));
                  }}
                  onLoadedMetadata={(e) => {
                    console.log('✅ Video loaded successfully:', {
                      clipId: clip.id,
                      duration: e.target.duration,
                      videoWidth: e.target.videoWidth,
                      videoHeight: e.target.videoHeight
                    });
                  }}
                />
                <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                  {formatDuration(clip.duration)}
                </div>
                {clip.viral_score && (
                  <div className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 rounded text-xs font-semibold">
                    🔥 {Number(clip.viral_score).toFixed(0)}%
                  </div>
                )}
              </div>
              
              <div className="p-4">
                {editingClip === clip.id ? (
                  <div className="mb-3">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 mb-2"
                      placeholder="Clip title"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(clip.id)}
                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingClip(null)}
                        className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <h3 className="font-semibold text-gray-900 mb-2">{clip.title}</h3>
                )}
                
                {clip.video_title && (
                  <p className="text-xs text-gray-500 mb-2">From: {clip.video_title}</p>
                )}
                
                {clip.emotion && (
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold mb-3 ${getEmotionColor(clip.emotion)}`}>
                    {clip.emotion}
                  </span>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>{clip.start_time}s - {clip.end_time}s</span>
                  <span>{new Date(clip.created_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
                </div>
                
                {showPostSuccess?.clipId === clip.id ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                    <p className="text-sm text-green-800 font-semibold mb-2">✅ Posted to YouTube!</p>
                    <a 
                      href={showPostSuccess.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-purple-600 hover:text-purple-700 underline block mb-2"
                    >
                      View on YouTube →
                    </a>
                    <button
                      onClick={() => setShowPostSuccess(null)}
                      className="w-full px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition text-sm"
                    >
                      Close
                    </button>
                  </div>
                ) : showDeleteConfirm === clip.id ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                    <p className="text-sm text-red-800 mb-2">Delete this clip?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteClip(clip.id)}
                        className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                      >
                        Yes, Delete
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Posted Status or Post Button */}
                    {isClipPosted(clip.id) ? (
                      <div className="space-y-2">
                        {/* Status Badge */}
                        {getPostData(clip.id).status === 'pending' && (
                          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 rounded-lg border border-orange-200">
                            <span className="animate-spin">⏳</span>
                            <span className="font-medium">Uploading to YouTube...</span>
                          </div>
                        )}
                        {getPostData(clip.id).status === 'uploading' && (
                          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 rounded-lg border border-orange-200">
                            <span className="animate-spin">⏳</span>
                            <span className="font-medium">Uploading to YouTube...</span>
                          </div>
                        )}
                        {getPostData(clip.id).status === 'scheduled' && (
                          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                            <span>📅</span>
                            <span className="font-medium">Scheduled for {new Date(getPostData(clip.id).scheduled_for).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
                          </div>
                        )}
                        {getPostData(clip.id).status === 'published' && (
                          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200">
                            <span className="font-medium">✅ Posted to YouTube</span>
                          </div>
                        )}
                        
                        {/* Action Buttons - Only show for published/scheduled posts with video URL */}
                        {(getPostData(clip.id).status === 'published' || getPostData(clip.id).status === 'scheduled') && getPostData(clip.id).platform_url && (
                          <div className="flex gap-2">
                            <a
                              href={getPostData(clip.id).platform_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 text-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                            >
                              🔗 View on YouTube
                            </a>
                            <button
                              onClick={() => handleVerifyVideo(clip)}
                              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
                              title="Check if video still exists on YouTube"
                            >
                              🔍
                            </button>
                          </div>
                        )}
                        
                        {/* Delete/Cancel Button */}
                        {getPostData(clip.id).status === 'published' && (
                          <>
                            <button
                              onClick={() => handleDeletePost(clip)}
                              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
                            >
                              🗑️ Remove Post Record
                            </button>
                            <p className="text-xs text-gray-500 text-center">
                              Delete the video from YouTube first, then remove the post record here to post again.
                            </p>
                          </>
                        )}
                        
                        {(getPostData(clip.id).status === 'scheduled' || getPostData(clip.id).status === 'pending' || getPostData(clip.id).status === 'uploading') && (
                          <>
                            <button
                              onClick={() => {
                                // Navigate to scheduled posts page
                                window.location.href = '/dashboard/scheduled';
                              }}
                              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
                            >
                              📅 View in Scheduled Posts
                            </button>
                            <p className="text-xs text-gray-500 text-center">
                              You can cancel this scheduled post from the Scheduled Posts page.
                            </p>
                          </>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <a 
                            href={getVideoUrl(clip.file_path, clip.cloud_url)}
                            download={`${clip.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.mp4`}
                            onClick={(e) => {
                              e.preventDefault();
                              const url = getVideoUrl(clip.file_path, clip.cloud_url);
                              fetch(url)
                                .then(response => response.blob())
                                .then(blob => {
                                  const blobUrl = window.URL.createObjectURL(blob);
                                  const link = document.createElement('a');
                                  link.href = blobUrl;
                                  link.download = `${clip.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.mp4`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  window.URL.revokeObjectURL(blobUrl);
                                  toast.success('Downloading clip...');
                                })
                                .catch(error => {
                                  console.error('Download error:', error);
                                  toast.error('Failed to download clip');
                                });
                            }}
                            className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm text-center"
                          >
                            📥 Download
                          </a>
                          <button
                            onClick={() => handleOpenPostModal(clip)}
                            disabled={!isYouTubeConnected()}
                            className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            ▶️ Post to YouTube
                          </button>
                        </div>
                        {!isYouTubeConnected() && (
                          <div className="text-xs text-center">
                            <span className="text-gray-500">
                              {getYouTubeConnectionStatus().message === 'Connection expired' 
                                ? '⚠️ YouTube connection expired - Reconnect in Settings'
                                : getYouTubeConnectionStatus().message === 'Invalid connection'
                                ? '⚠️ YouTube connection invalid - Reconnect in Settings'
                                : 'Connect YouTube in Settings to post clips'}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditClip(clip)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                        title="Edit"
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        onClick={() => {
                          const shareUrl = `${window.location.origin}/share/${clip.id}`;
                          if (navigator.share) {
                            navigator.share({
                              title: clip.title,
                              text: `Check out this viral clip!`,
                              url: shareUrl
                            }).catch(err => console.log('Share error:', err));
                          } else {
                            navigator.clipboard.writeText(shareUrl);
                            toast.success('Share link copied to clipboard!');
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                        title="Share"
                      >
                        📤 Share
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(clip.id)}
                        className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition text-sm"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Modal */}
      {showPostModal && (
        <PostModal
          clip={showPostModal}
          onClose={() => setShowPostModal(null)}
          onSuccess={handlePostSuccess}
        />
      )}
    </div>
  );
}

export default Clips;
